// Mock analytics job for testing
const runAnalyticsJob = async () => {
  console.log('Running analytics job...');
  // Mock implementation
  return { processed: 0, metrics: {} };
};

module.exports = { runAnalyticsJob };