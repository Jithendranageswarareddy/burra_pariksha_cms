# S4-T03: Explicit Domain Entity to Firestore Collection Registry

| Business Domain Entity | Canonical Prefix | Firestore Collection | Mode | Immutability Guard |
| :--- | :--- | :--- | :---: | :---: |
| **User Account** | `USR-` | `users` | Authoritative | Version OCC |
| **Question Draft** | `BP-DFT-` | `question_drafts` | Authoritative | Version OCC |
| **Approved Question** | `BP-Q-` | `questions` | Authoritative | Version OCC |
| **Question Video Link** | `QV-` | `question_videos` | Authoritative | Version OCC |
| **Video Production** | `BP-V-` | `videos` | Authoritative | Version OCC |
| **Script** | `BP-S-` | `scripts` | Authoritative | Version OCC |
| **Script Version** | `BP-SV-` | `script_versions` | Authoritative | Version OCC |
| **Thumbnail** | `BP-T-` | `thumbnails` | Authoritative | Version OCC |
| **Thumbnail Version** | `BP-TV-` | `thumbnail_versions` | Authoritative | Version OCC |
| **Pinned Comment** | `BP-PIN-` | `pinned_comments` | Authoritative | Version OCC |
| **Pinned Comment Version** | `BP-PV-` | `pinned_comment_versions`| Authoritative | Version OCC |
| **Assignment** | `BP-ASN-` | `assignments` | Authoritative | Version OCC |
| **Publishing Package** | `BP-PUB-` | `publishing_packages` | Authoritative | Version OCC |
| **Content Master** | `BP-CNT-` | `content_masters` | Authoritative | Version OCC |
| **Content Plan** | `BP-PLN-` | `content_plans` | Authoritative | Version OCC |
| **Content Batch** | `BP-BCH-` | `content_batches` | Authoritative | Version OCC |
| **Question Validation** | `BP-VAL-` | `question_validations`| Authoritative | Version OCC |
| **Social Review** | `BP-REV-` | `social_reviews` | Authoritative | Version OCC |
| **Question Config** | `BP-QCFG-` | `question_configs` | Authoritative | Version OCC |
| **Media Asset** | `BP-MED-` | `media_assets` | Authoritative | Version OCC |
| **Category** | `BP-CAT-` | `categories` | Authoritative | Version OCC |
| **Topic** | `BP-TOP-` | `topics` | Authoritative | Version OCC |
| **Subtopic** | `BP-SUB-` | `subtopics` | Authoritative | Version OCC |
| **Sequence Counter** | `SEQ-` | `sequences` | Authoritative | Atomic Counter |
| **Workflow Instance** | `wfl_` | `workflow_instances` | Authoritative | Version OCC |
| **Workflow History** | `wfh_` | `workflow_history` | Authoritative | Append-Only Immutable |
| **Audit Log Ledger** | `AUD-` / `aud_` | `audit_logs` | Authoritative | Append-Only Immutable |
| **Audit Event Ledger** | `aud_` | `audit_events` | Authoritative | Append-Only Immutable |
| **Social Analytics** | `BP-ANL-` | `social_analytics` | Authoritative | Version OCC |
| **Analytics Intelligence** | `BP-SPI-` | `analytics_intelligences`| Authoritative | Version OCC |
| **Strategy Recommendation**| `BP-STR-` | `strategy_recommendations`| Authoritative | Version OCC |
| **Social Audience Comment**| `BP-CMT-` | `social_comments` | Authoritative | Version OCC |
| **Comment Intelligence** | `BP-CMI-` | `comment_intelligences`| Authoritative | Version OCC |
