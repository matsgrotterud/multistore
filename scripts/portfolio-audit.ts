import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { collectDatabaseEvidence } from "@/lib/portfolio-audit/collect-db-evidence";
import { collectRepoEvidence } from "@/lib/portfolio-audit/collect-repo-evidence";
import { evaluateGate } from "@/lib/portfolio-audit/evaluate-gate";
import { stableJson } from "@/lib/portfolio-audit/stable-json";

loadEnvConfig(process.cwd(), true);

async function main(): Promise<void> {
  const policyPath = path.join(process.cwd(), "config/policies/stage-gates.v1.json");
  const policy = JSON.parse(fs.readFileSync(policyPath, "utf8")) as unknown;
  const database = await collectDatabaseEvidence();
  const evidence = [
    ...collectRepoEvidence({ typecheckPassed: process.argv.includes("--typecheck-passed") }),
    ...database.evidence,
  ].sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
  const gate = evaluateGate(policy, evidence);

  const report = {
    schemaVersion: 1,
    readiness: gate.decision === "PASS" ? "SCALE_READY" : "NOT_SCALE_READY",
    gate,
    evidence,
    aggregateCounts: database.counts,
    limitations: [
      "External DNS, TLS, Stripe, supplier, legal and browser evidence are not attested by this offline report.",
      "Passing this report is necessary but never sufficient for production launch.",
    ],
  };

  process.stdout.write(stableJson(report));
  if (gate.decision !== "PASS") process.exitCode = 2;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Portfolio audit failed";
  process.stderr.write(`portfolio-audit: ${message}\n`);
  process.exitCode = 1;
});
