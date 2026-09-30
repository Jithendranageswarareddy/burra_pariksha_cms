# Request Payloads & DTO Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 08 of 30  

---

## 1. Request Payload Characteristics

API mutating endpoints (POST, PUT, PATCH) in BP-CMS consume JSON request bodies (`Content-Type: application/json`).

---

## 2. Canonical Payload Specifications for Core Endpoints

### 1. Create Question (`POST /api/questions`)
```json
{
  "questionText": "string (min 10 chars, required)",
  "language": "enum ('te' | 'en', required)",
  "difficulty": "enum ('EASY' | 'MEDIUM' | 'HARD', required)",
  "subjectId": "string (UUID, required)",
  "topicId": "string (UUID, required)",
  "subtopicId": "string (UUID, optional)",
  "optionA": "string (required)",
  "optionB": "string (required)",
  "optionC": "string (required)",
  "optionD": "string (required)",
  "correctOption": "enum ('A' | 'B' | 'C' | 'D', required)",
  "explanation": "string (min 10 chars, required)",
  "tags": ["string (optional)"]
}
```

### 2. Video Record Take (`POST /api/videos/:id/record`)
```json
{
  "rawDriveUrl": "string (Google Drive URL, required)",
  "takeNumber": "integer (>= 1, required)",
  "notes": "string (optional)"
}
```

### 3. Publishing Schedule (`POST /api/publishing/schedule`)
```json
{
  "videoId": "string (required)",
  "platforms": ["enum ('youtube' | 'instagram' | 'facebook', min 1, required)"],
  "scheduledTime": "string (ISO-8601 timestamp, required)",
  "title": "string (required)",
  "description": "string (optional)",
  "tags": ["string (optional)"]
}
```
