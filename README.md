# Best Psychiatric Hospital Website

Responsive HTML/CSS website with a JavaScript backend, MySQL appointment storage, and a separate admin dashboard for doctor schedules.

## Files

- `public/index.html` - website layout
- `public/styles.css` - responsive styling
- `public/script.js` - mobile menu and enquiry form submit
- `admin/admin.html` - separate admin dashboard page
- `admin/admin.js` - admin dashboard data loading and doctor schedule updates
- `admin-server.js` - separate localhost server for admin
- `server.js` - Node.js/Express backend
- `db.sql` - MySQL database and table setup
- `update_existing_db.sql` - use this only if you already created the older enquiries table
- `.env.example` - environment variable template

## MySQL Connection Steps

1. Install Node.js and MySQL Server.
2. Open MySQL and run the SQL in `db.sql`.
   If you already created the previous table, run `update_existing_db.sql` once instead.
3. Install project dependencies:

```bash
npm install
```

4. Create a `.env` file by copying `.env.example`, then add your MySQL password:

```env
PORT=3000
ADMIN_PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=psychiatric_hospital
```

5. Start the website and API server:

```bash
npm start
```

6. In a second terminal, start the separate admin server:

```bash
npm run admin
```

Or from inside the `admin` folder:

```bash
npm start
```

7. Open the website:

```text
http://localhost:3000
```

8. Open the separate admin dashboard:

```text
http://localhost:4000
```

The admin dashboard runs on a different localhost port, but it still reads and writes data through `http://localhost:3000/api`, so both pages use the same MySQL database.

## Check Stored Appointments

Run this in MySQL:

```sql
USE psychiatric_hospital;
SELECT id, full_name, appointment_date, appointment_time, problem_type, appointment_status
FROM enquiries
ORDER BY created_at DESC;
```

Check doctors and schedule status:

```sql
USE psychiatric_hospital;
SELECT * FROM doctors ORDER BY doctor_name;
```

## APIs Used

The frontend sends form data to:

```text
POST /api/enquiries
```

Example JSON:

```json
{
  "fullName": "Jane Doe",
  "phone": "9876543210",
  "email": "jane@example.com",
  "appointmentDate": "2026-05-10",
  "appointmentTime": "10:30",
  "problemType": "Anxiety",
  "message": "Need support for panic symptoms."
}
```

The admin dashboard uses:

```text
GET /api/enquiries
PATCH /api/enquiries/:id/status
GET /api/doctors
POST /api/doctors
PATCH /api/doctors/:id/schedule
```
