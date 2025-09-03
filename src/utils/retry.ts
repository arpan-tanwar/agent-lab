import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public originalError: any,
    public attempt: number,
    public maxRetries: number,
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  requestId?: string,
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = true,
    retryCondition = (error) => {
      // Retry on 429 (rate limit) and 5xx errors
      const status = error?.status || error?.response?.status;
      return status === 429 || (status >= 500 && status < 600);
    },
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      if (attempt > 0) {
        logger.info(
          {
            requestId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            duration,
            success: true,
          },
          'Retry succeeded',
        );
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or condition says not to
      if (attempt === maxRetries || !retryCondition(error)) {
        logger.error(
          {
            requestId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: error instanceof Error ? error.message : String(error),
            status: error?.status || error?.response?.status,
          },
          'Retry failed - giving up',
        );
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, maxDelay);
      const jitterAmount = jitter ? Math.random() * 0.1 * delay : 0;
      const finalDelay = Math.floor(delay + jitterAmount);

      logger.warn(
        {
          requestId,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delay: finalDelay,
          error: error instanceof Error ? error.message : String(error),
          status: error?.status || error?.response?.status,
        },
        'Retry attempt failed - retrying',
      );

      await sleep(finalDelay);
    }
  }

  throw new RetryError(
    `Operation failed after ${maxRetries + 1} attempts`,
    lastError,
    maxRetries + 1,
    maxRetries + 1,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRetryLogger(requestId: string) {
  return {
    info: (message: string, data?: any) => {
      logger.info({ requestId, ...data }, message);
    },
    warn: (message: string, data?: any) => {
      logger.warn({ requestId, ...data }, message);
    },
    error: (message: string, data?: any) => {
      logger.error({ requestId, ...data }, message);
    },
    debug: (message: string, data?: any) => {
      logger.debug({ requestId, ...data }, message);
    },
  };
}
