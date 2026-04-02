import express from "express"
import {
  getBatchTrace,
  validateFarmer,
  validateLab,
  validateManufacturer
} from "../controllers/customer.controller.js"
import { getTraceByCollection } from "../controllers/customer.controller.js"




const router = express.Router()

router.get("/batch/:batchCode", getBatchTrace)

router.post("/validate/farmer",       validateFarmer)
router.post("/validate/lab",          validateLab)
router.post("/validate/manufacturer", validateManufacturer)



router.get("/batch/:batchCode", getBatchTrace)

router.post("/validate-farmer", validateFarmer)
router.post("/validate-lab", validateLab)
router.post("/validate-manufacturer", validateManufacturer)

router.get("/collection/:collectionId", getTraceByCollection)

export default router