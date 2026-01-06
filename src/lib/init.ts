/**
 * Initialize the application
 * Resets stuck jobs on startup
 */
export async function initializeApp() {
  // Skip initialization during build time (pre-render) to avoid side-effects
  if (process.env.SKIP_APP_INIT === '1' || process.env.SKIP_APP_INIT === 'true') {
    console.log('Skipping application initialization due to SKIP_APP_INIT');
    return;
  }

  try {
    // Reset any stuck jobs from previous runs
    const { resetStuckJobs } = await import('./jobs/processor');
    await resetStuckJobs();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}
