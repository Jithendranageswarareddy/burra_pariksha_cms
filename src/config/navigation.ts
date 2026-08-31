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
        name: 'Generate Question',
        href: '/generate',
        iconName: 'Sparkles',
        badge: 'AI Studio',
        description: 'AI-assisted aptitude question generator & editor',
      },
      {
        name: 'Question Library',
        href: '/questions',
        iconName: 'BookOpen',
        description: 'Search, filter, and review question repository',
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
    ],
  },
];
