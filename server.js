const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "psychiatric_hospital",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(160) NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      problem_type VARCHAR(80) NOT NULL,
      message TEXT NOT NULL,
      appointment_status ENUM('Pending', 'Accepted', 'Declined') NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing("enquiries", "appointment_date", "DATE NULL");
  await addColumnIfMissing("enquiries", "appointment_time", "TIME NULL");
  await addColumnIfMissing("enquiries", "problem_type", "VARCHAR(80) NULL");
  await addColumnIfMissing("enquiries", "message", "TEXT NULL");
  await addColumnIfMissing("enquiries", "appointment_status", "ENUM('Pending', 'Accepted', 'Declined') NOT NULL DEFAULT 'Pending'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor_name VARCHAR(120) NOT NULL,
      degree VARCHAR(120) NOT NULL,
      specialty VARCHAR(120) NOT NULL,
      accepting_schedule BOOLEAN NOT NULL DEFAULT TRUE,
      available_days VARCHAR(120) NOT NULL,
      available_time VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO doctors (doctor_name, degree, specialty, accepting_schedule, available_days, available_time)
    SELECT 'Dr. Ananya Rao', 'MD Psychiatry', 'Adult Psychiatry', TRUE, 'Monday to Friday', '10:00 AM - 4:00 PM'
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_name = 'Dr. Ananya Rao')
  `);

  await pool.query(`
    INSERT INTO doctors (doctor_name, degree, specialty, accepting_schedule, available_days, available_time)
    SELECT 'Dr. Vikram Mehta', 'DPM, MBBS', 'Counselling and Anxiety Care', TRUE, 'Tuesday, Thursday, Saturday', '11:00 AM - 6:00 PM'
    WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_name = 'Dr. Vikram Mehta')
  `);
}

async function addColumnIfMissing(tableName, columnName, columnDefinition) {
  const [columns] = await pool.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  if (!columns.length) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+\-\s()]{7,20}$/.test(phone);
}

app.post("/api/enquiries", async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const phone = String(req.body.phone || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const appointmentDate = String(req.body.appointmentDate || "").trim();
  const appointmentTime = String(req.body.appointmentTime || "").trim();
  const problemType = String(req.body.problemType || "").trim();
  const message = String(req.body.message || "").trim();

  if (!fullName || !phone || !email || !appointmentDate || !appointmentTime || !problemType || !message) {
    return res.status(400).json({ message: "Please fill in all appointment details." });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: "Please enter a valid phone number." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO enquiries
        (full_name, phone, email, appointment_date, appointment_time, problem_type, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, phone, email, appointmentDate, appointmentTime, problemType, message]
    );

    res.status(201).json({
      message: "Your appointment request has been submitted successfully.",
      enquiryId: result.insertId
    });
  } catch (error) {
    console.error("MySQL insert failed:", error);
    res.status(500).json({ message: "Unable to save your enquiry right now." });
  }
});

app.get("/api/enquiries", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, full_name AS fullName, phone, email,
        appointment_date AS appointmentDate,
        appointment_time AS appointmentTime,
        problem_type AS problemType,
        message,
        appointment_status AS appointmentStatus,
        created_at AS createdAt
       FROM enquiries
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("MySQL enquiry fetch failed:", error);
    res.status(500).json({ message: "Unable to load appointments right now." });
  }
});

app.patch("/api/enquiries/:id/status", async (req, res) => {
  const enquiryId = Number(req.params.id);
  const appointmentStatus = String(req.body.appointmentStatus || "").trim();
  const allowedStatuses = ["Pending", "Accepted", "Declined"];

  if (!Number.isInteger(enquiryId) || enquiryId < 1) {
    return res.status(400).json({ message: "Invalid appointment id." });
  }

  if (!allowedStatuses.includes(appointmentStatus)) {
    return res.status(400).json({ message: "Appointment status must be Accepted or Declined." });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE enquiries SET appointment_status = ? WHERE id = ?",
      [appointmentStatus, enquiryId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Appointment request not found." });
    }

    res.json({ message: `Appointment ${appointmentStatus.toLowerCase()} successfully.` });
  } catch (error) {
    console.error("MySQL appointment status update failed:", error);
    res.status(500).json({ message: "Unable to update appointment status right now." });
  }
});

app.get("/api/doctors", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, doctor_name AS doctorName, degree, specialty,
        accepting_schedule AS acceptingSchedule,
        available_days AS availableDays,
        available_time AS availableTime
       FROM doctors
       ORDER BY doctor_name`
    );

    res.json(rows);
  } catch (error) {
    console.error("MySQL doctor fetch failed:", error);
    res.status(500).json({ message: "Unable to load doctors right now." });
  }
});

app.post("/api/doctors", async (req, res) => {
  const doctorName = String(req.body.doctorName || "").trim();
  const degree = String(req.body.degree || "").trim();
  const specialty = String(req.body.specialty || "").trim();
  const acceptingSchedule = Boolean(req.body.acceptingSchedule);
  const availableDays = String(req.body.availableDays || "").trim();
  const availableTime = String(req.body.availableTime || "").trim();

  if (!doctorName || !degree || !specialty || !availableDays || !availableTime) {
    return res.status(400).json({ message: "Please fill in all doctor details." });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO doctors
        (doctor_name, degree, specialty, accepting_schedule, available_days, available_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [doctorName, degree, specialty, acceptingSchedule, availableDays, availableTime]
    );

    res.status(201).json({
      message: "Doctor schedule added successfully.",
      doctorId: result.insertId
    });
  } catch (error) {
    console.error("MySQL doctor insert failed:", error);
    res.status(500).json({ message: "Unable to save doctor details right now." });
  }
});

app.patch("/api/doctors/:id/schedule", async (req, res) => {
  const doctorId = Number(req.params.id);
  const acceptingSchedule = Boolean(req.body.acceptingSchedule);

  if (!Number.isInteger(doctorId) || doctorId < 1) {
    return res.status(400).json({ message: "Invalid doctor id." });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE doctors SET accepting_schedule = ? WHERE id = ?",
      [acceptingSchedule, doctorId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    res.json({ message: "Doctor schedule status updated." });
  } catch (error) {
    console.error("MySQL doctor update failed:", error);
    res.status(500).json({ message: "Unable to update doctor status right now." });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "not connected" });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
