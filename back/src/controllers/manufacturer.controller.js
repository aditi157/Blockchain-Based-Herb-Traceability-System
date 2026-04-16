import { verifySignature, buildManufacturingCanonical } from "../utils/crypto.utils.js";
import crypto from "crypto";
import prisma from "../config/db.js";
import {
  generateHash,
  signData,
} from "../utils/crypto.utils.js";
import QRCode from "qrcode";
import { anchorHash, verifyHash } from "../services/blockchain.js";


// ==========================
// GET APPROVED RESULTS
// ==========================
export const getApprovedResults = async (req, res) => {
  try {
    const manufacturerId = req.user.id;

    const results = await prisma.labResult.findMany({
      where: {
        assignedMfgId: manufacturerId,
        result: "PASS"
      },
      include: {
        lab: true,
        collection: {
          include: { farmer: true }
        }
      }
    });

    const enriched = await Promise.all(
      results.map(async (r) => {
        const batches = await prisma.manufacturingBatch.findMany({
          where: { labResultId: r.id }
        });

        const totalUsed = batches.reduce(
          (sum, b) => sum + Number(b.herbUsedQuantity || 0),
          0
        );

        const original = Number(r.collection?.quantity || 0);
        const remainingQuantity = original - totalUsed;

        return {
          ...r,
          remainingQuantity
        };
      })
    );

    const filtered = enriched.filter(r => r.remainingQuantity > 0);

    res.json(filtered);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// ==========================
// CREATE BATCH (FIXED)
// ==========================
export const createBatch = async (req, res) => {
  try {
    const manufacturerId = req.user.id;

    const {
      labResultId,
      batchName,
      herbUsedQuantity,
      finalProductQuantity,
      expiryDate
    } = req.body;

    if (!labResultId || !batchName || !herbUsedQuantity || !finalProductQuantity || !expiryDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const manufacturer = await prisma.organization.findUnique({
      where: { id: manufacturerId }
    });

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }

    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
      include: { collection: true }
    });

    if (!labResult) {
      return res.status(404).json({ error: "Lab result not found" });
    }

    const existingBatches = await prisma.manufacturingBatch.findMany({
      where: { labResultId }
    });

    const totalUsed = existingBatches.reduce(
      (sum, b) => sum + b.herbUsedQuantity,
      0
    );

    if (totalUsed + Number(herbUsedQuantity) > labResult.collection.quantity) {
      return res.status(400).json({ error: "Not enough remaining herb quantity" });
    }

    const count = await prisma.manufacturingBatch.count();
    const batchCode = `BATCH-${String(count + 1).padStart(3, "0")}`;

    const qrCodeBase64 = await QRCode.toDataURL(batchCode);

    const batchId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const expiryIso = new Date(expiryDate).toISOString();

    const canonicalData = buildManufacturingCanonical({
      batchId,
      batchName,
      labResultId,
      manufacturerId,
      herbUsedQuantity: String(herbUsedQuantity),
      finalProductQuantity: String(finalProductQuantity),
      expiryDate: expiryIso,
      timestamp
    });

    const hash = generateHash(canonicalData);

    console.log("ANCHORING BATCH:", batchId, hash);

    const signature = signData(manufacturer.privateKey, canonicalData);

    // ✅ CREATE FIRST
    const batch = await prisma.manufacturingBatch.create({
  data: {
    id: batchId,
    batchCode,
    qrCode: qrCodeBase64,
    batchName,
    herbUsedQuantity: Number(herbUsedQuantity),
    finalProductQuantity: Number(finalProductQuantity),
    expiryDate: new Date(expiryDate),
    canonicalData,
    canonicalTimestamp: timestamp,
    hash,
    signature,

    // ✅ USE IDs (NOT connect)
    manufacturerId: manufacturerId,
    labResultId: labResultId,

    blockchainHash: hash,
    txHash: null
  }
});

    // ✅ THEN BLOCKCHAIN
    anchorHash(batchId, hash)
      .then(async (tx) => {
        console.log("BATCH TX:", tx);

        await prisma.manufacturingBatch.update({
          where: { id: batchId },
          data: { txHash: tx }
        });
      })
      .catch((err) => {
        console.error("BATCH BLOCKCHAIN FAILED:", err);
      });

    res.status(201).json(batch);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// ==========================
// GET MY BATCHES
// ==========================
export const getMyBatches = async (req, res) => {
  try {
    const manufacturerId = req.user.id;

    const batches = await prisma.manufacturingBatch.findMany({
      where: { manufacturerId },
      include: {
        labResult: {
          include: {
            lab: true,
            collection: {
              include: { farmer: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(batches);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// ==========================
// VALIDATE BATCH (FIXED)
// ==========================
export const validateBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await prisma.manufacturingBatch.findUnique({
      where: { id },
      include: {
        manufacturer: true
      }
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const rebuiltCanonical = buildManufacturingCanonical({
      batchId: batch.id,
      batchName: batch.batchName,
      labResultId: batch.labResultId,
      manufacturerId: batch.manufacturerId,
      herbUsedQuantity: String(batch.herbUsedQuantity),
      finalProductQuantity: String(batch.finalProductQuantity),
      expiryDate: new Date(batch.expiryDate).toISOString(),
      timestamp: batch.canonicalTimestamp
    });

    const rebuiltHash = generateHash(rebuiltCanonical);

    const canonicalMatch = rebuiltCanonical === batch.canonicalData;
    const hashMatch = rebuiltHash === batch.hash;

    console.log("VERIFYING BATCH:", batch.id, batch.hash);

    const blockchainValid = await verifyHash(batch.id, batch.hash);

    const signatureValid = verifySignature(
      batch.manufacturer.publicKey,
      rebuiltCanonical,
      batch.signature
    );

    return res.json({
  hashMatch,
  signatureValid,
  blockchainValid,
  canonicalMatch,

  storedHash: batch.hash,
  computedHash: rebuiltHash,

  txHash: batch.txHash,
  etherscan: batch.txHash
    ? `https://sepolia.etherscan.io/tx/${batch.txHash}`
    : null
});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};