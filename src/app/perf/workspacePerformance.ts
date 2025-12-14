export type WorkspacePerfEvent = 'pan' | 'zoom' | 'select' | 'energized-style' | 'group-open' | 'group-sync'

export type WorkspacePerfSample = {
  name: WorkspacePerfEvent
  duration: number
  budgetMs: number
  withinBudget: boolean
  timestamp: number
}

type Reporter = (sample: WorkspacePerfSample) => void

type MeasureOptions = {
  budgetMs?: number
  reporter?: Reporter
}

const DEFAULT_BUDGET = 100
const marks = new Map<WorkspacePerfEvent, number>()

const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now())

const defaultReporter: Reporter = (sample) => {
  const label = `[workspace-perf] ${sample.name}`
  if (sample.withinBudget) {
    console.debug(`${label} ${sample.duration.toFixed(2)}ms (<= ${sample.budgetMs}ms)`)
  } else {
    console.warn(`${label} ${sample.duration.toFixed(2)}ms exceeded budget ${sample.budgetMs}ms`)
  }
}

export const workspacePerformance = {
  markStart(name: WorkspacePerfEvent) {
    marks.set(name, now())
  },

  markEnd(name: WorkspacePerfEvent, options?: MeasureOptions): WorkspacePerfSample | null {
    const start = marks.get(name)
    if (typeof start !== 'number') return null

    const duration = now() - start
    marks.delete(name)

    const sample: WorkspacePerfSample = {
      name,
      duration,
      budgetMs: options?.budgetMs ?? DEFAULT_BUDGET,
      withinBudget: duration <= (options?.budgetMs ?? DEFAULT_BUDGET),
      timestamp: Date.now(),
    }

    ;(options?.reporter ?? defaultReporter)(sample)
    return sample
  },

  async measure<T>(name: WorkspacePerfEvent, fn: () => Promise<T> | T, options?: MeasureOptions): Promise<T> {
    this.markStart(name)
    const result = await fn()
    this.markEnd(name, options)
    return result
  },
}

export const interactionBudgetMs = DEFAULT_BUDGET
