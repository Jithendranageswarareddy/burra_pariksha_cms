/**
 * BURRA PARIKSHA CMS - Navigation Configuration
 */

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
        description: 'Pipeline overview, metrics & daily tasks',
      },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      {
        name: 'Planning & Batches',
        href: '/planning',
        iconName: 'Compass',
        badge: 'Intelligence',
        description: 'Syllabus coverage, sprint batches & similarity radar',
      },
      {
        name: 'Question Studio',
        href: '/studio',
        iconName: 'Sparkles',
        badge: 'Studio',
        description: 'Unified manual & AI question authoring studio',
      },
      {
        name: 'Question Library',
        href: '/questions',
        iconName: 'BookOpen',
        description: 'Search, filter, and review question repository',
      },
      {
        name: 'Content Masters',
        href: '/content-masters',
        iconName: 'Layers',
        badge: '14.4',
        description: 'Permanent Content Master lifecycle & relationship explorer',
      },
      {
        name: 'Social Review',
        href: '/social-review',
        iconName: 'CheckCheck',
        badge: '8H',
        description: 'Quality assurance and social package review workspace',
      },
    ],
  },
  {
    title: 'PRODUCTION',
    items: [
      {
        name: 'Video Queue',
        href: '/queue',
        iconName: 'ListOrdered',
        description: 'Prioritized queue for filming & recording',
      },
      {
        name: 'Production Tracker',
        href: '/production',
        iconName: 'Kanban',
        description: 'Multi-stage video workflow & pipeline stages',
      },
      {
        name: 'Production Board',
        href: '/production-board',
        iconName: 'Table',
        badge: '3E.2',
        description: 'Unified read-model production board overview',
      },
    ],
  },
  {
    title: 'PUBLISHING',
    items: [
      {
        name: 'Publishing',
        href: '/publishing',
        iconName: 'Share2',
        description: 'Manual social upload tracker (YouTube, IG, FB)',
      },
      {
        name: 'Social Analytics',
        href: '/social-analytics',
        iconName: 'BarChart2',
        badge: 'Phase 27',
        description: 'Historical performance metrics entry & history',
      },
    ],
  },
  {
    title: 'TEAM OPERATIONS',
    items: [
      {
        name: 'My Work',
        href: '/my-work',
        iconName: 'UserCheck',
        badge: 'Tasks',
        description: 'Personal active assignments, deadlines & daily queue',
      },
      {
        name: 'Team & Workload',
        href: '/team',
        iconName: 'Users',
        badge: 'Workload',
        description: 'Team operations, workload distribution & unassigned queue',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        name: 'Settings',
        href: '/settings',
        iconName: 'Settings',
        description: 'Taxonomy, Google Sheets & API configurations',
      },
      {
        name: 'Recovery Admin',
        href: '/recovery',
        iconName: 'RotateCcw',
        badge: 'Admin',
        description: 'Recovery status, backup capabilities & system restore readiness',
      },
    ],
  },
];
