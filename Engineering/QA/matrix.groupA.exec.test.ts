// Executes test-matrix.json's pure-function / single-code diagnosis areas. See
// matrix-runner.ts for the shared execution/assertion logic.
import { runMatrixAreas } from "./matrix-runner";

runMatrixAreas([
  "deadline-basic",
  "deadline-suppression",
  "diagnose-code1",
  "diagnose-code3",
  "diagnose-code8",
  "diagnose-code9",
  "diagnose-simple-codes",
  "diagnose-self-check",
  "self-check-bucket",
]);
