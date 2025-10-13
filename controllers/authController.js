import admin from "firebase-admin";
import {pool} from "../db.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";  

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);


serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}




const JWT_SECRET = process.env.JWT_SECRET;

// Google register/login

// export const googleRegisterController = async (req, res) => {
//   try {
//     const { token } = req.body;
//     const decoded = await admin.auth().verifyIdToken(token);
//     const { email, name, picture } = decoded;


//     let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

//     if (user.rows.length === 0) {
//       const newUser = await pool.query(
//         "INSERT INTO users (name, email, avatar, provider) VALUES ($1, $2, $3, 'google') RETURNING *",
//         [name, email, picture]
//       );
//       user = newUser.rows[0];
//     } else {
//       user = user.rows[0];
//     }

//     const appToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
//     res.json({ user, token: appToken });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ error: "Firebase token verification failed" });
//   }
// };

  


export const googleRegisterController = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await admin.auth().verifyIdToken(token);
    const { email, name } = decoded;

    let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      // Generate DiceBear avatar based on name
      const avatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`;

      const newUser = await pool.query(
        "INSERT INTO users (name, email, avatar, provider) VALUES ($1, $2, $3, 'google') RETURNING *",
        [name, email, avatar]
      );
      user = newUser.rows[0];
    } else {
      user = user.rows[0];
    }

    const appToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ user, token: appToken });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Firebase token verification failed" });
  }
};







export const emailRegisterController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) 
      return res.status(400).json({ error: "User already exists" });

    // Generate UI Avatars URL from name


const avatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(name)}`;

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, provider, avatar) VALUES ($1, $2, $3, 'email', $4) RETURNING *",
      [name, email, hashedPassword, avatar]
    );

    const user = newUser.rows[0];
    const appToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ user, token: appToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};


export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length === 0)
      return res.status(400).json({ error: "Invalid email or password" });

    const user = userCheck.rows[0];

    console.log(user)

  
    if (user.provider === "google")
      return res.status(400).json({ error: "Use Google Sign-in for this account" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch)
      return res.status(400).json({ error: "Invalid email or password" });

    // Generate JWT
    const appToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ user, token: appToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
