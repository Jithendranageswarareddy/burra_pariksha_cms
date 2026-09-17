/**
 * BURRA PARIKSHA CMS - Navigation Configuration
 * Phase 02: Information Architecture & Production Journey
 */

export interface NavItem {
  name: string;
  href: string;
  iconName: string;
  step?: string;
  badge?: string;
  description?: string;
}

export interface NavSection {
  title: string;
  subtitle?: string;
  isSecondary?: boolean;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'CONTENT STUDIO',
    subtitle: 'Start at 01 and move toward 15',
    items: [
      {
        step: '01',
        name: 'Generate Question',
        href: '/studio',
        iconName: 'Sparkles',
        badge: 'AI',
        description: 'AI question authoring and candidate generation studio',
      },
      {
        step: '02',
        name: 'Question Library',
        href: '/questions',
        iconName: 'BookOpen',
        description: 'Search, filter, and review master question repository',
      },
      {
        step: '03',
        name: 'Improve Question',
        href: '/questions?status=DRAFT',
        iconName: 'Edit3',
        description: 'Refine questions, real-world context, and explanations',
      },
      {
        step: '04',
        name: 'Verify & Approve',
        href: '/questions?status=GENERATED',
        iconName: 'ShieldCheck',
        description: 'Mathematical safety checks and editorial approval',
      },
      {
        step: '05',
        name: 'Create Script',
        href: '/production?status=SCRIPT_REQUIRED',
        iconName: 'FileText',
        description: 'Video scripts, hooks, and narration timing design',
      },
      {
        step: '06',
        name: 'Review Script',
        href: '/production?status=SCRIPT_READY',
        iconName: 'FileCheck',
        description: 'Script quality assurance, teleprompter and host notes',
      },
      {
        step: '07',
        name: 'Record Video',
        href: '/queue',
        iconName: 'Video',
        description: 'Prioritized recording queue and raw footage intake',
      },
      {
        step: '08',
        name: 'Edit Video',
        href: '/production?status=EDITING',
        iconName: 'Scissors',
        description: 'Video editing, visual motion graphics, and audio mix',
      },
      {
        step: '09',
        name: 'Final Video',
        href: '/production?status=FINAL_REVIEW',
        iconName: 'Film',
        description: 'Final video review, quality signoff, and render lock',
      },
      {
        step: '10',
        name: 'Create Thumbnail',
        href: '/production?status=READY_TO_UPLOAD',
        iconName: 'Image',
        description: 'Custom thumbnail asset design, drive sync, and review',
      },
      {
        step: '11',
        name: 'Pinned Comment',
        href: '/production?status=UPLOADED',
        iconName: 'MessageSquare',
        description: 'Interactive challenge questions and solution comments',
      },
      {
        step: '12',
        name: 'Social Review',
        href: '/social-review',
        iconName: 'CheckCheck',
        badge: '8H',
        description: 'Quality assurance and social package review workspace',
      },
      {
        step: '13',
        name: 'Platform Packages',
        href: '/platform-packages',
        iconName: 'Share2',
        description: 'Multi-platform social distribution packages and diffs',
      },
      {
        step: '14',
        name: 'Publishing Package',
        href: '/publishing-package',
        iconName: 'CheckCircle2',
        description: 'Pre-flight channel checklist and asset assembly',
      },
      {
        step: '15',
        name: 'Publish',
        href: '/publishing',
        iconName: 'UploadCloud',
        description: 'Manual social upload tracker (YouTube, IG, FB)',
      },
    ],
  },
  {
    title: 'ANALYTICS',
    subtitle: 'Performance Intelligence & Insights',
    items: [
      {
        name: 'Analytics Overview',
        href: '/analytics/overview',
        iconName: 'LayoutDashboard',
        description: 'Comprehensive performance intelligence and metric summaries',
      },
      {
        name: 'Video Performance',
        href: '/analytics/video',
        iconName: 'Video',
        description: 'Individual video & content asset analytics breakdown',
      },
      {
        name: 'Platform Performance',
        href: '/analytics/platform',
        iconName: 'Share2',
        description: 'Cross-platform comparison across YouTube, Instagram, and Facebook',
      },
      {
        name: 'Topic Performance',
        href: '/analytics/topic',
        iconName: 'BookOpen',
        description: 'Performance aggregates by curriculum topic',
      },
      {
        name: 'Subtopic Performance',
        href: '/analytics/subtopic',
        iconName: 'Layers',
        description: 'Granular subtopic engagement and view metrics',
      },
      {
        name: 'Difficulty Performance',
        href: '/analytics/difficulty',
        iconName: 'BarChart2',
        description: 'Performance analysis by question difficulty tier',
      },
      {
        name: 'Engagement',
        href: '/analytics/engagement',
        iconName: 'Heart',
        description: 'Likes, comments, shares, CTR, and audience interaction ratios',
      },
      {
        name: 'Retention',
        href: '/analytics/retention',
        iconName: 'TrendingUp',
        description: 'Watch time, average retention rates, and audience hold duration',
      },
      {
        name: 'AI Insights',
        href: '/analytics/intelligence',
        iconName: 'Sparkles',
        badge: 'AI',
        description: 'AI Performance Intelligence analysis and automated verdict reports',
      },
      {
        name: 'Content Strategy',
        href: '/analytics/strategy',
        iconName: 'Target',
        badge: 'Phase 29',
        description: 'Evidence-based future content strategy recommendations',
      },
      {
        name: 'Snapshot Entry & Log',
        href: '/social-analytics',
        iconName: 'Clock',
        description: 'Manual performance metrics entry & historical snapshots',
      },
    ],
  },
  {
    title: 'WORKSPACE',
    items: [
      {
        name: 'My Work',
        href: '/my-work',
        iconName: 'UserCheck',
        badge: 'Tasks',
        description: 'Personal active assignments, deadlines & daily queue',
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    subtitle: 'Secondary Operations',
    isSecondary: true,
    items: [
      {
        name: 'Pipeline Overview',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
        description: 'Pipeline overview, metrics & daily tasks',
      },
      {
        name: 'Planning & Batches',
        href: '/planning',
        iconName: 'Compass',
        badge: 'Intelligence',
        description: 'Syllabus coverage, sprint batches & similarity radar',
      },
      {
        name: 'Production Board',
        href: '/production-board',
        iconName: 'Table',
        badge: '3E.2',
        description: 'Unified read-model production board overview',
      },
      {
        name: 'Content Masters',
        href: '/content-masters',
        iconName: 'Layers',
        badge: '14.4',
        description: 'Permanent Content Master lifecycle & relationship explorer',
      },
      {
        name: 'Team Operations',
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
        name: 'Admin',
        href: '/recovery',
        iconName: 'RotateCcw',
        badge: 'Admin',
        description: 'Recovery status, backup capabilities & system restore readiness',
      },
    ],
  },
];
