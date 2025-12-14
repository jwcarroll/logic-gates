import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

import App from '../../App'
import { mockSettings } from './__mocks__/settingsMock'

vi.mock('../../ui/WorkspaceShell', () => ({
  WorkspaceShell: () => <div data-testid="workspace-shell-mock" />,
}))

vi.mock('../../app/settings/settings', () => ({
  loadSettings: vi.fn(() => mockSettings),
}))

describe('Header version render timing', () => {
  it('renders version within 10 seconds of load', () => {
    const start = Date.now()
    render(<App />)
    const pill = screen.getByText(`v${mockSettings.app.version}`)
    const elapsedMs = Date.now() - start

    expect(pill).toBeInTheDocument()
    expect(elapsedMs).toBeLessThan(10_000)
  })
})
