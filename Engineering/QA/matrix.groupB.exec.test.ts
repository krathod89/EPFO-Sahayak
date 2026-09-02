// Executes test-matrix.json's orchestration areas (priority ranking, the full post-rejection
// flow, grievance generation, schema/cross-field validation, pre-filing readiness). See
// matrix-runner.ts for the shared execution/assertion logic.
import { runMatrixAreas } from "./matrix-runner";

runMatrixAreas(["prioritize", "post-rejection-flow", "grievance", "schema-validation", "pre-filing-readiness"]);
