# Database Technology Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 02 of 39  

---

## 1. Discovered Database Technologies

A forensic sweep of `package.json`, lock files, configuration files, and `src/` yields the following verified inventory of database and persistence technologies:

| Technology / Library | Version / Spec | Package | Connection Module | Environment | Classification | Purpose |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Google Sheets API v4** | `v4` (REST) | `googleapis ^176.0.0` | `src/lib/google-sheets/client.ts` | Production / Staging | **ACTIVE** | Authoritative tabular data store for all 28 domain entities |
| **Google Drive API v3** | `v3` (REST) | `googleapis ^176.0.0` | `src/lib/services/google-drive.service.ts` | Production / Staging | **ACTIVE** | Authoritative binary file and media asset storage |
| **In-Memory Map Store** | `ES2022 Map` | Built-in JavaScript | `src/lib/repositories/base.repository.ts` | Local Dev / Fallback | **ACTIVE** | Ephemeral fallback storage when Google credentials missing |
| **PostgreSQL** | None | None | None | None | **UNUSED / NON-EXISTENT** | Zero code, zero drivers, zero connection strings |
| **MySQL / MariaDB** | None | None | None | None | **UNUSED / NON-EXISTENT** | Zero code, zero drivers, zero connection strings |
| **SQLite** | None | None | None | None | **UNUSED / NON-EXISTENT** | Zero code, zero drivers, zero connection strings |
| **Google Cloud SQL** | None | None | None | None | **UNUSED / NON-EXISTENT** | No Cloud SQL instance, proxy, or Unix socket configured |
| **Firebase / Firestore** | None | None | None | None | **UNUSED / NON-EXISTENT** | No Firebase SDK or Firestore client in dependencies |
| **MongoDB** | None | None | None | None | **UNUSED / NON-EXISTENT** | No Mongoose or MongoDB driver in dependencies |
| **Prisma ORM** | None | None | None | None | **UNUSED / NON-EXISTENT** | No schema.prisma, no @prisma/client |
| **Drizzle ORM** | None | None | None | None | **UNUSED / NON-EXISTENT** | No drizzle-orm, no drizzle.config.ts |
| **TypeORM / Sequelize** | None | None | None | None | **UNUSED / NON-EXISTENT** | No ORM models, decorators, or config |

---

## 2. Forensic Code Verification

### `package.json` Direct Dependencies
```json
{
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "busboy": "^1.6.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "express-rate-limit": "^8.7.0",
    "googleapis": "^176.0.0",
    "helmet": "^8.3.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-router-dom": "^7.18.2",
    "zod": "^4.4.3"
  }
}
```

**Finding:** The ONLY persistence-related client package is `googleapis ^176.0.0`.

---

## 3. Technology Role Classifications

1. **ACTIVE PRODUCTION:**  
   Google Sheets API v4 via `googleapis` is the sole active production database engine. Every read and write of business records routes through `GoogleSheetsClient`.
2. **ACTIVE DEVELOPMENT FALLBACK:**  
   When environment variables `GOOGLE_SERVICE_ACCOUNT_EMAIL` or `GOOGLE_PRIVATE_KEY` are unset, `BaseRepository` routes all CRUD operations to `BaseRepository.fallbackStore`, an in-memory `Map<SheetTabName, Map<RecordId, Entity>>`. Data in fallback store is lost upon Node process restart.
3. **UNUSED / NON-EXISTENT RELATIONAL TIER:**  
   There is no relational database. All architectural assumptions of relational databases (foreign keys, atomic multi-table transactions, triggers, unique indexes, B-trees) are completely absent at the storage tier.
