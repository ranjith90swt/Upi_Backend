import express from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.get(
    "/",
    verifyToken,
    requireRole("admin"), // 👈 Only admin allowed
    getAllUsers
);

export default router;
