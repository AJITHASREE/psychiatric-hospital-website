CREATE DATABASE IF NOT EXISTS psychiatric_hospital;

USE psychiatric_hospital;

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
);

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_name VARCHAR(120) NOT NULL,
  degree VARCHAR(120) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  accepting_schedule BOOLEAN NOT NULL DEFAULT TRUE,
  available_days VARCHAR(120) NOT NULL,
  available_time VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO doctors (doctor_name, degree, specialty, accepting_schedule, available_days, available_time)
SELECT 'Dr. Ananya Rao', 'MD Psychiatry', 'Adult Psychiatry', TRUE, 'Monday to Friday', '10:00 AM - 4:00 PM'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_name = 'Dr. Ananya Rao');

INSERT INTO doctors (doctor_name, degree, specialty, accepting_schedule, available_days, available_time)
SELECT 'Dr. Vikram Mehta', 'DPM, MBBS', 'Counselling and Anxiety Care', TRUE, 'Tuesday, Thursday, Saturday', '11:00 AM - 6:00 PM'
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_name = 'Dr. Vikram Mehta');
