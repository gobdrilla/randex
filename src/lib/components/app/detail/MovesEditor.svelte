<script lang="ts">
  import { clampLevel } from "$lib/utils";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Chip, EditRow, Section } from "$lib/components/kit";
  import { app, updateEntry } from "$lib/runs.svelte.ts";
  import type { LevelMove, PokemonEntry } from "$lib/types.ts";
  import NamePicker from "./NamePicker.svelte";

  let { speciesId, entry }: { speciesId: number; entry: PokemonEntry } = $props();

  const moves = $derived(app.data?.moves ?? []);
  const levelMoves = $derived(entry.levelMoves ?? []);
  const tmMoves = $derived(entry.tmMoves ?? []);
  let newLevel = $state(1);


  // Nur beim Hinzufügen sortieren: Zeilen sind per Index gekeyt, Umsortieren verschöbe den Fokus.
  function setLevelMoves(list: LevelMove[]) {
    updateEntry(speciesId, { levelMoves: list.length ? list : undefined });
  }

  function setTmMoves(list: string[]) {
    updateEntry(speciesId, { tmMoves: list.length ? list : undefined });
  }
</script>

<div class="flex flex-col gap-4">
  <Section title="Level-Up">
    <ul class="flex flex-col gap-2">
      {#each levelMoves as lm, i (i)}
        <EditRow removeLabel="{lm.move} entfernen" onRemove={() => setLevelMoves(levelMoves.filter((_, j) => j !== i))}>
          <Input
            type="number"
            min={1}
            max={100}
            value={lm.level}
            aria-label="Level von {lm.move}"
            class="w-20 shrink-0"
            onchange={(e) =>
              setLevelMoves(levelMoves.map((m, j) => (j === i ? { ...m, level: clampLevel(e.currentTarget.valueAsNumber) } : m)))}
          />
          <NamePicker
            items={moves}
            value={lm.move}
            label="Attacke {i + 1}"
            onSelect={(move) => setLevelMoves(levelMoves.map((m, j) => (j === i ? { ...m, move } : m)))}
          />
        </EditRow>
      {/each}
      <EditRow>
        <Input
          type="number"
          min={1}
          max={100}
          bind:value={newLevel}
          aria-label="Level der neuen Attacke"
          class="w-20 shrink-0"
        />
        <NamePicker
          items={moves}
          value=""
          placeholder="Attacke hinzufügen …"
          onSelect={(move) =>
            setLevelMoves([...levelMoves, { level: clampLevel(newLevel), move }].sort((a, b) => a.level - b.level))}
        />
      </EditRow>
    </ul>
  </Section>

  <Section title="TM/VM">
    {#if tmMoves.length}
      <ul class="flex flex-wrap gap-1.5">
        {#each tmMoves as move, i (i)}
          <li>
            <Chip removeLabel="{move} entfernen" onRemove={() => setTmMoves(tmMoves.filter((_, j) => j !== i))}>
              {move}
            </Chip>
          </li>
        {/each}
      </ul>
    {/if}
    <ul>
      <EditRow>
        <NamePicker
          items={moves}
          value=""
          placeholder="TM/VM-Attacke hinzufügen …"
          onSelect={(move) => !tmMoves.includes(move) && setTmMoves([...tmMoves, move])}
        />
      </EditRow>
    </ul>
  </Section>
</div>
