import 'dotenv/config';
import { assignmentsRepository } from '../src/lib/repositories/assignments.repository';

async function checkAssignments() {
  const all = await assignmentsRepository.findAll();
  console.log(`Total assignments: ${all.length}`);
  const byAssignee = new Map<string, number>();
  const byEntityType = new Map<string, number>();
  const byRole = new Map<string, number>();

  all.forEach((a) => {
    byAssignee.set(a.assigneeId, (byAssignee.get(a.assigneeId) || 0) + 1);
    byEntityType.set(a.entityType, (byEntityType.get(a.entityType) || 0) + 1);
    const r = (a as any).assignmentRole || a.taskType;
    byRole.set(r, (byRole.get(r) || 0) + 1);
  });

  console.log('By Assignee:');
  for (const [k, v] of byAssignee.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  console.log('By EntityType:');
  for (const [k, v] of byEntityType.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  console.log('By Role / TaskType:');
  for (const [k, v] of byRole.entries()) {
    console.log(`  ${k}: ${v}`);
  }
}

checkAssignments().catch(console.error);
