import { google } from 'googleapis';

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const bucketName = 'burra-pariksha-snapshots-2026';

  if (!email || !privateKey) {
    console.error('BLOCKED: Missing Google Cloud Service Account credentials.');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/devstorage.read_only'],
  });

  const storage = google.storage({ version: 'v1', auth });

  console.log('--- GOOGLE CLOUD STORAGE INFO ---');
  console.log('Bucket Name:', bucketName);

  try {
    const res = await storage.objects.list({
      bucket: bucketName,
    });
    
    const items = res.data.items || [];
    console.log(`Found ${items.length} objects inside GCS Bucket.`);
    items.forEach((item: any) => {
      console.log(`- Object: "${item.name}" | Size: ${item.size} bytes | Created: ${item.timeCreated}`);
    });
  } catch (err: any) {
    console.error('Failed to list GCS bucket objects:', err.message);
  }
}

main().catch(err => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
