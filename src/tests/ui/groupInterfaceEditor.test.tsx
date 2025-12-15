import { cleanup, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../app/store'
import { GroupInterfaceEditor } from '../../ui/components/GroupInterfaceEditor'

describe('GroupInterfaceEditor', () => {
  beforeEach(() => {
    cleanup()
    useAppStore.getState().reset()
    useAppStore.setState({ groupInterfaceDraft: null })
  })

  it('disables confirm when no ports are exposed', () => {
    useAppStore.setState({
      groupInterfaceDraft: {
        mode: 'create',
        label: 'Group',
        nodeIds: ['n1'],
        interfaceDraft: { inputs: [], outputs: [] },
        available: { inputs: [], outputs: [] },
        errors: ['Expose at least one port'],
      },
    })

    render(<GroupInterfaceEditor />)
    expect(screen.getAllByRole('button', { name: /create group/i })[0]).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/expose at least one port/i)
  })

  it('disables confirm when a port has no mapping', () => {
    useAppStore.setState({
      groupInterfaceDraft: {
        mode: 'create',
        label: 'Group',
        nodeIds: ['n1'],
        interfaceDraft: {
          inputs: [{ id: 'in-a', kind: 'input', name: 'A', mapsToInternalPortId: '' }],
          outputs: [],
        },
        available: { inputs: ['some-internal-port'], outputs: [] },
        errors: ['Port in-a must be mapped to an internal port'],
      },
    })

    render(<GroupInterfaceEditor />)
    expect(screen.getAllByRole('button', { name: /create group/i })[0]).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/mapped/i)
  })
})
