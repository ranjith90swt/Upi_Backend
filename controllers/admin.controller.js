import db from "../config/db.js";
//admin aprove logic

export const approveMerchant = async (req, res) => {
    try {
        const { merchantId } = req.params;

        await db.query(
            `UPDATE merchant_profile 
             SET status = 'approved', approved_at = NOW() 
             WHERE id = ?`,
            [merchantId]
        );

        res.json({
            success: true,
            message: "Merchant approved successfully"
        });

    } catch (err) {
        console.error("APPROVE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const rejectMerchant = async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { remark } = req.body;

        await db.query(
            `UPDATE merchant_profile 
             SET status = 'rejected', admin_remark = ? 
             WHERE id = ?`,
            [remark, merchantId]
        );

        res.json({
            success: true,
            message: "Merchant rejected"
        });

    } catch (err) {
        console.error("REJECT ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

//get all merchants
export const getAllMerchants = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.id AS user_id,
                u.name,
                u.email,
                u.roles,
                mp.id AS merchant_id,
                mp.status,
                mp.approved_at
            FROM users u
            LEFT JOIN merchant_profile mp 
                ON u.id = mp.user_id
            WHERE u.roles = 'merchant'
            ORDER BY u.id DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (err) {
        console.error("GET MERCHANTS ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};