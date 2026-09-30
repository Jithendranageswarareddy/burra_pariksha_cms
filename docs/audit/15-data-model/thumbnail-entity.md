# Thumbnail Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 16 of 51  

---

## 1. Thumbnail Identity & Physical Storage

- **Classification:** Business Entity (Visual Media Asset)
- **Primary Identifier:** `BP-T-XXXXXX` (6 digits)
- **Candidate Identifier:** `BP-TC-XXXXXX` (Pre-approval candidate)
- **Physical Representation:**
  - Metadata: Google Sheets tab `THUMBNAILS` + `THUMBNAIL_VERSIONS`
  - Binary Image: Google Drive folder `THUMBNAILS`
- **TypeScript Model:** `interface Thumbnail` (`src/types/index.ts:610–650`)
- **Repositories:** `thumbnailsRepository`, `thumbnailCandidatesRepository`

---

## 2. Dimensions & Formats
- **Aspect Ratio:** 9:16 Vertical (`720x1280` px)
- **MIME Type:** `image/jpeg` or `image/png`
- **Status Enum:** `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`
- **Invariant:** A Video cannot legally transition to `PUBLISHED` unless linked Thumbnail has `status === 'APPROVED'`.
