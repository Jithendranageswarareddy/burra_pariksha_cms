import 'dotenv/config';
import express from 'express';
import { apiRouter } from '../src/server/routes';
import { authService } from '../src/lib/services/auth.service';
import { UserRole } from '../src/types';

async function testAuthRoute() {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const token = authService.generateSessionToken({
    userId: 'TEST-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
  });

  const server = app.listen(0, '127.0.0.1', async () => {
    const port = (server.address() as any).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ test: true }),
    });
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Body:', body);
    server.close();
  });
}

testAuthRoute().catch(console.error);
