import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { getSelectionStyles } from '../../app/hooks/useSelectionStyles'
import { workspaceThemes, workspaceTokens } from '../../design/tokens/workspace'

const parseRgb = (input: string): { r: number; g: number; b: number } => {
  const str = input.trim()
  if (str.startsWith('#')) {
    const hex = str.slice(1)
    const expanded =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex
    const r = parseInt(expanded.slice(0, 2), 16)
    const g = parseInt(expanded.slice(2, 4), 16)
    const b = parseInt(expanded.slice(4, 6), 16)
    return { r, g, b }
  }

  const match = str.match(/rgba?\\(([^)]+)\\)/i)
  if (!match) throw new Error(`Unsupported color: ${input}`)
  const [r, g, b] = match[1].split(',').slice(0, 3).map((v) => Number(v.trim()))
  return { r, g, b }
}

const toLinear = (c: number) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

const relativeLuminance = (rgb: { r: number; g: number; b: number }) => {
  const r = toLinear(rgb.r)
  const g = toLinear(rgb.g)
  const b = toLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrastRatio = (a: string, b: string) => {
  const l1 = relativeLuminance(parseRgb(a))
  const l2 = relativeLuminance(parseRgb(b))
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

describe('Workspace visuals snapshots', () => {
  it('snapshots selection + energized CSS vars for light/dark', async () => {
    const snapshots = workspaceThemes.map((theme) => {
      const selection = getSelectionStyles(theme)
      const energized = workspaceTokens.energized.theme[theme]
      const animation = workspaceTokens.energized.animation
      return {
        theme,
        selection: selection.cssVars,
        energized: {
          '--wire-base': energized.base,
          '--wire-gradient-start': energized.gradient[0],
          '--wire-gradient-end': energized.gradient[1],
          '--wire-inactive': energized.inactive,
          '--wire-flow-duration': `${animation.durationMs}ms`,
          '--wire-dasharray': animation.dashArray,
        },
      }
    })

    const snapshotPath = path.resolve(process.cwd(), 'src/tests/ui/__snapshots__/workspace-visuals.spec.ts.snap')
    await expect(snapshots).toMatchFileSnapshot(snapshotPath)
  })

  it('enforces minimum contrast targets for dark workspace theme', () => {
    const background = workspaceTokens.canvas.background
    const selectionStroke = workspaceTokens.selection.theme.dark.stroke
    const energizedBase = workspaceTokens.energized.theme.dark.base

    expect(contrastRatio(background, selectionStroke)).toBeGreaterThanOrEqual(workspaceTokens.selection.contrast.zoomExtreme)
    expect(contrastRatio(background, energizedBase)).toBeGreaterThanOrEqual(workspaceTokens.energized.contrast.min)
  })
})
