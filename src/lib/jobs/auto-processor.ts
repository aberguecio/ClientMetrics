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
 * Trigger immediate job processing
 * Can be called from API routes after adding new jobs
 */
export function triggerJobProcessing() {
  if (!isRunning) {
    console.log('Auto-processor not running, starting it temporarily...');
    isRunning = true;
  }

  // Trigger processing immediately without waiting for interval
  processJobsContinuously();
}

/**
 * Process jobs continuously until no more pending jobs
 */
// Flag to prevent overlapping processing cycles
let isProcessing = false;

async function processJobsContinuously() {
  // Prevent overlapping execution
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    let hasMoreJobs = true;

    // Loop until no more jobs or error
    while (hasMoreJobs) {
      // Check if there are pending jobs
      const stats = await getJobStats();

      if (stats.pending === 0) {
        hasMoreJobs = false;
        break;
      }

      console.log(`Auto-processor: ${stats.pending} pending jobs found`);

      // Process a batch (increased to 20 as requested)
      const result = await processBatchJobs(20);

      if (result.processed > 0) {
        console.log(
          `Auto-processor: Processed ${result.processed} jobs (${result.successful} successful, ${result.failed} failed)`
        );
      }

      // If we processed fewer jobs than batch size, it means we're done
      if (result.processed < 20) {
        hasMoreJobs = false;
      }

      // No delay between batches - process as fast as possible
    }
  } catch (error) {
    console.error('Auto-processor error:', error);
  } finally {
    isProcessing = false;
  }
}
