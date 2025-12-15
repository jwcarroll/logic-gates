import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FloatingToolbar } from './components/FloatingToolbar'
import { workspaceTokens } from '../design/tokens/workspace'
import { WorkspaceCanvas } from './WorkspaceCanvas'
import { useGroupView } from '../app/hooks/useGroupView'
import { GroupDrillInOverlay } from './components/GroupDrillInOverlay'
import { GroupStatusBanner } from './components/GroupStatusBanner'
import { useAppStore } from '../app/store'

const anchors = [
  { id: 'primary-toolbar', position: 'top-right' as const, offset: { x: 16, y: 16 }, label: 'Workspace tools' },
  { id: 'breadcrumb', position: 'top-left' as const, offset: { x: 16, y: 16 }, label: 'Breadcrumb' },
  { id: 'status-banner', position: 'bottom-left' as const, offset: { x: 20, y: 20 }, label: 'Status' },
]

type Viewport = { width: number; height: number }

export function WorkspaceShell() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState<Viewport>({ width: 1440, height: 900 })
  const groupView = useGroupView()
  const notice = useAppStore((s) => s.notice)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const deleteSelection = useAppStore((s) => s.deleteSelection)

  useLayoutEffect(() => {
    const measure = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setViewport((prev) =>
        prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height },
      )
    }
    measure()

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => measure())
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
    return
  }, [])

  useEffect(() => {
    const handler = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setViewport((prev) =>
        prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height },
      )
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      const mod = event.metaKey || event.ctrlKey

      if (mod && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (!mod && (key === 'delete' || key === 'backspace')) {
        event.preventDefault()
        deleteSelection()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo, deleteSelection])

  const selectionBox = null // placeholder until selection bounds are available

  return (
    <div ref={containerRef} className="workspace-shell" style={{ background: workspaceTokens.canvas.background }}>
      <div className="workspace-canvas-layer">
        <WorkspaceCanvas />
      </div>
      {anchors.map((anchor) => (
        <FloatingToolbar key={anchor.id} anchor={anchor} viewport={viewport} selectionBox={selectionBox}>
          {anchor.id === 'breadcrumb' ? (
            groupView.isOpen ? (
              <GroupDrillInOverlay breadcrumb={groupView.breadcrumb} onBack={groupView.closeGroup} />
            ) : (
              <div className="floating-anchor__inner">
                <span className="floating-anchor__label">Workspace</span>
              </div>
            )
          ) : anchor.id === 'status-banner' ? (
            <GroupStatusBanner status={groupView.status} isOpen={groupView.isOpen} notice={notice} />
          ) : (
            <div className="floating-anchor__inner">
              <span className="floating-anchor__label">{anchor.label}</span>
            </div>
          )}
        </FloatingToolbar>
      ))}
    </div>
  )
}
