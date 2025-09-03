import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { runs as runsTable } from '../db/schema.js';
import { workflowExecutor } from './executor.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class WorkflowProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  start(): void {
    if (this.isProcessing) {
      logger.warn('Workflow processor is already running');
      return;
    }

    this.isProcessing = true;
    logger.info({ pollInterval: this.POLL_INTERVAL }, 'Starting workflow processor');

    // Process immediately on start
    this.processPendingRuns();

    // Set up polling
    this.processingInterval = setInterval(() => {
      this.processPendingRuns();
    }, this.POLL_INTERVAL);
  }

  stop(): void {
    if (!this.isProcessing) {
      logger.warn('Workflow processor is not running');
      return;
    }

    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Workflow processor stopped');
  }

  private async processPendingRuns(): Promise<void> {
    try {
      // Find runs that are in 'running' status
      const pendingRuns = await db
        .select()
        .from(runsTable)
        .where(eq(runsTable.status, 'running'))
        .limit(10); // Process up to 10 runs at a time

      if (pendingRuns.length === 0) {
        return; // No pending runs
      }

      logger.info({ count: pendingRuns.length }, 'Found pending runs');

      // Process runs concurrently (but limit concurrency)
      const concurrency = 3;
      const chunks = this.chunkArray(pendingRuns, concurrency);

      for (const chunk of chunks) {
        await Promise.all(chunk.map((run) => this.processRun(run.id)));
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'Error processing pending runs',
      );
    }
  }

  private async processRun(runId: string): Promise<void> {
    try {
      logger.info({ runId }, 'Processing run');

      // Mark run as processing (optional - could add a 'processing' status)
      await db
        .update(runsTable)
        .set({ status: 'running' }) // Keep as running since we don't have a processing status
        .where(eq(runsTable.id, runId));

      // Execute the workflow
      await workflowExecutor.executeRun(runId);

      logger.info({ runId }, 'Run processing completed');
    } catch (error) {
      logger.error(
        {
          runId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Run processing failed',
      );

      // The executor should have already marked the run as failed
      // But let's make sure
      try {
        await db
          .update(runsTable)
          .set({
            status: 'failed',
            finishedAt: new Date(),
            failureReason: error instanceof Error ? error.message : String(error),
            lastError: { message: error instanceof Error ? error.message : String(error) },
          })
          .where(eq(runsTable.id, runId));
      } catch (updateError) {
        logger.error(
          {
            runId,
            error: updateError instanceof Error ? updateError.message : String(updateError),
          },
          'Failed to update run status',
        );
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Method to manually trigger processing (useful for testing)
  async triggerProcessing(): Promise<void> {
    logger.info('Manually triggering run processing');
    await this.processPendingRuns();
  }

  // Get processor status
  getStatus(): { isProcessing: boolean; pollInterval: number } {
    return {
      isProcessing: this.isProcessing,
      pollInterval: this.POLL_INTERVAL,
    };
  }
}

// Export a singleton instance
export const workflowProcessor = new WorkflowProcessor();
