const QRCode = require('qrcode');

/**
 * Generate QR code for attendee
 * The QR code contains attendee information in JSON format
 */
async function generateQRCode(attendeeData) {
  try {
    const qrData = {
      id: attendeeData.id,
      name: `${attendeeData.firstName} ${attendeeData.lastName}`,
      email: attendeeData.email,
      token: attendeeData.confirmationToken,
      registrationDate: attendeeData.registrationDate || new Date().toISOString()
    };

    // Generate QR code as Data URL (can be embedded in HTML/emails)
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code as buffer (for saving to file)
 */
async function generateQRCodeBuffer(attendeeData) {
  try {
    const qrData = {
      id: attendeeData.id,
      name: `${attendeeData.firstName} ${attendeeData.lastName}`,
      email: attendeeData.email,
      token: attendeeData.confirmationToken,
      registrationDate: attendeeData.registrationDate || new Date().toISOString()
    };

    const buffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw error;
  }
}

/**
 * Verify QR code data
 */
function verifyQRData(qrData) {
  try {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

    if (!data.id || !data.token || !data.email) {
      return { valid: false, error: 'Invalid QR code data' };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  verifyQRData
};
