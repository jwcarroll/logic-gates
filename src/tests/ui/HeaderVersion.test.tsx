import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import App from '../../App'
import { mockSettings } from './__mocks__/settingsMock'

vi.mock('../../ui/WorkspaceShell', () => ({
  WorkspaceShell: () => <div data-testid="workspace-shell-mock" />,
}))

vi.mock('../../app/settings/settings', () => ({
  loadSettings: vi.fn(() => mockSettings),
}))

describe('Header displays version', () => {
  it('shows the version from settings in the header pill', () => {
    render(<App />)

    const pills = screen.getAllByText(`v${mockSettings.app.version}`)
    expect(pills.length).toBeGreaterThan(0)
    expect(pills[0]).toHaveAttribute('title', `Environment: ${mockSettings.app.environment}`)
  })
})
