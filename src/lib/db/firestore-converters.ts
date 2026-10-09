/**
 * BURRA PARIKSHA CMS — Firestore Document Serialization Converters
 */
import { BaseEntity } from './repository.interface';

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: 'NULL_VALUE' };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [key, val] of Object.entries(val.mapValue.fields || {})) {
      res[key] = fromFirestoreValue(val);
    }
    return res;
  }
  return null;
}

export function entityToFirestoreDocument<T extends BaseEntity>(entity: T): any {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  }
  return { fields };
}

export function firestoreDocumentToEntity<T extends BaseEntity>(doc: any): T {
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(doc.fields || {})) {
    res[key] = fromFirestoreValue(val);
  }
  return res as T;
}
