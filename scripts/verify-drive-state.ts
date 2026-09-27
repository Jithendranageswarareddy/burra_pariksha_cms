import { google } from 'googleapis';

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
    console.error('BLOCKED: Missing Google Drive OAuth credentials or root folder ID in env.');
    console.log({
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      hasRootFolderId: !!rootFolderId,
    });
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  console.log('--- GOOGLE DRIVE INFO ---');
  console.log('Root Folder ID:', rootFolderId);

  // 1. Get Root Folder Metadata
  try {
    const rootMeta = await drive.files.get({
      fileId: rootFolderId,
      fields: 'id, name, mimeType, trashed',
    });
    console.log('Root Folder Live Name:', rootMeta.data.name);
    console.log('Root Folder Live MimeType:', rootMeta.data.mimeType);
    console.log('Root Folder Live Trashed:', rootMeta.data.trashed);
  } catch (err: any) {
    console.error('Failed to fetch Root Folder Metadata:', err.message);
  }

  // 2. List all files and folders immediately under the Root Folder
  console.log('\n--- ACTIVE ITEMS UNDER ROOT FOLDER ---');
  try {
    const activeRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime)',
    });
    const files = activeRes.data.files || [];
    console.log(`Found ${files.length} active files/folders under root folder.`);
    files.forEach(f => {
      console.log(`- ID: ${f.id} | Name: "${f.name}" | MimeType: ${f.mimeType} | Created: ${f.createdTime}`);
    });

    // Let's also check if any "Content" folder exists and inspect it
    const contentFolder = files.find(f => f.name === 'Content' && f.mimeType === 'application/vnd.google-apps.folder');
    if (contentFolder) {
      console.log(`\n--- ACTIVE ITEMS UNDER "Content" FOLDER (${contentFolder.id}) ---`);
      const contentRes = await drive.files.list({
        q: `'${contentFolder.id}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, createdTime)',
      });
      const contentFiles = contentRes.data.files || [];
      console.log(`Found ${contentFiles.length} active files/folders inside Content folder.`);
      contentFiles.forEach(f => {
        console.log(`- ID: ${f.id} | Name: "${f.name}" | MimeType: ${f.mimeType} | Created: ${f.createdTime}`);
      });
    }
  } catch (err: any) {
    console.error('Failed to list active files under Root Folder:', err.message);
  }

  // 3. List all items in Trash
  console.log('\n--- ITEMS IN GOOGLE DRIVE TRASH ---');
  try {
    const trashRes = await drive.files.list({
      q: 'trashed = true',
      fields: 'files(id, name, mimeType, parents, createdTime)',
    });
    const trashedFiles = trashRes.data.files || [];
    console.log(`Found ${trashedFiles.length} files in Trash.`);
    trashedFiles.forEach(f => {
      console.log(`- ID: ${f.id} | Name: "${f.name}" | MimeType: ${f.mimeType} | Parents: ${JSON.stringify(f.parents)} | Created: ${f.createdTime}`);
    });
  } catch (err: any) {
    console.error('Failed to list trashed files:', err.message);
  }
}

main().catch(err => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
