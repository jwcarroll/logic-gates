import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'
import { GroupInterfaceEditor } from '../../ui/components/GroupInterfaceEditor'
import { GroupStatusBanner } from '../../ui/components/GroupStatusBanner'

function Harness() {
  const notice = useAppStore((s) => s.notice)
  return (
    <div>
      <GroupInterfaceEditor />
      <GroupStatusBanner status="live" isOpen={false} notice={notice} />
    </div>
  )
}

describe('group interface edit warning', () => {
  beforeEach(() => {
    cleanup()
    useAppStore.getState().reset()
  })

  it('warns before disconnecting wires and shows "rewiring required" feedback after confirm', () => {
    const store = useAppStore.getState()
    store.addHalfAdderTemplate()

    const groupId = useAppStore.getState().circuit.nodes.find((n) => n.type === 'group')!.id
    store.selectNodes([groupId])
    expect(store.editSelectedGroupInterface().ok).toBe(true)

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /update interface/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/disconnect/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/rewiring required/i)

    fireEvent.click(screen.getByRole('button', { name: /disconnect wires and update/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/rewiring required/i)
  })
})

