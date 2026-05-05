import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const allowedColumns = [
  "ID",
  "Created date (UTC)",
  "Amount",
  "Currency",
  "Status",
  "Customer Email",
  "selectedPackage (metadata)",
  "receiptCode (metadata)",
  "fullName (metadata)",
  "businessName (metadata)",
  "websiteUrl (metadata)",
  "whatsappNumber (metadata)",
  "businessType (metadata)",
  "targetLocation (metadata)",
  "briefBusinessDescription (metadata)",
  "mainProductsServices (metadata)",
  "mainGoal (metadata)",
  "targetKeywords (metadata)",
  "idealCustomers (metadata)",
  "topicsToCover (metadata)",
  "ctaText (metadata)",
  "pagesToPush (metadata)",
  "additionalNotes (metadata)",
];

const normalizedMetadataColumns = {
  "selectedPackage (metadata)": ["selectedPackage (metadata)", "order_selectedPackage (metadata)"],
  "receiptCode (metadata)": ["receiptCode (metadata)", "order_receiptCode (metadata)"],
  "fullName (metadata)": ["fullName (metadata)", "order_fullName (metadata)"],
  "businessName (metadata)": ["businessName (metadata)", "order_businessName (metadata)"],
  "websiteUrl (metadata)": ["websiteUrl (metadata)", "order_websiteUrl (metadata)"],
  "whatsappNumber (metadata)": ["whatsappNumber (metadata)", "order_whatsappNumber (metadata)"],
  "businessType (metadata)": ["businessType (metadata)", "order_businessType (metadata)"],
  "targetLocation (metadata)": ["targetLocation (metadata)", "order_targetLocation (metadata)", "blog_targetLocation (metadata)"],
  "briefBusinessDescription (metadata)": ["briefBusinessDescription (metadata)", "blog_briefBusinessDescription (metadata)"],
  "mainProductsServices (metadata)": ["mainProductsServices (metadata)", "blog_mainProductsServices (metadata)"],
  "mainGoal (metadata)": ["mainGoal (metadata)", "blog_mainGoal (metadata)"],
  "targetKeywords (metadata)": ["targetKeywords (metadata)", "blog_targetKeywords (metadata)"],
  "idealCustomers (metadata)": ["idealCustomers (metadata)", "blog_idealCustomers (metadata)"],
  "topicsToCover (metadata)": [
    "topicsToCover (metadata)",
    "blog_topicsToCover (metadata)",
    "blog_blogTopicIdeas (metadata)",
    "blogTopicIdeas (metadata)",
  ],
  "ctaText (metadata)": ["ctaText (metadata)", "blog_ctaText (metadata)", "preferredCTA (metadata)", "customCTA (metadata)"],
  "pagesToPush (metadata)": ["pagesToPush (metadata)", "blog_pagesToPush (metadata)"],
  "additionalNotes (metadata)": ["additionalNotes (metadata)", "blog_additionalNotes (metadata)"],
};

function parseCsv(input) {
  const rows = [];
  let currentCell = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function getFirstNonEmptyValue(row, headerRow, candidates) {
  for (const candidate of candidates) {
    const index = headerRow.indexOf(candidate);

    if (index === -1) {
      continue;
    }

    const value = row[index] ?? "";

    if (String(value).trim()) {
      return value;
    }
  }

  return "";
}

function buildOutputPath(inputPath) {
  const parsedPath = path.parse(inputPath);
  return path.join(parsedPath.dir, `${parsedPath.name}.clean${parsedPath.ext || ".csv"}`);
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: node scripts/clean-stripe-export-csv.mjs <path-to-csv>");
  }

  const resolvedInputPath = path.resolve(inputPath);
  const outputPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : buildOutputPath(resolvedInputPath);
  const rawCsv = await fs.readFile(resolvedInputPath, "utf8");
  const rows = parseCsv(rawCsv);

  if (rows.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const [headerRow, ...dataRows] = rows;
  const selectedColumns = allowedColumns.filter((column) =>
    column in normalizedMetadataColumns
      ? normalizedMetadataColumns[column].some((candidate) => headerRow.includes(candidate))
      : headerRow.includes(column),
  );
  const cleanedRows = [
    selectedColumns,
    ...dataRows.map((row) =>
      selectedColumns.map((column) =>
        column in normalizedMetadataColumns
          ? getFirstNonEmptyValue(row, headerRow, normalizedMetadataColumns[column])
          : row[headerRow.indexOf(column)] ?? "",
      ),
    ),
  ];

  await fs.writeFile(outputPath, toCsv(cleanedRows), "utf8");

  console.log(`Cleaned CSV written to ${outputPath}`);
  console.log(`Kept ${selectedColumns.length} columns.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
