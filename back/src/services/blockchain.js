// import { ethers } from "ethers";
// import dotenv from "dotenv";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Load ABI
// const abiPath = path.join(__dirname, "../blockchain/abi/HerbTrace.json");
// const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
// const ABI = contractJson.abi;

// // ✅ Contract address (NO SPACES)
// const CONTRACT_ADDRESS = "0xe01e553A5E9577A7F87a7D2ab323244133340427";

// // ✅ Provider + wallet
// const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// // ✅ Contract
// const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// // 🔥 Convert to bytes32
// const toBytes32Id = (id) => ethers.keccak256(ethers.toUtf8Bytes(id));

// // 🔥 hash is already hex → convert directly
// const toBytes32Hash = (hash) => {
//   return "0x" + hash.replace(/^0x/, "").padStart(64, "0");
// };

// // ✅ Anchor (returns tx hash)
// export const anchorHash = async (id, hash) => {
//   const idBytes = toBytes32Id(id);
//   const hashBytes = toBytes32Hash(hash); // ✅ FIXED

//   console.log("ANCHOR:", idBytes, hashBytes);

//   const tx = await contract.anchor(idBytes, hashBytes);
//   await tx.wait();

//   return tx.hash;
// };

// // ✅ Verify
// export const verifyHash = async (id, hash) => {
//   const idBytes = toBytes32Id(id);
//   const hashBytes = toBytes32Hash(hash); // ✅ FIXED

//   console.log("VERIFY:", idBytes, hashBytes);

//   return await contract.verify(idBytes, hashBytes);
// };


import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const abiPath = path.join(__dirname, "../blockchain/abi/HerbTrace.json");
const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
const ABI = contractJson.abi;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// ✅ ONLY hash ID
const toBytes32Id = (id) => {
  return ethers.keccak256(ethers.toUtf8Bytes(id));
};

// ❗ DO NOT hash hash again
const toBytes32Hash = (hash) => {
  return "0x" + hash.replace(/^0x/, "").padStart(64, "0");
};

// ==========================
// ANCHOR
// ==========================
export const anchorHash = async (id, hash) => {
    console.log("ANCHOR RAW ID:", `"${id}"`);
console.log("ANCHOR RAW HASH:", `"${hash}"`);
  const idBytes = toBytes32Id(id);
  const hashBytes = toBytes32Hash(hash);

  console.log("ANCHOR:", idBytes, hashBytes);

  const tx = await contract.anchor(idBytes, hashBytes);
  await tx.wait();

  return tx.hash;
};

// ==========================
// VERIFY
// ==========================
export const verifyHash = async (id, hash) => {
    console.log("VERIFY RAW ID:", `"${id}"`);
console.log("VERIFY RAW HASH:", `"${hash}"`);
  const idBytes = toBytes32Id(id);
  const hashBytes = toBytes32Hash(hash);

  console.log("VERIFY:", idBytes, hashBytes);

  const result = await contract.verify(idBytes, hashBytes);

  console.log("VERIFY RESULT:", result);

  return result;
};