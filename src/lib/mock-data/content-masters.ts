/**
 * BURRA PARIKSHA CMS - Content Masters Mock Dataset
 * Initial canonical Content Master linking primary question and downstream productions.
 */

import { ContentMaster, ContentMasterStatus } from '../../types';

export const MOCK_CONTENT_MASTERS: ContentMaster[] = [
  {
    id: 'BP-MST-000001',
    title: 'Time, Speed & Distance — Escalators & Walking Speeds Aptitude Series',
    status: ContentMasterStatus.ACTIVE,
    primaryQuestionId: 'BP-Q-1001',
    categoryId: 'CAT-QA',
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-02',
    createdBy: 'USR-001',
    createdAt: '2026-02-01T09:30:00Z',
    updatedAt: '2026-02-03T14:20:00Z',
  },
];
