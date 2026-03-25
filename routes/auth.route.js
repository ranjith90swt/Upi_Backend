import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, roles } = req.body;

        if (!name || !email || !password || !roles) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Use transaction (VERY IMPORTANT)
        const connection = await db.getConnection();
        await connection.beginTransaction();

        // insert user
        const [userResult] = await connection.query(
            "INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, roles]
        );

        const userId = userResult.insertId;

        // If role is merchant → create merchant_profile
        if (roles === "merchant") {
            await connection.query(
                "INSERT INTO merchant_profile (user_id, status) VALUES (?, 'draft')",
                [userId]
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: "Signup successful"
        });

    } catch (err) {

        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email already exists" });
        }

        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});


/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const sql = "SELECT * FROM users WHERE email = ?";
        const [result] = await db.query(sql, [email]);

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // User role
        console.log("User Role:", user.role);

        // Merchant status
        let merchantStatus = null;

        if (user.roles && user.roles.toLowerCase() === "merchant") {

            const [merchant] = await db.query(
                "SELECT status FROM merchant_profile WHERE user_id = ?",
                [user.id]
            );

            console.log("MERCHANT:", merchant); // debug

            if (merchant.length > 0) {
                merchantStatus = merchant[0].status;
            } else {
                merchantStatus = "not_created";
            }
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roles
            },
            merchant_status: merchantStatus
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
});



export default router;
