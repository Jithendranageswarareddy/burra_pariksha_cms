/**
 * BURRA PARIKSHA CMS — UNIFIED DESIGN SYSTEM TOKENS
 * 
 * Strict UI Contract for all phases. Centralizes all visual primitives:
 * Colors, Typography, Spacing, Shadows, Radii, Borders, Icons, and Z-Indices.
 */

export const COLOR_TOKENS = {
  // 1. Primary Palette (Indigo)
  primary: {
    base: '#4f46e5', // indigo-600
    hover: '#4338ca', // indigo-700
    active: '#3730a3', // indigo-800
    subtle: '#eef2ff', // indigo-50
    border: '#c7d2fe', // indigo-200
    text: '#ffffff',
    classes: {
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-700',
      bgActive: 'active:bg-indigo-800',
      bgSubtle: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      textOnPrimary: 'text-white',
    },
  },

  // 2. Secondary Palette (Slate Dark)
  secondary: {
    base: '#1e293b', // slate-800
    hover: '#0f172a', // slate-900
    active: '#020617', // slate-950
    subtle: '#f1f5f9', // slate-100
    border: '#cbd5e1', // slate-300
    text: '#ffffff',
    classes: {
      bg: 'bg-slate-800',
      bgHover: 'hover:bg-slate-900',
      bgActive: 'active:bg-slate-950',
      bgSubtle: 'bg-slate-100',
      border: 'border-slate-300',
      text: 'text-slate-800',
      textOnSecondary: 'text-white',
    },
  },

  // 3. Backgrounds
  background: {
    app: '#f8fafc', // slate-50
    canvas: '#ffffff', // white
    dark: '#0f172a', // slate-900
    classes: {
      app: 'bg-slate-50',
      canvas: 'bg-white',
      dark: 'bg-slate-900',
    },
  },

  // 4. Surfaces / Cards
  surface: {
    card: '#ffffff',
    hover: '#f8fafc',
    dark: '#1e293b',
    classes: {
      card: 'bg-white',
      cardHover: 'hover:bg-slate-50/75',
      dark: 'bg-slate-900',
    },
  },

  // 5. Typography Colors
  text: {
    primary: '#0f172a', // slate-900
    secondary: '#334155', // slate-700
    muted: '#64748b', // slate-500
    subtle: '#94a3b8', // slate-400
    inverted: '#ffffff',
    classes: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      muted: 'text-slate-500',
      subtle: 'text-slate-400',
      inverted: 'text-white',
    },
  },

  // 6. Borders & Dividers
  border: {
    subtle: '#f1f5f9', // slate-100
    default: '#e2e8f0', // slate-200
    medium: '#cbd5e1', // slate-300
    dark: '#334155', // slate-700
    classes: {
      subtle: 'border-slate-100',
      default: 'border-slate-200',
      medium: 'border-slate-300',
      dark: 'border-slate-700',
    },
  },

  // 7. Status — Success (Emerald)
  success: {
    base: '#059669', // emerald-600
    hover: '#047857', // emerald-700
    subtle: '#ecfdf5', // emerald-50
    border: '#a7f3d0', // emerald-200
    text: '#065f46', // emerald-800
    classes: {
      bg: 'bg-emerald-600',
      bgHover: 'hover:bg-emerald-700',
      bgSubtle: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
    },
  },

  // 8. Status — Warning (Amber)
  warning: {
    base: '#d97706', // amber-600
    hover: '#b45309', // amber-700
    subtle: '#fffbeb', // amber-50
    border: '#fde68a', // amber-200
    text: '#92400e', // amber-800
    classes: {
      bg: 'bg-amber-600',
      bgHover: 'hover:bg-amber-700',
      bgSubtle: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
    },
  },

  // 9. Status — Danger / Error (Rose)
  danger: {
    base: '#e11d48', // rose-600
    hover: '#be123c', // rose-700
    subtle: '#fff1f2', // rose-50
    border: '#fecdd3', // rose-200
    text: '#9f1239', // rose-800
    classes: {
      bg: 'bg-rose-600',
      bgHover: 'hover:bg-rose-700',
      bgSubtle: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
    },
  },

  // 10. Status — Info (Sky)
  info: {
    base: '#0284c7', // sky-600
    hover: '#0369a1', // sky-700
    subtle: '#f0f9ff', // sky-50
    border: '#bae6fd', // sky-200
    text: '#075985', // sky-800
    classes: {
      bg: 'bg-sky-600',
      bgHover: 'hover:bg-sky-700',
      bgSubtle: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      badgeBorder: 'border-sky-200',
    },
  },

  // 11. Focus & Outline
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    ringSubtle: 'focus:outline-none focus:ring-1 focus:ring-indigo-500',
    ringOffset: 'focus:ring-offset-white',
  },

  // 12. Disabled State
  disabled: {
    classes: 'opacity-50 cursor-not-allowed pointer-events-none select-none',
    inputClasses: 'disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed',
  },
} as const;

