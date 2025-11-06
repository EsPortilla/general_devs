require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Import database (initializes on load)
require('./database');

// Import API routes
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api', apiRoutes);

// Root route - serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    event: {
      name: process.env.EVENT_NAME,
      date: process.env.EVENT_DATE
    }
  });
});

// Schedule reminder job to run daily at 9:00 AM
// Check if event is tomorrow and send reminders
if (process.env.NODE_ENV !== 'test') {
  console.log('Scheduling reminder job...');
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled reminder job at', new Date().toISOString());
    const { sendReminders } = require('./jobs/reminder');
    sendReminders()
      .then(result => {
        console.log('Reminder job completed:', result);
      })
      .catch(error => {
        console.error('Reminder job failed:', error);
      });
  }, {
    timezone: "America/Mexico_City" // Change to your timezone
  });
  console.log('Reminder job scheduled for 9:00 AM daily');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Event Registration System Started!       ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📅 Event: ${process.env.EVENT_NAME}`);
  console.log(`🗓️  Date: ${process.env.EVENT_DATE}`);
  console.log(`📍 Location: ${process.env.EVENT_LOCATION}`);
  console.log('\n📋 Available routes:');
  console.log(`   - http://localhost:${PORT} (Registration form)`);
  console.log(`   - http://localhost:${PORT}/admin (Admin dashboard)`);
  console.log(`   - http://localhost:${PORT}/api/statistics (Public stats)`);
  console.log(`   - http://localhost:${PORT}/health (Health check)`);
  console.log('\n✨ Ready to accept registrations!\n');
});

module.exports = app;
