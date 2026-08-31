/**
 * BURRA PARIKSHA CMS - Video Queue Mock Data
 */

import { DifficultyLevel, PriorityLevel, VideoProductionStatus } from '../../types';

export interface QueueItemView {
  id: string; // Video ID or Queue ID
  queuePosition: number;
  questionId: string;
  topicName: string;
  categoryName: string;
  difficulty: DifficultyLevel;
  priority: PriorityLevel;
  productionStatus: VideoProductionStatus;
  title: string;
  targetDuration: string;
  createdDate: string;
  notes?: string;
}

export const MOCK_QUEUE: QueueItemView[] = [
  {
    id: 'QUEUE-01',
    queuePosition: 1,
    questionId: 'BP-Q-1001',
    topicName: 'Time, Speed & Distance',
    categoryName: 'Quantitative Aptitude',
    difficulty: DifficultyLevel.HARD,
    priority: PriorityLevel.HIGH,
    productionStatus: VideoProductionStatus.RECORDED,
    title: 'The Viral Escalator Step Trick',
    targetDuration: '58s',
    createdDate: '2026-02-05',
    notes: 'Filming wrapped. Move to sound sync.',
  },
  {
    id: 'QUEUE-02',
    queuePosition: 2,
    questionId: 'BP-Q-1002',
    topicName: 'Profit, Loss & Discount',
    categoryName: 'Quantitative Aptitude',
    difficulty: DifficultyLevel.MEDIUM,
    priority: PriorityLevel.MEDIUM,
    productionStatus: VideoProductionStatus.SCRIPT_READY,
    title: 'Dishonest Merchant False Weight Formula',
    targetDuration: '45s',
    createdDate: '2026-02-08',
    notes: 'Ready for studio recording slot.',
  },
  {
    id: 'QUEUE-03',
    queuePosition: 3,
    questionId: 'BP-Q-1003',
    topicName: 'Clocks & Calendars',
    categoryName: 'Logical Reasoning',
    difficulty: DifficultyLevel.EASY,
    priority: PriorityLevel.URGENT,
    productionStatus: VideoProductionStatus.EDITING,
    title: 'Clock Reflex Angle Trap: 99% Fail',
    targetDuration: '42s',
    createdDate: '2026-02-10',
    notes: 'Motion graphics on 318-degree angle in progress.',
  },
  {
    id: 'QUEUE-04',
    queuePosition: 4,
    questionId: 'BP-Q-1004',
    topicName: 'Permutations & Probability',
    categoryName: 'Quantitative Aptitude',
    difficulty: DifficultyLevel.HARD,
    priority: PriorityLevel.HIGH,
    productionStatus: VideoProductionStatus.READY_TO_UPLOAD,
    title: 'Circular Table Seating Arrangement Shortcut',
    targetDuration: '60s',
    createdDate: '2026-02-12',
    notes: 'Master render verified. Pinned comments ready.',
  },
  {
    id: 'QUEUE-05',
    queuePosition: 5,
    questionId: 'BP-Q-1006',
    topicName: 'Time & Work',
    categoryName: 'Quantitative Aptitude',
    difficulty: DifficultyLevel.MEDIUM,
    priority: PriorityLevel.MEDIUM,
    productionStatus: VideoProductionStatus.QUEUED,
    title: 'Pipes & Cisterns Alternate Schedule Leak',
    targetDuration: '55s',
    createdDate: '2026-02-20',
    notes: 'Approved question waiting for scriptwriter.',
  },
  {
    id: 'QUEUE-06',
    queuePosition: 6,
    questionId: 'BP-Q-1007',
    topicName: 'Blood Relations & Family Tree',
    categoryName: 'Logical Reasoning',
    difficulty: DifficultyLevel.EASY,
    priority: PriorityLevel.LOW,
    productionStatus: VideoProductionStatus.SCRIPT_REQUIRED,
    title: 'Executive Portrait Family Riddle',
    targetDuration: '45s',
    createdDate: '2026-02-22',
    notes: 'Hook draft pending approval.',
  },
];
