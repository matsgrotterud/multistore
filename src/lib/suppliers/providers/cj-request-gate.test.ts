import assert from "node:assert/strict";
import test from "node:test";
import {
  CjCatalogTimeoutError,
  createCjCatalogRequestRunner,
  createCjRequestGate,
} from "./cj-request-gate";

test("concurrent mixed CJ calls are serialized with minimum start spacing", async () => {
  let clock = 10_000;
  const starts: Array<{ name: string; at: number }> = [];
  const sleeps: number[] = [];
  const gate = createCjRequestGate({
    minimumIntervalMs: 1_100,
    now: () => clock,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds);
      clock += milliseconds;
    },
  });

  const call = (name: string) =>
    gate(async () => {
      starts.push({ name, at: clock });
      return name;
    });

  const results = await Promise.all([
    call("health"),
    call("search"),
    call("details"),
    call("order"),
  ]);

  assert.deepEqual(results, ["health", "search", "details", "order"]);
  assert.deepEqual(starts, [
    { name: "health", at: 10_000 },
    { name: "search", at: 11_100 },
    { name: "details", at: 12_200 },
    { name: "order", at: 13_300 },
  ]);
  assert.deepEqual(sleeps, [1_100, 1_100, 1_100]);
});

test("a rejected CJ request does not poison the serial gate", async () => {
  let clock = 20_000;
  const starts: number[] = [];
  const gate = createCjRequestGate({
    minimumIntervalMs: 1_100,
    now: () => clock,
    sleep: async (milliseconds) => {
      clock += milliseconds;
    },
  });

  const failed = gate(async () => {
    starts.push(clock);
    throw new Error("upstream rejected");
  });
  const recovered = gate(async () => {
    starts.push(clock);
    return "recovered";
  });

  await assert.rejects(failed, /upstream rejected/);
  assert.equal(await recovered, "recovered");
  assert.deepEqual(starts, [20_000, 21_100]);
});

test("an aborted catalog request settles before the timeout runner is reused", async () => {
  const events: string[] = [];
  const runCatalogRequest = createCjCatalogRequestRunner({
    defaultTimeoutMs: 100,
  });

  const timedOut = runCatalogRequest({
    timeoutMs: 100,
    request: (signal) =>
      new Promise<never>((_, reject) => {
        events.push("first-start");
        signal.addEventListener(
          "abort",
          () => {
            events.push("first-aborted");
            reject(signal.reason);
          },
          { once: true }
        );
      }),
  });
  await assert.rejects(timedOut, (error) => error instanceof CjCatalogTimeoutError);

  const recovered = runCatalogRequest({
    timeoutMs: 100,
    request: async () => {
      events.push("second-start");
      return "ok";
    },
  });

  assert.equal(await recovered, "ok");
  assert.deepEqual(events, ["first-start", "first-aborted", "second-start"]);
});
