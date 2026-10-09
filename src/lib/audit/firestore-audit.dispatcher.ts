/**
 * BURRA PARIKSHA CMS — Firestore Native Audit Dispatcher
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY (Section 08)
 *
 * Implements persistent append-only audit ledger on Google Cloud Firestore:
 * - Stores in authoritative 'audit_events' collection
 * - Zero updates or deletes allowed (tamper-resistant)
 * - Automatic redaction of sensitive credentials and PII
 * - Seamless fallback to internal InMemoryAuditDispatcher in offline/test environments
 */

import { google, firestore_v1 } from 'googleapis';
import {
  AuditEvent,
  CreateAuditEventInput,
  AuditQueryFilters,
  CreateAuditEventInputSchema,
  redactSensitiveData,
} from '../../types/audit';
import { IAuditDispatcher, AuditQueryResult } from './audit-dispatcher.interface';
import { InMemoryAuditDispatcher } from './in-memory-audit.dispatcher';
import { canonicalIdService } from '../id.service';
import { ValidationError } from '../errors';
import { entityToFirestoreDocument, firestoreDocumentToEntity } from '../db/firestore-converters';

export class FirestoreAuditDispatcher implements IAuditDispatcher {
  public readonly collectionName = 'audit_events';
  private readonly projectId: string;
  private readonly databaseId: string;
  private firestoreClient: firestore_v1.Firestore | null = null;
  private fallbackDispatcher: InMemoryAuditDispatcher | null = null;
  private isClientInitialized = false;

  constructor() {
    this.projectId =
      process.env.GCP_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      'burra-pariksha-cms';
    this.databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  }

  private async getClient(): Promise<firestore_v1.Firestore | null> {
    if (this.isClientInitialized) {
      return this.firestoreClient;
    }

    if (process.env.NODE_ENV === 'test' || !process.env.GCP_PROJECT_ID) {
      this.firestoreClient = null;
      this.fallbackDispatcher = new InMemoryAuditDispatcher();
      this.isClientInitialized = true;
      return null;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/datastore'],
      });
      await auth.getClient();
      this.firestoreClient = google.firestore({ version: 'v1', auth });
      this.isClientInitialized = true;
      return this.firestoreClient;
    } catch {
      this.firestoreClient = null;
      this.fallbackDispatcher = new InMemoryAuditDispatcher();
      this.isClientInitialized = true;
      return null;
    }
  }

  public async dispatch(input: CreateAuditEventInput): Promise<AuditEvent> {
    const parseResult = CreateAuditEventInputSchema.safeParse(input);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => ({
        field: i.path.join('.') || 'input',
        issue: i.message,
      }));
      throw new ValidationError('Audit event validation failed: mandatory fields missing or invalid.', issues);
    }

    const validatedInput = parseResult.data;
    const sanitizedInput = redactSensitiveData(validatedInput);

    const client = await this.getClient();
    if (!client || this.fallbackDispatcher) {
      return this.fallbackDispatcher!.dispatch(sanitizedInput);
    }

    const id = sanitizedInput.id || canonicalIdService.generateAuditId();
    const timestamp = sanitizedInput.timestamp || new Date().toISOString();

    const event: AuditEvent = {
      id,
      timestamp,
      actor: {
        actorId: sanitizedInput.actor.actorId,
        actorRole: sanitizedInput.actor.actorRole,
        actorName: sanitizedInput.actor.actorName,
        impersonatorId: sanitizedInput.actor.impersonatorId,
      },
      action: sanitizedInput.action,
      resource: {
        resourceType: sanitizedInput.resource.resourceType,
        resourceId: sanitizedInput.resource.resourceId,
        resourceVersion: sanitizedInput.resource.resourceVersion,
      },
      context: {
        requestId: sanitizedInput.context.requestId,
        traceId: sanitizedInput.context.traceId,
        ipAddress: sanitizedInput.context.ipAddress,
        userAgent: sanitizedInput.context.userAgent,
        workflowStep: sanitizedInput.context.workflowStep,
        jobId: sanitizedInput.context.jobId,
        aiRequestId: sanitizedInput.context.aiRequestId,
      },
      result: sanitizedInput.result || 'SUCCESS',
      reason: sanitizedInput.reason,
      stateChange: sanitizedInput.stateChange,
      errorMessage: sanitizedInput.errorMessage,
    };

    const doc = entityToFirestoreDocument(event as any);

    await client.projects.databases.documents.createDocument({
      parent: `projects/${this.projectId}/databases/${this.databaseId}/documents`,
      collectionId: this.collectionName,
      documentId: id,
      requestBody: doc,
    });

    return event;
  }

  public async query(filters?: AuditQueryFilters): Promise<AuditQueryResult> {
    const client = await this.getClient();
    if (!client || this.fallbackDispatcher) {
      return this.fallbackDispatcher!.query(filters);
    }

    try {
      const res = await client.projects.databases.documents.list({
        parent: `projects/${this.projectId}/databases/${this.databaseId}/documents`,
        collectionId: this.collectionName,
        pageSize: filters?.limit || 20,
      });

      const docs = res.data.documents || [];
      let events = docs.map((d) => firestoreDocumentToEntity<AuditEvent>(d));

      if (filters?.resourceType) {
        events = events.filter(
          (e) => e.resource.resourceType.toLowerCase() === filters.resourceType!.toLowerCase()
        );
      }
      if (filters?.resourceId) {
        events = events.filter((e) => e.resource.resourceId === filters.resourceId);
      }
      if (filters?.actorId) {
        events = events.filter((e) => e.actor.actorId === filters.actorId);
      }
      if (filters?.action) {
        events = events.filter((e) => e.action.toLowerCase() === filters.action!.toLowerCase());
      }
      if (filters?.startDate) {
        const startTime = new Date(filters.startDate).getTime();
        events = events.filter((e) => new Date(e.timestamp).getTime() >= startTime);
      }
      if (filters?.endDate) {
        const endTime = new Date(filters.endDate).getTime();
        events = events.filter((e) => new Date(e.timestamp).getTime() <= endTime);
      }

      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const total = events.length;
      const page = Math.max(1, filters?.page || 1);
      const limit = Math.min(100, Math.max(1, filters?.limit || 20));
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        events,
        total,
        page,
        limit,
        totalPages,
      };
    } catch {
      return {
        events: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        totalPages: 1,
      };
    }
  }
}
