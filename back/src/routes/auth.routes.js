// const express = require("express");
// const router = express.Router();
// const authController = require("../controllers/auth.controller");

// router.post("/register", authController.register);
// router.post("/login", authController.login);

// module.exports = router;

import express from "express"
import { register, login } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)

export default router
