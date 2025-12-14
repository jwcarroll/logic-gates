import { workspaceTokens } from '../../design/tokens/workspace'

export type AnchorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type AnchorConfig = {
  position: AnchorPosition
  offset: { x: number; y: number }
  size: { width: number; height: number }
}

export type SelectionBox = { x: number; y: number; width: number; height: number }

export type Viewport = { width: number; height: number }

export type AnchorResult = {
  x: number
  y: number
  position: AnchorPosition
  shift: number
  repositioned: boolean
  attemptedPositions: AnchorPosition[]
}

/**
 * Computes anchor position with collision avoidance for selected bounding boxes.
 * Uses 12–24px shift and falls back in priority order top-right → top-left → bottom-left → bottom-right.
 */
export function computeAnchorPosition(
  anchor: AnchorConfig,
  selection: SelectionBox | null,
  viewport: Viewport,
): AnchorResult {
  const { collisionShift, gutter } = workspaceTokens.anchors
  const order: AnchorPosition[] = dedupeOrder([anchor.position, 'top-right', 'top-left', 'bottom-left', 'bottom-right'])
  const attempted: AnchorPosition[] = []
  let shiftUsed = 0

  for (const position of order) {
    attempted.push(position)
    const base = basePosition({ ...anchor, position }, viewport, gutter)
    const overlap = selection ? isOverlap(base, anchor.size, selection) : false
    if (!overlap) {
      const repositioned = position !== anchor.position || shiftUsed > 0
      return { ...base, shift: shiftUsed, repositioned, attemptedPositions: attempted }
    }

    shiftUsed = collisionShift.min
    const shifted = shiftAway(position, base, anchor.size, selection!, collisionShift.max, viewport, gutter)
    const stillOverlaps = isOverlap(shifted, anchor.size, selection!)
    if (!stillOverlaps) {
      const fallback = fallbackPosition(position)
      const attempts = fallback ? [...attempted, fallback] : attempted
      return {
        ...shifted,
        shift: shiftUsed,
        repositioned: true,
        attemptedPositions: attempts,
      }
    }
  }

  const fallback = basePosition({ ...anchor, position: order[order.length - 1] }, viewport, gutter)
  return {
    ...fallback,
    shift: collisionShift.max,
    repositioned: true,
    attemptedPositions: attempted,
  }
}

const basePosition = (anchor: AnchorConfig, viewport: Viewport, gutter: number) => {
  const { position, offset, size } = anchor
  const positions: Record<AnchorPosition, { x: number; y: number }> = {
    'top-left': { x: gutter + offset.x, y: gutter + offset.y },
    'top-right': { x: viewport.width - size.width - gutter - offset.x, y: gutter + offset.y },
    'bottom-left': { x: gutter + offset.x, y: viewport.height - size.height - gutter - offset.y },
    'bottom-right': { x: viewport.width - size.width - gutter - offset.x, y: viewport.height - size.height - gutter - offset.y },
  }
  return { ...positions[position], position }
}

const isOverlap = (anchor: { x: number; y: number }, size: { width: number; height: number }, selection: SelectionBox) => {
  return !(
    anchor.x + size.width < selection.x ||
    anchor.x > selection.x + selection.width ||
    anchor.y + size.height < selection.y ||
    anchor.y > selection.y + selection.height
  )
}

const shiftAway = (
  position: AnchorPosition,
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  selection: SelectionBox,
  maxShift: number,
  viewport: Viewport,
  gutter: number,
) => {
  const shift = maxShift
  const clampX = (value: number) => Math.max(gutter, Math.min(viewport.width - size.width - gutter, value))
  const clampY = (value: number) => Math.max(gutter, Math.min(viewport.height - size.height - gutter, value))

  const candidates: { x: number; y: number }[] = []

  if (position === 'top-right') {
    candidates.push({ x: clampX(selection.x + selection.width + shift), y: anchor.y })
    candidates.push({ x: clampX(selection.x - size.width - shift), y: anchor.y })
    candidates.push({ x: anchor.x, y: clampY(selection.y + selection.height + shift) })
  } else if (position === 'top-left') {
    candidates.push({ x: clampX(selection.x - size.width - shift), y: anchor.y })
    candidates.push({ x: clampX(selection.x + selection.width + shift), y: anchor.y })
    candidates.push({ x: anchor.x, y: clampY(selection.y + selection.height + shift) })
  } else if (position === 'bottom-left') {
    candidates.push({ x: clampX(selection.x - size.width - shift), y: clampY(selection.y - size.height - shift) })
    candidates.push({ x: clampX(selection.x + selection.width + shift), y: clampY(selection.y - size.height - shift) })
    candidates.push({ x: anchor.x, y: clampY(selection.y + selection.height + shift) })
  } else if (position === 'bottom-right') {
    candidates.push({ x: clampX(selection.x + selection.width + shift), y: clampY(selection.y - size.height - shift) })
    candidates.push({ x: clampX(selection.x - size.width - shift), y: clampY(selection.y - size.height - shift) })
    candidates.push({ x: anchor.x, y: clampY(selection.y + selection.height + shift) })
  }

  for (const candidate of candidates) {
    if (!isOverlap(candidate, size, selection)) {
      return { ...candidate, position }
    }
  }

  return { ...anchor, position }
}

const fallbackPosition = (position: AnchorPosition): AnchorPosition | null => {
  switch (position) {
    case 'top-right':
      return 'top-left'
    case 'top-left':
      return 'top-right'
    case 'bottom-left':
      return 'bottom-right'
    case 'bottom-right':
      return 'bottom-left'
    default:
      return null
  }
}

const dedupeOrder = (order: AnchorPosition[]) => Array.from(new Set(order))
