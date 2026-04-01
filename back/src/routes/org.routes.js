// import express from "express";
// import { getOrganizationById } from "../controllers/org.controller.js";
// import { authenticate } from "../middleware/auth.middleware.js";

// const router = express.Router();

// // Get organization by ID (authenticated users only)
// router.get("/:id", authenticate, getOrganizationById);

// export default router;

import express from "express";
import { getOrganizationById } from "../controllers/org.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get organization by ID (authenticated users only)
router.get("/:id", authenticate, getOrganizationById);

export default router;