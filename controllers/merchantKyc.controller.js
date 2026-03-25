import db from "../config/db.js";

export const savePersonalKycTab = async (req, res) => {
    try {
        const userId = req.user.id;
        const { business_entity_type } = req.body;

        if (!business_entity_type) {
            return res.status(400).json({
                message: "Business entity type is required"
            });
        }

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({ message: "Merchant profile not found" });
        }

        const merchantId = profile[0].id;

        // Get uploaded files
        const panFile = req.files?.pan_doc?.[0];
        const aadhaarFile = req.files?.aadhaar_doc?.[0];

        if (!panFile || !aadhaarFile) {
            return res.status(400).json({
                message: "Both PAN and Aadhaar files are required"
            });
        }

        const panPath = `/uploads/${panFile.filename}`;
        const aadhaarPath = `/uploads/${aadhaarFile.filename}`;

        // Insert or update
        await db.query(
            `INSERT INTO merchant_kyc 
            (merchant_id, business_entity_type, pan_doc, aadhaar_doc, status)
            VALUES (?, ?, ?, ?, 'completed')
            ON DUPLICATE KEY UPDATE
            business_entity_type = VALUES(business_entity_type),
            pan_doc = VALUES(pan_doc),
            aadhaar_doc = VALUES(aadhaar_doc),
            status = 'completed'`,
            [merchantId, business_entity_type, panPath, aadhaarPath]
        );

        await checkAndSubmitMerchant(merchantId);


        res.json({
            success: true,
            message: "Personal KYC uploaded successfully"
        });

    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

export const getPersonalKyc = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get merchant profile
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                message: "Merchant profile not found"
            });
        }

        const merchantId = profile[0].id;

        // Get personal KYC
        const [kyc] = await db.query(
            "SELECT business_entity_type, pan_doc, aadhaar_doc, status FROM merchant_kyc WHERE merchant_id = ?",
            [merchantId]
        );

        if (kyc.length === 0) {
            return res.status(404).json({
                message: "Personal KYC not submitted yet"
            });
        }

        res.status(200).json({
            success: true,
            data: kyc[0]
        });

    } catch (error) {
        console.error("GET PERSONAL KYC ERROR:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
};


export const saveBusinessKyc = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            business_name,
            business_type,
            address_line1,
            city,
            state,
            pincode
        } = req.body;

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({ message: "Merchant profile not found" });
        }

        const merchantId = profile[0].id;

        // get uploaded Files
        const gstFile = req.files?.gst_doc?.[0];
        const businessFile = req.files?.business_proof_doc?.[0];

        const gstPath = gstFile ? `/uploads/${gstFile.filename}` : null;
        const businessPath = businessFile ? `/uploads/${businessFile.filename}` : null;

        // Insert or Update
        await db.query(
            `INSERT INTO merchant_business_kyc 
            (merchant_id, business_name, business_type,
             address_line1, city, state, pincode,
             gst_doc, business_proof_doc, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
            ON DUPLICATE KEY UPDATE
            business_name = VALUES(business_name),
            business_type = VALUES(business_type),
            address_line1 = VALUES(address_line1),
            city = VALUES(city),
            state = VALUES(state),
            pincode = VALUES(pincode),
            gst_doc = COALESCE(VALUES(gst_doc), gst_doc),
            business_proof_doc = COALESCE(VALUES(business_proof_doc), business_proof_doc),
            status = 'completed'`,
            [
                merchantId,
                business_name,
                business_type,
                address_line1,
                city,
                state,
                pincode,
                gstPath,
                businessPath
            ]
        );

        await checkAndSubmitMerchant(merchantId);


        res.json({
            success: true,
            message: "Business KYC completed"
        });

    } catch (error) {
        console.error("BUSINESS KYC ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBusinessKyc = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Merchant profile not found"
            });
        }

        const merchantId = profile[0].id;

        // Get business KYC data
        const [kycData] = await db.query(
            `SELECT 
                business_name,
                business_type,
                address_line1,
                city,
                state,
                pincode,
                gst_doc,
                business_proof_doc,
                status
             FROM merchant_business_kyc
             WHERE merchant_id = ?`,
            [merchantId]
        );

        // If no data
        if (kycData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business KYC not found"
            });
        }

        // Send response
        res.json({
            success: true,
            data: kycData[0]
        });

    } catch (error) {
        console.error("GET BUSINESS KYC ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export const saveBankDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            account_holder_name,
            account_number,
            ifsc_code,
            bank_name
        } = req.body;

        //  Validation
        if (!account_holder_name || !account_number || !ifsc_code) {
            return res.status(400).json({
                message: "Required bank fields missing"
            });
        }

        //  Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({ message: "Merchant profile not found" });
        }

        const merchantId = profile[0].id;

        // get File
        const chequeFile = req.file;
        const chequePath = chequeFile
            ? `/uploads/${chequeFile.filename}`
            : null;

        // Insert / Update
        await db.query(
            `INSERT INTO merchant_bank_details 
            (merchant_id, account_holder_name, account_number, ifsc_code, bank_name, cancelled_cheque, status)
            VALUES (?, ?, ?, ?, ?, ?, 'completed')
            ON DUPLICATE KEY UPDATE
            account_holder_name = VALUES(account_holder_name),
            account_number = VALUES(account_number),
            ifsc_code = VALUES(ifsc_code),
            bank_name = VALUES(bank_name),
            cancelled_cheque = COALESCE(VALUES(cancelled_cheque), cancelled_cheque),
            status = 'completed'`,
            [
                merchantId,
                account_holder_name,
                account_number,
                ifsc_code,
                bank_name,
                chequePath
            ]
        );
        await checkAndSubmitMerchant(merchantId);

        res.json({
            success: true,
            message: "Bank details saved successfully"
        });

    } catch (error) {
        console.error("BANK DETAILS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBankDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Merchant profile not found"
            });
        }

        const merchantId = profile[0].id;

        // Get bank details
        const [bankData] = await db.query(
            `SELECT 
                account_holder_name,
                account_number,
                ifsc_code,
                bank_name,
                cancelled_cheque,
                status
             FROM merchant_bank_details
             WHERE merchant_id = ?`,
            [merchantId]
        );

        // If not found
        if (bankData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bank details not found"
            });
        }

        const data = bankData[0];

        // Optional: Full file URL
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        data.cancelled_cheque = data.cancelled_cheque
            ? baseUrl + data.cancelled_cheque
            : null;

        // Optional: Mask account number (security)
        if (data.account_number) {
            data.account_number =
                "XXXXXX" + data.account_number.slice(-4);
        }

        // Response
        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GET BANK DETAILS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export const createVpa = async (req, res) => {
    try {
        const userId = req.user.id;
        const { vpa } = req.body;

        // Validate
        if (!vpa) {
            return res.status(400).json({
                message: "VPA is required"
            });
        }

        // simple format check
        if (!vpa.includes("@")) {
            return res.status(400).json({
                message: "Invalid VPA format"
            });
        }

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                message: "Merchant profile not found"
            });
        }

        const merchantId = profile[0].id;

        // Check if VPA already exists
        const [existing] = await db.query(
            "SELECT * FROM merchant_vpa WHERE vpa = ?",
            [vpa]
        );

        if (existing.length > 0 && existing[0].merchant_id !== merchantId) {
            return res.status(409).json({
                message: "VPA already taken"
            });
        }

        // Insert / Update
        await db.query(
            `INSERT INTO merchant_vpa (merchant_id, vpa, status)
             VALUES (?, ?, 'completed')
             ON DUPLICATE KEY UPDATE
             vpa = VALUES(vpa),
             status = 'completed'`,
            [merchantId, vpa]
        );

        await checkAndSubmitMerchant(merchantId);

        res.json({
            success: true,
            message: "VPA created successfully"
        });

    } catch (error) {
        console.error("VPA ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getVpa = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get merchant id
        const [profile] = await db.query(
            "SELECT id FROM merchant_profile WHERE user_id = ?",
            [userId]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Merchant profile not found"
            });
        }

        const merchantId = profile[0].id;

        // Get VPA
        const [vpaData] = await db.query(
            `SELECT vpa, status
             FROM merchant_vpa
             WHERE merchant_id = ?`,
            [merchantId]
        );

        if (vpaData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "VPA not found"
            });
        }

        // Direct response (no masking)
        res.json({
            success: true,
            data: vpaData[0]
        });

    } catch (error) {
        console.error("GET VPA ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const checkAndSubmitMerchant = async (merchantId) => {
    const [personal] = await db.query(
        "SELECT status FROM merchant_kyc WHERE merchant_id = ?",
        [merchantId]
    );

    const [business] = await db.query(
        "SELECT status FROM merchant_business_kyc WHERE merchant_id = ?",
        [merchantId]
    );

    const [bank] = await db.query(
        "SELECT status FROM merchant_bank_details WHERE merchant_id = ?",
        [merchantId]
    );

    const [vpa] = await db.query(
        "SELECT status FROM merchant_vpa WHERE merchant_id = ?",
        [merchantId]
    );

    if (
        personal.length && personal[0].status === "completed" &&
        business.length && business[0].status === "completed" &&
        bank.length && bank[0].status === "completed" &&
        vpa.length && vpa[0].status === "completed"
    ) {
        await db.query(
            "UPDATE merchant_profile SET status = 'submitted' WHERE id = ?",
            [merchantId]
        );
    }
};