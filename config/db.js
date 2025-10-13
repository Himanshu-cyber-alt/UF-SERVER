import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config(); 

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'smart-healthcare-assistance',
  password: process.env.PASS,
  port: 5432,
});

pool.on('connect', () => console.log('✅ Connected to PostgreSQL'));

export default pool;



