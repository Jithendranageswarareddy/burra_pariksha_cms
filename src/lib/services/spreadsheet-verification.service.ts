/**
 * BURRA PARIKSHA CMS - Spreadsheet Verification & Schema Diagnostic Service
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Read-only diagnostic verification of Google Spreadsheet structure, sheets, headers,
 * and sequence rows.
 * 
 * IMPORTANT SAFETY RULE:
 * This service is purely diagnostic. It does NOT recreate worksheets, delete worksheets,
 * rewrite headers, reorder columns, or modify data in Google Sheets.
 */

import { googleSheetsClient } from '../google-sheets/client';
import { ALL_SHEET_TABS, SEQUENCE_ENTITIES, SHEET_SCHEMAS, SheetTabName } from '../schemas/google-sheets-schema';
import { validateWorksheetHeaders } from '../google-sheets/helpers';
import { sequencesRepository } from '../repositories/sequences.repository';
import { categoriesRepository, subtopicsRepository, topicsRepository } from '../repositories';

export interface TabVerificationResult {
  tabName: string;
  exists: boolean;
  hasHeaders: boolean;
  actualHeaders: string[];
  missingHeaders: string[];
  duplicateHeaders: string[];
  status: 'VALID' | 'MISSING_TAB' | 'MISSING_HEADERS' | 'DUPLICATE_HEADERS';
  manualFixGuidance?: string;
}

export interface SpreadsheetHealthReport {
  isConfigured: boolean;
  isConnected: boolean;
  mode: 'LIVE_GOOGLE_SHEETS' | 'MOCK_DEVELOPMENT';
  spreadsheetId: string;
  spreadsheetTitle: string;
  totalTabsExpected: number;
  totalTabsFound: number;
  tabs: TabVerificationResult[];
  sequencesConfigured: boolean;
  missingSequences: string[];
  taxonomyIntegrity: {
    isValid: boolean;
    issues: string[];
  };
  overallStatus: 'READY' | 'WARNING' | 'ERROR';
  summaryMessage: string;
  diagnosticActionItems: string[];
}

export class SpreadsheetVerificationService {
  private static instance: SpreadsheetVerificationService | null = null;

  private constructor() {}

  public static getInstance(): SpreadsheetVerificationService {
    if (!SpreadsheetVerificationService.instance) {
      SpreadsheetVerificationService.instance = new SpreadsheetVerificationService();
    }
    return SpreadsheetVerificationService.instance;
  }

