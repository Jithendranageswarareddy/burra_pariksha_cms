/**
 * BURRA PARIKSHA CMS - Authoritative Hub & Item Navigation Structure
 * Phase UX-05 & Implementation 01: Global Application Shell
 *
 * Six Frozen Hubs:
 * 1. HOME (Overview, My Work)
 * 2. QUESTIONS (Question Library, Question Studio)
 * 3. PRODUCTION (Recording Queue, Production Pipeline)
 * 4. PUBLISHING (Quality Signoff, Publishing Manager)
 * 5. ANALYTICS (Analytics Hub)
 * 6. MANAGEMENT & SYSTEM (Planning & Batches, Team Workload, Content Explorer, System Health, Disaster Recovery)
 */

import { NavigationCapability } from './roles';

export interface HubNavItem {
  id: string;
  name: string;
  href: string;
  iconName: string;
  description?: string;
  badge?: string;
  capability?: NavigationCapability;
  adminOnly?: boolean;
  step?: string;
}

export interface NavigationHub {
  id: string;
  title: string;
  subtitle?: string;
  capability?: NavigationCapability;
  items: HubNavItem[];
}

export const AUTHORITATIVE_HUBS: NavigationHub[] = [
  {
    id: 'hub-home',
    title: 'HOME',
    capability: 'VIEW_HOME',
    items: [
      {
        id: 'home-overview',
        name: 'Overview',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
        description: 'Operations pulse, daily workflow metrics, and recent activity',
        capability: 'VIEW_HOME',
      },
      {
        id: 'home-my-work',
        name: 'My Work',
        href: '/my-work',
        iconName: 'UserCheck',
        badge: 'Tasks',
        description: 'Personal active assignments, deadlines, and task queue',
        capability: 'VIEW_MY_WORK',
      },
    ],
  },
  {
    id: 'hub-questions',
    title: 'QUESTIONS',
    capability: 'VIEW_QUESTIONS',
    items: [
      {
        id: 'questions-library',
        name: 'Question Library',
        href: '/questions',
        iconName: 'BookOpen',
        description: 'Search, filter, and review master question repository (Topic → Subtopic)',
        capability: 'VIEW_QUESTIONS',
      },
      {
        id: 'questions-studio',
        name: 'Question Studio',
        href: '/studio',
        iconName: 'Sparkles',
        badge: 'Studio',
        description: 'Authoring workspace for question drafting and refinement',
        capability: 'VIEW_QUESTION_STUDIO',
      },
    ],
  },
  {
    id: 'hub-production',
    title: 'PRODUCTION',
    capability: 'VIEW_PRODUCTION',
    items: [
      {
        id: 'production-queue',
        name: 'Recording Queue',
        href: '/queue',
        iconName: 'Video',
        description: 'Studio recording schedule and raw footage intake queue',
        capability: 'VIEW_RECORDING_QUEUE',
      },
      {
        id: 'production-pipeline',
        name: 'Production Pipeline',
        href: '/production',
        iconName: 'Film',
        description: 'End-to-end video lifecycle: scripting, editing, final review, and thumbnails',
        capability: 'VIEW_PRODUCTION',
      },
    ],
  },
  {
    id: 'hub-publishing',
    title: 'PUBLISHING',
    capability: 'VIEW_PUBLISHING',
    items: [
      {
        id: 'publishing-signoff',
        name: 'Quality Signoff',
        href: '/social-review',
        iconName: 'ShieldCheck',
        description: 'Editorial QA, Telugu accuracy, and social package approvals',
        capability: 'VIEW_QUALITY_SIGNOFF',
      },
      {
        id: 'publishing-manager',
        name: 'Publishing Manager',
        href: '/publishing',
        iconName: 'UploadCloud',
        description: 'Multi-platform social publishing (YouTube, Instagram, Facebook)',
        capability: 'VIEW_PUBLISHING',
      },
    ],
  },
  {
    id: 'hub-analytics',
    title: 'ANALYTICS',
    capability: 'VIEW_ANALYTICS',
    items: [
      {
        id: 'analytics-hub',
        name: 'Analytics Hub',
        href: '/analytics/overview',
        iconName: 'BarChart2',
        description: 'Multi-platform audience analytics, topic engagement, and performance intelligence',
        capability: 'VIEW_ANALYTICS',
      },
    ],
  },
  {
    id: 'hub-management',
    title: 'MANAGEMENT & SYSTEM',
    capability: 'VIEW_MANAGEMENT',
    items: [
      {
        id: 'mgmt-planning',
        name: 'Planning & Batches',
        href: '/planning',
        iconName: 'Compass',
        description: 'Syllabus coverage, sprint batches, and similarity radar',
        capability: 'VIEW_PLANNING',
      },
      {
        id: 'mgmt-team',
        name: 'Team Workload',
        href: '/team',
        iconName: 'Users',
        description: 'Team operations, active workload distribution, and unassigned queues',
        capability: 'VIEW_TEAM',
      },
      {
        id: 'mgmt-content-masters',
        name: 'Content Explorer',
        href: '/content-masters',
        iconName: 'Layers',
        description: 'Permanent Content Master lifecycle and entity relationships',
        capability: 'VIEW_CONTENT_MASTERS',
      },
      {
        id: 'mgmt-system-health',
        name: 'System Health',
        href: '/settings',
        iconName: 'Settings',
        description: 'Taxonomy (Topic → Subtopic), Cloud Firestore DB, and system settings',
        capability: 'VIEW_SYSTEM_HEALTH',
      },
      {
        id: 'mgmt-recovery',
        name: 'Disaster Recovery',
        href: '/recovery',
        iconName: 'RotateCcw',
        badge: 'Admin',
        description: 'Database snapshot restore and system backup verification (Admin only)',
        capability: 'VIEW_DISASTER_RECOVERY',
        adminOnly: true,
      },
    ],
  },
];

// Backward compatibility alias for legacy test runners and references
export interface NavItem extends HubNavItem {}
export interface NavSection {
  title: string;
  subtitle?: string;
  isSecondary?: boolean;
  items: NavItem[];
}
export const NAVIGATION_SECTIONS: NavSection[] = AUTHORITATIVE_HUBS.map((hub) => ({
  title: hub.title,
  subtitle: hub.subtitle,
  items: hub.items,
}));
