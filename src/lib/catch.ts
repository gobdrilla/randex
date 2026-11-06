import type { TypeId } from "./types.ts";

/** Fangformeln je Generation nach pokewiki.de/Fangrate. */

export type CatchStatus = "none" | "sleep" | "other";

export const CATCH_STATUS_LABELS: Record<CatchStatus, string> = {
  none: "Keiner",
  sleep: "Schlaf/Frost",
  other: "Paralyse/Gift/Verbrennung",
};

export interface Ball {
  id: "poke" | "great" | "ultra" | "net" | "nest" | "dusk" | "quick" | "timer";
  name: string;
  /** Wann der Bonus gilt; ohne = immer */
  when?: string;
  factor: number;
}

/** Bälle des Spiels mit ihrem Faktor; Netz-/Nestball nur, wenn sie bei diesen Typen bzw. diesem Level wirken. */
export function ballsFor(gen: number, types: readonly TypeId[], level: number): Ball[] {
  const balls: Ball[] = [
    { id: "poke", name: "Pokéball", factor: 1 },
    { id: "great", name: "Superball", factor: 1.5 },
    { id: "ultra", name: "Hyperball", factor: 2 },
  ];
  if (gen >= 3 && types.some((t) => t === "water" || t === "bug")) {
    balls.push({ id: "net", name: "Netzball", factor: gen >= 7 ? 3.5 : 3 });
  }
  const nest = Math.max(1, ((gen >= 5 ? 41 : 40) - level) / 10);
  if (gen >= 3 && nest > 1) balls.push({ id: "nest", name: "Nestball", factor: nest });
  if (gen >= 4) {
    balls.push({ id: "dusk", name: "Finsterball", when: "nachts/Höhle", factor: gen >= 7 ? 3 : 3.5 });
    balls.push({ id: "quick", name: "Flottball", when: "1. Runde", factor: gen >= 5 ? 5 : 4 });
  }
  if (gen >= 3) {
    // Faktor steigt je Runde bis ×4: Gen 3/4 um 0,1, ab Gen 5 um 1229/4096 ≈ 0,3
    balls.push({ id: "timer", name: "Timerball", when: gen >= 5 ? "ab Runde 11" : "ab Runde 31", factor: 4 });
  }
  return balls;
}

/**
 * Fangchance pro Wurf (0–1). hp = KP-Anteil 0–1 (0 ≈ 1 KP), level = Level des wilden Pokémon.
 * shortcut: ohne Superfang (Gen 5+), dunkles Gras, O-Kraft und Orden-Malus (Gen 8+), die das Ergebnis
 * nur in Sonderfällen ändern; ergänzen, falls jemand danach fragt.
 */
export function catchChance(gen: number, rate: number, hp: number, status: CatchStatus, ball: Ball, level: number): number {
  if (gen <= 1) return gen1(rate, hp, status, ball.id);
  if (gen === 2) {
    // Bug: nur Schlaf/Frost zählt
    const x = Math.min(255, Math.max(Math.floor(((3 - 2 * hp) * Math.min(255, rate * ball.factor)) / 3), 1) + (status === "sleep" ? 10 : 0));
    return (x + 1) / 256;
  }
  const s = status === "sleep" ? (gen >= 5 ? 2.5 : 2) : status === "other" ? 1.5 : 1;
  // Bonus für niedrige Level: Gen 8 unter Lv. 20, Gen 9 unter Lv. 13
  const low = gen === 8 ? Math.max(1, (30 - level) / 10) : gen >= 9 ? Math.max(1, (36 - 2 * level) / 10) : 1;
  const x = Math.min(255, Math.floor(((3 - 2 * hp) * rate * ball.factor * low) / 3) * s);
  if (x >= 255) return 1;
  if (x <= 0) return 0;
  if (gen <= 4) {
    const y = Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / x))))));
    return Math.min(1, y / 65536) ** 4;
  }
  if (gen === 5) return Math.min(1, Math.floor(65536 / (255 / x) ** 0.25) / 65536) ** 3;
  return Math.min(1, Math.floor(65536 / (255 / x) ** (3 / 16)) / 65536) ** 4;
}

/** Gen 1: eigener Algorithmus mit Zufallsbereich je Ball (Näherung aus dem Pokéwiki). */
function gen1(rate: number, hp: number, status: CatchStatus, ball: Ball["id"]): number {
  const range = ball === "great" ? 201 : ball === "ultra" ? 151 : 256;
  const s = status === "sleep" ? 25 : status === "other" ? 12 : 0;
  // F = KPmax·255/Teiler / ⌊KPakt/4⌋, mit dem KP-Anteil statt absoluter KP
  const f = hp <= 0 ? 255 : Math.min(255, Math.floor((255 * 4) / ((ball === "great" ? 8 : 12) * hp)));
  return Math.min(1, (s + (Math.min(rate + 1, range - s) * (f + 1)) / 256) / range);
}
