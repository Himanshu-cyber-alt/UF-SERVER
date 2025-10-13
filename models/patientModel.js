import pool from '../config/db.js';

export const createPatient = async (mobile_number) => {
  const result = await pool.query(
    `INSERT INTO patients (mobile_number)
     VALUES ($1)
     ON CONFLICT (mobile_number) DO NOTHING
     RETURNING *`,
    [mobile_number]
  );
  return result.rows[0];
};

export const getPatientByMobile = async (mobile_number) => {
  const result = await pool.query(
    `SELECT * FROM patients WHERE mobile_number = $1`,
    [mobile_number]
  );
  return result.rows[0];
};
