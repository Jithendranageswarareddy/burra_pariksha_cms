import { google } from 'googleapis';

export async function exchangeAndValidate(authCode: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1Moz_86ymwFZY0JadXx4agSlBHWWJRKyN';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(authCode);

  const refreshTokenReceived = Boolean(tokens.refresh_token);

  if (!refreshTokenReceived) {
    return {
      success: false,
      error: 'No refresh_token returned by Google. Ensure prompt=consent and access_type=offline were used.',
      refreshTokenReceived: false,
    };
  }

  // Validate the new refresh token by making a live metadata request
  oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const metaRes = await drive.files.get({
    fileId: rootFolderId,
    fields: 'id, name, mimeType',
  });

  return {
    success: true,
    refreshTokenReceived: true,
    refreshToken: tokens.refresh_token, // kept strictly in code memory, never printed
    folder: metaRes.data,
  };
}

if (process.argv[2]) {
  const code = process.argv[2];
  const redirectUri = process.argv[3] || 'http://localhost:3000/api/auth/google/callback';
  exchangeAndValidate(code, redirectUri)
    .then(res => {
      console.log('EXCHANGE_RESULT:', JSON.stringify({
        success: res.success,
        refreshTokenReceived: res.refreshTokenReceived,
        folderName: res.folder?.name,
        folderId: res.folder?.id,
        folderMimeType: res.folder?.mimeType,
      }));
    })
    .catch(err => {
      console.error('EXCHANGE_ERROR:', err?.message || err);
      process.exit(1);
    });
}
