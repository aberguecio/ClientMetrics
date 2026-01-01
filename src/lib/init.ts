/**
 * Initialize the application
 * Resets stuck jobs on startup
 */
export async function initializeApp() {
  try {
    // Reset any stuck jobs from previous runs
    const { resetStuckJobs } = await import('./jobs/processor');
    await resetStuckJobs();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}
