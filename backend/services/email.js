const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid if API key is available
let usingSendGrid = false;
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  usingSendGrid = true;
  console.log('Using SendGrid HTTP API for email delivery');
} else {
  console.log('Using SMTP for email delivery');
}

// Create SMTP transporter as fallback (for local development with Gmail, etc.)
let transporter = null;
if (!usingSendGrid) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error);
      console.log('Email will still attempt to send on demand');
    } else {
      console.log('Email server is ready to send messages');
    }
  });
}

/**
 * Send email using SendGrid HTTP API or SMTP fallback
 */
async function sendEmail(mailOptions) {
  if (usingSendGrid) {
    // Use SendGrid HTTP API
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from || process.env.EMAIL_FROM,
      subject: mailOptions.subject,
      html: mailOptions.html,
      attachments: mailOptions.attachments?.map(att => ({
        content: att.path.split(',')[1], // Extract base64 from data URL
        filename: att.filename,
        type: 'image/png',
        disposition: 'inline',
        content_id: att.cid
      }))
    };

    return await sgMail.send(msg);
  } else {
    // Use SMTP (fallback for local development)
    return await transporter.sendMail(mailOptions);
  }
}

/**
 * Send confirmation email with QR code
 */
async function sendConfirmationEmail(attendee, qrCodeDataURL) {
  const { firstName, lastName, email, confirmationToken, cancellationToken, id } = attendee;

  const confirmUrl = `${process.env.APP_URL}/api/confirm/${confirmationToken}`;
  const cancelUrl = `${process.env.APP_URL}/api/cancel/${cancellationToken}`;
  const walletUrl = `${process.env.APP_URL}/api/wallet/${id}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Confirmación de registro - ${process.env.EVENT_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .qr-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .qr-code {
            max-width: 250px;
            height: auto;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 10px 5px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .button.secondary {
            background: #48bb78;
          }
          .button.cancel {
            background: #f56565;
          }
          .info-box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Registro Confirmado! 🎉</h1>
        </div>

        <div class="content">
          <p>Hola <strong>${firstName} ${lastName}</strong>,</p>

          <p>¡Tu registro para el evento <strong>${process.env.EVENT_NAME}</strong> ha sido confirmado exitosamente!</p>

          <div class="info-box">
            <h3>📅 Detalles del Evento</h3>
            <p><strong>Fecha:</strong> ${new Date(process.env.EVENT_DATE).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Ubicación:</strong> ${process.env.EVENT_LOCATION}</p>
            <p><strong>Descripción:</strong> ${process.env.EVENT_DESCRIPTION}</p>
          </div>

          <div class="qr-container">
            <h3>Tu Código QR de Entrada</h3>
            <p>Presenta este código QR el día del evento:</p>
            <img src="cid:qrcode" alt="QR Code" class="qr-code" />
            <p style="margin-top: 20px;">
              <a href="${walletUrl}" class="button secondary">📱 Guardar en Wallet</a>
            </p>
            <p style="font-size: 12px; color: #666;">
              Guarda este código QR en tu teléfono o imprímelo
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>¿Necesitas hacer cambios?</strong></p>
            <a href="${cancelUrl}" class="button cancel">Cancelar Asistencia</a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>📧 Recordatorio:</strong> Recibirás un correo de recordatorio 1 día antes del evento.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Este correo fue enviado a ${email}</p>
          <p>Si no te registraste para este evento, puedes ignorar este mensaje.</p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'qr-code.png',
        path: qrCodeDataURL,
        cid: 'qrcode'
      }
    ]
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log('Confirmation email sent:', info);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

/**
 * Send reminder email
 */
async function sendReminderEmail(attendee, qrCodeDataURL) {
  const { firstName, lastName, email, confirmationToken, cancellationToken, id } = attendee;

  const confirmUrl = `${process.env.APP_URL}/api/confirm/${confirmationToken}`;
  const cancelUrl = `${process.env.APP_URL}/api/cancel/${cancellationToken}`;
  const walletUrl = `${process.env.APP_URL}/api/wallet/${id}`;

  const eventDate = new Date(process.env.EVENT_DATE);
  const tomorrow = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Recordatorio: ${process.env.EVENT_NAME} es mañana! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .qr-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .qr-code {
            max-width: 250px;
            height: auto;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 10px 5px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .button.secondary {
            background: #48bb78;
          }
          .button.cancel {
            background: #f56565;
          }
          .highlight-box {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
          }
          .info-box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #f5576c;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ ¡El evento es mañana!</h1>
        </div>

        <div class="content">
          <p>Hola <strong>${firstName} ${lastName}</strong>,</p>

          <div class="highlight-box">
            <h2 style="margin-top: 0;">¡Te esperamos mañana! 🎊</h2>
            <p style="font-size: 18px; margin-bottom: 0;">
              <strong>${tomorrow}</strong>
            </p>
          </div>

          <p>Este es un recordatorio amistoso de que tu asistencia está confirmada para <strong>${process.env.EVENT_NAME}</strong>.</p>

          <div class="info-box">
            <h3>📍 Detalles Importantes</h3>
            <p><strong>Ubicación:</strong> ${process.env.EVENT_LOCATION}</p>
            <p><strong>Hora:</strong> ${new Date(process.env.EVENT_DATE).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            <p style="margin-bottom: 0;"><strong>Recuerda:</strong> Lleva tu código QR impreso o en tu teléfono</p>
          </div>

          <div class="qr-container">
            <h3>Tu Código QR de Entrada</h3>
            <img src="cid:qrcode" alt="QR Code" class="qr-code" />
            <p style="margin-top: 20px;">
              <a href="${walletUrl}" class="button secondary">📱 Guardar en Wallet</a>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>¿Confirmas tu asistencia?</strong></p>
            <a href="${confirmUrl}" class="button">✅ Confirmar Asistencia</a>
            <a href="${cancelUrl}" class="button cancel">❌ No Podré Asistir</a>
          </div>

          <div style="background: #e6fffa; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #48bb78;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💡 Consejo:</strong> Guarda el código QR en tu Wallet para un acceso rápido el día del evento.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>¡Nos vemos pronto! 🎉</p>
          <p>Este correo fue enviado a ${email}</p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'qr-code.png',
        path: qrCodeDataURL,
        cid: 'qrcode'
      }
    ]
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log('Reminder email sent:', info);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
}

/**
 * Send cancellation confirmation email
 */
async function sendCancellationEmail(attendee) {
  const { firstName, lastName, email } = attendee;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Cancelación confirmada - ${process.env.EVENT_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #f56565;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cancelación Confirmada</h1>
        </div>

        <div class="content">
          <p>Hola <strong>${firstName} ${lastName}</strong>,</p>

          <p>Tu registro para el evento <strong>${process.env.EVENT_NAME}</strong> ha sido cancelado exitosamente.</p>

          <p>Lamentamos que no puedas asistir. Esperamos verte en futuros eventos.</p>

          <p>Si cancelaste por error o cambias de opinión, por favor contacta al organizador del evento.</p>
        </div>

        <div class="footer">
          <p>Este correo fue enviado a ${email}</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log('Cancellation email sent:', info);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail
};
