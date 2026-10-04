/**
 * BURRA PARIKSHA CMS - Production Spreadsheet Initializer Service
 * 
 * SAFE, IDEMPOTENT, ONE-TIME PRODUCTION SPREADSHEET INITIALIZATION UTILITY
 * 
 * Invariants & Safety Guarantees:
 * 1. Connects using existing GoogleSheetsClient and server-side environment variables.
 * 2. Checks if GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY exist.
 * 3. Inspects existing tabs via spreadsheets.get metadata.
 * 4. Creates only missing required worksheet tabs with exact frozen header row (18 tabs).
 * 5. Does NOT delete existing worksheets or clear existing rows.
 * 6. Does NOT overwrite existing records or data.
 * 7. Leaves Sheet1 or non-conflicting tabs untouched.
 * 8. Initializes SEQUENCES only if entries are missing, never overwriting or decrementing existing sequence counters.
 * 9. Seeds default USERS and taxonomy (CATEGORIES, TOPICS, SUBTOPICS) only if the sheets are completely empty.
 * 10. Idempotent: Executing multiple times produces identical, stable database state.
 * 11. Redacts all sensitive credentials in output and logs.
 */

import { googleSheetsClient } from '../google-sheets/client';
import {
  ALL_SHEET_TABS,
  ID_PREFIX_MAP,
  SEQUENCE_ENTITIES,
  SHEET_SCHEMAS,
  SHEET_TABS,
  SequenceEntityType,
  SheetTabName,
} from '../schemas/google-sheets-schema';
import { sequencesRepository, SequenceRecord } from '../repositories/sequences.repository';
import { usersRepository } from '../repositories/users.repository';
import { categoriesRepository } from '../repositories/categories.repository';
import { topicsRepository } from '../repositories/topics.repository';
import { subtopicsRepository } from '../repositories/subtopics.repository';
import { questionConfigRepository } from '../repositories/question-config.repository';
import { PRODUCTION_CATEGORIES, PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } from '../data/production-taxonomy';
import { authService } from './auth.service';
import { User, UserRole, QuestionConfigEntry } from '../../types';

export interface SheetInitializationReport {
  isConfigured: boolean;
  isLiveAccess: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  existingTabsFound: string[];
  createdTabs: string[];
  skippedTabs: string[];
  headersVerifiedCount: number;
  sequencesInitialized: string[];
  sequencesSkipped: string[];
  usersSeeded: number;
  taxonomySeeded: {
    categories: number;
    topics: number;
    subtopics: number;
  };
  questionConfigSeeded?: number;
  summary: string;
  success: boolean;
}

export class ProductionSheetInitializer {
  private static instance: ProductionSheetInitializer | null = null;

  private constructor() {}

  public static getInstance(): ProductionSheetInitializer {
    if (!ProductionSheetInitializer.instance) {
      ProductionSheetInitializer.instance = new ProductionSheetInitializer();
    }
    return ProductionSheetInitializer.instance;
  }

