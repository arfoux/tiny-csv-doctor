import test from "node:test";
import assert from "node:assert/strict";
import { checkCsv, detectDelimiter, splitFields, formatIssues, hasErrors } from "../src/index.mjs";

test("clean file reports no errors", () => {
  const report = checkCsv("id,name,total\n1,coffee,3\n2,tea,2\n");
  assert.equal(report.rows, 2);
  assert.equal(hasErrors(report), false);
});

test("duplicate and empty headers are reported", () => {
  const report = checkCsv("id,,id\n1,x,2\n");
  assert.deepEqual(report.issues.map((i) => i.code).sort(), ["duplicate-header", "empty-header"]);
});

test("ragged rows point at the file line", () => {
  const report = checkCsv("a,b\n1,2\n3,4,5\n");
  assert.equal(report.issues.length, 1);
  assert.equal(report.issues[0].code, "ragged-row");
  assert.equal(report.issues[0].line, 3);
});

test("quoted separators do not split fields", () => {
  assert.equal(splitFields('"coffee, large",3', ",").length, 2);
  assert.equal(splitFields('"say ""hi""",3', ",")[0], 'say "hi"');
});

test("delimiter detection prefers the busiest candidate", () => {
  assert.equal(detectDelimiter("a;b;c"), ";");
  assert.equal(detectDelimiter("a,b,c"), ",");
});

test("bom is a warning only", () => {
  const report = checkCsv("\uFEFFa,b\n1,2\n");
  assert.equal(report.issues[0].code, "bom");
  assert.equal(hasErrors(report), false);
});

test("format prints the summary line", () => {
  const out = formatIssues("x.csv", checkCsv("a,a\n1,2\n"));
  assert.match(out, /x\.csv:1 duplicate-header/);
  assert.match(out, /1 rows checked, 1 issues/);
});
