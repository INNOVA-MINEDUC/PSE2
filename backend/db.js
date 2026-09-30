import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  // DECIMAL como número, no como string
  decimalNumbers: true,
  // DATE como "AAAA-MM-DD" para no desplazar el día por zona horaria
  dateStrings: true,
});
