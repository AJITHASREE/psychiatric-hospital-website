const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const ADMIN_PORT = process.env.ADMIN_PORT || 4000;

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

app.get("/admin.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

app.get("/admin.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.js"));
});

app.get("/styles.css", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "styles.css"));
});

app.listen(ADMIN_PORT, () => {
  console.log(`Admin dashboard running at http://localhost:${ADMIN_PORT}`);
});
