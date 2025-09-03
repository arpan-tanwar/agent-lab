import pino from 'pino';
import { config as appConfig } from '../config/index.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

interface ErrorWithStatus {
  status?: number;
  response?: {
    status?: number;
  };
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public originalError: unknown,
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
    maxRetries = appConfig.retry.maxRetries,
    baseDelay = appConfig.retry.baseDelay,
    maxDelay = appConfig.retry.maxDelay,
    jitter = true,
    retryCondition = (error: unknown) => {
      // Retry on 429 (rate limit) and 5xx errors
      const errorWithStatus = error as ErrorWithStatus;
      const status = errorWithStatus?.status || errorWithStatus?.response?.status;
      return status === 429 || (status !== undefined && status >= 500 && status < 600);
    },
  } = options;

  let lastError: unknown;

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
        const errorWithStatus = error as ErrorWithStatus;
        logger.error(
          {
            requestId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: error instanceof Error ? error.message : String(error),
            status: errorWithStatus?.status || errorWithStatus?.response?.status,
          },
          'Retry failed - giving up',
        );
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, maxDelay);
      const jitterAmount = jitter ? Math.random() * appConfig.retry.jitterFactor * delay : 0;
      const finalDelay = Math.floor(delay + jitterAmount);

      const errorWithStatus = error as ErrorWithStatus;
      logger.warn(
        {
          requestId,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delay: finalDelay,
          error: error instanceof Error ? error.message : String(error),
          status: errorWithStatus?.status || errorWithStatus?.response?.status,
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
    info: (message: string, data?: Record<string, unknown>) => {
      logger.info({ requestId, ...data }, message);
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      logger.warn({ requestId, ...data }, message);
    },
    error: (message: string, data?: Record<string, unknown>) => {
      logger.error({ requestId, ...data }, message);
    },
    debug: (message: string, data?: Record<string, unknown>) => {
      logger.debug({ requestId, ...data }, message);
    },
  };
}
