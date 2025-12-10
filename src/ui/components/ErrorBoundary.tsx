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
    ;(window as any).__LAST_ERROR__ = { message: error?.message, stack: info?.componentStack }
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
        <div className="app-error-fallback" data-testid="app-error-fallback" role="alert">
          <h2>Something went wrong</h2>
          <p>{this.state.message ?? 'Unknown error'}</p>
          <button onClick={this.handleReset}>Reset app</button>
        </div>
      )
    }
    return this.props.children
  }
}
