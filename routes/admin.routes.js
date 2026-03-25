import express from "express";
//import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";
import { approveMerchant, rejectMerchant, getAllMerchants } from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/role.js";
const router = express.Router();

router.put("/kyc-approve/:merchantId",
    verifyToken,
    requireRole("admin"),
    approveMerchant);

router.put("/kyc-reject/:merchantId",
    verifyToken,
    requireRole("admin"),
    rejectMerchant);

router.get(
    "/merchants",
    verifyToken,
    requireRole("admin"),
    getAllMerchants
);

export default router;

