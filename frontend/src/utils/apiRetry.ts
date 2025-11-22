/**
 * API Retry Utility
 * Implements exponential backoff retry logic for failed requests
 * @author Senior Developer
 * @version 1.0.0
 */

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, getRetryDelay, isRetryableStatus } from '../config/api.config';
import { logger } from './logger';
import { isRetryableError } from './apiErrors';

interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry an API request with exponential backoff
 */
export async function retryRequest<T = any>(
  requestFn: () => Promise<AxiosResponse<T>>,
  config: RetryConfig = {}
): Promise<AxiosResponse<T>> {
  const {
    maxAttempts = API_CONFIG.RETRY.MAX_ATTEMPTS,
    onRetry,
  } = config;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestFn();
      
      // If we succeeded after retrying, log it
      if (attempt > 1) {
        logger.info(`Request succeeded after ${attempt} attempts`);
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      const status = error.response?.status;
      const shouldRetry = 
        attempt < maxAttempts && 
        (
          !error.response || // Network error
          (status && isRetryableStatus(status))
        );

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = getRetryDelay(attempt);
      
      logger.warn(`Request failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, {
        status,
        message: error.message,
      });

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // If we exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Create a retry interceptor for Axios
 */
export function createRetryInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };
      
      // Initialize retry count
      if (!config._retryCount) {
        config._retryCount = 0;
      }

      // Check if we should retry
      const status = error.response?.status;
      const shouldRetry = 
        config._retryCount < API_CONFIG.RETRY.MAX_ATTEMPTS &&
        (
          !error.response || // Network error
          (status && isRetryableStatus(status))
        );

      if (!shouldRetry) {
        return Promise.reject(error);
      }

      // Increment retry count
      config._retryCount++;

      // Calculate delay
      const delay = getRetryDelay(config._retryCount);

      logger.warn(
        `Retrying request (attempt ${config._retryCount}/${API_CONFIG.RETRY.MAX_ATTEMPTS})`,
        { url: config.url, method: config.method }
      );

      // Wait before retrying
      await sleep(delay);

      // Retry the request
      return axiosInstance(config);
    }
  );
}

/**
 * Retry wrapper for async functions
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = API_CONFIG.RETRY.MAX_ATTEMPTS,
    onRetry,
  } = config;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const shouldRetry = attempt < maxAttempts && isRetryableError(error);

      if (!shouldRetry) {
        throw error;
      }

      const delay = getRetryDelay(attempt);

      logger.warn(`Operation failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`);

      if (onRetry) {
        onRetry(attempt, error);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

