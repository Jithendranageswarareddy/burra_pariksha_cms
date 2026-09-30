# Field-by-Field Interactive Surface Forensic Inventory (291 Fields)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 03 of 30  

---

## 1. Field Distribution Overview

The 32 form and data-entry surfaces across BP-CMS contain a total of **291 interactive input fields**:
- **Standard Input (`<input>`)**: 147 fields (text, number, url, datetime-local, checkbox, radio)
- **Text Area (`<textarea>`)**: 53 fields (question stems, explanations, scripts, notes)
- **Selection Dropdowns (`<select>`)**: 91 fields (languages, subjects, statuses, assignees, platforms)

---

## 2. Field Audit Register by Major Subsystem

### 2.1 Authentication & Profile (FORM-01)
| Field Name | Type | Data Type | Required? | Default | Client Validation | Backend Validation | Persistence Field |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `email` | `input[type="email"]` | `string` | YES | `""` | Email regex check | Basic string non-empty | LocalStorage / Token |
| `password` | `input[type="password"]`| `string` | YES | `""` | `length >= 6` | Authentication check | Session Hash |

### 2.2 Question Creation & Verification (FORM-02, FORM-03, FORM-04)
| Field Name | Type | Data Type | Required? | Default | Client Validation | Backend Validation | Persistence Field |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `questionText` | `textarea` | `string` | YES | `""` | `length >= 10 && length <= 500` | `z.string().min(10)` | `QUESTIONS.question_text` |
| `language` | `select` | `enum` | YES | `"te"` | Enum in (`"te"`, `"en"`) | `QuestionLanguage` enum | `QUESTIONS.language` |
| `difficulty` | `select` | `enum` | YES | `"MEDIUM"` | Enum in (`"EASY"`, `"MEDIUM"`, `"HARD"`) | `DifficultyLevel` enum | `QUESTIONS.difficulty` |
| `subjectId` | `select` | `string` | YES | `""` | Non-empty UUID/ID | Foreign key check | `QUESTIONS.subject_id` |
| `topicId` | `select` | `string` | YES | `""` | Non-empty UUID/ID | Foreign key check | `QUESTIONS.topic_id` |
| `subtopicId` | `select` | `string` | NO | `""` | None | Optional foreign key | `QUESTIONS.subtopic_id` |
| `optionA` | `input[type="text"]` | `string` | YES | `""` | Non-empty | `z.string().min(1)` | `QUESTIONS.option_a` |
| `optionB` | `input[type="text"]` | `string` | YES | `""` | Non-empty | `z.string().min(1)` | `QUESTIONS.option_b` |
| `optionC` | `input[type="text"]` | `string` | YES | `""` | Non-empty | `z.string().min(1)` | `QUESTIONS.option_c` |
| `optionD` | `input[type="text"]` | `string` | YES | `""` | Non-empty | `z.string().min(1)` | `QUESTIONS.option_d` |
| `correctOption`| `select` | `enum` | YES | `"A"` | Value in `['A','B','C','D']` | Enum validation | `QUESTIONS.correct_option` |
| `explanation` | `textarea` | `string` | YES | `""` | `length >= 10` | `z.string().min(10)` | `QUESTIONS.explanation` |
| `rejectionReason`|`textarea` | `string` | CONDITIONAL | `""` | Required if action is REJECT | Required if `status == REJECTED` | `QUESTIONS.rejection_reason`|
| `verificationScore`|`input[number]`| `number` | YES | `100` | `0 <= score <= 100` | `z.number().min(0).max(100)` | `QUESTION_VALIDATIONS.score`|

### 2.3 Scripting & Teleprompter (FORM-07, FORM-08)
| Field Name | Type | Data Type | Required? | Default | Client Validation | Backend Validation | Persistence Field |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `hook` | `textarea` | `string` | YES | `""` | `length >= 10 && length <= 200` | `z.string().min(5)` | `SCRIPT.hook` |
| `body` | `textarea` | `string` | YES | `""` | `length >= 50` | `z.string().min(20)` | `SCRIPT.body` |
| `callToAction` | `textarea` | `string` | YES | `""` | `length >= 10` | `z.string().min(5)` | `SCRIPT.cta` |
| `targetDuration`| `input[number]`| `number` | YES | `60` | `30 <= duration <= 180` | Integer validation | `SCRIPT.target_duration` |
| `wpm` | `input[number]`| `number` | NO | `140` | `100 <= wpm <= 200` | Integer validation | Local State / Script Config |
| `cueNotes` | `textarea` | `string` | NO | `""` | None | None | `SCRIPT.cue_notes` |

### 2.4 Video Recording & Edit Bay (FORM-09, FORM-11)
| Field Name | Type | Data Type | Required? | Default | Client Validation | Backend Validation | Persistence Field |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `rawDriveUrl` | `input[type="url"]` | `string` | YES | `""` | Regex: `drive.google.com` | URL validation | `VIDEOS.raw_drive_url` |
| `takeNumber` | `input[number]`| `number` | YES | `1` | `takeNumber >= 1` | Integer check | `VIDEOS.take_count` |
| `editedDriveUrl`| `input[type="url"]` | `string` | YES | `""` | Regex: `drive.google.com` | URL validation | `VIDEOS.edited_drive_url` |
| `editNotes` | `textarea` | `string` | NO | `""` | None | String sanitization | `VIDEOS.edit_notes` |

### 2.5 Publishing & Scheduling (FORM-20, FORM-21, FORM-22)
| Field Name | Type | Data Type | Required? | Default | Client Validation | Backend Validation | Persistence Field |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `scheduledTime`| `input[datetime]`| `string` | YES | `""` | Valid future timestamp | Timestamp ISO-8601 | `PUBLISHING.scheduled_time` |
| `platforms` | `checkbox[]` | `string[]` | YES | `['youtube']` | `platforms.length >= 1` | Array enum check | `PUBLISHING.platform` |
| `publishedUrl` | `input[type="url"]` | `string` | YES | `""` | Valid URL | URL validation | `PUBLISHING.live_url` |
| `platformVideoId`|`input[text]`| `string` | YES | `""` | Non-empty alphanumeric | Non-empty | `PUBLISHING.platform_post_id`|
