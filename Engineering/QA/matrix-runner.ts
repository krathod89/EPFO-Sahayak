// Shared execution harness for Engineering/QA/test-matrix.json — NOT part of the product
// test suite (excluded from the main vitest.config.ts's `include`; run via this directory's
// own Engineering/QA/vitest.config.ts instead). Loads the matrix, maps each case's `fn`
// string to the real exported implementation, calls it with the case's `args`, and asserts
// the result against `expected` via `toMatchObject` (a partial match — extra fields on the
// real result are ignored, per the matrix's own documented contract in its NOTES-000 entry).
//
// Two conventions from NOTES-000, implemented here so every exec-test file behaves
// identically instead of each one reinventing this:
//   1. A `null` value on an `expected` field means "assert this field is `undefined`
//      (absent)" — the rule engine's types never assign literal `null`, only
//      optional/absent. Those keys are pulled out of the toMatchObject call and asserted
//      with `toBeUndefined()` instead, since `toMatchObject`/`toEqual` treat `null` and
//      `undefined` as distinct.
//   2. Array-valued expected fields (entries, tier1/tier2/..., unsureItems, missing, errors)
//      must match exactly (length + order) — toMatchObject already does this correctly for
//      array fields (it does NOT do partial/subset matching on arrays), so no special-casing
//      is needed here beyond leaving them in the plain matchObj.

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { checkDeadline } from "@/lib/rule-engine/deadline";
import { runPostRejectionFlow, runPreFilingFlow } from "@/lib/rule-engine";
import { buildGrievance } from "@/lib/rule-engine/grievance";
import { prioritize } from "@/lib/rule-engine/prioritize";
import { diagnose } from "@/lib/rule-engine/diagnose";
import { validatePostRejectionCrossFields } from "@/lib/rule-engine/schema";
import { bucketSelfCheck } from "@/lib/rule-engine/selfCheck";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FN_MAP: Record<string, (...args: any[]) => unknown> = {
  checkDeadline,
  runPostRejectionFlow,
  runPreFilingFlow,
  buildGrievance,
  prioritize,
  diagnose,
  validatePostRejectionCrossFields,
  bucketSelfCheck,
};

interface MatrixCase {
  id: string;
  area: string;
  fn: string;
  args: unknown[];
  expected: Record<string, unknown>;
  rationale: string;
  tags?: string[];
}

function splitNulls(expected: Record<string, unknown>): { matchObj: Record<string, unknown>; undefinedKeys: string[] } {
  const matchObj: Record<string, unknown> = {};
  const undefinedKeys: string[] = [];
  for (const [k, v] of Object.entries(expected)) {
    if (v === null) undefinedKeys.push(k);
    else matchObj[k] = v;
  }
  return { matchObj, undefinedKeys };
}

/** Registers one `describe`/`it` per matching case (filtered to `areas`) in the calling test
 * file. Call this at the top level of a `*.exec.test.ts` file — vitest collects tests
 * synchronously, so `describe`/`it` calls made from inside this imported function still
 * register correctly, the same as if they were written inline. */
export function runMatrixAreas(areas: string[]): void {
  const matrixPath = path.resolve(__dirname, "test-matrix.json");
  const all: MatrixCase[] = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
  const cases = all.filter((c) => c.id !== "NOTES-000" && areas.includes(c.area));

  if (cases.length === 0) {
    throw new Error(`runMatrixAreas: no cases found for areas [${areas.join(", ")}] — check the area names against test-matrix.json`);
  }

  describe(`QA matrix — ${areas.join(", ")} (${cases.length} cases)`, () => {
    for (const c of cases) {
      it(`${c.id} [${c.area}] ${c.fn}: ${c.rationale.slice(0, 80)}`, () => {
        const impl = FN_MAP[c.fn];
        if (!impl) throw new Error(`${c.id}: no implementation mapped for fn "${c.fn}"`);
        const actual = impl(...c.args);
        const { matchObj, undefinedKeys } = splitNulls(c.expected);
        // validatePostRejectionCrossFields returns a bare string[] (schema.ts), but the
        // matrix models its expected shape as { errors: [...] } for readability — unwrap
        // here rather than have every one of its 18 cases fail on a shape mismatch that has
        // nothing to do with the actual rule being tested.
        if (c.fn === "validatePostRejectionCrossFields" && Array.isArray(actual) && Array.isArray(matchObj.errors)) {
          expect(actual).toEqual(matchObj.errors);
        } else {
          expect(actual).toMatchObject(matchObj);
        }
        for (const k of undefinedKeys) {
          expect((actual as Record<string, unknown>)[k], `expected "${k}" to be undefined`).toBeUndefined();
        }
      });
    }
  });
}
