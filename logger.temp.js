// Determine if we're in renderer or main process
const isRenderer = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

// Main process logger - only load if in main process
let winston;
let path;
let fs;
let app;
let os;
let logDir;
let logger;
let createContextLogger;
let getLogPath;

// Only load Node.js dependencies in the main process
if (!isRenderer) {
  winston = require('winston');
  require('winston-daily-rotate-file');
  path = require('path');
  fs = require('fs');
  app = require('electron').app;
  os = require('os');

  // Determine the logs directory based on the app's user data path
  logDir = app ? path.join(app.getPath('userData'), 'logs') : path.join(os.homedir(), '.translor', 'logs');
  const {
    createLogger,
    format,
    transports
  } = winston;
  const {
    combine,
    timestamp,
    printf,
    colorize,
    label,
    json,
    errors
  } = format;

  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, {
      recursive: true
    });
  }

  // Define custom format for console logs with colorization
  const consoleFormat = combine(colorize({
    all: true
  }), label({
    label: 'Translor'
  }), timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }), printf(({
    level,
    message,
    timestamp,
    label,
    ...metadata
  }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      if (metadata.stack) {
        // Error object processing
        metaStr = `\n${metadata.stack}`;
      } else {
        metaStr = `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }
    return `[${timestamp}] [${label}] ${level}: ${message}${metaStr}`;
  }));

  // Define format for file logs
  const fileFormat = combine(label({
    label: 'Translor'
  }), timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }), errors({
    stack: true
  }), json());

  // Create a daily rotate file transport for each log level
  const fileTransports = [new transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d'
  }), new transports.DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d'
  })];

  // Define log levels and colors
  const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    verbose: 5
  };
  const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    verbose: 'grey'
  };

  // Create logger with both console and file transports
  logger = createLogger({
    levels: logLevels,
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: fileFormat,
    transports: [new transports.Console({
      format: consoleFormat
    }), ...fileTransports],
    exitOnError: false
  });

  // Add colors to Winston logger 
  winston.addColors(logColors);

  // Create a logger with additional context
  createContextLogger = (context = {}) => {
    return {
      error: (message, additionalContext = {}) => logger.error(message, {
        ...context,
        ...additionalContext
      }),
      warn: (message, additionalContext = {}) => logger.warn(message, {
        ...context,
        ...additionalContext
      }),
      info: (message, additionalContext = {}) => logger.info(message, {
        ...context,
        ...additionalContext
      }),
      http: (message, additionalContext = {}) => logger.http(message, {
        ...context,
        ...additionalContext
      }),
      debug: (message, additionalContext = {}) => logger.debug(message, {
        ...context,
        ...additionalContext
      }),
      verbose: (message, additionalContext = {}) => logger.verbose(message, {
        ...context,
        ...additionalContext
      })
    };
  };

  // Setup global error handling in main process
  if (process && process.on) {
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });

      // Send to error reporting service if in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement error reporting service integration
      }
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: reason.toString(),
        stack: reason.stack
      });

      // Send to error reporting service if in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement error reporting service integration
      }
    });
  }

  // Simple function to get log path for renderer process (exposed via ipcMain)
  getLogPath = () => logDir;
}
// Renderer process - create a browser-friendly logger
else {
  // Define log levels
  const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    verbose: 5
  };

  // Get current level based on environment
  const getCurrentLevel = () => {
    const isDev = process.env.NODE_ENV === 'development';
    return isDev ? 'debug' : 'info';
  };

  // Create simplified browser logger that uses console and electron IPC
  const createBrowserLogger = () => {
    const currentLevel = getCurrentLevel();
    const currentLevelValue = LOG_LEVELS[currentLevel];

    // Send logs to main process
    const sendToMain = (level, message, context) => {
      try {
        window.electronAPI?.log({
          level,
          message,
          context
        });
      } catch (err) {
        console.error('Error sending log to main process:', err);
      }
    };

    // Create formatted log message
    const formatLogMessage = (message, context) => {
      const timestamp = new Date().toISOString();
      const contextStr = context ? JSON.stringify(context) : '';
      return `[${timestamp}] [Translor] ${message} ${contextStr}`;
    };

    // Log methods with level checking
    return {
      error: (message, context = {}) => {
        if (LOG_LEVELS.error <= currentLevelValue) {
          console.error(formatLogMessage(message, context));
          sendToMain('error', message, context);
        }
      },
      warn: (message, context = {}) => {
        if (LOG_LEVELS.warn <= currentLevelValue) {
          console.warn(formatLogMessage(message, context));
          sendToMain('warn', message, context);
        }
      },
      info: (message, context = {}) => {
        if (LOG_LEVELS.info <= currentLevelValue) {
          console.info(formatLogMessage(message, context));
          sendToMain('info', message, context);
        }
      },
      http: (message, context = {}) => {
        if (LOG_LEVELS.http <= currentLevelValue) {
          console.log(`[HTTP] ${formatLogMessage(message, context)}`);
          sendToMain('http', message, context);
        }
      },
      debug: (message, context = {}) => {
        if (LOG_LEVELS.debug <= currentLevelValue) {
          console.debug(formatLogMessage(message, context));
          sendToMain('debug', message, context);
        }
      },
      verbose: (message, context = {}) => {
        if (LOG_LEVELS.verbose <= currentLevelValue) {
          console.log(`[VERBOSE] ${formatLogMessage(message, context)}`);
          sendToMain('verbose', message, context);
        }
      }
    };
  };

  // Create the browser logger instance
  logger = createBrowserLogger();

  // Create context logger for browser
  createContextLogger = (context = {}) => {
    return {
      error: (message, additionalContext = {}) => logger.error(message, {
        ...context,
        ...additionalContext
      }),
      warn: (message, additionalContext = {}) => logger.warn(message, {
        ...context,
        ...additionalContext
      }),
      info: (message, additionalContext = {}) => logger.info(message, {
        ...context,
        ...additionalContext
      }),
      http: (message, additionalContext = {}) => logger.http(message, {
        ...context,
        ...additionalContext
      }),
      debug: (message, additionalContext = {}) => logger.debug(message, {
        ...context,
        ...additionalContext
      }),
      verbose: (message, additionalContext = {}) => logger.verbose(message, {
        ...context,
        ...additionalContext
      })
    };
  };

  // Add global error handlers for browser
  window.addEventListener('error', event => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  window.addEventListener('unhandledrejection', event => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason?.toString(),
      stack: event.reason?.stack
    });
  });
  getLogPath = () => null; // Not applicable in browser
}

// Export the appropriate logger instance and helper functions
export { logger, createContextLogger, getLogPath };
