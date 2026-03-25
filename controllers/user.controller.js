import db from "../config/db.js";

export const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, name, email, roles, created_at FROM users"
        );

        res.json({
            success: true,
            total: users.length,
            data: users
        });

    } catch (err) {
        console.error("GET USERS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};
