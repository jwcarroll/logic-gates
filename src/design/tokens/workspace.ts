export type WorkspaceTheme = 'light' | 'dark'

type SelectionTheme = {
  stroke: string
  fill: string
  glow: string
  handle: string
}

type EnergizedTheme = {
  base: string
  gradient: [string, string]
  inactive: string
}

type BreadcrumbTheme = {
  text: string
  muted: string
  separator: string
  background: string
  focusRing: string
}

type WorkspaceTokens = {
  canvas: {
    background: string
    grid: string
    accent: string
    minWidth: number
    padding: number
  }
  anchors: {
    collisionShift: { min: number; max: number }
    gutter: number
  }
  selection: {
    latencyBudgetMs: number
    strokeWidth: number
    haloWidth: number
    contrast: { min: number; zoomExtreme: number }
    theme: Record<WorkspaceTheme, SelectionTheme>
  }
  energized: {
    animation: { durationMs: number; dashArray: string; throttleMs: number }
    contrast: { min: number }
    theme: Record<WorkspaceTheme, EnergizedTheme>
  }
  breadcrumbs: {
    height: number
    gap: number
    maxItems: number
    theme: Record<WorkspaceTheme, BreadcrumbTheme>
  }
}

export const workspaceTokens: WorkspaceTokens = {
  canvas: {
    background: '#0b1220',
    grid: 'rgba(148, 163, 184, 0.14)',
    accent: '#38bdf8',
    minWidth: 1024,
    padding: 16,
  },
  anchors: {
    collisionShift: { min: 12, max: 24 },
    gutter: 18,
  },
  selection: {
    latencyBudgetMs: 100,
    strokeWidth: 3,
    haloWidth: 6,
    contrast: { min: 4.5, zoomExtreme: 3 },
    theme: {
      light: {
        stroke: '#2563eb',
        fill: 'rgba(37, 99, 235, 0.12)',
        glow: 'rgba(37, 99, 235, 0.35)',
        handle: '#0f172a',
      },
      dark: {
        stroke: '#22c55e',
        fill: 'rgba(34, 197, 94, 0.14)',
        glow: 'rgba(34, 197, 94, 0.45)',
        handle: '#e2e8f0',
      },
    },
  },
  energized: {
    animation: { durationMs: 1200, dashArray: '14 8', throttleMs: 90 },
    contrast: { min: 4.5 },
    theme: {
      light: {
        base: '#eab308',
        gradient: ['#f59e0b', '#f97316'],
        inactive: '#cbd5e1',
      },
      dark: {
        base: '#facc15',
        gradient: ['#f59e0b', '#f97316'],
        inactive: '#475569',
      },
    },
  },
  breadcrumbs: {
    height: 44,
    gap: 8,
    maxItems: 4,
    theme: {
      light: {
        text: '#0f172a',
        muted: '#475569',
        separator: '#cbd5e1',
        background: 'rgba(241, 245, 249, 0.9)',
        focusRing: '#2563eb',
      },
      dark: {
        text: '#e2e8f0',
        muted: '#94a3b8',
        separator: '#334155',
        background: 'rgba(15, 23, 42, 0.9)',
        focusRing: '#38bdf8',
      },
    },
  },
}

export const workspaceThemes = ['light', 'dark'] as const satisfies ReadonlyArray<WorkspaceTheme>
