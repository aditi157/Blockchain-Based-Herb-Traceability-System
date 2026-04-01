import express from "express"
import {
  createCollection,
  getMyCollections,
  validateFarmerSignature 
} from "../controllers/collection.controller.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { getAssignedCollectionsForLab } from "../controllers/collection.controller.js"

const router = express.Router()

// Farmer creates collection
router.post(
  "/",
  requireAuth,
  requireRole("FARMER"),
  createCollection
)

// Farmer views own collections
router.get(
  "/mine",
  requireAuth,
  requireRole("FARMER"),
  getMyCollections
)

router.get(
  "/assigned",
  requireAuth,
  requireRole("LAB"),
  getAssignedCollectionsForLab
)

router.get(
  "/:id/validate",
  requireAuth,
  validateFarmerSignature
)

router.get("/:id/validate", validateFarmerSignature)

export default router
