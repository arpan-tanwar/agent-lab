import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface ToolConfig {
  name: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ToolResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
  duration: number;
  cost: number; // For API calls that might have costs
}

export type ToolHandler = (config: ToolConfig, input?: any) => Promise<ToolResponse>;

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  registerTool(name: string, handler: ToolHandler): void {
    this.tools.set(name, handler);
    logger.info({ toolName: name }, 'Tool registered');
  }

  async executeTool(toolName: string, config: ToolConfig, input?: any): Promise<ToolResponse> {
    const handler = this.tools.get(toolName);
    if (!handler) {
      throw new Error(
        `Tool '${toolName}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
      );
    }

    const startTime = Date.now();

    try {
      logger.info({ toolName, config }, 'Executing tool');
      const result = await handler(config, input);
      const duration = Date.now() - startTime;

      logger.info(
        {
          toolName,
          duration,
          status: result.status,
          cost: result.cost,
        },
        'Tool execution completed',
      );

      return {
        ...result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        {
          toolName,
          error: error instanceof Error ? error.message : String(error),
          duration,
        },
        'Tool execution failed',
      );

      throw new Error(
        `Tool '${toolName}' execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  private registerDefaultTools(): void {
    // HTTP Request Tool
    this.registerTool('http', this.httpRequestHandler.bind(this));

    // Email Tool
    this.registerTool('email', this.emailHandler.bind(this));

    // Slack Tool
    this.registerTool('slack', this.slackHandler.bind(this));

    // CRM Tool
    this.registerTool('crm', this.crmHandler.bind(this));

    // Data Processing Tool
    this.registerTool('process', this.dataProcessingHandler.bind(this));
  }

  private async httpRequestHandler(config: ToolConfig, input?: any): Promise<ToolResponse> {
    const url = config.url || input?.url;
    if (!url) {
      throw new Error('URL is required for HTTP requests');
    }

    const method = config.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const body = config.body || input?.body;

    const controller = new AbortController();
    const timeout = config.timeout || 30000; // 30 seconds default
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => response.text());

      return {
        data: responseData,
        status: response.status,
        headers: Object.fromEntries(response.headers as any),
        duration: 0, // Will be set by the caller
        cost: 0, // HTTP requests are typically free
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async emailHandler(config: ToolConfig, input?: any): Promise<ToolResponse> {
    // Mock email sending - in production you'd integrate with SendGrid, SES, etc.
    const { to, subject, body } = input || {};

    if (!to || !subject || !body) {
      throw new Error('Email requires: to, subject, body');
    }

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info({ to, subject }, 'Email sent');

    return {
      data: { messageId: `email_${Date.now()}`, to, subject },
      status: 200,
      headers: {},
      duration: 0,
      cost: 0.001, // Mock cost for email service
    };
  }

  private async slackHandler(config: ToolConfig, input?: any): Promise<ToolResponse> {
    // Mock Slack notification - in production you'd use Slack Web API
    const { channel, message } = input || {};

    if (!channel || !message) {
      throw new Error('Slack requires: channel, message');
    }

    // Simulate Slack API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info({ channel, message }, 'Slack message sent');

    return {
      data: { ts: Date.now().toString(), channel, message },
      status: 200,
      headers: {},
      duration: 0,
      cost: 0,
    };
  }

  private async crmHandler(config: ToolConfig, input?: any): Promise<ToolResponse> {
    // Mock CRM integration - in production you'd integrate with Salesforce, HubSpot, etc.
    const { action, data } = input || {};

    if (!action) {
      throw new Error('CRM requires: action');
    }

    // Simulate CRM API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const recordId = `crm_${Date.now()}`;

    logger.info({ action, recordId }, 'CRM operation completed');

    return {
      data: { recordId, action, data },
      status: 200,
      headers: {},
      duration: 0,
      cost: 0.01, // Mock cost for CRM service
    };
  }

  private async dataProcessingHandler(config: ToolConfig, input?: any): Promise<ToolResponse> {
    // Mock data processing - in production you'd have actual data processing logic
    const { operation, data } = input || {};

    if (!operation) {
      throw new Error('Data processing requires: operation');
    }

    // Simulate data processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    let processedData;
    switch (operation) {
      case 'extract':
        processedData = { extracted: 'sample data' };
        break;
      case 'transform':
        processedData = { transformed: data };
        break;
      case 'validate':
        processedData = { valid: true, data };
        break;
      default:
        processedData = { processed: data };
    }

    logger.info({ operation }, 'Data processing completed');

    return {
      data: processedData,
      status: 200,
      headers: {},
      duration: 0,
      cost: 0,
    };
  }
}

// Export a singleton instance
export const toolRegistry = new ToolRegistry();
