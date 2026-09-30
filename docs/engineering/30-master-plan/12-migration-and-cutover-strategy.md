# Step 30: 12 — Migration & Zero-Downtime Cutover Strategy

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Database & System Cutover Protocol  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Zero-Downtime Cutover Strategy (Shadow / Dual-Write Protocol)

To transition from Google Sheets to PostgreSQL without production downtime or data loss, BP-CMS utilizes a **4-Stage Dual-Write Migration Protocol**:

```
[ Stage 1: Read/Write Sheets (Baseline) ]
                   │
                   ▼
[ Stage 2: Dual-Write (Write Sheets + Write Postgres, Read Sheets) ]
                   │ (Verify Data Parity & Consistency)
                   ▼
[ Stage 3: Inverted Dual-Write (Write Postgres + Write Sheets, Read Postgres) ]
                   │ (Verify P95 Latency & Error Rates)
                   ▼
[ Stage 4: Postgres Authoritative (Sheets Deprecated / Historical Archive) ]
```

---

## 2. Data Parity & Validation Assertion Script

During Stage 2 and Stage 3, an automated reconciliation job runs every 15 minutes to assert row-by-row consistency:

```typescript
export async function assertDataParity(): Promise<ParityReport> {
  const sheetsCount = await sheetsRepo.countAllRecords();
  const postgresCount = await db.select({ count: sql`count(*)` }).from(contentItems);

  const diffs: RecordDiff[] = [];
  const sheetsData = await sheetsRepo.fetchAll();

  for (const sheetRow of sheetsData) {
    const pgRecord = await db.query.contentItems.findFirst({
      where: eq(contentItems.code, sheetRow.id)
    });

    if (!pgRecord || pgRecord.status !== sheetRow.status) {
      diffs.push({ id: sheetRow.id, sheetsStatus: sheetRow.status, pgStatus: pgRecord?.status });
    }
  }

  return {
    isParityAchieved: diffs.length === 0,
    discrepancyCount: diffs.length,
    discrepancies: diffs
  };
}
```

---

## 3. Rollback Protocol & Emergency Triggers

If any of the following triggers occur during cutover:
1. P95 API latency exceeds 500ms for more than 3 consecutive minutes.
2. Error rate exceeds 0.5% of total requests.
3. Data parity discrepancy count is greater than zero.

**Rollback Action:**
- Immediately toggle runtime configuration `PERSISTENCE_MODE=SHEETS_PRIMARY`.
- Inverted dual-write captures any PostgreSQL mutations back into Google Sheets.
- Zero data loss is guaranteed due to bidirectional replication during the cutover window.
