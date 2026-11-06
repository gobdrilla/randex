import { test } from "node:test";
import assert from "node:assert/strict";
import { ballsFor, catchChance } from "./catch.ts";

const [poke, great, ultra] = ballsFor(4, [], 50);
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} ≠ ${expected}`);

test("catchChance: Gen 3–4 mit Schüttelproben", () => {
  near(catchChance(4, 3, 1, "none", poke, 50), 0.00416);
  near(catchChance(4, 45, 0, "sleep", ultra, 50), 0.7847);
  assert.equal(catchChance(3, 255, 0, "none", poke, 50), 1);
  near(catchChance(3, 255, 1, "none", poke, 50), 0.3369);
});

test("catchChance: Gen 6+ mit Statusfaktor 2,5", () => {
  near(catchChance(6, 45, 0, "sleep", ultra, 50), 0.9104);
});

test("catchChance: Gen 1 und 2 eigene Formeln, mehr KP-Verlust hilft immer", () => {
  for (const gen of [1, 2, 3, 5, 7]) {
    assert.ok(catchChance(gen, 45, 0, "none", great, 50) > catchChance(gen, 45, 1, "none", great, 50), `Gen ${gen}`);
  }
  near(catchChance(2, 3, 1, "none", poke, 50), 2 / 256);
});

test("ballsFor: Netzball nur bei Wasser/Käfer, Flott-/Finsterball ab Gen 4, Timerball ab Gen 3", () => {
  assert.deepEqual(ballsFor(3, ["water"], 50).map((b) => b.id), ["poke", "great", "ultra", "net", "timer"]);
  assert.deepEqual(ballsFor(5, ["fire"], 50).map((b) => b.id), ["poke", "great", "ultra", "dusk", "quick", "timer"]);
  assert.equal(ballsFor(5, [], 50).find((b) => b.id === "quick")?.factor, 5);
  assert.equal(ballsFor(3, [], 50).find((b) => b.id === "timer")?.when, "ab Runde 31");
});

test("Level: Nestball nur unter Lv. 30 (Gen 3/4) bzw. 31 (ab Gen 5), Bonus ab Gen 8", () => {
  assert.equal(ballsFor(4, [], 30).some((b) => b.id === "nest"), false);
  assert.equal(ballsFor(5, [], 30).find((b) => b.id === "nest")?.factor, 1.1);
  assert.equal(ballsFor(5, [], 1).find((b) => b.id === "nest")?.factor, 4);
  near(catchChance(7, 45, 1, "none", poke, 5), catchChance(7, 45, 1, "none", poke, 50));
  assert.ok(catchChance(8, 45, 1, "none", poke, 5) > catchChance(8, 45, 1, "none", poke, 20));
  near(catchChance(8, 45, 1, "none", poke, 20), catchChance(8, 45, 1, "none", poke, 50));
  near(catchChance(9, 45, 1, "none", poke, 13), catchChance(9, 45, 1, "none", poke, 50));
});
