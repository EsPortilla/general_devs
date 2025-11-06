const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbOperations } = require('../database');
const { generateQRCode } = require('../services/qr');
const { sendConfirmationEmail, sendCancellationEmail } = require('../services/email');
const { generateWalletPass } = require('../services/wallet');

/**
 * POST /api/register
 * Register a new attendee
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if email already registered
    const existingAttendee = await dbOperations.getAttendeeByEmail(email);
    if (existingAttendee) {
      return res.status(409).json({
        success: false,
        error: 'This email is already registered for the event'
      });
    }

    // Generate unique tokens
    const confirmationToken = uuidv4();
    const cancellationToken = uuidv4();

    // Create attendee
    const attendee = await dbOperations.createAttendee({
      firstName,
      lastName,
      email,
      confirmationToken,
      cancellationToken
    });

    // Generate QR code
    const qrCode = await generateQRCode({
      id: attendee.id,
      firstName,
      lastName,
      email,
      confirmationToken,
      registrationDate: new Date().toISOString()
    });

    // Update attendee with QR code
    await dbOperations.updateQRCode(attendee.id, qrCode);

    // Send confirmation email
    await sendConfirmationEmail(
      {
        id: attendee.id,
        firstName,
        lastName,
        email,
        confirmationToken,
        cancellationToken
      },
      qrCode
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for confirmation.',
      attendee: {
        id: attendee.id,
        firstName,
        lastName,
        email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register. Please try again later.'
    });
  }
});

/**
 * GET /api/confirm/:token
 * Confirm attendance
 */
router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const attendee = await dbOperations.getAttendeeByToken(token, 'confirmation');

    if (!attendee) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Token Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #f56565; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Token no válido</h1>
            <p>El enlace de confirmación no es válido o ha expirado.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (attendee.status === 'confirmed') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Confirmed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #48bb78; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Ya confirmado</h1>
            <p>Tu asistencia ya había sido confirmada previamente.</p>
            <p><strong>${attendee.first_name} ${attendee.last_name}</strong></p>
            <p>¡Nos vemos en el evento!</p>
          </div>
        </body>
        </html>
      `);
    }

    // Update status to confirmed
    await dbOperations.updateAttendeeStatus(attendee.id, 'confirmed');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Confirmation Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #48bb78; }
          .info { background: #f0fff4; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #48bb78; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ ¡Asistencia Confirmada!</h1>
          <p>Gracias por confirmar tu asistencia, <strong>${attendee.first_name} ${attendee.last_name}</strong>.</p>
          <div class="info">
            <h3>${process.env.EVENT_NAME}</h3>
            <p>${new Date(process.env.EVENT_DATE).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>${process.env.EVENT_LOCATION}</p>
          </div>
          <p>¡Te esperamos!</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).send('Error processing confirmation');
  }
});

/**
 * GET /api/cancel/:token
 * Cancel attendance
 */
router.get('/cancel/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const attendee = await dbOperations.getAttendeeByToken(token, 'cancellation');

    if (!attendee) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Token Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #f56565; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Token no válido</h1>
            <p>El enlace de cancelación no es válido o ha expirado.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (attendee.status === 'cancelled') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Cancelled</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Ya cancelado</h1>
            <p>Tu registro ya había sido cancelado previamente.</p>
            <p><strong>${attendee.first_name} ${attendee.last_name}</strong></p>
          </div>
        </body>
        </html>
      `);
    }

    // Update status to cancelled
    await dbOperations.updateAttendeeStatus(attendee.id, 'cancelled');

    // Send cancellation confirmation email
    await sendCancellationEmail({
      firstName: attendee.first_name,
      lastName: attendee.last_name,
      email: attendee.email
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cancellation Confirmed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Cancelación Confirmada</h1>
          <p>Tu registro para <strong>${process.env.EVENT_NAME}</strong> ha sido cancelado.</p>
          <p>Lamentamos que no puedas asistir, <strong>${attendee.first_name} ${attendee.last_name}</strong>.</p>
          <p>Esperamos verte en futuros eventos.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).send('Error processing cancellation');
  }
});

/**
 * GET /api/wallet/:id
 * Get wallet pass for attendee
 */
router.get('/wallet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const platform = req.query.platform || 'mobile'; // mobile, apple, google

    const attendee = await dbOperations.getAttendeeById(id);

    if (!attendee) {
      return res.status(404).json({
        success: false,
        error: 'Attendee not found'
      });
    }

    // Get or generate QR code
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

    // Generate wallet pass
    const walletPass = await generateWalletPass(
      {
        id: attendee.id,
        firstName: attendee.first_name,
        lastName: attendee.last_name,
        email: attendee.email,
        confirmationToken: attendee.confirmation_token,
        cancellationToken: attendee.cancellation_token
      },
      qrCode,
      platform
    );

    // Send HTML ticket (fallback)
    if (walletPass.type === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(walletPass.content);
    } else {
      // Send actual pass file (future implementation)
      res.status(501).json({
        success: false,
        error: 'Native wallet passes not yet implemented. Please use the mobile ticket.'
      });
    }

  } catch (error) {
    console.error('Wallet pass error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate wallet pass'
    });
  }
});

/**
 * GET /api/attendees
 * Get all attendees (admin only)
 */
router.get('/attendees', async (req, res) => {
  try {
    // Simple authentication check
    const adminPassword = req.query.password || req.headers['x-admin-password'];

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const attendees = await dbOperations.getAllAttendees();
    const statistics = await dbOperations.getStatistics();

    res.json({
      success: true,
      statistics,
      attendees: attendees.map(a => ({
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        status: a.status,
        registrationDate: a.registration_date,
        confirmedAt: a.confirmed_at,
        cancelledAt: a.cancelled_at,
        reminderSent: a.reminder_sent === 1
      }))
    });

  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendees'
    });
  }
});

/**
 * GET /api/statistics
 * Get event statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await dbOperations.getStatistics();

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * POST /api/send-reminders
 * Manually trigger reminder emails (admin only)
 */
router.post('/send-reminders', async (req, res) => {
  try {
    // Simple authentication check
    const adminPassword = req.body.password || req.headers['x-admin-password'];

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { sendReminders } = require('../jobs/reminder');
    const result = await sendReminders();

    res.json(result);

  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminders'
    });
  }
});

module.exports = router;
