import { describe, expect, it } from 'vitest'
import { freshRoutines, mergeImportedRoutines, parseImportFile } from './import-apps.js'
import { mergeImport } from './import-csv.js'

// Hevy's CSV has no routines: it is a history export, one row per set. The routines are read off
// it in lib/import-apps.js routinesFromHistory(): each workout title is a training day, and its
// most typical session is what that day does. A renamed day (Hevy names are free text) is one
// plan under its newer name, not two.
const HEAD = '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"'
const line = (title, date, ex, idx, { w = '', r = '', km = '', sec = '' } = {}) =>
  `"${title}","${date} 18:00","${date} 19:00","","${ex}",,"",${idx},normal,${w},${r},${km},${sec},`
const csv = rows => [HEAD, ...rows].join('\n')

// A "推" (push) day: two dumbbell bench sets and one incline set.
const pushDay = date => [
  line('推', date, '卧推 （哑铃）', 0, { w: 30, r: 10 }),
  line('推', date, '卧推 （哑铃）', 1, { w: 30, r: 8 }),
  line('推', date, '上斜卧推（哑铃）', 0, { w: 25, r: 12 }),
]
const chestDay = (title, date) => [
  line(title, date, '卧推 （哑铃）', 0, { w: 30, r: 10 }),
  line(title, date, '三头肌下压', 0, { w: 20, r: 12 }),
]

describe('routines read from a Hevy CSV', () => {
  const file = csv([
    ...pushDay('3 9月 2026'),
    ...pushDay('10 9月 2026'),
    line('腿', '4 9月 2026', '腿举（器械）', 0, { w: 100, r: 10 }),
    line('腿', '11 9月 2026', '腿举（器械）', 0, { w: 110, r: 10 }),
  ])
  const parsed = parseImportFile(file, { unit: 'kg' })

  it('makes one routine per repeated training day, named as the workout was', () => {
    expect(parsed.routines.routines.map(r => r.name).sort()).toEqual(['推', '腿'])
    expect(parsed.routines.routines.map(r => r.importKey).sort()).toEqual(['hevycsv|推', 'hevycsv|腿'])
  })

  it('keeps the day’s exercises in order with its sets, reps and load', () => {
    const push = parsed.routines.routines.find(r => r.name === '推')
    expect(push.ex).toEqual([
      { id: '0289', sets: 2, reps: 10, weight: 30 },
      { id: '0314', sets: 1, reps: 12, weight: 25 },
    ])
    const legs = parsed.routines.routines.find(r => r.name === '腿')
    // Same exercise twice: the later session's load is what the plan shows.
    expect(legs.ex).toEqual([{ id: '0739', sets: 1, reps: 10, weight: 110 }])
  })

  it('reads the most typical session when a day’s exercises vary', () => {
    const variable = csv([
      ...pushDay('3 9月 2026'),
      ...pushDay('10 9月 2026'),
      // A one-off variant of the same day: it must not replace the typical list.
      line('推', '17 9月 2026', '蝴蝶机夹胸', 0, { w: 50, r: 15 }),
    ])
    const ex = parseImportFile(variable, { unit: 'kg' }).routines.routines[0].ex
    expect(ex.map(e => e.id)).toEqual(['0289', '0314'])
  })

  it('treats a renamed day as one plan under the newer name', () => {
    const renamed = csv([
      ...chestDay('第一天：胸+三头', '6 7月 2026'),
      ...chestDay('第一天：胸+三头', '13 7月 2026'),
      ...chestDay('第一天：胸+三头', '20 7月 2026'),
      ...chestDay('胸+三头', '27 7月 2026'),
      ...chestDay('胸+三头', '3 8月 2026'),
    ])
    const routines = parseImportFile(renamed, { unit: 'kg' }).routines.routines
    expect(routines.map(r => r.name)).toEqual(['胸+三头'])
  })

  it('keeps two different days that were trained side by side separate', () => {
    const twoDays = csv([
      ...chestDay('A日', '1 9月 2026'),
      ...chestDay('A日', '8 9月 2026'),
      ...chestDay('B日', '2 9月 2026'),
      ...chestDay('B日', '9 9月 2026'),
    ])
    expect(parseImportFile(twoDays, { unit: 'kg' }).routines.routines.map(r => r.name).sort()).toEqual(['A日', 'B日'])
  })

  it('does not make a plan out of a title logged once', () => {
    const oneOff = csv([
      ...pushDay('3 9月 2026'),
      ...pushDay('10 9月 2026'),
      line('随机练', '4 9月 2026', '腿举（器械）', 0, { w: 100, r: 10 }),
    ])
    expect(parseImportFile(oneOff, { unit: 'kg' }).routines.routines.map(r => r.name)).toEqual(['推'])
  })

  it('keeps cardio in its own mode', () => {
    const cardio = csv([
      line('有氧日', '3 9月 2026', '跑步机', 0, { km: 2.4, sec: 2160 }),
      line('有氧日', '10 9月 2026', '跑步机', 0, { km: 2.4, sec: 2160 }),
      line('有氧日', '10 9月 2026', '平板支撑', 0, { sec: 60 }),
    ])
    const ex = parseImportFile(cardio, { unit: 'kg' }).routines.routines[0].ex
    expect(ex[0]).toMatchObject({ id: '3666', min: 36, speed: 4 })
  })

  it('arrives through parseImportFile with the history, and re-importing adds nothing', () => {
    expect(parsed.workouts).toHaveLength(4)
    expect(parsed.routines.routines).toHaveLength(2)

    const S = { workouts: [], customEx: [], exWeights: {}, bodyweight: [], routines: [] }
    mergeImport(S, parsed)
    expect(freshRoutines(S, parsed.routines)).toBe(2)
    expect(mergeImportedRoutines(S, parsed.routines)).toEqual({ added: 2, skipped: 0 })

    // The same file again: the days are already here and the plans keep their importKey.
    expect(freshRoutines(S, parsed.routines)).toBe(0)
    expect(mergeImportedRoutines(S, parsed.routines)).toEqual({ added: 0, skipped: 2 })
    expect(S.routines.map(r => r.name).sort()).toEqual(['推', '腿'])
  })

  it('does not add plans to the files that already export their own routines', () => {
    // A Strong CSV has no routine section either, but its apps keep their plans elsewhere; the
    // derivation stays a Hevy-CSV reader and must not change what another app's file imports.
    const strong = [
      'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
      '2026-04-02 18:05:00,"Upper A",1h 5m,"Bench Press (Barbell)",1,60,8,0,0,"","",8',
      '2026-04-05 17:00:00,"Upper A",52m,"Bench Press (Barbell)",1,60,8,0,0,"","",',
    ].join('\n')
    const p = parseImportFile(strong, { unit: 'kg' })
    expect(p.source).toBe('Strong')
    expect(p.routines).toBeUndefined()
  })
})
