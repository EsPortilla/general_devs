/**
 * Reminder Job
 *
 * This script sends reminder emails to registered attendees
 * one day before the event.
 *
 * Usage:
 * - Can be run manually: node jobs/reminder.js
 * - Can be scheduled with cron (recommended)
 * - Can be triggered from the main server with node-cron
 */

require('dotenv').config();
const { dbOperations } = require('../database');
const { generateQRCode } = require('../services/qr');
const { sendReminderEmail } = require('../services/email');

/**
 * Check if event is tomorrow
 */
function isEventTomorrow() {
  const eventDate = new Date(process.env.EVENT_DATE);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Compare dates (ignoring time)
  return (
    eventDate.getDate() === tomorrow.getDate() &&
    eventDate.getMonth() === tomorrow.getMonth() &&
    eventDate.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Send reminders to all registered attendees
 */
async function sendReminders() {
  console.log('Starting reminder job...');
  console.log('Event date:', process.env.EVENT_DATE);
  console.log('Current date:', new Date().toISOString());

  // Check if event is tomorrow
  if (!isEventTomorrow()) {
    console.log('Event is not tomorrow. Skipping reminder emails.');
    return {
      success: true,
      message: 'Event is not tomorrow',
      sent: 0
    };
  }

  console.log('Event is tomorrow! Sending reminders...');

  try {
    // Get attendees who need reminders
    const attendees = await dbOperations.getAttendeesForReminder();

    console.log(`Found ${attendees.length} attendees who need reminders`);

    if (attendees.length === 0) {
      return {
        success: true,
        message: 'No attendees need reminders',
        sent: 0
      };
    }

    let successCount = 0;
    let errorCount = 0;

    // Send reminder to each attendee
    for (const attendee of attendees) {
      try {
        console.log(`Sending reminder to ${attendee.email}...`);

        // Generate or retrieve QR code
        let qrCode = attendee.qr_code;
        if (!qrCode) {
          qrCode = await generateQRCode({
            id: attendee.id,
            firstName: attendee.first_name,
            lastName: attendee.last_name,
            email: attendee.email,
            confirmationToken: attendee.confirmation_token,
            registrationDate: attendee.registration_date
          });
          await dbOperations.updateQRCode(attendee.id, qrCode);
        }

        // Send reminder email
        await sendReminderEmail(
          {
            id: attendee.id,
            firstName: attendee.first_name,
            lastName: attendee.last_name,
            email: attendee.email,
            confirmationToken: attendee.confirmation_token,
            cancellationToken: attendee.cancellation_token
          },
          qrCode
        );

        // Mark reminder as sent
        await dbOperations.markReminderSent(attendee.id);

        console.log(`✓ Reminder sent to ${attendee.email}`);
        successCount++;

        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`✗ Error sending reminder to ${attendee.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Reminder Job Complete ===');
    console.log(`Successfully sent: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${attendees.length}`);

    return {
      success: true,
      sent: successCount,
      errors: errorCount,
      total: attendees.length
    };

  } catch (error) {
    console.error('Error in reminder job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manual execution
 * Run this file directly: node jobs/reminder.js
 */
if (require.main === module) {
  console.log('=== Event Reminder Job ===\n');

  sendReminders()
    .then((result) => {
      console.log('\nResult:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nFatal error:', error);
      process.exit(1);
    });
}

module.exports = { sendReminders, isEventTomorrow };
