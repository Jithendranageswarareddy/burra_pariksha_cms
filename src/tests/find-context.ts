import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { googleSheetsClient } from '../lib/google-sheets/client';

async function main() {
  googleSheetsClient.invalidateRowCache('AUDIT_LOG');
  const allLogs = await auditLogRepository.findAll();
  const idx = allLogs.findIndex(l => l.id === 'LOG-1789470313907-00001-ug68-undefined');
  if (idx !== -1) {
    console.log("Found at index:", idx);
    console.log("--- BEFORE ---");
    console.log(allLogs.slice(Math.max(0, idx - 2), idx));
    console.log("--- THE LOG ---");
    console.log(allLogs[idx]);
    console.log("--- AFTER ---");
    console.log(allLogs.slice(idx + 1, idx + 3));
  }
}
main();
