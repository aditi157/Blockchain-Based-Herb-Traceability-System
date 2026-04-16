import prisma from "../config/db.js";
import XLSX from "xlsx";
import fs from "fs";

// 🔥 flatten nested objects
const flatten = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, newKey));
    } else {
      acc[newKey] = value;
    }

    return acc;
  }, {});
};

// 🔥 FIX HASHES FOR BOTH EXCEL + CSV
const fixHashes = (row) => {
  const newRow = { ...row };

  if (newRow.hash) newRow.hash = "'" + newRow.hash;
  if (newRow.blockchainHash) newRow.blockchainHash = "'" + newRow.blockchainHash;

  return newRow;
};

const prepareData = (rows) => {
  return rows.map((row) => fixHashes(flatten(row)));
};

const exportCSV = (data, filename) => {
  const sheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  fs.writeFileSync(filename, csv);
};

const exportData = async () => {
  try {
    // =========================
    // FETCH
    // =========================

    const collections = await prisma.collection.findMany({
      include: { farmer: true, labResults: true }
    });

    const labResults = await prisma.labResult.findMany({
      include: { collection: true }
    });

    const batches = await prisma.manufacturingBatch.findMany({
      include: { labResult: true, manufacturer: true }
    });

    const organizations = await prisma.organization.findMany();

    // =========================
    // PREPARE
    // =========================

    const cleanCollections = prepareData(collections);
    const cleanLabResults = prepareData(labResults);
    const cleanBatches = prepareData(batches);
    const cleanOrganizations = prepareData(organizations);

    // =========================
    // EXCEL EXPORT
    // =========================

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanCollections), "Collections");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanLabResults), "LabResults");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanBatches), "Batches");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(cleanOrganizations), "Organizations");

    XLSX.writeFile(workbook, "herbtrace_export.xlsx");

    // =========================
    // CSV EXPORT (NEW)
    // =========================

    exportCSV(cleanCollections, "collections.csv");
    exportCSV(cleanLabResults, "lab_results.csv");
    exportCSV(cleanBatches, "batches.csv");
    exportCSV(cleanOrganizations, "organizations.csv");

    console.log("✅ Excel + CSV export complete");

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
};

exportData();