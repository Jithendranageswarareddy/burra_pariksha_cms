import http from 'http';
import url from 'url';
import crypto from 'crypto';
import { google } from 'googleapis';

async function runLocalSetup() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const port = parseInt(process.env.PORT || '3005', 10);
  const redirectUri = `http://localhost:${port}/callback`;

  if (!clientId || !clientSecret) {
    console.error('\n❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be defined.');
    console.log('\nUsage:');
    console.log('  export GOOGLE_CLIENT_ID="your_client_id"');
    console.log('  export GOOGLE_CLIENT_SECRET="your_client_secret"');
    console.log('  export PORT="3005" (optional)');
    console.log('  npx tsx scripts/google-oauth-setup.ts\n');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate a cryptographically secure random state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state: state,
  });

  console.log('\n==================================================================');
  console.log('⚡ LOCAL GOOGLE OAUTH 2.0 REFRESH TOKEN ACQUISITION UTILITY');
  console.log('==================================================================\n');
  console.log('This utility runs a short-lived local server to securely acquire your refresh token.');
  console.log('It will NOT log the token to any cloud log, Sheet, or remote repository.\n');
  console.log('👉 ACTION REQUIRED:');
  console.log('1. Open this URL in your web browser:');
  console.log(`   \x1b[36m${authUrl}\x1b[0m\n`);
  console.log('2. Log in with your designated CMS administrator Google account and authorize the application.');
  console.log('3. Google will redirect you to your local machine.');

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url || '', true);
      if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code as string;
        const returnedState = parsedUrl.query.state as string;

        if (!returnedState || returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>CSRF Verification Failed</h1><p>State parameter does not match or has expired.</p>');
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Missing Code</h1><p>No authorization code was returned.</p>');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization Successful!</h1><p>Please return to your terminal to copy your refresh token.</p>');

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n==================================================================');
        console.log('🎉 SUCCESS! GOOGLE DRIVE REFRESH TOKEN ACQUIRED SUCCESSFULLY');
        console.log('==================================================================\n');
        console.log('Copy this token and add it to your production secret / GOOGLE_DRIVE_REFRESH_TOKEN:\n');
        console.log(`\x1b[32;1m${tokens.refresh_token}\x1b[0m\n`);
        console.log('Keep this token secret. Do NOT commit it to git or share it in public channels.\n');

        server.close(() => {
          console.log('Local setup server closed. Exiting successfully.\n');
          process.exit(0);
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    } catch (err: any) {
      console.error('\n❌ Failed to exchange code for tokens:', err?.message || err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Token Acquisition Failed</h1><p>Error: ${err?.message || err}</p>`);
      server.close(() => process.exit(1));
    }
  });

  server.listen(port, 'localhost', () => {
    console.log(`📡 Local callback listener listening on: http://localhost:${port}/callback\n`);
  });
}

runLocalSetup().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
