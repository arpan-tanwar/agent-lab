export interface AppConfig {
  // LLM Configuration
  llm: {
    defaultModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    costPerToken: Record<string, number>;
  };

  // Tool Configuration
  tools: {
    httpTimeout: number;
    emailDelay: number;
    slackDelay: number;
    crmDelay: number;
    processDelay: number;
  };

  // Background Processing
  processing: {
    pollInterval: number;
    concurrency: number;
  };

  // Retry Configuration
  retry: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    jitterFactor: number;
  };

  // Database Configuration
  database: {
    maxRetries: number;
  };
}

export const defaultConfig: AppConfig = {
  llm: {
    defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.0-flash',
    defaultTemperature: parseFloat(process.env.GEMINI_DEFAULT_TEMPERATURE || '0.1'),
    defaultMaxTokens: parseInt(process.env.GEMINI_DEFAULT_MAX_TOKENS || '1000'),
    costPerToken: {
      'gemini-2.0-flash': 0,
      'gemini-1.5-flash': 0,
      'gemini-1.5-pro': 0.00000125,
      'gemini-1.0-pro': 0.00000125,
    },
  },

  tools: {
    httpTimeout: parseInt(process.env.TOOL_HTTP_TIMEOUT || '30000'),
    emailDelay: parseInt(process.env.TOOL_EMAIL_DELAY || '1000'),
    slackDelay: parseInt(process.env.TOOL_SLACK_DELAY || '500'),
    crmDelay: parseInt(process.env.TOOL_CRM_DELAY || '800'),
    processDelay: parseInt(process.env.TOOL_PROCESS_DELAY || '300'),
  },

  processing: {
    pollInterval: parseInt(process.env.PROCESSING_POLL_INTERVAL || '5000'),
    concurrency: parseInt(process.env.PROCESSING_CONCURRENCY || '3'),
  },

  retry: {
    maxRetries: parseInt(process.env.RETRY_MAX_RETRIES || '3'),
    baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000'),
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000'),
    jitterFactor: parseFloat(process.env.RETRY_JITTER_FACTOR || '0.1'),
  },

  database: {
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
  },
};

// Export singleton instance
export const config = defaultConfig;
