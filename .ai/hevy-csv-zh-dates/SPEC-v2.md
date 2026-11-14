# SPEC v2 — HEVY CSV import, round 2: Chinese exercise names + training plans

Status: frozen before implementation (round 2). Supersedes nothing in SPEC v1: v1's AC1–AC7 stay
true. Level: **L2** (shared importer + routine merge path; user-visible data; no dependency,
schema or red-line change).

## Why (user, 2026-11-15)

> 导入的时候，这些动作能不能匹配一下它内部的动作库？就是中文的名称。
> 我在 HEVY 导出的这些训练计划是分成三个训练计划的，但是导入它没有把这些训练计划导入…
> 能不能把这个也添加进导入？

Two gaps in the round-1 result on the user's real export:

1. **Chinese exercise names were not matched.** Every Chinese title became "your own exercise"
   (41 of them). The catalogue has Chinese names (catalogue/i18n/zh.json); the Hevy title table
   (`hevy-id-map.js`) only holds English titles, and the English word-bag cannot read Chinese.
2. **The training plans did not arrive.** Hevy's CSV has no routines section: it is a history
   export (one row per set, workout title on every row). The user's three plans are visible only
   as the repeating workout titles (胸+三头 / 肩和腿 / 背+二头) and what each day logs. Importing
   the history alone left them without plans.

## Goal

On the user's real 1,159-row export: Chinese exercise titles land on the library where the name
is known, and the history yields their three training plans (one routine per training day, named
as Hevy named it) in the same import, without touching what already imported correctly.

## Acceptance criteria (frozen)

| # | Observable behaviour | How verified |
|---|---|---|
| AC8 | Hevy CSV titles in Chinese resolve to the catalogue exercise the name means, using a curated map built from the app's own Chinese vocabulary: equipment in parentheses is normalized (机械/机器/训练机/机 → 器械, 加重 → 负重), a bare base name falls back to the canonical entry, an unknown name stays a custom exercise. Every mapped id exists in the catalogue. | unit tests in `import-csv.hevy-zh.test.js`; table sanity test |
| AC9 | On the user's real export, matched Chinese titles go from 2 to **42 of 43 titles** (33 distinct library exercises); only 船式摇摆 stays a custom exercise. | evidence: parse summary over `.ai/…/evidence/user-export.csv` |
| AC10 | A Hevy CSV also produces routines: each workout title used **at least twice** becomes one routine, named as the title, with its exercises in order, sets = work sets of the most typical session, reps = the rep count most sets used, weight = the heaviest set (timed sets keep `mode: time`; cardio keeps min/speed). One-off titles make no routine. | `import-apps.hevy-routines.test.js` |
| AC11 | A renamed training day is one routine, under the newer name: an older title whose last session closely matches the newer title's first session, with disjoint periods and a gap ≤ 45 days, merges into the newer title. Titles trained side by side never merge. | routine tests (rename, side-by-side) |
| AC12 | On the user's real export the import yields exactly **3 routines**: 胸+三头 (6 exercises), 肩和腿 (5), 背+二头 (5). Every routine exercise id is a library id or an exercise the same import created; slots are valid (sets 1–20, reps/weight in range). | evidence: parse + merge summary over the real file |
| AC13 | The routines go through the existing routine path: they appear in the import summary (Routines tile), merge via `mergeImportedRoutines`, and importing the same file twice adds no duplicate plans (stable `hevycsv|<name>` importKey). Other apps' CSV imports are unchanged (no derived plans outside Hevy CSV). | routine tests; full suite |
| AC14 | Docs state that Hevy's dates and exercise names follow the app's language (Chinese included) and that repeated workout titles become routines. Full frontend suite green; no dependency, UI string, lockfile, CHANGELOG or generated-catalogue change. | docs diff; `npm test` |

## Non-goals

- Translating arbitrary/unseen Chinese names: the table is curated (103 entries, from the real
  export plus everyday vocabulary). An unknown title stays a custom exercise, as documented.
- zh-TW (Traditional) titles: not covered; Hevy's zh-TW export was not available.
- Importing Hevy's *actual routine definitions*: the CSV does not contain them; the routines are
  derived from history. The Hevy API import keeps its own routine import.
- Weekly scheduling/weekday assignment of the derived routines; emoji inference; supersets in
  derived routines.
- Reworking the existing "plank exports as cardio" behaviour of Hevy timed holds.

## Risks

- The Chinese map is hand-curated: a wrong row would file history under the wrong exercise. Every
  row is test-asserted and the mapped English names were reviewed against the catalogue; an
  unknown name still falls back to a custom exercise rather than a guess.
- Routine derivation is heuristic (title = training day, rename rule). It only reads repeated
  titles and never overwrites existing routines (importKey dedupe); the import summary shows the
  plans before anything is written.
- `parseImportFile` is shared: derivation is gated to `source === 'Hevy'` and covered by a
  "Strong file gets no routines" test.
