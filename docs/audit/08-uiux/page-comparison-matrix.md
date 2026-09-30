# Master Page Comparison Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 25 of 30  

---

## 1. Machine-Readable Comparative Matrix

| Page ID | Route | Primary Role | Stage | Forms | Tables | Modals | Tabs | Buttons | Primary Next Action | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| `PAGE-LOGIN` | `/login` | Public | Auth | 1 | 0 | 0 | 0 | 2 | Authenticate & Land | CANONICAL |
| `PAGE-DASH` | `/dashboard` | ALL | Dash | 0 | 0 | 0 | 1 | 1 | Select Hub Pipeline | CANONICAL |
| `PAGE-MYWORK` | `/my-work` | ALL | Work | 1 | 0 | 1 | 1 | 23 | Execute Assigned Task | CANONICAL |
| `PAGE-PLAN` | `/planning` | Lead | 01 | 1 | 0 | 1 | 1 | 59 | Create Question Batch | CANONICAL |
| `PAGE-QLIB` | `/questions` | Academic | 01-02 | 0 | 1 | 0 | 0 | 7 | Open Question Detail | CANONICAL |
| `PAGE-QDET` | `/questions/:id` | Academic | 01-02 | 1 | 0 | 0 | 0 | 12 | Improve / Verify Question | CANONICAL |
| `PAGE-QSTUDIO` | `/studio` | Author | 01 | 1 | 0 | 2 | 1 | 11 | Save & Continue to Verify | CANONICAL |
| `PAGE-QIMP` | `/questions/improve` | Editor | 02 | 1 | 0 | 0 | 0 | 11 | Save Quality Improvements | CANONICAL |
| `PAGE-QVERIFY` | `/questions/verify` | QA Review | 02 | 1 | 0 | 1 | 1 | 17 | Approve & Launch Video | CANONICAL |
| `PAGE-QUEUE` | `/queue` | Presenter | 04 | 0 | 1 | 0 | 0 | 8 | Launch Prompter / Record | CANONICAL |
| `PAGE-PRODTRK` | `/production` | Video Lead | 04-07 | 0 | 1 | 0 | 0 | 6 | Open Video Workspace | CANONICAL |
| `PAGE-VCSCRIPT`| `/videos/create-script`| Script | 03 | 1 | 0 | 0 | 1 | 1 | Generate Spoken Script | CANONICAL |
| `PAGE-VDET` | `/videos/:id` | Video Team | 03-11 | 7 | 0 | 6 | 8 | 84 | Advance Production Tab | CANONICAL |
| `PAGE-SOCREV` | `/social-review` | QA / Social | 09 | 0 | 1 | 1 | 1 | 10 | Signoff Social Package | CANONICAL |
| `PAGE-PLTPKG` | `/platform-packages` | Publisher | 10 | 0 | 1 | 0 | 1 | 7 | Package for Multi-Platform | CANONICAL |
| `PAGE-PUB` | `/publishing` | Publisher | 11-12 | 1 | 1 | 2 | 1 | 5 | Schedule Broadcast Release| CANONICAL |
| `PAGE-ANL-EXP` | `/analytics/*` | Analyst | 13-15 | 0 | 1 | 0 | 10 | 11 | Review Pedagogical Loop | CANONICAL |
| `PAGE-SOCANL` | `/social-analytics` | Analyst | 13 | 1 | 1 | 0 | 0 | 18 | Moderate Viewer Comments | CANONICAL |
| `PAGE-TEAM` | `/team` | Lead | Ops | 1 | 1 | 1 | 1 | 18 | Reassign Team Workload | CANONICAL |
| `PAGE-CMASTER` | `/content-masters` | Lead | 01-15 | 0 | 1 | 0 | 1 | 11 | Inspect Entity Graph | CANONICAL |
| `PAGE-SETT` | `/settings` | Admin | System | 2 | 1 | 1 | 3 | 35 | Verify Google Sheets Ping | CANONICAL |
| `PAGE-RECOV` | `/recovery` | Admin | System | 1 | 1 | 1 | 0 | 17 | Execute Backup Restore | CANONICAL |
| `PAGE-404` | `/*` | ALL | Utility | 0 | 0 | 0 | 0 | 1 | Return to Dashboard | CANONICAL |
