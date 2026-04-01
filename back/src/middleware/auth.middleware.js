import jwt from "jsonwebtoken"
import prisma from "../config/db.js"

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Our login uses { id, role }
    if (!decoded.id) {
      return res.status(401).json({ error: "Invalid token payload" })
    }

    const org = await prisma.organization.findUnique({
      where: { id: decoded.id }
    })

    if (!org) {
      return res.status(401).json({ error: "Organization not found" })
    }

    // Attach clean user object
    req.user = {
  id: org.id,
  role: org.role,
  publicKey: org.publicKey,
  privateKey: org.privateKey,
  orgCode: org.orgCode
}


    next()

  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}


export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
