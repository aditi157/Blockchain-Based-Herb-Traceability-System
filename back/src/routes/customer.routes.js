// import express from "express"
// import { getBatchTrace } from "../controllers/customer.controller.js"

// const router = express.Router()

// router.get("/batch/:batchCode", getBatchTrace)

// export default router


import express from "express"
import {
  getBatchTrace,
  validateFarmer,
  validateLab,
  validateManufacturer
} from "../controllers/customer.controller.js"

const router = express.Router()

router.get("/batch/:batchCode", getBatchTrace)

// ✅ Three separate validation endpoints — one per supply chain actor
router.post("/validate/farmer",       validateFarmer)
router.post("/validate/lab",          validateLab)
router.post("/validate/manufacturer", validateManufacturer)

export default router
