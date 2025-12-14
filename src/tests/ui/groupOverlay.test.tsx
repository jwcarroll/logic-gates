import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { GroupDrillInOverlay } from '../../ui/components/GroupDrillInOverlay'

describe('[US3] group drill-in overlay', () => {
  it('renders breadcrumb and calls back handler', () => {
    const onBack = vi.fn()
    render(<GroupDrillInOverlay breadcrumb={['Root', 'Full Adder']} onBack={onBack} />)

    expect(screen.getByRole('navigation', { name: /group breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText('Root')).toBeInTheDocument()
    expect(screen.getAllByText('Full Adder').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
