# tiny-csv-doctor

Zero-dependency CSV sanity checker. It does one thing: tell you whether a CSV file is
structurally consistent — no duplicate headers, no rows whose column count drifts from the
header, no BOM surprises.

```
npm i -g tiny-csv-doctor
csv-doctor data/orders.csv
```

## What it checks

- `duplicate-header` — a header name appears twice (case-insensitive, trimmed)
- `ragged-row` — a row has a different number of fields than the header
- `empty-header` — a header field is empty
- `bom` — a byte-order mark at the start of the file (warning only)

Exit code is `0` when there are no errors, `1` when there is at least one.

## Output

```
data/orders.csv:1 duplicate-header: "id" appears 2 times
data/orders.csv:37 ragged-row: expected 8 fields, got 9
3 rows checked, 2 issues
```

## API

```js
import { checkCsv } from "tiny-csv-doctor";

const report = checkCsv("id,name,total\n1,coffee,3\n");
// { rows: 1, issues: [ { line: 1, code: "empty-header", ... } ] }
```

Delimiter detection guesses between `,`, `;` and tab by counting candidates in the first
line; pass `{ delimiter: ";" }` to skip the guess.

## Notes

The parser is intentionally naive: quoted fields are supported, embedded newlines inside
quotes are not. That is fine for the fixtures it was written for, and it keeps the file
under 200 lines.

## License

MIT
