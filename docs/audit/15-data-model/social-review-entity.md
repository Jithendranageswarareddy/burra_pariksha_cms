# Social Review Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 17 of 51  

---

## 1. Social Review Bundle Representation

- **Classification:** Business Entity / Quality Review Record
- **Primary Identifier:** `BP-REV-XXXXXX`
- **Physical Storage:** Google Sheets tab `SOCIAL_REVIEWS`
- **TypeScript Model:** `interface SocialReviewBundle` (`src/types/index.ts:2110–2160`)
- **Repository:** `socialReviewsRepository` (`phase20-social-reviews.repository.ts`)

---

## 2. Integrity Hash Invariant
To prevent reviewing stale packages, the entity records:
- `currentVersionHash`: Deterministic SHA-256 hash of Question + Script + Thumbnail + Video Cut.
- If upstream video or script changes, `currentReviewStatus` automatically regresses to `STALE_REVISION_REQUIRED`.
