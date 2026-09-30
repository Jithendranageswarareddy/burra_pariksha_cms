# Test vs. Production Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 30 of 35  

---

## 1. Forensic Audit of Test Pollution in Production

### The `1789891450880` Artifact Investigation:
The audit investigated the origin of non-canonical records such as:
- `TEST-P09-Q-1789891450880`
- `TEST-P09-V-1789891450880`
- `SCR-TEST-P09-V-1789891450880`
- `THM-TEST-P09-V-1789891450880`
- `PIN-TEST-P09-V-1789891450880`

### Forensic Findings:
1. **Source of Creation:** Found in `src/tests/phase09-publishing-workflow-verification.ts:64-65`. Tests were executed directly against production Google Sheets without an isolated mock or separate test spreadsheet ID!
2. **Current Participation in Application Reads:**
   - Production read methods (e.g. `questionsRepository.findAll()`) scan the entire sheet and load these test rows into memory.
   - UI filters and lists parse them as valid Question and Video objects unless explicitly filtered by ID prefix.
3. **Safety Gate Remediation:** `src/tests/canonical-sequence-parsing.test.ts` was created to ensure sequence parsing ignores `TEST-P09-*` prefixes so counter allocation is not corrupted to timestamp values.