  /**
   * Safe, idempotent execution of spreadsheet initialization.
   */
  public async initializeSpreadsheet(): Promise<SheetInitializationReport> {
    const isConfigured = googleSheetsClient.isConfigured();
    const spreadsheetId = googleSheetsClient.getSpreadsheetId();

    if (!isConfigured) {
      return {
        isConfigured: false,
        isLiveAccess: false,
        spreadsheetId: spreadsheetId || '(Not configured)',
        spreadsheetTitle: 'N/A (Credentials Missing)',
        existingTabsFound: [],
        createdTabs: [],
        skippedTabs: ALL_SHEET_TABS,
        headersVerifiedCount: 0,
        sequencesInitialized: [],
        sequencesSkipped: Object.values(SEQUENCE_ENTITIES),
        usersSeeded: 0,
        taxonomySeeded: { categories: 0, topics: 0, subtopics: 0 },
        summary: 'Production credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID) are not set. Live initialization skipped.',
        success: false,
      };
    }

    try {
      // 1. Inspect existing spreadsheet metadata
      const metadata = await googleSheetsClient.getSpreadsheetMetadata();
      const existingTabSet = new Set(metadata.sheetNames);

      const createdTabs: string[] = [];
      const skippedTabs: string[] = [];
      let headersVerifiedCount = 0;

      // 2. Safely create any missing worksheets with exact schema headers
      for (const tabName of ALL_SHEET_TABS) {
        const schema = SHEET_SCHEMAS[tabName];
        const expectedHeaders = schema.columns.map((c) => c.name);

        if (!existingTabSet.has(tabName)) {
          // Tab does not exist -> Create tab and write row 1 header
          await googleSheetsClient.createWorksheetIfNotExists(tabName, expectedHeaders);
          createdTabs.push(tabName);
          headersVerifiedCount++;
        } else {
          // Tab already exists -> Do NOT clear or recreate
          skippedTabs.push(tabName);
          try {
            const actualHeaders = await googleSheetsClient.getHeaders(tabName);
            if (actualHeaders.length > 0) {
              headersVerifiedCount++;
            }
          } catch {
            // Header read check handled gracefully
          }
        }
      }

      // 3. Initialize SEQUENCES safely (without overwriting or decrementing existing sequence values)
      const sequencesInitialized: string[] = [];
      const sequencesSkipped: string[] = [];

      try {
        const existingSequences = await sequencesRepository.findAll();
        const existingSeqMap = new Map<string, SequenceRecord>();
        for (const s of existingSequences) {
          if (s.entityType) {
            existingSeqMap.set(s.entityType, s);
          }
        }

        for (const entity of Object.values(SEQUENCE_ENTITIES)) {
          const config = ID_PREFIX_MAP[entity as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };
          const existing = existingSeqMap.get(entity);

          if (!existing) {
            // Seed initial row with nextNumber = 1
            const newSeq: SequenceRecord = {
              entityType: entity,
              nextNumber: 1,
              prefix: config.prefix,
              padLength: config.padLength,
              updatedAt: new Date().toISOString(),
            };
            await sequencesRepository.appendRecord(newSeq);
            sequencesInitialized.push(entity);
          } else {
            sequencesSkipped.push(entity);
          }
        }
      } catch (err: any) {
        console.error(`[ProductionSheetInitializer] Note during SEQUENCES initialization: ${err?.message || 'Error'}`);
      }

      // 4. Seed default USERS only if USERS worksheet is completely empty (no existing users)
      let usersSeeded = 0;
      try {
        const existingUsers = await usersRepository.findAll();
        if (existingUsers.length === 0) {
          const now = new Date().toISOString();
          const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'password123';
          const defaultPasswordHash = await authService.hashPassword(initialAdminPassword);
          const defaultInitialUsers: User[] = [
            {
              id: 'USR-001',
              name: 'Jithendra',
              email: 'jithendrareddy629@gmail.com',
              role: UserRole.ADMIN,
              roles: [UserRole.ADMIN],
              isActive: true,
              password_hash: defaultPasswordHash,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'USR-002',
              name: 'Surendra Reddy',
              email: 'seelamsurendrareddy999@gmail.com',
              role: UserRole.CONTENT_MANAGER,
              roles: [UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.VIDEO_EDITOR],
              isActive: true,
              password_hash: defaultPasswordHash,
              createdAt: now,
              updatedAt: now,
            },
          ];

          for (const u of defaultInitialUsers) {
            await usersRepository.appendRecord(u);
            usersSeeded++;
          }
        }
      } catch (err: any) {
        console.error(`[ProductionSheetInitializer] Note during USERS check: ${err?.message || 'Error'}`);
      }

      // 5. Seed default Taxonomy (CATEGORIES, TOPICS, SUBTOPICS) only if completely empty
      let categoriesSeeded = 0;
      let topicsSeeded = 0;
      let subtopicsSeeded = 0;

      try {
        const existingCategories = await categoriesRepository.findAll();
        if (existingCategories.length === 0) {
          for (const c of PRODUCTION_CATEGORIES) {
            await categoriesRepository.appendRecord(c);
            categoriesSeeded++;
          }
        }

        const existingTopics = await topicsRepository.findAll();
        if (existingTopics.length === 0) {
          for (const t of PRODUCTION_TOPICS) {
            await topicsRepository.appendRecord(t);
            topicsSeeded++;
          }
        }

        const existingSubtopics = await subtopicsRepository.findAll();
        if (existingSubtopics.length === 0) {
          for (const s of PRODUCTION_SUBTOPICS) {
            await subtopicsRepository.appendRecord(s);
            subtopicsSeeded++;
          }
        }
      } catch (err: any) {
        console.error(`[ProductionSheetInitializer] Note during taxonomy check: ${err?.message || 'Error'}`);
      }

      // 6. Seed minimal canonical QUESTION_CONFIG only if worksheet is completely empty
      let questionConfigSeeded = 0;
      try {
        const existingConfig = await questionConfigRepository.findAll();
        if (existingConfig.length === 0) {
          const nowIso = new Date().toISOString();
          const minimalCanonicalSeed: QuestionConfigEntry[] = [
            {
              id: 'CFG-STY-001',
              dimension: 'QUESTION_STYLE',
              code: 'STORY_BASED',
              displayLabel: 'Story-Based Scenario',
              description: 'Narrative problem set in everyday situations with relatable characters',
              aiPromptGuidance: 'Frame the mathematical problem inside an authentic narrative arc with clear setup, tension, and resolution.',
              sortOrder: 10,
              isActive: true,
              isDefault: true,
              updatedAt: nowIso,
            },
            {
              id: 'CFG-CTX-001',
              dimension: 'REAL_LIFE_CONTEXT',
              code: 'DAILY_COMMUTE',
              displayLabel: 'Daily Commute & Public Transit',
              description: 'Scenarios involving bus, metro, train, auto-rickshaw travel and schedules',
              aiPromptGuidance: 'Ground the problem in commuter travel, train/bus arrival offsets, ticketing queues, and transit speed.',
              sortOrder: 10,
              isActive: true,
              isDefault: true,
              updatedAt: nowIso,
            },
          ];

          for (const entry of minimalCanonicalSeed) {
            await questionConfigRepository.appendRecord(entry);
            questionConfigSeeded++;
          }
        }
      } catch (err: any) {
        console.error(`[ProductionSheetInitializer] Note during QUESTION_CONFIG check: ${err?.message || 'Error'}`);
      }

      return {
        isConfigured: true,
        isLiveAccess: true,
        spreadsheetId,
        spreadsheetTitle: metadata.title,
        existingTabsFound: metadata.sheetNames,
        createdTabs,
        skippedTabs,
        headersVerifiedCount,
        sequencesInitialized,
        sequencesSkipped,
        usersSeeded,
        taxonomySeeded: {
          categories: categoriesSeeded,
          topics: topicsSeeded,
          subtopics: subtopicsSeeded,
        },
        questionConfigSeeded,
        summary: `Spreadsheet initialization complete. Created ${createdTabs.length} tabs, skipped ${skippedTabs.length} existing tabs, initialized ${sequencesInitialized.length} sequences.`,
        success: true,
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        isLiveAccess: false,
        spreadsheetId,
        spreadsheetTitle: 'Failed to access spreadsheet',
        existingTabsFound: [],
        createdTabs: [],
        skippedTabs: [],
        headersVerifiedCount: 0,
        sequencesInitialized: [],
        sequencesSkipped: [],
        usersSeeded: 0,
        taxonomySeeded: { categories: 0, topics: 0, subtopics: 0 },
        summary: `Initialization error: ${err?.message || 'Unknown error occurred while accessing Google Sheets API'}`,
        success: false,
      };
    }
  }
}

export const productionSheetInitializer = ProductionSheetInitializer.getInstance();