export const TYPOGRAPHY_TOKENS = {
  fontFamily: {
    sans: 'font-sans',
    mono: 'font-mono',
  },
  weights: {
    regular: 'font-normal', // 400
    medium: 'font-medium',   // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',       // 700
  },
  lineHeights: {
    tight: 'leading-tight',   // 1.25
    normal: 'leading-normal', // 1.5
    relaxed: 'leading-relaxed', // 1.625
  },
  scale: {
    pageTitle: 'text-2xl font-bold tracking-tight text-slate-900',
    sectionTitle: 'text-lg font-semibold tracking-tight text-slate-900',
    cardTitle: 'text-base font-semibold text-slate-900',
    body: 'text-sm font-normal text-slate-700 leading-normal',
    bodyMuted: 'text-sm font-normal text-slate-500 leading-normal',
    secondary: 'text-xs font-normal text-slate-500 leading-normal',
    label: 'text-xs font-medium text-slate-700 select-none',
    caption: 'text-[11px] font-medium text-slate-500 tracking-wide',
    buttonSm: 'text-xs font-semibold tracking-normal',
    buttonMd: 'text-sm font-semibold tracking-normal',
    buttonLg: 'text-base font-semibold tracking-normal',
    tableHeader: 'text-xs font-semibold text-slate-600 uppercase tracking-wider',
    tableCell: 'text-sm text-slate-700',
  },
} as const;

export const SPACING_TOKENS = {
  scale: {
    0: '0px',
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px
    3: '0.75rem', // 12px
    4: '1rem',    // 16px
    5: '1.25rem', // 20px
    6: '1.5rem',  // 24px
    8: '2rem',    // 32px
    10: '2.5rem', // 40px
    12: '3rem',   // 48px
    16: '4rem',   // 64px
  },
  container: {
    pagePadding: 'px-4 sm:px-6 lg:px-8 py-6',
    cardPadding: 'p-5 sm:p-6',
    cardHeaderPadding: 'px-6 py-4',
    cardBodyPadding: 'px-6 py-5',
    cardFooterPadding: 'px-6 py-3.5',
    modalPadding: 'p-6',
    tableCellPadding: 'px-4 py-3.5',
  },
  buttonPadding: {
    sm: 'px-3 py-1.5',   // exact 2:1 ratio (12px horizontal, 6px vertical)
    md: 'px-4 py-2',     // exact 2:1 ratio (16px horizontal, 8px vertical)
    lg: 'px-5 py-2.5',   // exact 2:1 ratio (20px horizontal, 10px vertical)
    iconSm: 'p-1.5',
    iconMd: 'p-2',
    iconLg: 'p-2.5',
  },
  gap: {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4',
    '2xl': 'gap-6',
  },
} as const;

export const RADIUS_TOKENS = {
  sm: 'rounded-md',  // 6px
  md: 'rounded-lg',  // 8px
  lg: 'rounded-xl',  // 12px
  full: 'rounded-full',
} as const;

export const SHADOW_TOKENS = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  none: 'shadow-none',
} as const;

export const ICON_TOKENS = {
  sizes: {
    xs: 'w-3 h-3',       // 12px
    sm: 'w-3.5 h-3.5',   // 14px
    md: 'w-4 h-4',       // 16px (default)
    lg: 'w-5 h-5',       // 20px
    xl: 'w-6 h-6',       // 24px
  },
  spacing: {
    left: 'mr-2',
    right: 'ml-2',
    tight: 'gap-1.5',
    normal: 'gap-2',
    relaxed: 'gap-2.5',
  },
} as const;

export const Z_INDEX_TOKENS = {
  dropdown: 'z-30',
  sticky: 'z-40',
  modalBackdrop: 'z-50',
  modalContent: 'z-50',
  tooltip: 'z-60',
} as const;
