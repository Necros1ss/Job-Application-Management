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
    console.error("Application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-500 leading-relaxed mb-6">
            The page ran into an unexpected problem. Reloading usually gets things back on track.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
