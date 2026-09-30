# Critical Database Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 37 of 39  

---

## 1. Trace 1: Question Creation & ID Allocation

```
[POST /api/questions]
       │
       ▼
[QuestionService.createQuestion(data)]
       │
       ▼
[SequencesRepository.getNextSequenceValue('QUESTION')]
       ├── 1. GoogleSheetsClient.getRows('SEQUENCES')
       ├── 2. In-memory match: entity_type === 'QUESTION'
       ├── 3. Increment: currentValue = 142 -> 143
       ├── 4. Format: 'BP-Q-' + '000143' -> 'BP-Q-000143'
       └── 5. GoogleSheetsClient.updateCell('SEQUENCES', 'B3', 143)
       │
       ▼
[QuestionsRepository.create({ id: 'BP-Q-000143', ...data })]
       ├── 1. validateWorksheetHeaders('QUESTIONS')
       ├── 2. objectToRow(questionObj, headers)
       ├── 3. GoogleSheetsClient.appendRow('QUESTIONS', rowArray)
       └── 4. GoogleSheetsClient.invalidateRowCache('QUESTIONS')
       │
       ▼
[AuditLogRepository.appendEvent({ entity_id: 'BP-Q-000143', action: 'CREATE' })]
       └── GoogleSheetsClient.appendRow('AUDIT_LOG', rowArray)
```

---

## 2. Trace 2: Video Status Transition & Lock Acquisition

```
[PATCH /api/videos/:id/status]
       │
       ▼
[VideoService.updateVideoStatus('BP-V-000012', 'EDITING')]
       │
       ▼
[BaseRepository.recordLocks.get('VIDEOS:BP-V-000012')]
       ├── Lock Acquired in Current Process
       │
       ▼
[VideosRepository.findById('BP-V-000012')]
       ├── GoogleSheetsClient.getRows('VIDEOS') (Cache or HTTPS)
       └── In-memory search: r.id === 'BP-V-000012'
       │
       ▼
[Validation: VALID_VIDEO_TRANSITIONS['RECORDED'] includes 'EDITING'? -> YES]
       │
       ▼
[VideosRepository.update('BP-V-000012', { status: 'EDITING' })]
       ├── GoogleSheetsClient.updateRow('VIDEOS', rowIdx, updatedRowArray)
       └── GoogleSheetsClient.invalidateRowCache('VIDEOS')
       │
       ▼
[Release Lock: BaseRepository.recordLocks.delete('VIDEOS:BP-V-000012')]
```
