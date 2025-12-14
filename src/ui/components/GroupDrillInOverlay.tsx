import type { WorkspaceTheme } from '../../design/tokens/workspace'

type Props = {
  breadcrumb: string[]
  onBack: () => void
  theme?: WorkspaceTheme
}

export function GroupDrillInOverlay({ breadcrumb, onBack, theme = 'dark' }: Props) {
  const last = breadcrumb[breadcrumb.length - 1] ?? 'Group'
  return (
    <div className="group-drill-in" data-theme={theme}>
      <button type="button" className="group-drill-in__back" onClick={onBack} aria-label="Back">
        Back
      </button>
      <nav className="group-drill-in__breadcrumb" aria-label="Group breadcrumb">
        {breadcrumb.map((item, index) => {
          const isCurrent = index === breadcrumb.length - 1
          return (
            <span key={`${item}-${index}`} className={`group-drill-in__crumb ${isCurrent ? 'group-drill-in__crumb--current' : ''}`}>
              {item}
              {!isCurrent ? <span className="group-drill-in__separator">/</span> : null}
            </span>
          )
        })}
      </nav>
      <span className="group-drill-in__title" aria-label="Current group">
        {last}
      </span>
    </div>
  )
}

