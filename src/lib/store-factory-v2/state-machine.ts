import type {
  BuildPhaseV1,
  BuildRunStateV1,
  BuildTerminalStateV1,
  RevisionStatusV1,
} from "./contracts";
import { StoreFactoryV2Error } from "./errors";

const NEXT_BUILD_PHASE: Readonly<
  Partial<Record<BuildPhaseV1, BuildPhaseV1>>
> = {
  RECEIVED: "VALIDATING",
  VALIDATING: "ASSEMBLING_REVISION",
  ASSEMBLING_REVISION: "PERSISTING_REVISION",
  PERSISTING_REVISION: "COMPLETED",
};

export function assertBuildPhaseTransitionV1(
  current: BuildPhaseV1,
  next: BuildPhaseV1
): void {
  if (NEXT_BUILD_PHASE[current] !== next) {
    throw new StoreFactoryV2Error(
      "BUILD_PHASE_TRANSITION_INVALID",
      `Build phase cannot move from ${current} to ${next}.`
    );
  }
}

export function assertBuildStateTransitionV1(
  current: BuildRunStateV1,
  next: BuildTerminalStateV1
): void {
  if (current !== "RUNNING") {
    throw new StoreFactoryV2Error(
      "BUILD_STATE_TRANSITION_INVALID",
      `Terminal build state ${current} cannot move to ${next}.`
    );
  }
}

export function assertRevisionStatusTransitionV1(
  current: RevisionStatusV1,
  next: RevisionStatusV1
): void {
  const valid =
    current === "DRAFT" && (next === "APPROVED" || next === "REJECTED");
  if (!valid) {
    throw new StoreFactoryV2Error(
      "REVISION_TRANSITION_INVALID",
      `Revision status cannot move from ${current} to ${next}.`
    );
  }
}

export function isTerminalBuildStateV1(
  state: BuildRunStateV1
): state is BuildTerminalStateV1 {
  return state !== "RUNNING";
}
