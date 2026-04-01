import express from "express"
import {
  getApprovedResults,
  createBatch,
  getMyBatches,
  validateBatch
} from "../controllers/manufacturer.controller.js"
import { requireAuth, requireRole } from "../middleware/auth.js"

const router = express.Router()

router.get("/approved", requireAuth, requireRole("MANUFACTURER"), getApprovedResults)
router.post("/batch", requireAuth, requireRole("MANUFACTURER"), createBatch)
router.get("/batches", requireAuth, requireRole("MANUFACTURER"), getMyBatches)
router.get("/batch/:id/validate", validateBatch)

export default router
