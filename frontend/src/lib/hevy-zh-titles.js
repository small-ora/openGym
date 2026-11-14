// Hevy's exercise titles written in Chinese, mapped to the catalogue exercise they mean.
//
// Hevy localizes exercise names to the language the app is set to; hevy-id-map.js covers the
// English titles (its HEVY_TITLE_MAP), and this table covers the Chinese ones. Hand-curated
// against a real 1,159-row Chinese export and checked name by name against the catalogue, the
// same way ALIAS_EX in import-csv.js is: the equipment in parentheses is normalized (机械/机器/
// 训练机/机 → 器械, 加重 → 负重, 滑轮 → 滑轮机) and a bare base name (腿举 for every leg press
// variant Hevy writes) falls back to the canonical entry for that movement.
//
// A title the table does not know stays the user's own exercise, which is what happens to any
// name the library does not recognise: nothing is dropped and nothing is guessed.
import { EXIDX, canonicalExId } from './exercises.js'

export const HEVY_ZH_TITLE_MAP = {
  // 三头 / 二头
  '三头肌下压': '0241', '三头肌绳索下压': '0200', '三头肌下压(绳索)': '0241',
  '二头弯举': '0294', '二头弯举(器械)': '0575',
  '传教士弯举': '0372', '传教士弯举(哑铃)': '0372',
  '锤式弯举': '0313', '锤式弯举(哑铃)': '0313',
  // 胸
  '卧推': '0025', '卧推(哑铃)': '0289', '卧推(史密斯机)': '0748',
  '上斜卧推': '0047', '上斜卧推(哑铃)': '0314', '上斜推胸': '0047', '上斜推胸(哑铃)': '0314',
  '下斜卧推': '0033', '下斜卧推(哑铃)': '0301', '下斜推胸': '0033', '下斜推胸(哑铃)': '0301',
  '下斜推胸(器械)': '1300', '胸推': '0577', '胸推(器械)': '0577',
  '蝴蝶机夹胸': '1030', '绳索夹胸交叉': '1269', '绳索夹胸': '1269',
  // 背
  '俯身划船': '0027', '俯身划船(杠铃)': '0027',
  '单侧划船': '1235', '单侧划船(器械)': '1235',
  '等侧划船': '0571', '等侧划船(器械)': '0571',
  '高位下拉': '2330', '高位下拉(绳索)': '2330', '阔背肌下拉': '2330', '阔背肌下拉(滑轮机)': '2330',
  '高位下拉-窄握': '1047', '高位下拉-窄握(绳索)': '1047',
  '坐姿绳索划船': '0861', '坐姿绳索划船-v把': '2661', '坐姿绳索划船-v把(绳索)': '2661',
  '坐姿绳索划船-宽握': '0218', '坐姿绳索划船-宽握(绳索)': '0218',
  '背部伸展': '0573', '负重背部伸展': '0573', '负重背部伸展(罗马椅)': '0573',
  // 肩
  '肩推': '0405', '肩推(哑铃)': '0405',
  // 腹
  '卷腹': '0274', '卷腹(负重)': '0832',
  '单车式卷腹': '6211', '悬垂举腿': '0472', '单杠曲腿上举': '9819', '平板支撑': '0463',
  // 腿
  '腿举': '0739', '腿举(器械)': '0739',
  '哈克深蹲': '0743', '哈克深蹲(器械)': '0743',
  '腿屈伸': '0585', '腿屈伸(器械)': '0585', '腿部伸展': '0585', '腿部伸展(器械)': '0585',
  '髋关节内收': '0598', '髋关节内收(器械)': '0598',
  // 有氧
  '跑步机': '3666', '攀登': '2311', '爬楼机': '2311',
  // The everyday vocabulary the table above does not happen to use: a second Hevy export (or the
  // same account after new exercises) names these, and each is mapped to the canonical entry the
  // English matcher would pick for the English title.
  '深蹲': '0043', '深蹲(杠铃)': '0043', '深蹲(史密斯机)': '0770',
  '硬拉': '0032', '硬拉(杠铃)': '0032', '罗马尼亚硬拉': '0085', '罗马尼亚硬拉(杠铃)': '0085', '罗马尼亚硬拉(哑铃)': '1459',
  '双杠臂屈伸': '0814', '臂屈伸(双杠)': '0814',
  '侧平举': '0334', '侧平举(哑铃)': '0334', '侧平举(绳索)': '0178',
  '前平举': '0310', '前平举(哑铃)': '0310', '前平举(杠铃)': '0041',
  '提踵': '1372', '站姿提踵': '1372', '坐姿提踵': '0088',
  '腿弯举': '0586', '俯卧腿弯举': '0586', '坐姿腿弯举': '0599',
  '耸肩': '0095', '耸肩(哑铃)': '0406', '耸肩(杠铃)': '0095',
  '弯举': '0294', '弯举(哑铃)': '0294', '弯举(杠铃)': '0031', '弯举(绳索)': '0868',
  '面拉': '0203', '俄罗斯转体': '0687', '山羊挺身': '0573',
  '划船(哑铃)': '0292', '划船(杠铃)': '0027', '划船(器械)': '1350', '划船(绳索)': '0180',
}

// The equipment Hevy writes in parentheses, folded onto the spelling the table above uses.
const ZH_EQUIPMENT = { 机械: '器械', 机器: '器械', 训练机: '器械', 机: '器械', 加重: '负重', 滑轮: '滑轮机' }

/** The key the table is written in: no spaces, ASCII parentheses, folded equipment words. */
export function zhTitleKey(name) {
  const key = String(name || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '')
  return key.replace(/\(([^()]*)\)$/, (all, eq) => '(' + (ZH_EQUIPMENT[eq] || eq) + ')')
}

/** The catalogue id a Chinese Hevy title means, or null when it is not one of the known names. */
export function matchHevyZhTitle(name) {
  const key = zhTitleKey(name)
  if (!key) return null
  // A name with equipment the table has no row for (a new "（弹力带）" say) still means the base
  // movement: "腿举（弹力带）" is a leg press. Only the trailing parentheses are dropped.
  const cut = key.lastIndexOf('(')
  const id = HEVY_ZH_TITLE_MAP[key] || (cut > 0 ? HEVY_ZH_TITLE_MAP[key.slice(0, cut)] : null)
  return id && Object.hasOwn(EXIDX, id) ? canonicalExId(id) : null
}
