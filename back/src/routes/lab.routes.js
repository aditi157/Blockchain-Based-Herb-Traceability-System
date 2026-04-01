import express from "express"
import { requireAuth, requireRole } from "../middleware/auth.middleware.js"
import {
  createLabResult,
  getPastTests, 
  getResultsForFarmer
} from "../controllers/lab.controller.js"

const router = express.Router()

// Create lab result
router.post(
  "/results",
  requireAuth,
  requireRole("LAB"),
  createLabResult
)

// Get past tests
router.get(
  "/results",
  requireAuth,
  requireRole("LAB"),
  getPastTests
)

router.get(
  "/farmer",
  requireAuth,
  requireRole("FARMER"),
  getResultsForFarmer
)

export default router
