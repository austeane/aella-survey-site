import { Component, type ReactNode } from "react";

import { track } from "@/lib/client/track";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

class InternalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error): void {
    track({
      event: "error",
      page: typeof window !== "undefined" ? window.location.pathname : "/",
      action: "ui_error_boundary",
      error_code: "UI_RENDER_ERROR",
      label: error.message,
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      message: null,
    });

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="page">
        <section className="raised-panel space-y-4">
          <h2 className="page-title">Something went wrong</h2>
          <p className="page-subtitle">
            We hit an unexpected rendering error. You can try again now.
          </p>
          {this.state.message ? (
            <p className="mono-value text-[var(--ink-faded)]">{this.state.message}</p>
          ) : null}
          <button
            type="button"
            className="editorial-button editorial-button--filled"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </section>
      </div>
    );
  }
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <InternalErrorBoundary>{children}</InternalErrorBoundary>;
}
