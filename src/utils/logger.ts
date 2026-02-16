/**
 * Frontend Logger Utility
 * Provides structured logging for API requests, responses, and errors
 */

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

interface LogOptions {
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

/**
 * Format timestamp for logs
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Get emoji for log level
 */
const getLogEmoji = (level: LogLevel): string => {
  const emojis = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍',
  };
  return emojis[level];
};

/**
 * Core logging function
 */
const log = (options: LogOptions): void => {
  const { level, message, data, error } = options;
  const timestamp = getTimestamp();
  const emoji = getLogEmoji(level);
  
  const logPrefix = `[${timestamp}] ${emoji} ${level.toUpperCase()}`;
  
  console.log(`\n${logPrefix}: ${message}`);
  
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  if (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
};

/**
 * Log API request
 */
export const logRequest = (method: string, url: string, data?: any): void => {
  console.log('\n' + '='.repeat(60));
  console.log(`📤 API REQUEST`);
  console.log('='.repeat(60));
  console.log(`⏰ Time: ${getTimestamp()}`);
  console.log(`🔗 Method: ${method.toUpperCase()}`);
  console.log(`🌐 URL: ${url}`);
  
  if (data) {
    console.log(`📦 Request Data:`, JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(60));
};

/**
 * Log API response
 */
export const logResponse = (
  method: string,
  url: string,
  status: number,
  data?: any,
  duration?: number
): void => {
  console.log('\n' + '-'.repeat(60));
  console.log(`📥 API RESPONSE`);
  console.log('-'.repeat(60));
  console.log(`⏰ Time: ${getTimestamp()}`);
  console.log(`🔗 Method: ${method.toUpperCase()}`);
  console.log(`🌐 URL: ${url}`);
  console.log(`📊 Status: ${status}`);
  
  if (duration !== undefined) {
    console.log(`⏱️  Duration: ${duration}ms`);
  }
  
  if (data) {
    // Redact sensitive information
    const sanitizedData = JSON.parse(JSON.stringify(data));
    if (sanitizedData.data?.token) {
      sanitizedData.data.token = '[REDACTED]';
    }
    
    console.log(`📦 Response Data:`, JSON.stringify(sanitizedData, null, 2));
  }
  console.log('-'.repeat(60) + '\n');
};

/**
 * Log API error
 */
export const logError = (
  method: string,
  url: string,
  error: any,
  duration?: number
): void => {
  console.log('\n' + '!'.repeat(60));
  console.log(`❌ API ERROR`);
  console.log('!'.repeat(60));
  console.log(`⏰ Time: ${getTimestamp()}`);
  console.log(`🔗 Method: ${method.toUpperCase()}`);
  console.log(`🌐 URL: ${url}`);
  
  if (duration !== undefined) {
    console.log(`⏱️  Duration: ${duration}ms`);
  }
  
  if (error.response) {
    console.log(`📊 Status: ${error.response.status}`);
    console.log(`📦 Error Data:`, JSON.stringify(error.response.data, null, 2));
  } else if (error.request) {
    console.log(`🔌 Network Error: No response received`);
    console.log(`📦 Request Details:`, {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });
  } else {
    console.log(`💥 Error Message: ${error.message}`);
  }
  
  if (error.stack) {
    console.log(`📚 Stack Trace:`, error.stack);
  }
  console.log('!'.repeat(60) + '\n');
};

/**
 * Log info message
 */
export const logInfo = (message: string, data?: any): void => {
  log({ level: 'info', message, data });
};

/**
 * Log success message
 */
export const logSuccess = (message: string, data?: any): void => {
  log({ level: 'success', message, data });
};

/**
 * Log warning message
 */
export const logWarning = (message: string, data?: any): void => {
  log({ level: 'warning', message, data });
};

/**
 * Log error message
 */
export const logErrorMessage = (message: string, error?: Error, data?: any): void => {
  log({ level: 'error', message, error, data });
};

/**
 * Log debug message
 */
export const logDebug = (message: string, data?: any): void => {
  log({ level: 'debug', message, data });
};

/**
 * Log KYC validation check
 */
export const logKYCCheck = (userId: string, isApproved: boolean, status?: string): void => {
  console.log('\n' + '~'.repeat(60));
  console.log(`🔐 KYC VALIDATION CHECK`);
  console.log('~'.repeat(60));
  console.log(`⏰ Time: ${getTimestamp()}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`✅ Approved: ${isApproved}`);
  if (status) {
    console.log(`📋 Status: ${status}`);
  }
  console.log('~'.repeat(60) + '\n');
};

/**
 * Log booking operation
 */
export const logBookingOperation = (
  operation: string,
  bookingId?: string,
  details?: any
): void => {
  console.log('\n' + '~'.repeat(60));
  console.log(`📅 BOOKING OPERATION: ${operation.toUpperCase()}`);
  console.log('~'.repeat(60));
  console.log(`⏰ Time: ${getTimestamp()}`);
  
  if (bookingId) {
    console.log(`🎫 Booking ID: ${bookingId}`);
  }
  
  if (details) {
    console.log(`📋 Details:`, JSON.stringify(details, null, 2));
  }
  console.log('~'.repeat(60) + '\n');
};

export default {
  logRequest,
  logResponse,
  logError,
  logInfo,
  logSuccess,
  logWarning,
  logErrorMessage,
  logDebug,
  logKYCCheck,
  logBookingOperation,
};
