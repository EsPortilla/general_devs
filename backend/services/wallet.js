/**
 * Wallet Pass Service
 *
 * This service generates passes for Apple Wallet and Google Wallet.
 *
 * IMPORTANT NOTES:
 *
 * For production use, you need:
 *
 * APPLE WALLET:
 * 1. Apple Developer Account ($99/year)
 * 2. Pass Type ID certificate
 * 3. Team ID
 * 4. Configure .env variables:
 *    - APPLE_PASS_TYPE_ID
 *    - APPLE_TEAM_ID
 *    - APPLE_CERTIFICATE_PATH
 *    - APPLE_CERTIFICATE_PASSWORD
 *
 * GOOGLE WALLET:
 * 1. Google Cloud Project with Wallet API enabled
 * 2. Service Account with credentials
 * 3. Configure .env variables:
 *    - GOOGLE_ISSUER_ID
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PATH
 *
 * For now, this service provides a fallback that generates a downloadable
 * HTML file with QR code that users can bookmark on their phone's home screen.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if Apple Wallet is configured
 */
function isAppleWalletConfigured() {
  return !!(
    process.env.APPLE_PASS_TYPE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_CERTIFICATE_PATH
  );
}

/**
 * Check if Google Wallet is configured
 */
function isGoogleWalletConfigured() {
  return !!(
    process.env.GOOGLE_ISSUER_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PATH
  );
}

/**
 * Generate Apple Wallet Pass
 * This is a placeholder - requires proper Apple certificates
 */
async function generateApplePass(attendee, qrCodeDataURL) {
  if (!isAppleWalletConfigured()) {
    throw new Error('Apple Wallet not configured. Please add certificates and configuration.');
  }

  // TODO: Implement Apple Pass generation with passkit-generator
  // This requires:
  // 1. Pass Type ID certificate from Apple Developer
  // 2. WWDR certificate
  // 3. Proper signing with Apple certificates

  throw new Error('Apple Wallet pass generation requires proper certificates. See documentation.');
}

/**
 * Generate Google Wallet Pass
 * This is a placeholder - requires Google Cloud project setup
 */
async function generateGooglePass(attendee, qrCodeDataURL) {
  if (!isGoogleWalletConfigured()) {
    throw new Error('Google Wallet not configured. Please add service account credentials.');
  }

  // TODO: Implement Google Wallet pass generation
  // This requires:
  // 1. Google Cloud Project with Wallet API enabled
  // 2. Service Account credentials
  // 3. OAuth2 token generation

  throw new Error('Google Wallet pass generation requires Google Cloud setup. See documentation.');
}

/**
 * Generate a mobile-optimized HTML page that can be saved as bookmark
 * This is a fallback solution that works without certificates
 */
function generateMobileTicketHTML(attendee, qrCodeDataURL) {
  const { firstName, lastName, email, id } = attendee;
  const eventDate = new Date(process.env.EVENT_DATE);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Event Ticket">
  <link rel="apple-touch-icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
  <title>Entrada - ${process.env.EVENT_NAME}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .ticket {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 100%;
      overflow: hidden;
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .ticket-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }

    .ticket-header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }

    .ticket-header .date {
      font-size: 16px;
      opacity: 0.9;
    }

    .ticket-body {
      padding: 30px 20px;
    }

    .qr-container {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
      margin-bottom: 20px;
    }

    .qr-code {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
    }

    .attendee-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 15px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: bold;
      color: #666;
    }

    .info-value {
      color: #333;
      text-align: right;
    }

    .instructions {
      text-align: center;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
      padding: 0 10px;
    }

    .add-to-home {
      background: #48bb78;
      color: white;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
    }

    .brightness {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255,255,255,0.9);
      padding: 10px;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="brightness" onclick="toggleBrightness()" title="Aumentar brillo">💡</div>

  <div class="ticket">
    <div class="ticket-header">
      <h1>🎉 ${process.env.EVENT_NAME}</h1>
      <div class="date">
        ${eventDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div class="date">
        ${eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>

    <div class="ticket-body">
      <div class="qr-container">
        <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" id="qrCode" />
      </div>

      <div class="attendee-info">
        <div class="info-row">
          <span class="info-label">Nombre:</span>
          <span class="info-value">${firstName} ${lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ticket ID:</span>
          <span class="info-value">#${String(id).padStart(6, '0')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ubicación:</span>
          <span class="info-value">${process.env.EVENT_LOCATION}</span>
        </div>
      </div>

      <div class="instructions">
        <p><strong>📱 Presenta este QR en la entrada</strong></p>
        <p style="margin-top: 10px;">Guarda esta página en tus favoritos o pantalla de inicio para acceso rápido</p>
      </div>

      <div class="add-to-home">
        <strong>💾 Cómo guardar en tu teléfono:</strong><br>
        <span style="font-size: 12px; opacity: 0.9;">
          iOS: Safari → Compartir → "Agregar a pantalla de inicio"<br>
          Android: Chrome → Menú (⋮) → "Agregar a pantalla de inicio"
        </span>
      </div>
    </div>
  </div>

  <script>
    let brightMode = false;

    function toggleBrightness() {
      brightMode = !brightMode;
      if (brightMode) {
        document.body.style.background = 'white';
        document.querySelector('.ticket').style.boxShadow = 'none';
      } else {
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.querySelector('.ticket').style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
      }
    }

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Keep screen awake
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(err => {
        console.log('Wake Lock error:', err);
      });
    }
  </script>
</body>
</html>
  `;

  return html;
}

/**
 * Generate wallet pass based on platform and configuration
 */
async function generateWalletPass(attendee, qrCodeDataURL, platform = 'mobile') {
  try {
    // Check platform preference
    if (platform === 'apple' && isAppleWalletConfigured()) {
      return await generateApplePass(attendee, qrCodeDataURL);
    } else if (platform === 'google' && isGoogleWalletConfigured()) {
      return await generateGooglePass(attendee, qrCodeDataURL);
    }

    // Fallback to mobile HTML ticket
    return {
      type: 'html',
      content: generateMobileTicketHTML(attendee, qrCodeDataURL)
    };
  } catch (error) {
    console.error('Error generating wallet pass:', error);
    // Always fallback to HTML ticket on error
    return {
      type: 'html',
      content: generateMobileTicketHTML(attendee, qrCodeDataURL)
    };
  }
}

module.exports = {
  generateWalletPass,
  generateApplePass,
  generateGooglePass,
  generateMobileTicketHTML,
  isAppleWalletConfigured,
  isGoogleWalletConfigured
};
