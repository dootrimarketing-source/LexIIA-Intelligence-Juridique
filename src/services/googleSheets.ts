export interface ContactLead {
  fullName: string;
  cabinet: string;
  email: string;
  practiceArea: string;
  message?: string;
  submittedAt?: string;
}

const SPREADSHEET_STORAGE_KEY = 'lexiia_google_sheet_id';
const DEFAULT_SHEET_TITLE = 'LexIIA — Prospects & Demandes de Démo';

export const getStoredSpreadsheetId = (): string | null => {
  try {
    return localStorage.getItem(SPREADSHEET_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredSpreadsheetId = (id: string): void => {
  try {
    localStorage.setItem(SPREADSHEET_STORAGE_KEY, id);
  } catch {
    // Ignore storage errors
  }
};

/**
 * Creates a new dedicated Google Sheet for LexIIA Leads with pre-formatted header row.
 */
export const createLeadsSpreadsheet = async (
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: DEFAULT_SHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Prospects LexIIA',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur lors de la création du Google Sheet : ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Prospects LexIIA'!A1:F1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [
          [
            'Date & Heure',
            'Nom & Prénom',
            'Cabinet / Direction',
            'E-mail Professionnel',
            'Pratique Dominante',
            'Volume & Besoins Spécifiques',
          ],
        ],
      }),
    }
  );

  setStoredSpreadsheetId(spreadsheetId);
  return { spreadsheetId, spreadsheetUrl };
};

/**
 * Appends a new prospect row to the Google Sheet.
 */
export const appendLeadToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  lead: ContactLead
): Promise<void> => {
  const formattedDate = lead.submittedAt
    ? new Date(lead.submittedAt).toLocaleString('fr-FR')
    : new Date().toLocaleString('fr-FR');

  const rowValues = [
    formattedDate,
    lead.fullName,
    lead.cabinet,
    lead.email,
    lead.practiceArea,
    lead.message?.trim() || 'Non spécifié',
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Prospects LexIIA'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Impossible d'ajouter le prospect dans Google Sheets : ${errorText}`);
  }
};
