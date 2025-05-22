import React, { Component } from 'react';
import { useLogger } from '../../utils/useLogger';

// Error logger context consumer wrapper
const withErrorLogging = (WrappedComponent) => {
  const WithErrorLoggingComponent = (props) => {
    const logger = useLogger({ component: 'ErrorBoundary' });
    
    return <WrappedComponent {...props} logger={logger} />;
  };
  
  return WithErrorLoggingComponent;
};

class ErrorBoundaryBase extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logger system
    const { logger } = this.props;
    
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    };
    
    logger.error('React error boundary caught an error', errorDetails);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, errorInfo, this.resetError)
          : fallback;
      }
      
      // Otherwise use default error UI
      return (
        <div className="error-boundary p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
          <details className="text-sm text-red-600">
            <summary className="cursor-pointer">View technical details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
              {error && error.toString()}
              <br />
              {errorInfo && errorInfo.componentStack}
            </pre>
          </details>
          <button
            className="mt-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={this.resetError}
          >
            Try again
          </button>
        </div>
      );
    }
    
    return children;
  }
  
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
}

// Export the ErrorBoundary with logger
const ErrorBoundary = withErrorLogging(ErrorBoundaryBase);
export default ErrorBoundary; 