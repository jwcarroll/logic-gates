import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: undefined }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for Playwright capture and debugging
    // eslint-disable-next-line no-console
    console.error('App crashed', error, info?.componentStack)
    try {
      // Surface stack in global for automated grabs
      ;(window as any).__LAST_ERROR__ = { message: error?.message, stack: error?.stack, componentStack: info?.componentStack }
    } catch {
      /* ignore */
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="workspace-shell app-error-fallback" data-testid="app-error-fallback" role="alert">
          <div className="workspace-canvas-layer">
            <div className="canvas-root">
              <div className="energized-overlay" data-empty="true" />
              <div className="canvas-error">{this.state.message ?? 'Unknown error'}</div>
            </div>
          </div>
          <button onClick={this.handleReset}>Reset app</button>
        </div>
      )
    }
    return this.props.children
  }
}
