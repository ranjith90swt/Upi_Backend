import express from "express";
import { getPersonalKyc, savePersonalKycTab } from "../controllers/merchantKyc.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";
import { saveBusinessKyc, getBusinessKyc } from "../controllers/merchantKyc.controller.js";
import { saveBankDetails, createVpa } from "../controllers/merchantKyc.controller.js";

const router = express.Router();

router.post(
    "/personal-kyc",
    verifyToken,
    upload.fields([
        { name: "pan_doc", maxCount: 1 },
        { name: "aadhaar_doc", maxCount: 1 },
    ]),
    savePersonalKycTab,
);

router.get(
    "/personal-kyc",
    verifyToken,
    getPersonalKyc
);


router.post(
    "/business-kyc",
    verifyToken,
    upload.fields([
        { name: "gst_doc", maxCount: 1 },
        { name: "business_proof_doc", maxCount: 1 }
    ]),
    saveBusinessKyc
);

router.get(
    "/business-kyc",
    verifyToken,
    getBusinessKyc
);


router.post(
    "/bank-details",
    verifyToken,
    upload.single("cancelled_cheque"),
    saveBankDetails
);
router.post("/vpa", verifyToken, createVpa);

export default router;
