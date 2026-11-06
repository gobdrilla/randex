<script lang="ts">
  import { app } from "$lib/runs.svelte.ts";
  import { clampLevel } from "$lib/utils";
  import { ballsFor, catchChance, CATCH_STATUS_LABELS, type CatchStatus } from "$lib/catch.ts";
  import type { TypeId } from "$lib/types.ts";
  import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
  import { Input } from "$lib/components/ui/input";
  import { EmptyState, Field, Hint, SegmentItem, StatBar } from "$lib/components/kit";
  import ItemIcon from "../ItemIcon.svelte";

  let { captureRate, types }: { captureRate: number; types: readonly TypeId[] } = $props();

  // Fangen ohne Kampf bzw. eigenes System
  const UNSUPPORTED = new Set(["legends-arceus", "lets-go-pikachu", "lets-go-eevee"]);
  const HP_STEPS: [string, number][] = [
    ["Voll", 1],
    ["50 %", 0.5],
    ["25 %", 0.25],
    ["10 %", 0.1],
    ["1 KP", 0],
  ];

  const uid = $props.id();
  let hp = $state("1");
  let status = $state<CatchStatus>("none");
  let level = $state(10);

  const gen = $derived(app.data?.game.generation ?? 0);
  const supported = $derived(!!app.current && !UNSUPPORTED.has(app.current.gameId));
  const rows = $derived(
    ballsFor(gen, types, level).map((ball) => ({ ball, chance: catchChance(gen, captureRate, Number(hp), status, ball, level) })),
  );

  const percent = (p: number) => `${(p * 100).toLocaleString("de-DE", { maximumFractionDigits: p < 0.1 ? 1 : 0 })} %`;
  /** Würfe, bis man mit 90 % Wahrscheinlichkeit gefangen hat */
  const throwsFor90 = (p: number) => (p >= 1 ? 1 : Math.ceil(Math.log(0.1) / Math.log(1 - p)));
</script>

{#if !supported}
  <EmptyState variant="inline">In diesem Spiel wird anders gefangen, dafür gibt es keinen Rechner.</EmptyState>
{:else}
  <div class="flex flex-col gap-3">
    <Hint>Fangrate {captureRate}</Hint>
    <Field label="Level" for="{uid}-level">
      <Input
        id="{uid}-level"
        type="number"
        min={1}
        max={100}
        value={level}
        class="w-20"
        onchange={(e) => (level = clampLevel(e.currentTarget.valueAsNumber))}
      />
    </Field>
    <div class="flex flex-col gap-1">
      <span class="text-sm font-medium" id="{uid}-hp">KP</span>
      <ToggleGroup.Root
        type="single"
        variant="outline"
        size="sm"
        class="flex-wrap"
        value={hp}
        onValueChange={(v) => v && (hp = v)}
        aria-labelledby="{uid}-hp"
      >
        {#each HP_STEPS as [label, value] (value)}
          <SegmentItem value={String(value)}>{label}</SegmentItem>
        {/each}
      </ToggleGroup.Root>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-sm font-medium" id="{uid}-status">Status</span>
      <ToggleGroup.Root
        type="single"
        variant="outline"
        size="sm"
        class="flex-wrap"
        value={status}
        onValueChange={(v) => v && (status = v as CatchStatus)}
        aria-labelledby="{uid}-status"
      >
        {#each Object.entries(CATCH_STATUS_LABELS) as [value, label] (value)}
          <SegmentItem {value}>{label}</SegmentItem>
        {/each}
      </ToggleGroup.Root>
    </div>
    <ul class="flex flex-col gap-2 text-sm">
      {#each rows as { ball, chance } (ball.id)}
        <li class="grid grid-cols-[auto_minmax(0,9rem)_1fr_auto] items-center gap-2">
          <ItemIcon src="/items/ball-{ball.id}.png" class="[image-rendering:pixelated]" />
          <span class="flex flex-col leading-tight">
            {ball.name}
            {#if ball.when}<span class="text-xs text-muted-foreground">{ball.when}</span>{/if}
          </span>
          <StatBar value={chance} max={1} class="bg-primary" />
          <span class="text-right tabular-nums">
            <span class="font-semibold">{percent(chance)}</span>
            <span class="block text-xs text-muted-foreground">
              {chance > 0 ? `90 % nach ${throwsFor90(chance)} ${throwsFor90(chance) === 1 ? "Wurf" : "Würfen"}` : "–"}
            </span>
          </span>
        </li>
      {/each}
    </ul>
  </div>
{/if}
