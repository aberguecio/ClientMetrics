import { processBatchJobs, getJobStats } from './processor';

// Global flag to control the auto-processor
let isRunning = false;
let processorInterval: NodeJS.Timeout | null = null;

/**
 * Start the automatic job processor
 * Runs continuously in the background processing pending jobs
 */
export function startAutoProcessor(intervalMs: number = 10000) {
  if (isRunning) {
    console.log('Auto-processor is already running');
    return;
  }

  isRunning = true;
  console.log(`Starting auto-processor with ${intervalMs}ms interval`);

  // Process immediately on start
  processJobsContinuously();

  // Then set up interval for continuous processing
  processorInterval = setInterval(async () => {
    await processJobsContinuously();
  }, intervalMs);
}

/**
 * Stop the automatic job processor
 */
export function stopAutoProcessor() {
  if (!isRunning) {
    console.log('Auto-processor is not running');
    return;
  }

  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
  }

  isRunning = false;
  console.log('Auto-processor stopped');
}

/**
 * Check if auto-processor is running
 */
export function isAutoProcessorRunning(): boolean {
  return isRunning;
}

/**
 * Process jobs continuously until no more pending jobs
 */
async function processJobsContinuously() {
  try {
    // Check if there are pending jobs
    const stats = await getJobStats();

    if (stats.pending === 0) {
      // No pending jobs, skip this cycle
      return;
    }

    console.log(`Auto-processor: ${stats.pending} pending jobs found`);

    // Process a batch
    const result = await processBatchJobs(5);

    if (result.processed > 0) {
      console.log(
        `Auto-processor: Processed ${result.processed} jobs (${result.successful} successful, ${result.failed} failed)`
      );
    }

    // If there are still pending jobs, process again immediately
    if (stats.pending > result.processed) {
      // Wait a bit to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await processJobsContinuously();
    }
  } catch (error) {
    console.error('Auto-processor error:', error);
  }
}
