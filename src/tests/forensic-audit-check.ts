import { googleSheetsClient } from '../lib/google-sheets/client';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';

async function main() {
  console.log('--- FORENSIC AUDIT LOG CHECK ---');
  // Refresh cache
  googleSheetsClient.invalidateRowCache('AUDIT_LOG');
  
  const allLogs = await auditLogRepository.findAll();
  console.log(`Total AUDIT_LOG records: ${allLogs.length}`);

  const malformedLogs = allLogs.filter((log: any) => {
    return !log.action || log.action === 'undefined' || 
           !log.entityId || log.entityId === 'undefined' ||
           log.action === null || log.entityId === null;
  });

  console.log(`Found ${malformedLogs.length} malformed records.`);

  malformedLogs.forEach((log: any, idx) => {
    const isSynthetic = log.details && (
      log.details.includes('test') || 
      log.details.includes('synthetic') ||
      log.details.includes('mock') ||
      log.details.includes('e2e') ||
      (log.userId && log.userId.includes('test'))
    );
    
    console.log(`\nRecord #${idx + 1}:`);
    console.log(`ID: ${log.id}`);
    console.log(`Timestamp: ${log.timestamp}`);
    console.log(`User: ${log.userId} / ${log.userName}`);
    console.log(`Action: ${log.action}`);
    console.log(`Entity ID: ${log.entityId}`);
    console.log(`Details: ${log.details}`);
    console.log(`Classification: ${isSynthetic ? 'SYNTHETIC' : 'UNCERTAIN'}`);
  });
}

main().catch(console.error);
