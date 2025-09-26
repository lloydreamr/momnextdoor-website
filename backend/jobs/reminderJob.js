// Mock reminder job for testing
const runReminderJob = async () => {
  console.log('Running reminder job...');
  // Mock implementation
  return { sent: 0, errors: [] };
};

module.exports = { runReminderJob };