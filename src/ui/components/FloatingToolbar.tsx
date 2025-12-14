import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { computeAnchorPosition, type AnchorPosition } from '../workspace/anchorMath'
import type { SelectionBox, Viewport } from '../workspace/anchorMath'

export type FloatingAnchorConfig = {
  id: string
  position: AnchorPosition
  offset?: { x: number; y: number }
}

type Props = {
  anchor: FloatingAnchorConfig
  viewport: Viewport
  selectionBox?: SelectionBox | null
  children: ReactNode
}

const DEFAULT_SIZE = { width: 180, height: 48 }

export function FloatingToolbar({ anchor, viewport, selectionBox = null, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(DEFAULT_SIZE)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const { width, height } = node.getBoundingClientRect()
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
  }, [children])

  const position = computeAnchorPosition(
    {
      position: anchor.position,
      offset: anchor.offset ?? { x: 0, y: 0 },
      size,
    },
    selectionBox,
    viewport,
  )

  return (
    <div
      ref={ref}
      data-testid="floating-anchor"
      style={{ left: position.x, top: position.y }}
      className="floating-anchor"
      aria-label={anchor.id}
    >
      {children}
    </div>
  )
}
