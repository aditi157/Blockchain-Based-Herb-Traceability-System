import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.routes.js"
import collectionRoutes from "./routes/collection.routes.js"
import labRoutes from "./routes/lab.routes.js"
import manufacturerRoutes from "./routes/manufacturer.routes.js"
import customerRoutes from "./routes/customer.routes.js"


const app = express()

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use(express.json())

// Routes MUST come after app initialization
app.use("/api/collections", collectionRoutes)
app.use("/api/lab", labRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/manufacturer", manufacturerRoutes)
app.use("/api/customer", customerRoutes)


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend running" })
})

export default app
