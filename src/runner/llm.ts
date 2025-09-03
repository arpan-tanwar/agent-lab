import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface LLMConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  prompt: string;
}

export interface LLMResponse {
  content: string;
  tokens: number;
  cost: number;
  model: string;
}

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.model = 'gemini-2.0-flash'; // Free model
  }

  async callLLM(config: LLMConfig, input?: unknown): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Prepare the prompt with input data if provided
      let fullPrompt = config.prompt;
      if (input) {
        if (typeof input === 'string') {
          fullPrompt += `\n\nInput: ${input}`;
        } else {
          fullPrompt += `\n\nInput: ${JSON.stringify(input, null, 2)}`;
        }
      }

      const model = this.genAI.getGenerativeModel({
        model: config.model || this.model,
        generationConfig: {
          temperature: config.temperature || 0.1,
          maxOutputTokens: config.maxTokens || 1000,
        },
      });

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Calculate tokens (rough estimation)
      const tokens = this.estimateTokens(fullPrompt + content);

      // Calculate cost (Gemini 1.5 Flash is free, but we'll track for future models)
      const cost = this.calculateCost(tokens, config.model || this.model);

      logger.info(
        {
          model: config.model || this.model,
          tokens,
          cost,
          duration,
          promptLength: fullPrompt.length,
          responseLength: content.length,
        },
        'LLM call completed',
      );

      return {
        content,
        tokens,
        cost,
        model: config.model || this.model,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          duration,
          model: config.model || this.model,
        },
        'LLM call failed',
      );

      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simplified approach - in production you'd want more accurate counting
    return Math.ceil(text.length / 4);
  }

  private calculateCost(tokens: number, model: string): number {
    // Gemini 1.5 Flash is currently free
    // Future models might have costs, so we'll track this
    const costPerToken = this.getCostPerToken(model);
    return tokens * costPerToken;
  }

  private getCostPerToken(model: string): number {
    // Current Gemini pricing (as of 2024)
    const pricing: Record<string, number> = {
      'gemini-1.5-flash': 0, // Free
      'gemini-1.5-pro': 0.00000125, // $1.25 per 1M tokens
      'gemini-1.0-pro': 0.00000125,
    };

    return pricing[model] || 0;
  }

  async validateConfig(config: LLMConfig): Promise<boolean> {
    if (!config.prompt || config.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      throw new Error('Temperature must be between 0 and 1');
    }

    if (config.maxTokens !== undefined && config.maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }

    return true;
  }
}

// Export a singleton instance
export const geminiProvider = new GeminiProvider();
