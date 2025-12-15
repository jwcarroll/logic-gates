type Props = {
  status: 'live' | 'paused'
  isOpen: boolean
  notice?: { message: string; kind: 'info' | 'warning'; updatedAt: number } | null
}

export function GroupStatusBanner({ status, isOpen, notice }: Props) {
  const label = status === 'live' ? 'Simulation live' : 'Simulation paused'
  return (
    <div className="group-status" role="status" aria-label="Group simulation status" data-open={isOpen ? 'true' : 'false'}>
      <span className="group-status__label">{label}</span>
      {isOpen ? <span className="group-status__hint">Editing inside group</span> : <span className="group-status__hint">Editing root</span>}
      {notice?.message ? (
        <span className="group-status__notice" data-kind={notice.kind}>
          {notice.message}
        </span>
      ) : null}
    </div>
  )
}
