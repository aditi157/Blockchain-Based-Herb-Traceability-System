// const { PrismaClient } = require("@prisma/client")
// const bcrypt = require("bcrypt")
// const jwt = require("jsonwebtoken")
// const crypto = require("crypto")

// const prisma = new PrismaClient()

// /*
// CRYPTO SPEC (DO NOT CHANGE):

// Password:
// - bcrypt
// - 10 rounds

// Keypair:
// - Algorithm: ec
// - Curve: P-256
// - Public encoding: spki, pem
// - Private encoding: pkcs8, pem
// */

// // ========================
// // Keypair Generator
// // ========================
// function generateKeyPair() {
//   return crypto.generateKeyPairSync("ec", {
//     namedCurve: "P-256",
//     publicKeyEncoding: {
//       type: "spki",
//       format: "pem",
//     },
//     privateKeyEncoding: {
//       type: "pkcs8",
//       format: "pem",
//     },
//   })
// }

// // ========================
// // OrgCode Generator
// // ========================
// async function generateOrgCode(role) {
//   const prefixMap = {
//     FARMER: "FARM",
//     LAB: "LAB",
//     MANUFACTURER: "MFG",
//     CONSUMER: "CONS"
//   }

//   const prefix = prefixMap[role]

//   if (!prefix) {
//     throw new Error("Invalid role")
//   }

//   const count = await prisma.organization.count({
//     where: { role }
//   })

//   const nextNumber = count + 1

//   return `${prefix}-${String(nextNumber).padStart(3, "0")}`
// }

// // ========================
// // REGISTER
// // ========================
// exports.register = async (req, res) => {
//   const { name, email, password, role } = req.body
//   const normalizedRole = role.toUpperCase()

//   try {
//     const existing = await prisma.organization.findUnique({
//       where: { email }
//     })

//     if (existing) {
//       return res.status(400).json({ message: "Email already exists" })
//     }

//     const hashedPassword = await bcrypt.hash(password, 10)

//     const { publicKey, privateKey } = generateKeyPair()

//     const orgCode = await generateOrgCode(normalizedRole)

//     await prisma.organization.create({
//       data: {
//         orgCode,                 // ✅ THIS WAS MISSING
//         name,
//         email,
//         password: hashedPassword,
//         role: normalizedRole,
//         publicKey,
//         privateKey,
//       }
//     })

//     res.status(201).json({
//       message: "User registered successfully",
//       orgCode
//     })

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// }

// // ========================
// // LOGIN
// // ========================
// exports.login = async (req, res) => {
//   const { email, password } = req.body

//   try {
//     const user = await prisma.organization.findUnique({
//       where: { email }
//     })

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" })
//     }

//     const valid = await bcrypt.compare(password, user.password)

//     if (!valid) {
//       return res.status(400).json({ message: "Invalid credentials" })
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         role: user.role
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     )

//     res.json({
//       token,
//       role: user.role,
//       orgCode: user.orgCode
//     })

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: "Server error" })
//   }
// }

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import prisma from "../config/db.js"

function generateKeyPair() {
  return crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })
}

async function generateOrgCode(role) {
  const prefixMap = {
    FARMER:       "FARM",
    LAB:          "LAB",
    MANUFACTURER: "MFG",
    CONSUMER:     "CONS",
  }
  const prefix = prefixMap[role]
  if (!prefix) throw new Error("Invalid role")

  const count = await prisma.organization.count({ where: { role } })
  return `${prefix}-${String(count + 1).padStart(3, "0")}`
}

// Role values the frontend sends → enum values in DB
const ROLE_MAP = {
  farmer:       "FARMER",
  laboratory:   "LAB",
  manufacturer: "MANUFACTURER",
  consumer:     "CONSUMER",
  // already-correct values pass through
  FARMER:       "FARMER",
  LAB:          "LAB",
  MANUFACTURER: "MANUFACTURER",
  CONSUMER:     "CONSUMER",
}

export const register = async (req, res) => {
  const { name, email, password, role } = req.body

  const normalizedRole = ROLE_MAP[role?.toLowerCase()] || ROLE_MAP[role]

  if (!normalizedRole) {
    return res.status(400).json({ message: `Invalid role: ${role}` })
  }

  try {
    const existing = await prisma.organization.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: "Email already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)
    const { publicKey, privateKey } = generateKeyPair()
    const orgCode = await generateOrgCode(normalizedRole)

    await prisma.organization.create({
      data: { orgCode, name, email, password: hashedPassword, role: normalizedRole, publicKey, privateKey }
    })

    res.status(201).json({ message: "Registered successfully", orgCode })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await prisma.organization.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: "Invalid credentials" })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: "Invalid credentials" })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({ token, role: user.role, orgCode: user.orgCode })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}