#!/usr/bin/env node
import { readFileSync } from "node:fs";

const CANDIDATES = [",", ";", "\t"];

function countSeparators(line, delimiter) {
  let count = 0;
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === delimiter) count += 1;
  }
  return count;
}

export function detectDelimiter(line) {
  let best = ",";
  let bestCount = -1;
  for (const candidate of CANDIDATES) {
    const count = countSeparators(line, candidate);
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

export function splitFields(line, delimiter) {
  const fields = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function checkCsv(text, options = {}) {
  const issues = [];
  const hasBom = text.charCodeAt(0) === 0xfeff;
  if (hasBom) {
    issues.push({ line: 1, code: "bom", message: "file starts with a byte-order mark" });
  }
  const raw = (hasBom ? text.slice(1) : text).split(/\r\n|\n/);
  while (raw.length > 0 && raw[raw.length - 1] === "") raw.pop();
  if (raw.length === 0) return { rows: 0, issues };

  const delimiter = options.delimiter ?? detectDelimiter(raw[0]);
  const header = splitFields(raw[0], delimiter);

  const counts = new Map();
  const labels = new Map();
  for (const name of header) {
    const key = name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!labels.has(key)) labels.set(key, name.trim());
  }
  header.forEach((name, index) => {
    if (name.trim() === "") {
      issues.push({ line: 1, code: "empty-header", message: `header ${index + 1} is empty` });
    }
  });
  for (const [key, count] of counts) {
    if (count > 1) {
      issues.push({
        line: 1,
        code: "duplicate-header",
        message: `"${labels.get(key)}" appears ${count} times`,
      });
    }
  }

  for (let i = 1; i < raw.length; i += 1) {
    const fields = splitFields(raw[i], delimiter);
    if (fields.length !== header.length) {
      issues.push({
        line: i + 1,
        code: "ragged-row",
        message: `expected ${header.length} fields, got ${fields.length}`,
      });
    }
  }

  return { rows: raw.length - 1, issues, delimiter };
}

export function formatIssues(file, report) {
  const lines = report.issues.map(
    (issue) => `${file}:${issue.line} ${issue.code}: ${issue.message}`,
  );
  const errors = report.issues.filter((issue) => issue.code !== "bom").length;
  lines.push(`${report.rows} rows checked, ${errors} issues`);
  return lines.join("\n");
}

export function hasErrors(report) {
  return report.issues.some((issue) => issue.code !== "bom");
}

function main(argv) {
  const target = argv[0];
  if (!target) {
    process.stderr.write("usage: csv-doctor <file.csv>\n");
    return 2;
  }
  const text = target === "-" ? readFileSync(0, "utf8") : readFileSync(target, "utf8");
  const report = checkCsv(text);
  process.stdout.write(`${formatIssues(target === "-" ? "<stdin>" : target, report)}\n`);
  return hasErrors(report) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = main(process.argv.slice(2));
}
