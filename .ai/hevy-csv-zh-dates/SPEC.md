# SPEC v1 — HEVY CSV import for Chinese-language exports

Status: frozen before implementation. Level: **L2** (shared pure helper used by every CSV
importer, multi-file incl. docs, user-visible data import; no dependency/schema/red-line change).

## Problem

The user's HEVY export cannot be imported. Their file is a stock Hevy CSV: English header,
Chinese workout/exercise titles, and `start_time`/`end_time` written the way Hevy writes dates
when the app language is Chinese: `30 10月 2026, 09:52` (day, month number + `月`, year, time).

openGym's `parseWhen()` does not know a Chinese date shape, returns `null` for every row, and
the importer drops all 1159 rows → UI says "Nothing to import from that file".

Reproduced on the real file (`recon.md`): `source 'Hevy'`, `workouts 0`, `skipped 1159`.

## Goal

That export imports faithfully: every workout, set, weight, rep, time, distance, note and
workout name lands, with nothing silently dropped.

## Acceptance criteria (frozen)

| # | Observable behaviour | How verified |
|---|---|---|
| AC1 | `parseWhen` reads Chinese day-first dates: `D M月 YYYY` with optional `, HH:MM`, e.g. `30 10月 2026, 09:52` → `{d:'2026-10-30', t:35520000}`; single-digit day/month and missing time work; invalid dates (`32 10月 2026`, `30 13月 2026`) still return `null`. | unit tests in `frontend/src/lib/import-csv.hevy-locale.test.js` |
| AC2 | `parseWhen` reads Chinese year-first dates `YYYY年M月D日` with optional `, HH:MM`, and Chinese day-period words before a time: `上午`/`凌晨`/`早上` → 0–11 h, `中午`/`下午`/`晚上` → 12–23 h, with 12-hour edge cases (上午12:30 → 00:30, 下午12:04 → 12:04). | unit tests |
| AC3 | No behaviour change for the formats already supported (ISO, numeric, English/French/etc. word months, 12-hour English AM/PM left as today). | existing `import-csv*.test.js` suites stay green; no assertion touched |
| AC4 | A Chinese-language Hevy CSV imports end to end through `parseImportFile()`: source `Hevy`, 0 skipped, workouts grouped per session (two sessions on one day stay two), Chinese workout names kept, Chinese exercise titles become the user's own exercises, weights/reps/timed seconds/cardio distance kept, exercise notes kept, workout start/end derived from the file. | fixture test in the new test file + manual run on the user's real file (evidence) |
| AC5 | The user's real 1159-row export imports with **60 workouts, 1159 sets, 0 skipped**, from 2026-07-14 to 2026-10-30. | evidence: parse summary command + output, real file kept outside git |
| AC6 | `docs/DATA_IMPORTS.md` states that Hevy's dates are written in the app's language (Chinese included) and are read as written. | read the doc diff |
| AC7 | Full frontend suite green; no new dependency; no UI string; no CHANGELOG edit. | `cd frontend && npm test` |

## Non-goals

- English 12-hour AM/PM parsing (`Dec 27, 2025, 12:04 PM`) — tracked separately as
  DuarteSantos8/openGym#1121, already claimed by another contributor.
- Mapping Chinese Hevy exercise titles onto openGym's catalogue (openGym's zh translations and
  Hevy's zh titles use different naming; unmatched names become custom exercises, which is the
  documented behaviour for every app).
- Body-part inference from Chinese exercise names, timed-hold detection for Chinese names.
- Other CJK Hevy locales (Japanese/Korean), zh-TW sample verification (shape covered by unit
  tests, but no real zh-TW export was available).
- UI copy changes, new import sheet, Hevy API import.

## Risks

- `parseWhen` is shared: a sloppy regex could reinterpret an existing format. Mitigation:
  Chinese shapes are separate branches that cannot match ISO/word/numeric inputs (they require
  `月`/`年`/`日`), plus the existing suites are run unchanged.
- `calendarDay()` still applies its guards (real calendar day, no future dates) to Chinese dates.
- No sample zh-TW file; day-period words are covered by unit tests only.

## Contract / compatibility

Internal helper only, no API/state schema change. Stored workout shape unchanged.
