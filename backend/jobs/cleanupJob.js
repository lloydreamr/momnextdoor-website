// Mock cleanup job for testing
const runCleanupJob = async () => {
  console.log('Running cleanup job...');
  // Mock implementation
  return { cleaned: 0 };
};

module.exports = { runCleanupJob };