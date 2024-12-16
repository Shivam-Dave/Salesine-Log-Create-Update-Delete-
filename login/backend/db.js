// backend/db.js
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres", // your postgres username
  host: "localhost", // your host, localhost for local machine
  database: "auth_system", // database name we created
  password: "admin", // your postgres user password
  port: 5432, // default postgres port
});

module.exports = pool;
