
import bcrypt from "bcryptjs";
import { createDoctor, findDoctorByEmail, setDoctorOnline } from "../models/doctor.js";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";  // 👈 add this


const JWT_SECRET = "whatareyouhuman"; 

export const registerDoctor = async (req, res) => {
  try {
    const { email, password, specialization } = req.body;

    if (!email || !password || !specialization) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await findDoctorByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDoctor = await createDoctor(email, hashedPassword, specialization);

    res.status(201).json({
      message: "Doctor registered successfully",
      doctor: newDoctor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const doctor = await findDoctorByEmail(email);
    if (!doctor)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // mark as online
    await setDoctorOnline(doctor.doctor_id, true);

    const token = jwt.sign(
      {
        doctor_id: doctor.doctor_id,
        email: doctor.email,
        specialization: doctor.specialization,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      doctor: {
        doctor_id: doctor.doctor_id,
        email: doctor.email,
        specialization: doctor.specialization,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutDoctor = async (req, res) => {
  try {
    const { doctor_id } = req.body;
    if (!doctor_id) return res.status(400).json({ message: "Doctor ID required" });

    await setDoctorOnline(doctor_id, false);

    res.status(200).json({ message: "Doctor logged out and set offline" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT doctor_id, email, specialization, is_online FROM doctors"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server error" });
  }
};
