import 'server-only';
import { drive as driveApi } from '@googleapis/drive';
import { JWT } from 'google-auth-library';

// Conta de serviço (JSON em base64 na env GOOGLE_SERVICE_ACCOUNT_JSON).
function getClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado.');
  // Aceita o JSON cru (começa com "{") ou em base64.
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const json = JSON.parse(text) as { client_email: string; private_key: string };
  const auth = new JWT({
    email: json.client_email,
    key: json.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return driveApi({ version: 'v3', auth });
}

export type DriveFile = { id: string; name: string; mimeType: string };

// Lista todas as imagens de uma pasta (com paginação; suporta Shared Drives).
export async function listFolderImages(folderId: string): Promise<DriveFile[]> {
  const drive = getClient();
  const out: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const f of res.data.files ?? []) {
      if (f.id && f.name) out.push({ id: f.id, name: f.name, mimeType: f.mimeType ?? '' });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return out;
}

export async function downloadFile(id: string): Promise<ArrayBuffer> {
  const drive = getClient();
  const res = await drive.files.get(
    { fileId: id, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  );
  return res.data as ArrayBuffer;
}

// Extrai o ID de uma pasta a partir de um link do Drive (ou retorna o próprio valor).
export function parseFolderId(input: string): string {
  const s = input.trim();
  return s.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1]
    ?? s.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1]
    ?? s;
}
