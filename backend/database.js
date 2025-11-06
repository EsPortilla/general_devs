const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.serialize(() => {
    // Attendees table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        confirmation_token TEXT UNIQUE,
        cancellation_token TEXT UNIQUE,
        qr_code TEXT,
        reminder_sent INTEGER DEFAULT 0,
        confirmed_at DATETIME,
        cancelled_at DATETIME
      )
    `, (err) => {
      if (err) {
        console.error('Error creating attendees table:', err.message);
      } else {
        console.log('Attendees table ready');
      }
    });

    // Events table (for future multi-event support)
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date DATETIME NOT NULL,
        location TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating events table:', err.message);
      } else {
        console.log('Events table ready');
      }
    });
  });
}

// Database operations
const dbOperations = {
  // Create new attendee
  createAttendee: (attendee) => {
    return new Promise((resolve, reject) => {
      const { firstName, lastName, email, confirmationToken, cancellationToken } = attendee;

      const sql = `
        INSERT INTO attendees (first_name, last_name, email, confirmation_token, cancellation_token, status)
        VALUES (?, ?, ?, ?, ?, 'registered')
      `;

      db.run(sql, [firstName, lastName, email, confirmationToken, cancellationToken], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...attendee });
        }
      });
    });
  },

  // Get attendee by ID
  getAttendeeById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM attendees WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get attendee by email
  getAttendeeByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM attendees WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get attendee by token
  getAttendeeByToken: (token, tokenType = 'confirmation') => {
    return new Promise((resolve, reject) => {
      const column = tokenType === 'confirmation' ? 'confirmation_token' : 'cancellation_token';
      db.get(`SELECT * FROM attendees WHERE ${column} = ?`, [token], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get all attendees
  getAllAttendees: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM attendees ORDER BY registration_date DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Update attendee status
  updateAttendeeStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString();
      const timestampColumn = status === 'confirmed' ? 'confirmed_at' : 'cancelled_at';

      const sql = `UPDATE attendees SET status = ?, ${timestampColumn} = ? WHERE id = ?`;

      db.run(sql, [status, timestamp, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Update QR code
  updateQRCode: (id, qrCode) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE attendees SET qr_code = ? WHERE id = ?', [qrCode, id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Mark reminder as sent
  markReminderSent: (id) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE attendees SET reminder_sent = 1 WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get attendees who need reminders (1 day before event)
  getAttendeesForReminder: () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM attendees
        WHERE status = 'registered'
        AND reminder_sent = 0
      `;

      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get statistics
  getStatistics: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM attendees
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
  }
};

// Close database connection
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = { db, dbOperations };
