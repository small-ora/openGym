# SPEC v2.1 — review-driven corrections to SPEC v2

Frozen after the independent round-2 review (REVIEW.md), before the fixes were committed.
SPEC v2's goals and ACs stand; four corrections below. Old → new is recorded here and in
ACCEPTANCE.

## Corrections

| # | v2 said | v2.1 says | Why |
|---|---|---|---|
| AC9 | 42 of 43 titles matched; **33** distinct library exercises | 42 of 43 titles matched; **34** distinct library exercises | Two Hevy exercises were collapsing onto one catalogue entry: 高位下拉（绳索）→ 0150 "cable bar lateral pulldown" (as `hevy-id-map.js` maps "lat pulldown (cable)") and 阔背肌下拉（滑轮机）→ 2330 stay apart. The user's history keeps both progressions separate, as an English export of the same file does. |
| AC9b (new) | — | Where the generated English Hevy table (`hevy-id-map.js`) knows the exercise, the Chinese row maps to the **same id**: 背部伸展(hyperextension) → 1860, 负重背部伸展 / 背部伸展 (Weighted Hyperextension) → 5035, 面拉 → 7744 (not a rear-delt row), 高位下拉(cable) → 0150. | Users get the same result whichever language Hevy was in when they exported; the earlier rows contradicted the repo's own verified table (e.g. 背部伸展 → 0573 machine back extension vs 5035 weighted hyperextension). |
| AC10b (new) | base-name fallback for any unknown equipment | a title carrying equipment the table does not know stays a **custom exercise**; only a bare movement name falls back to its canonical entry | Matches the generated English map's rule ("better a custom exercise than a wrong one"): 深蹲（器械）must not become the barbell squat. |
| AC11b (new) | rename = older title's last session vs newer title's first session | additionally the **whole groups' date ranges** must be disjoint before merging | A transitive chain could fold two days trained side by side into one later look-alike. |
| AC13b (new) | routine `importKey` = normalized title | routine `importKey` = the **exact trimmed title** | Two plans split by the 45-day rename rule shared one normalized key, so one was silently skipped on merge ("胸 + 三头" vs "胸+三头"). |

## Evidence numbers (final)

Real export: 60 workouts / 1159 sets / 0 skipped / 42 of 43 titles matched / 34 distinct library
exercises / 船式摇摆 the only custom exercise / 3 routines 胸+三头(6), 肩和腿(5), 背+二头(5),
all slot ids library ids, no duplicates on re-import.
