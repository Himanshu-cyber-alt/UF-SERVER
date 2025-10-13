import pool from "../config/db.js";

export const createDoctor = async (email, password, specialization) => {
  const result = await pool.query(
    `INSERT INTO doctors (email, password, specialization)
     VALUES ($1, $2, $3) 
     RETURNING doctor_id, email, specialization, is_online, created_at, updated_at`,
    [email, password, specialization]
  );
  return result.rows[0];
};

export const findDoctorByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM doctors WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

// models/Doctor.js
export const setDoctorOnline = async (doctor_id, isOnline = true) => {
  const result = await pool.query(
    `UPDATE doctors SET is_online = $1, updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $2 RETURNING *`,
    [isOnline, doctor_id]
  );
  return result.rows[0];
};


