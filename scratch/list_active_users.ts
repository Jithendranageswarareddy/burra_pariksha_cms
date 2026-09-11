import 'dotenv/config';
import { usersRepository } from '../src/lib/repositories/users.repository';

async function listUsers() {
  const users = await usersRepository.findAll();
  console.log(`Total users in USERS tab: ${users.length}`);
  const active = users.filter((u) => u.isActive);
  console.log(`Active users (${active.length}):`);
  active.forEach((u) => {
    console.log(`  [${u.id}] Name: "${u.name}", Role: "${u.role}"`);
  });
}

listUsers().catch(console.error);