  /**
   * Performs full read-only verification of Google Spreadsheet structure and schema.
   * Never mutates or rewrites the spreadsheet.
   */
  public async verifySpreadsheet(): Promise<SpreadsheetHealthReport> {
    const isConfigured = googleSheetsClient.isConfigured();
    const spreadsheetId = googleSheetsClient.getSpreadsheetId();

    if (!isConfigured) {
      return {
        isConfigured: false,
        isConnected: false,
        mode: 'MOCK_DEVELOPMENT',
        spreadsheetId: spreadsheetId || '(Not set)',
        spreadsheetTitle: 'N/A (Local Mock)',
        totalTabsExpected: ALL_SHEET_TABS.length,
        totalTabsFound: 0,
        tabs: ALL_SHEET_TABS.map((tab) => ({
          tabName: tab,
          exists: false,
          hasHeaders: false,
          actualHeaders: [],
          missingHeaders: SHEET_SCHEMAS[tab].columns.filter((c) => c.required).map((c) => c.name),
          duplicateHeaders: [],
          status: 'MISSING_TAB',
          manualFixGuidance: `Create sheet tab named "${tab}" in Google Sheets.`,
        })),
        sequencesConfigured: false,
        missingSequences: Object.values(SEQUENCE_ENTITIES),
        taxonomyIntegrity: { isValid: true, issues: [] },
        overallStatus: 'WARNING',
        summaryMessage: 'Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID) are not configured. Application is operating in explicit Local Mock Development Mode.',
        diagnosticActionItems: [
          'To connect live Google Sheets: Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in environment settings.',
          'Share your Google Sheet with the Service Account email with Editor permissions.',
        ],
      };
    }

    try {
      const metadata = await googleSheetsClient.getSpreadsheetMetadata();
      const existingTabs = new Set(metadata.sheetNames);

      const tabResults: TabVerificationResult[] = [];
      const diagnosticActionItems: string[] = [];
      let totalValid = 0;
      let hasMissingRequiredTabs = false;
      let hasMissingRequiredHeaders = false;
      let hasDuplicateHeaders = false;

      for (const tabName of ALL_SHEET_TABS) {
        const schema = SHEET_SCHEMAS[tabName];
        if (!existingTabs.has(tabName)) {
          hasMissingRequiredTabs = true;
          const missingReqCols = schema.columns.filter((c) => c.required).map((c) => c.name);
          const guidance = `Add worksheet tab named "${tabName}" in Google Sheets with header row: ${schema.columns.map((c) => c.name).join(', ')}`;
          diagnosticActionItems.push(guidance);

          tabResults.push({
            tabName,
            exists: false,
            hasHeaders: false,
            actualHeaders: [],
            missingHeaders: missingReqCols,
            duplicateHeaders: [],
            status: 'MISSING_TAB',
            manualFixGuidance: guidance,
          });
          continue;
        }

        try {
          const headers = await googleSheetsClient.getHeaders(tabName);
          const validation = validateWorksheetHeaders(headers, schema);

          // Check for duplicate headers
          const seen = new Set<string>();
          const duplicates: string[] = [];
          headers.forEach((h) => {
            const lower = h.trim().toLowerCase();
            if (seen.has(lower)) {
              duplicates.push(h);
            }
            seen.add(lower);
          });

          if (duplicates.length > 0) {
            hasDuplicateHeaders = true;
            const guidance = `Worksheet "${tabName}" contains duplicate header(s): ${duplicates.join(', ')}. Rename or remove duplicate columns.`;
            diagnosticActionItems.push(guidance);

            tabResults.push({
              tabName,
              exists: true,
              hasHeaders: headers.length > 0,
              actualHeaders: headers,
              missingHeaders: validation.missingHeaders,
              duplicateHeaders: duplicates,
              status: 'DUPLICATE_HEADERS',
              manualFixGuidance: guidance,
            });
          } else if (!validation.isValid) {
            hasMissingRequiredHeaders = true;
            const guidance = `Worksheet "${tabName}" is missing required header(s): ${validation.missingHeaders.join(', ')}. Add them to row 1.`;
            diagnosticActionItems.push(guidance);

            tabResults.push({
              tabName,
              exists: true,
              hasHeaders: headers.length > 0,
              actualHeaders: headers,
              missingHeaders: validation.missingHeaders,
              duplicateHeaders: [],
              status: 'MISSING_HEADERS',
              manualFixGuidance: guidance,
            });
          } else {
            totalValid++;
            tabResults.push({
              tabName,
              exists: true,
              hasHeaders: true,
              actualHeaders: headers,
              missingHeaders: [],
              duplicateHeaders: [],
              status: 'VALID',
            });
          }
        } catch (err: any) {
          hasMissingRequiredHeaders = true;
          const guidance = `Unable to read headers from tab "${tabName}": ${err?.message || 'Error'}`;
          diagnosticActionItems.push(guidance);

          tabResults.push({
            tabName,
            exists: true,
            hasHeaders: false,
            actualHeaders: [],
            missingHeaders: schema.columns.filter((c) => c.required).map((c) => c.name),
            duplicateHeaders: [],
            status: 'MISSING_HEADERS',
            manualFixGuidance: guidance,
          });
        }
      }

      // Check SEQUENCES tab content
      let sequencesConfigured = false;
      const missingSequences: string[] = [];
      try {
        const sequences = await sequencesRepository.findAll();
        const existingEntities = new Set(sequences.map((s) => s.entityType));
        const requiredEntities = [SEQUENCE_ENTITIES.QUESTION, SEQUENCE_ENTITIES.VIDEO, SEQUENCE_ENTITIES.SCRIPT, SEQUENCE_ENTITIES.THUMBNAIL];

        for (const entity of requiredEntities) {
          if (!existingEntities.has(entity)) {
            missingSequences.push(entity);
          }
        }
        sequencesConfigured = missingSequences.length === 0;

        if (!sequencesConfigured) {
          diagnosticActionItems.push(
            `SEQUENCES tab missing initial row(s) for: ${missingSequences.join(', ')}. Add rows in SEQUENCES tab (e.g. entity_type: "${missingSequences[0]}", next_number: 1).`
          );
        }
      } catch {
        sequencesConfigured = false;
      }

      // Check Taxonomy Foreign Key Integrity
      const taxonomyIssues: string[] = [];
      try {
        const categories = await categoriesRepository.findAll();
        const topics = await topicsRepository.findAll();
        const subtopics = await subtopicsRepository.findAll();

        const catIds = new Set(categories.map((c) => c.id));
        const topicIds = new Set(topics.map((t) => t.id));

        for (const topic of topics) {
          if (topic.categoryId && !catIds.has(topic.categoryId)) {
            taxonomyIssues.push(`Topic "${topic.id}" references non-existent categoryId "${topic.categoryId}".`);
          }
        }
        for (const sub of subtopics) {
          if (sub.topicId && !topicIds.has(sub.topicId)) {
            taxonomyIssues.push(`Subtopic "${sub.id}" references non-existent topicId "${sub.topicId}".`);
          }
        }
      } catch (err: any) {
        taxonomyIssues.push(`Could not verify taxonomy integrity: ${err?.message || 'Error'}`);
      }

      const totalExpected = ALL_SHEET_TABS.length;
      let overallStatus: 'READY' | 'WARNING' | 'ERROR' = 'READY';
      let summaryMessage = `Spreadsheet is connected and fully verified. All ${totalExpected} tabs and schemas match authoritative contracts.`;

      if (hasMissingRequiredTabs || hasMissingRequiredHeaders || hasDuplicateHeaders || !sequencesConfigured) {
        overallStatus = 'ERROR';
        summaryMessage = `Schema validation error: ${totalValid}/${totalExpected} tabs verified. Manual correction required in Google Sheets.`;
      } else if (taxonomyIssues.length > 0) {
        overallStatus = 'WARNING';
        summaryMessage = `Schema tabs valid, but ${taxonomyIssues.length} taxonomy foreign-key warnings detected.`;
      }

      return {
        isConfigured: true,
        isConnected: true,
        mode: 'LIVE_GOOGLE_SHEETS',
        spreadsheetId,
        spreadsheetTitle: metadata.title,
        totalTabsExpected: totalExpected,
        totalTabsFound: metadata.sheetNames.length,
        tabs: tabResults,
        sequencesConfigured,
        missingSequences,
        taxonomyIntegrity: {
          isValid: taxonomyIssues.length === 0,
          issues: taxonomyIssues,
        },
        overallStatus,
        summaryMessage,
        diagnosticActionItems,
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        isConnected: false,
        mode: 'LIVE_GOOGLE_SHEETS',
        spreadsheetId,
        spreadsheetTitle: 'Connection Failed',
        totalTabsExpected: ALL_SHEET_TABS.length,
        totalTabsFound: 0,
        tabs: [],
        sequencesConfigured: false,
        missingSequences: [],
        taxonomyIntegrity: { isValid: false, issues: ['Connection failure'] },
        overallStatus: 'ERROR',
        summaryMessage: `Failed to connect to Google Sheets: ${err?.message || 'Network error'}. Verify Service Account permissions and GOOGLE_PRIVATE_KEY formatting.`,
        diagnosticActionItems: [
          'Check that GOOGLE_PRIVATE_KEY contains the complete RSA private key with "\\n" replaced by actual newlines or valid escaped strings.',
          'Verify that the Google Sheet is shared with GOOGLE_SERVICE_ACCOUNT_EMAIL as an Editor.',
          'Check that the Google Sheets API is enabled in your Google Cloud Project.',
        ],
      };
    }
  }
}

export const spreadsheetVerificationService = SpreadsheetVerificationService.getInstance();
