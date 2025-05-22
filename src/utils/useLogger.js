import { useCallback } from 'react';

/**
 * React hook for using the browser-friendly logger in components
 * 
 * @param {Object} defaultContext - Default context values to include with each log
 * @returns {Object} - Logger methods (error, warn, info, debug, verbose)
 */
export const useLogger = (defaultContext = {}) => {
  // Create a component name context if it's not provided
  if (!defaultContext.component && typeof document !== 'undefined') {
    try {
      const error = new Error();
      const stack = error.stack || '';
      const callerMatch = stack.match(/at\s+(.*?)\s+\(/);
      if (callerMatch && callerMatch[1]) {
        defaultContext.component = callerMatch[1].trim();
      }
    } catch (e) {
      // Ignore errors in stack trace parsing
    }
  }

  // Convert React component instances to component names in context
  const sanitizeContext = (context) => {
    const sanitized = { ...context };
    Object.entries(sanitized).forEach(([key, value]) => {
      // Handle React component instances
      if (value && typeof value === 'object' && value.$$typeof) {
        sanitized[key] = value.type?.displayName || value.type?.name || 'ReactComponent';
      }
      // Stringify any functions
      else if (typeof value === 'function') {
        sanitized[key] = `[Function: ${value.name || 'anonymous'}]`;
      }
    });
    return sanitized;
  };

  const error = useCallback((message, context = {}) => {
    const mergedContext = sanitizeContext({ ...defaultContext, ...context });
    if (window.electronAPI) {
      window.electronAPI.log({ 
        level: 'error', 
        message, 
        context: mergedContext 
      });
    } else {
      console.error(`[ERROR] ${message}`, mergedContext);
    }
  }, [defaultContext]);

  const warn = useCallback((message, context = {}) => {
    const mergedContext = sanitizeContext({ ...defaultContext, ...context });
    if (window.electronAPI) {
      window.electronAPI.log({ 
        level: 'warn', 
        message, 
        context: mergedContext 
      });
    } else {
      console.warn(`[WARN] ${message}`, mergedContext);
    }
  }, [defaultContext]);

  const info = useCallback((message, context = {}) => {
    const mergedContext = sanitizeContext({ ...defaultContext, ...context });
    if (window.electronAPI) {
      window.electronAPI.log({ 
        level: 'info', 
        message, 
        context: mergedContext 
      });
    } else {
      console.info(`[INFO] ${message}`, mergedContext);
    }
  }, [defaultContext]);

  const debug = useCallback((message, context = {}) => {
    const mergedContext = sanitizeContext({ ...defaultContext, ...context });
    if (window.electronAPI) {
      window.electronAPI.log({ 
        level: 'debug', 
        message, 
        context: mergedContext 
      });
    } else {
      console.debug(`[DEBUG] ${message}`, mergedContext);
    }
  }, [defaultContext]);

  const verbose = useCallback((message, context = {}) => {
    const mergedContext = sanitizeContext({ ...defaultContext, ...context });
    if (window.electronAPI) {
      window.electronAPI.log({ 
        level: 'verbose', 
        message, 
        context: mergedContext 
      });
    } else {
      console.log(`[VERBOSE] ${message}`, mergedContext);
    }
  }, [defaultContext]);

  return {
    error,
    warn,
    info,
    debug,
    verbose
  };
};

export default useLogger; 