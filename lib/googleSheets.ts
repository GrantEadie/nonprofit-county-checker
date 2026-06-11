declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const SCOPES =
  "https://www.googleapis.com/auth/spreadsheets " +
  "https://www.googleapis.com/auth/drive.file";

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById("gis-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = "gis-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
}

function getAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (!resp.access_token) {
          reject(new Error(resp.error ?? "No access token returned"));
        } else {
          resolve(resp.access_token);
        }
      },
    });
    client.requestAccessToken();
  });
}

type CellValue = string | number | null;

function cell(v: CellValue) {
  if (v === null || v === "") {
    return { userEnteredValue: { stringValue: "" } };
  }
  if (typeof v === "number") {
    return { userEnteredValue: { numberValue: v } };
  }
  return { userEnteredValue: { stringValue: v } };
}

export async function exportToGoogleSheets(
  title: string,
  headers: string[],
  rows: CellValue[][]
): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. See README for setup instructions."
    );
  }

  await loadGisScript();
  const token = await getAccessToken(clientId);

  const headerRow = {
    values: headers.map((h) => ({
      userEnteredValue: { stringValue: h },
      userEnteredFormatting: { textFormat: { bold: true } },
    })),
  };

  const dataRows = rows.map((row) => ({ values: row.map(cell) }));

  const body = {
    properties: { title },
    sheets: [
      {
        properties: { title: "Results" },
        data: [{ rowData: [headerRow, ...dataRows] }],
      },
    ],
  };

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ?? `Sheets API error: ${res.status}`
    );
  }

  const sheet = await res.json();
  return `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`;
}
