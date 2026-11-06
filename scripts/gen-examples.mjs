import { readdirSync, readFileSync } from "node:fs";
import { checkCsv, formatIssues } from "../src/index.mjs";

const dir = new URL("../examples/", import.meta.url);
const files = readdirSync(dir).filter((file) => file.endsWith(".csv")).sort();

const out = [
  "# Generated examples",
  "",
  "Produced by `node scripts/gen-examples.mjs` from the fixtures in `examples/`.",
  "",
];

for (const file of files) {
  const report = checkCsv(readFileSync(new URL(file, dir), "utf8"));
  out.push(`## ${file}`, "", "```", formatIssues(`examples/${file}`, report), "```", "");
}

process.stdout.write(out.join("\n"));
