import { processJobsConcurrently, getJobStats } from './processor';

// Flag to prevent overlapping processing cycles
let isProcessing = false;

/**
 * Trigger immediate job processing
 * Can be called from API routes after adding new jobs
 */
export function triggerJobProcessing() {
  // Prevent overlapping execution
  if (isProcessing) {
    console.log('Auto-processor is already running, skipping trigger');
    return;
  }

  // Start processing in background (fire and forget)
  processJobsContinuously().catch(err => {
    console.error('Unhandled error in job processor:', err);
    isProcessing = false;
  });
}

/**
 * Process jobs continuously until no more pending jobs
 */
async function processJobsContinuously() {
  isProcessing = true;
  console.log('Starting job processing cycle...');

  try {
    // Check if there are pending jobs
    const stats = await getJobStats();

    if (stats.pending === 0) {
      console.log('No pending jobs, stopping processor.');
      return;
    }

    console.log(`Found ${stats.pending} pending jobs. Starting concurrent processing...`);

    // Process all jobs using 20 concurrent workers
    // This function will return only when all jobs are processed (or no more pending jobs can be found)
    const result = await processJobsConcurrently(20);

    console.log(
      `Processing cycle completed: Processed ${result.processed} jobs (${result.successful} successful, ${result.failed} failed)`
    );

  } catch (error) {
    console.error('Auto-processor error:', error);
  } finally {
    isProcessing = false;
    console.log('Job processing cycle finished.');
  }
}
