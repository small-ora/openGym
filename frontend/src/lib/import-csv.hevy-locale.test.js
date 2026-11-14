import { describe, expect, it } from 'vitest'
import { parseWhen } from './import-csv.js'
import { parseImportFile } from './import-apps.js'

// Hevy writes the date in the language the app is set to. A Chinese-language export writes
// "30 10月 2026, 09:52": day, month number + 月, year, 24-hour time (and zh-TW can put
// 上午/下午 in front of a 12-hour one). None of those shapes were readable, so every row of a
// Chinese export was dropped at the date gate and the app said there was nothing to import.
const H = 3600000, M = 60000

describe('Chinese dates in a Hevy export', () => {
  it('reads a day-first date with the month word after its number', () => {
    expect(parseWhen('30 10月 2026, 09:52')).toEqual({ d: '2026-10-30', t: 9 * H + 52 * M })
    expect(parseWhen('3 9月 2026, 14:08')).toEqual({ d: '2026-09-03', t: 14 * H + 8 * M })
  })

  it('accepts a date with no time', () => {
    expect(parseWhen('30 10月 2026')).toEqual({ d: '2026-10-30', t: null })
  })

  it('reads the 年月日 shape too', () => {
    expect(parseWhen('2026年10月30日 09:52')).toEqual({ d: '2026-10-30', t: 9 * H + 52 * M })
    expect(parseWhen('2026年1月1日')).toEqual({ d: '2026-01-01', t: null })
  })

  // zh-TW writes a 12-hour clock with a day-period word in front: 上午/凌晨/早上 are the
  // morning, 中午/下午/晚上 the afternoon and evening. 12 is the edge on both sides.
  it('applies a Chinese day-period word to a 12-hour time', () => {
    expect(parseWhen('30 10月 2026, 下午6:00')).toEqual({ d: '2026-10-30', t: 18 * H })
    expect(parseWhen('2026年10月30日 上午9:05')).toEqual({ d: '2026-10-30', t: 9 * H + 5 * M })
    expect(parseWhen('2026年10月30日 下午12:04')).toEqual({ d: '2026-10-30', t: 12 * H + 4 * M })
    expect(parseWhen('2026年10月30日 上午12:30')).toEqual({ d: '2026-10-30', t: 30 * M })
    expect(parseWhen('2026年10月30日 中午12:00')).toEqual({ d: '2026-10-30', t: 12 * H })
    expect(parseWhen('2026年10月30日 晚上8:15')).toEqual({ d: '2026-10-30', t: 20 * H + 15 * M })
    expect(parseWhen('2026年10月30日 凌晨1:10')).toEqual({ d: '2026-10-30', t: H + 10 * M })
  })

  it('still rejects impossible Chinese dates', () => {
    expect(parseWhen('32 10月 2026')).toBeNull()
    expect(parseWhen('30 13月 2026')).toBeNull()
    expect(parseWhen('2026年2月30日')).toBeNull()
    expect(parseWhen('2026年10月30日 25:00')).toBeNull()
  })

  it('leaves the other date formats alone', () => {
    expect(parseWhen('22 Dec 2025, 08:00')).toEqual({ d: '2025-12-22', t: 8 * H })
    expect(parseWhen('21 août 2024, 18:00')).toEqual({ d: '2024-08-21', t: 18 * H })
    expect(parseWhen('2026-08-08 18:05:00')).toEqual({ d: '2026-08-08', t: 18 * H + 5 * M })
  })
})

const ZH_HEVY = [
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
  '"腿","30 10月 2026, 09:52","30 10月 2026, 10:52","","腿举（器械）",,"",0,"normal",70,18,,,',
  '"腿","30 10月 2026, 09:52","30 10月 2026, 10:52","","腿举（器械）",,"",1,"normal",70,12,,,',
  '"腿","30 10月 2026, 09:52","30 10月 2026, 10:52","","跑步机",,"",0,"normal",,,2.4,2160,',
  '"推","31 10月 2026, 下午8:05","31 10月 2026, 下午9:10","","卧推（哑铃）",,"",0,"normal",30,10,,,',
  '"推","31 10月 2026, 下午8:05","31 10月 2026, 下午9:10","","卧推（哑铃）",,"最后一组很吃力",1,"normal",30,8,,,',
  '"背","1 11月 2026, 08:00","1 11月 2026, 08:40","","划船（哑铃）",,"",0,"normal",25,12,,,',
  '"背","1 11月 2026, 18:00","1 11月 2026, 18:30","","划船（哑铃）",,"",0,"normal",25,12,,,',
].join('\n')

const minutes = w => (w.end - w.start) / 60000

describe('a Hevy export written in Chinese', () => {
  const parsed = parseImportFile(ZH_HEVY, { unit: 'kg' })

  it('recognises the file as Hevy and drops no row', () => {
    expect(parsed.source).toBe('Hevy')
    expect(parsed.skipped).toBe(0)
    expect(parsed.sets).toBe(7)
    expect(parsed.from).toBe('2026-10-30')
    expect(parsed.to).toBe('2026-11-01')
  })

  it('keeps two sessions on one day as two workouts, with their own names and lengths', () => {
    expect(parsed.workouts.map(w => [w.d, w.name])).toEqual([
      ['2026-10-30', '腿'],
      ['2026-10-31', '推'],
      ['2026-11-01', '背'],
      ['2026-11-01', '背'],
    ])
    expect(parsed.workouts.map(minutes)).toEqual([60, 65, 40, 30])
    const [legs, push] = parsed.workouts
    expect([new Date(legs.start).getHours(), new Date(legs.start).getMinutes()]).toEqual([9, 52])
    expect([new Date(push.start).getHours(), new Date(push.start).getMinutes()]).toEqual([20, 5])
  })

  it('creates the Chinese exercise names as the user’s own exercises with their sets', () => {
    const [legs] = parsed.workouts
    expect(parsed.customEx.map(c => c.n).sort()).toEqual(['卧推（哑铃）', '划船（哑铃）', '跑步机', '腿举（器械）'].sort())
    expect(legs.entries.map(e => e.sets)).toEqual([
      [{ w: 70, r: 18, done: true }, { w: 70, r: 12, done: true }],
      [{ min: 36, speed: 4, done: true }],
    ])
  })

  it('keeps a set note written in Chinese, and the weight and reps as they were', () => {
    const push = parsed.workouts[1]
    expect(push.entries[0].note).toBe('最后一组很吃力')
    expect(push.entries[0].sets).toEqual([{ w: 30, r: 10, done: true }, { w: 30, r: 8, done: true }])
  })
})
