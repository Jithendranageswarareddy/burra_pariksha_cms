# ORM Model Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 12 of 39  

---

## 1. Presence of ORM / ODM Frameworks

A complete code and dependency inspection confirms:
- **Prisma:** ZERO models. No `schema.prisma` file exists.
- **Drizzle ORM:** ZERO tables. No `drizzle.config.ts` or Drizzle schemas exist.
- **TypeORM:** ZERO entity classes. No `@Entity` decorators exist.
- **Sequelize:** ZERO models.
- **Mongoose:** ZERO document schemas.

---

## 2. Pseudo-ORM Architecture: Contract-Based Mapping

BP-CMS replaces an ORM with a custom, lightweight object-to-row mapper:

### 1. Schema Contracts (`src/lib/schemas/google-sheets-schema.ts`)
Defines the mapping between JavaScript object properties and Google Sheets column headers:
```typescript
export interface SheetColumnDefinition {
  name: string;          // Google Sheets Column Header (Row 1)
  propertyKey: string;   // TypeScript Object Property
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  isPrimaryKey?: boolean;
  required?: boolean;
}
```

### 2. Serialization & Deserialization Helpers (`src/lib/google-sheets/helpers.ts`)
- **`objectToRow(obj, headers, schema)`:** Iterates through `headers` and serializes object properties into an array of stringified cells matching column order.
- **`rowToObject(row, headers, schema)`:** Iterates through `row` values and deserializes cells back into typed JavaScript objects based on `column.type`.

---

## 3. Schema Drift & Mapping Risks

1. **Header Reordering Hazard:**  
   Because mapping is dynamically determined by matching Row 1 headers at runtime, reordering columns in Google Sheets does NOT break data mapping. However, renaming a header in Google Sheets immediately breaks `MissingHeaderError` or results in `undefined` properties.
2. **Untyped JSON Columns:**  
   Complex sub-objects (e.g. `checklist`, `video_ids`, `target_dates`) are stored as serialized JSON strings. No database validator verifies that the JSON adheres to a schema.
