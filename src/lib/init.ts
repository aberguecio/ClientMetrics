import { startAutoProcessor } from './jobs/auto-processor';

let initialized = false;

/**
 * Initialize the application
 * Starts background services like the auto-processor
 */
export function initializeApp() {
  // Prevent multiple initializations
  if (initialized) {
    return;
  }

  console.log('Initializing application...');

  // Start auto-processor with 10 second interval
  // This will continuously process pending jobs in the background
  startAutoProcessor(10000);

  initialized = true;
  console.log('Application initialized successfully');
}

/**
 * Check if app is initialized
 */
export function isInitialized(): boolean {
  return initialized;
}
