import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(file, "utf8"));
const deps = pkg.devDependencies ?? {};
const names = Object.keys(deps).sort();

if (names.length === 0) {
  console.error("no devDependencies to bump");
  process.exit(1);
}

const name = names[0];
const before = deps[name];
deps[name] = before.replace(/\.(\d+)$/, (_, patch) => `.${Number(patch) + 1}`);
pkg.devDependencies = Object.fromEntries(names.map((key) => [key, deps[key]]));

writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`${name}: ${before} -> ${deps[name]}`);
