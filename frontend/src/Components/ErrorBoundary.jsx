/* eslint-disable react/prop-types */
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Application error:", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2] px-4">
        <div className="w-full max-w-md rounded-[14px] border border-[#e5e5e5] bg-white p-8 text-center shadow-[0_0_0_1px_rgba(10,10,10,0.08)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[10px] border border-red-100 bg-red-50 text-red-500">
            <span className="text-3xl font-bold">!</span>
          </div>
          <h1 className="mb-3 text-2xl font-semibold text-[#0a0a0a]">Something went wrong</h1>
          <p className="mb-6 leading-relaxed text-[#737373]">
            The page ran into an unexpected problem. Reloading usually gets things back on track.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded-[10px] bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a0a0a]"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
