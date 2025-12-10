import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChallengePanel } from '../../ui/pages/ChallengePanel'
import { useAppStore } from '../../app/store'

describe('ChallengePanel', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('loads and validates a challenge run', () => {
    render(<ChallengePanel />)

    fireEvent.click(screen.getByText(/Load challenge/i))
    expect(useAppStore.getState().challengeStatus.state).toBe('loaded')

    useAppStore.getState().toggleSwitch('challenge-switch-a')

    fireEvent.click(screen.getByRole('button', { name: /Validate/i }))
    expect(screen.getByRole('status').textContent).toContain('Success')
  })
})
