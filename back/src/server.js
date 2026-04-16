
import "dotenv/config"
import app from "./app.js"
import dotenv from "dotenv";
import path from "path";
import { verifyHash } from "./services/blockchain.js";

app.get("/test-chain", async (req, res) => {
  try {
    const { id, hash } = req.query;

    console.log("TEST VERIFY:", id, hash);

    const result = await verifyHash(id, hash);

    res.json({ result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});


const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

