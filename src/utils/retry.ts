/**
 * Retry Utility
 * 
 * Provides retry mechanisms for failed API calls with exponential backoff
 * Helps improve reliability of network operations
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) {
      // Network error
      return true;
    }
    
    const status = error.response?.status;
    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429;
  },
  onRetry: () => {},
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Retry an async operation with exponential backoff
 * 
 * @param operation - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to operation result
 * @throws Last error if all retries fail
 * 
 * @example
 * ```typescript
 * const data = await retryOperation(
 *   () => apiClient.get('/data'),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt) => console.log(`Retry attempt ${attempt}`)
 *   }
 * );
 * ```
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!config.shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      // Call retry callback
      config.onRetry(attempt + 1, error);

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper for a function
 * 
 * @param fn - Function to wrap with retry logic
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 * 
 * @example
 * ```typescript
 * const fetchDataWithRetry = withRetry(
 *   (id: string) => apiClient.get(`/data/${id}`),
 *   { maxRetries: 3 }
 * );
 * 
 * const data = await fetchDataWithRetry('123');
 * ```
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    return retryOperation(() => fn(...args), options);
  };
}

/**
 * Check if an error is retryable
 * 
 * @param error - Error to check
 * @returns True if error should be retried
 */
export function isRetryableError(error: any): boolean {
  return DEFAULT_OPTIONS.shouldRetry(error);
}

/**
 * Get user-friendly retry message
 * 
 * @param attempt - Current retry attempt number
 * @param maxRetries - Maximum number of retries
 * @returns User-friendly message
 */
export function getRetryMessage(attempt: number, maxRetries: number): string {
  if (attempt === 1) {
    return 'Connection failed. Retrying...';
  }
  
  const remaining = maxRetries - attempt + 1;
  if (remaining > 0) {
    return `Retry ${attempt} of ${maxRetries}. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining...`;
  }
  
  return 'Final retry attempt...';
}
