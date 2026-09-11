import 'dotenv/config';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';

async function main() {
  const allMasters = await contentMastersRepository.findAll();
  console.log('Total Content Masters:', allMasters.length);
  const lastMasters = allMasters.slice(-3);
  console.log('Last Content Masters:', JSON.stringify(lastMasters, null, 2));

  const allAudits = await auditLogRepository.findAll();
  console.log('Total Audit Logs:', allAudits.length);
  const lastAudits = allAudits.slice(-3);
  console.log('Last Audit Logs:', JSON.stringify(lastAudits, null, 2));
}

main().catch(console.error);
