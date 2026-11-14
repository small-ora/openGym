import { describe, expect, it } from 'vitest'
import { HEVY_ZH_TITLE_MAP, matchHevyZhTitle, zhTitleKey } from './hevy-zh-titles.js'
import { EXIDX } from './exercises.js'
import { parseImportFile } from './import-apps.js'

// Hevy localizes exercise names to the app's language, so a Chinese export has no English title
// for lib/hevy-id-map.js to look up. lib/hevy-zh-titles.js maps the Chinese names; without it
// every Chinese title became a custom exercise.
describe('Hevy Chinese exercise titles', () => {
  it('maps every row of the table to an exercise the catalogue has', () => {
    for (const [zh, id] of Object.entries(HEVY_ZH_TITLE_MAP)) expect(EXIDX[id], zh).toBeTruthy()
  })

  it('reads the names a Chinese export writes, including the equipment in parentheses', () => {
    const cases = {
      '腿举（器械）': '0739', '腿举（机）': '0739', '哈克深蹲（机械）': '0743',
      '髋关节内收（器械）': '0598', '高位下拉（绳索）': '0150', '阔背肌下拉（滑轮机）': '2330',
      '高位下拉 - 窄握（绳索）': '1047', '坐姿绳索划船 - V把（绳索）': '2661',
      '坐姿绳索划船 - 宽握': '0218', '肩推 （哑铃）': '0405',
      '传教士弯举（哑铃）': '0372', '锤式弯举 （哑铃）': '0313',
      '卷腹（加重）': '0832', '卷腹（负重）': '0832', '蝴蝶机夹胸': '1030',
      '卧推（史密斯机）': '0748', '卧推 （哑铃）': '0289',
      '下斜推胸 （训练机）': '1300', '二头弯举 （训练机）': '0575', '等侧划船 （训练机）': '0571',
      '绳索夹胸交叉': '1269', '平板支撑': '0463', '跑步机': '3666', '攀登': '2311',
      '俯身划船  (杠铃）': '0027', '背部伸展 (Weighted Hyperextension)': '5035',
      '负重背部伸展（罗马椅）': '5035', '背部伸展': '1860', '山羊挺身': '1860', '面拉': '7744', '胸推（器械）': '0577',
      '上斜卧推（哑铃）': '0314', '下斜卧推（哑铃）': '0301',
      '单杠曲腿上举': '9819', '单车式卷腹': '6211', '悬垂举腿': '0472',
      '三头肌下压': '0241', '三头肌绳索下压': '0200', '单侧划船（器械）': '1235',
    }
    for (const [zh, id] of Object.entries(cases)) expect(matchHevyZhTitle(zh), zh).toBe(id)
  })

  it('does not guess an equipment the table does not know', () => {
    // The generated English map refuses the same guess ("squat (machine)" is never the barbell
    // squat): a custom exercise beats the wrong one.
    expect(matchHevyZhTitle('腿举（弹力带）')).toBeNull()
    expect(matchHevyZhTitle('卧推（弹力带）')).toBeNull()
    expect(matchHevyZhTitle('深蹲（器械）')).toBeNull()
    // A bare movement name still has its canonical entry.
    expect(matchHevyZhTitle('腿举')).toBe('0739')
    expect(matchHevyZhTitle('深蹲')).toBe('0043')
  })

  it('leaves names it does not know, and English titles, to the other matchers', () => {
    expect(matchHevyZhTitle('船式摇摆')).toBeNull()
    expect(matchHevyZhTitle('Seated Cable Row - V Grip (Cable)')).toBeNull()
    expect(matchHevyZhTitle('')).toBeNull()
  })

  it('folds equipment words and spacing into the key the table is written in', () => {
    expect(zhTitleKey('  卧推 （哑铃） ')).toBe('卧推(哑铃)')
    expect(zhTitleKey('二头弯举（训练机）')).toBe('二头弯举(器械)')
    expect(zhTitleKey('卷腹（加重）')).toBe('卷腹(负重)')
    expect(zhTitleKey('腿部伸展（机器）')).toBe('腿部伸展(器械)')
  })
})

const HEAD = '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"'
const row = (title, date, ex, idx, w, r) => `"${title}","${date} 18:00","${date} 19:00","","${ex}",,"",${idx},normal,${w},${r},,,`
const ZH_CSV = [
  HEAD,
  row('推', '3 9月 2026', '卧推 （哑铃）', 0, 30, 10),
  row('推', '3 9月 2026', '卧推 （哑铃）', 1, 30, 8),
  row('推', '3 9月 2026', '船式摇摆', 1, '', 12),
].join('\n')

describe('a Chinese Hevy CSV and the library', () => {
  const parsed = parseImportFile(ZH_CSV, { unit: 'kg' })

  it('imports a known Chinese title onto its library exercise', () => {
    expect(parsed.source).toBe('Hevy')
    expect(parsed.workouts[0].entries[0].id).toBe('0289')
    expect(parsed.workouts[0].entries[0].sets).toEqual([{ w: 30, r: 10, done: true }, { w: 30, r: 8, done: true }])
  })

  it('keeps a name it cannot match as the user’s own exercise', () => {
    expect(parsed.customEx.map(c => c.n)).toEqual(['船式摇摆'])
    expect(parsed.unmatchedNames).toEqual(['船式摇摆'])
  })
})
