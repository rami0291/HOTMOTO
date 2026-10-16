// 車種の辞書：同じ車種のいろいろな呼び方（日中英の名前、国交省の型式）を 1 つの slug にまとめ、
// 排気量だけが違う兄弟車（レブル 250 / 500 / 1100）を取り違えないようにする。
// 区分は 2 つの軸で持つ。法規がどの車に効くかは、免許ではなく車両の区分で決まることが多い
// （車検は 250cc 超だけ、高速道路は 125cc 超）。同じ普通二輪免許の 250cc と 400cc でも、車検の有無が違う。
//
// 別名の書き方：
// - aliases はその車種だけを指す名前。企業名＋数字だけ（「凯旋400」）や系列名だけ（「レブル」）は複数の車種を指すので書かない。
//   系列名は VEHICLE_FAMILIES に書く。
// - 全角と半角、大文字と小文字、空白・ハイフン・中黒の違いは aliasKey で揃うので書き分けない。
//   簡体字と繁体字（张雪 / 張雪）は揃わないので両方書く。
// - typeCodes は国交省の型式（8BK-MC49）と車台番号の頭（MC49）。リコールの届け出はこれで車種を書く。
//   同じ車台の兄弟車（YZF-R25 と MT-25）は同じ型式を共有するので、型式だけは複数の車種に書いてよい。
// 辞書の規則は tests/vehicles.test.ts が検査する。原文との照合と構造化の工程での使い方は modules/vehicles/ にある。
// 収録範囲・諸元の世代・確認先は docs/vehicles.md。販売中かどうかを示す一覧ではない。
// 同じエンジンの別車種は分け、SP / SE / DCT などの仕様違いは同じ車種にまとめる。

/**
 * 道路運送車両法の区分：車検（小型二輪だけ）、軽二輪の届出、軽自動車税、自賠責、高速道路の通行（軽二輪と小型二輪）が決まる。
 * maxCc はその区分に入る排気量の上限で、この順に当てはめる。
 */
export const VEHICLE_CLASSES = {
  "gentsuki-1": { label: "原付一種", maxCc: 50 },
  "gentsuki-2": { label: "原付二種", maxCc: 125 },
  "kei-nirin": { label: "軽二輪", maxCc: 250 },
  "kogata-nirin": { label: "小型二輪", maxCc: Infinity },
} as const;

/** 道路交通法の運転免許の区分：免許制度の変更、教習、取得の条件が決まる。 */
export const LICENSE_CLASSES = {
  gentsuki: { label: "原付免許", maxCc: 50 },
  "kogata-gentei": { label: "小型限定普通二輪免許", maxCc: 125 },
  "futsu-nirin": { label: "普通二輪免許", maxCc: 400 },
  "oogata-nirin": { label: "大型二輪免許", maxCc: Infinity },
} as const;

export type VehicleClass = keyof typeof VEHICLE_CLASSES;
export type LicenseClass = keyof typeof LICENSE_CLASSES;

/**
 * 系列：記事が排気量を書かずに系列名だけで呼ぶもの（「レブルシリーズ全車にリコール」）。
 * その系列のすべての車種に関わる記事として扱う。系列に入る車種は 2 つ以上で、同じ企業のもの。
 */
export const VEHICLE_FAMILIES = {
  "honda-rebel": { maker: "honda", name: "レブル", aliases: ["レブル", "Rebel"] },
  "honda-super-cub": { maker: "honda", name: "スーパーカブ", aliases: ["スーパーカブ", "Super Cub", "超级幼兽", "超級幼獸"] },
  "honda-cross-cub": { maker: "honda", name: "クロスカブ", aliases: ["クロスカブ", "Cross Cub"] },
  "honda-pcx": { maker: "honda", name: "PCX", aliases: ["PCX"] },
  "honda-forza": { maker: "honda", name: "フォルツァ", aliases: ["フォルツァ", "Forza"] },
  "honda-adv": { maker: "honda", name: "ADV", aliases: ["ホンダADV", "Honda ADV"] },
  "honda-gb350": { maker: "honda", name: "GB350シリーズ", aliases: ["GB350シリーズ", "GB350 series"] },
  "yamaha-mt": { maker: "yamaha", name: "MTシリーズ", aliases: ["MTシリーズ", "Yamaha MT series"] },
  "yamaha-xsr": { maker: "yamaha", name: "XSR", aliases: ["XSR"] },
  "yamaha-nmax": { maker: "yamaha", name: "NMAX", aliases: ["NMAX", "エヌマックス"] },
  "yamaha-tricity": { maker: "yamaha", name: "トリシティ", aliases: ["トリシティ", "Tricity"] },
  "kawasaki-ninja": { maker: "kawasaki", name: "Ninja", aliases: ["Ninja", "ニンジャ", "カワサキ忍者", "川崎忍者"] },
  "kawasaki-versys": { maker: "kawasaki", name: "VERSYS", aliases: ["VERSYS", "ヴェルシス"] },
  "suzuki-v-strom": { maker: "suzuki", name: "Vストローム", aliases: ["Vストローム", "V-Strom"] },
  "suzuki-gixxer": { maker: "suzuki", name: "ジクサー", aliases: ["ジクサー", "Gixxer"] },
  "husqvarna-svartpilen": { maker: "ktm", name: "スヴァルトピレン", aliases: ["スヴァルトピレン", "Svartpilen", "黑箭"] },
  "husqvarna-vitpilen": { maker: "ktm", name: "ヴィットピレン", aliases: ["ヴィットピレン", "Vitpilen", "白箭"] },
  "ktm-duke": { maker: "ktm", name: "DUKE", aliases: ["DUKE", "デューク", "公爵"] },
  "triumph-trident": { maker: "triumph", name: "トライデント", aliases: ["トライデント", "Trident"] },
  "triumph-tiger-sport": { maker: "triumph", name: "タイガースポーツ", aliases: ["タイガースポーツ", "Tiger Sport"] },
  "triumph-speed-twin": { maker: "triumph", name: "スピードツイン", aliases: ["スピードツイン", "Speed Twin"] },
  "royal-enfield-classic": { maker: "royal-enfield", name: "クラシック", aliases: ["Royal Enfield Classic", "ロイヤルエンフィールドクラシック"] },
  "royal-enfield-himalayan": { maker: "royal-enfield", name: "ヒマラヤ", aliases: ["Himalayan", "ヒマラヤ", "ヒマラヤン", "喜马拉雅", "喜馬拉雅"] },
  "aprilia-tuono": { maker: "piaggio", name: "トゥオーノ", aliases: ["Tuono", "トゥオーノ"] },
  "cfmoto-nk": { maker: "cfmoto", name: "NKシリーズ", aliases: ["CFMOTO NKシリーズ", "CFMOTO NK series"] },
} satisfies Record<string, { maker: string; name: string; aliases: string[] }>;

export interface VehicleModel {
  /** taxonomy.ts の ENTITIES のキー。 */
  maker: string;
  family?: keyof typeof VEHICLE_FAMILIES;
  /** 表示名。 */
  name: string;
  /** 区分はここから決まる。公式諸元に小数がある場合は丸めない。新基準原付（125cc 以下・最高出力 4.0kW 以下で原付一種）と電動車（定格出力で決まる）は排気量で決まらないので、加えるときは区分を明示する項目を足す。 */
  displacementCc: number;
  aliases: string[];
  typeCodes?: string[];
}

/** slug → 車種。slug は車種のページとインターフェースでの身元になるので、公開後は変えない。 */
export const VEHICLES: Record<string, VehicleModel> = {
  // ── ホンダ
  "honda-super-cub-50": { maker: "honda", family: "honda-super-cub", name: "スーパーカブ50", displacementCc: 49, aliases: ["スーパーカブ50", "Super Cub 50", "カブ50", "本田幼兽50", "本田幼獸50"], typeCodes: ["AA09", "2BH-AA09"] },
  "honda-ct125-hunter-cub": { maker: "honda", name: "CT125・ハンターカブ", displacementCc: 123, aliases: ["CT125", "ハンターカブ", "Hunter Cub", "猎人幼兽"], typeCodes: ["JA65", "8BJ-JA65", "JA55", "2BJ-JA55"] },
  "honda-pcx-125": { maker: "honda", family: "honda-pcx", name: "PCX (125)", displacementCc: 124, aliases: ["PCX125"], typeCodes: ["JK05", "2BJ-JK05", "8BJ-JK05"] },
  "honda-rebel-250": { maker: "honda", family: "honda-rebel", name: "レブル250", displacementCc: 249, aliases: ["レブル250", "Rebel 250", "CMX250"], typeCodes: ["MC49", "8BK-MC49", "2BK-MC49"] },
  "honda-rebel-500": { maker: "honda", family: "honda-rebel", name: "レブル500", displacementCc: 471, aliases: ["レブル500", "Rebel 500", "CMX500", "CM500"], typeCodes: ["PC60", "8BL-PC60", "2BL-PC60"] },
  "honda-rebel-1100": { maker: "honda", family: "honda-rebel", name: "レブル1100", displacementCc: 1082, aliases: ["レブル1100", "Rebel 1100", "CMX1100", "CM1100"], typeCodes: ["SC83", "8BL-SC83"] },
  "honda-gb350": { maker: "honda", family: "honda-gb350", name: "GB350", displacementCc: 348, aliases: ["GB350", "H'ness CB350"], typeCodes: ["NC59", "8BL-NC59", "2BL-NC59"] },
  "honda-gb350s": { maker: "honda", family: "honda-gb350", name: "GB350 S", displacementCc: 348, aliases: ["GB350S"], typeCodes: ["NC59", "8BL-NC59", "2BL-NC59"] },
  "honda-gb350c": { maker: "honda", family: "honda-gb350", name: "GB350 C", displacementCc: 348, aliases: ["GB350C"], typeCodes: ["NC64", "8BL-NC64"] },
  "honda-crf250l": { maker: "honda", name: "CRF250L", displacementCc: 249, aliases: ["CRF250L"], typeCodes: ["MD47", "8BK-MD47", "2BK-MD47"] },
  "honda-crf250-rally": { maker: "honda", name: "CRF250 RALLY", displacementCc: 249, aliases: ["CRF250 RALLY", "CRF250ラリー"], typeCodes: ["MD47", "8BK-MD47", "2BK-MD47"] },
  "honda-cb250r": { maker: "honda", name: "CB250R", displacementCc: 249, aliases: ["CB250R"], typeCodes: ["MC52", "8BK-MC52", "2BK-MC52"] },
  "honda-cb650r": { maker: "honda", name: "CB650R", displacementCc: 648, aliases: ["CB650R", "CB650R E-Clutch", "E-Clutch CB650R"], typeCodes: ["RH03", "8BL-RH03", "2BL-RH03", "RH17", "8BL-RH17"] },
  "honda-cbr650r": { maker: "honda", name: "CBR650R", displacementCc: 648, aliases: ["CBR650R", "CBR650R E-Clutch"], typeCodes: ["RH03", "8BL-RH03", "2BL-RH03", "RH17", "8BL-RH17"] },
  // Honda 主要諸元・製品アーカイブ：https://www.honda.co.jp/motor-lineup/
  "honda-super-cub-110": { maker: "honda", family: "honda-super-cub", name: "スーパーカブ110", displacementCc: 109, aliases: ["スーパーカブ110", "Super Cub 110", "カブ110", "本田幼兽110", "本田幼獸110"], typeCodes: ["JA59", "8BJ-JA59", "JA44", "2BJ-JA44"] },
  "honda-super-cub-c125": { maker: "honda", family: "honda-super-cub", name: "スーパーカブ C125", displacementCc: 123, aliases: ["スーパーカブC125", "Super Cub C125", "C125"], typeCodes: ["JA71", "8BJ-JA71", "JA58", "8BJ-JA58", "JA48", "2BJ-JA48"] },
  "honda-cross-cub-50": { maker: "honda", family: "honda-cross-cub", name: "クロスカブ50", displacementCc: 49, aliases: ["クロスカブ50", "Cross Cub 50"], typeCodes: ["AA06", "2BH-AA06"] },
  "honda-cross-cub-110": { maker: "honda", family: "honda-cross-cub", name: "クロスカブ110", displacementCc: 109, aliases: ["クロスカブ110", "Cross Cub 110"], typeCodes: ["JA60", "8BJ-JA60", "JA45", "2BJ-JA45"] },
  "honda-monkey-125": { maker: "honda", name: "モンキー125", displacementCc: 123, aliases: ["モンキー125", "Monkey 125", "猴子125"], typeCodes: ["JB05", "8BJ-JB05", "JB03", "8BJ-JB03", "JB02", "2BJ-JB02"] },
  "honda-dax-125": { maker: "honda", name: "ダックス125", displacementCc: 123, aliases: ["ダックス125", "Dax 125", "ST125"], typeCodes: ["JB04", "8BJ-JB04", "JB06", "8BJ-JB06"] },
  "honda-grom": { maker: "honda", name: "グロム", displacementCc: 123, aliases: ["グロム", "GROM", "MSX125", "MSX125SF"], typeCodes: ["JC92", "2BJ-JC92", "8BJ-JC92"] },
  "honda-cb125r": { maker: "honda", name: "CB125R", displacementCc: 124, aliases: ["CB125R"], typeCodes: ["JC91", "8BJ-JC91"] },
  "honda-dio-110": { maker: "honda", name: "Dio110", displacementCc: 109, aliases: ["Dio110", "ディオ110"], typeCodes: ["JK03", "2BJ-JK03", "8BJ-JK03"] },
  "honda-lead-125": { maker: "honda", name: "リード125", displacementCc: 124, aliases: ["リード125", "Lead 125"], typeCodes: ["JK12", "8BJ-JK12"] },
  "honda-pcx-150": { maker: "honda", family: "honda-pcx", name: "PCX150", displacementCc: 149, aliases: ["PCX150"], typeCodes: ["KF30", "2BK-KF30"] },
  "honda-pcx-160": { maker: "honda", family: "honda-pcx", name: "PCX160", displacementCc: 156, aliases: ["PCX160"], typeCodes: ["KF47", "2BK-KF47", "8BK-KF47"] },
  "honda-adv-150": { maker: "honda", family: "honda-adv", name: "ADV150", displacementCc: 149, aliases: ["ADV150"], typeCodes: ["KF38", "2BK-KF38"] },
  "honda-adv-160": { maker: "honda", family: "honda-adv", name: "ADV160", displacementCc: 156, aliases: ["ADV160"], typeCodes: ["KF54", "8BK-KF54"] },
  "honda-forza-250": { maker: "honda", family: "honda-forza", name: "フォルツァ (250)", displacementCc: 249, aliases: ["フォルツァ250", "Forza 250", "NSS250"], typeCodes: ["MF17", "8BK-MF17", "MF15", "2BK-MF15"] },
  "honda-forza-350": { maker: "honda", family: "honda-forza", name: "Forza 350", displacementCc: 330, aliases: ["Forza 350", "フォルツァ350", "NSS350"] },
  "honda-forza-750": { maker: "honda", family: "honda-forza", name: "Forza 750", displacementCc: 745, aliases: ["Forza 750", "フォルツァ750", "NSS750"] },
  "honda-cbr250rr": { maker: "honda", name: "CBR250RR", displacementCc: 249, aliases: ["CBR250RR"], typeCodes: ["MC51", "2BK-MC51", "8BK-MC51"] },
  "honda-cbr400r": { maker: "honda", name: "CBR400R", displacementCc: 399, aliases: ["CBR400R", "CBR400R E-Clutch"], typeCodes: ["NC65", "8BL-NC65", "NC56", "2BL-NC56", "8BL-NC56"] },
  "honda-nx400": { maker: "honda", name: "NX400", displacementCc: 399, aliases: ["NX400", "NX400 E-Clutch"], typeCodes: ["NC65", "8BL-NC65"] },
  "honda-400x": { maker: "honda", name: "400X", displacementCc: 399, aliases: ["400X", "ホンダ400X", "Honda 400X", "CB400X"], typeCodes: ["NC56", "2BL-NC56", "8BL-NC56"] },
  "honda-cl250": { maker: "honda", name: "CL250", displacementCc: 249, aliases: ["CL250", "CL250 E-Clutch"], typeCodes: ["MC57", "8BK-MC57"] },
  "honda-cl500": { maker: "honda", name: "CL500", displacementCc: 471, aliases: ["CL500", "SCL500"], typeCodes: ["PC68", "8BL-PC68"] },
  "honda-cb400-super-four": { maker: "honda", name: "CB400 SUPER FOUR / SUPER BOL D'OR", displacementCc: 399, aliases: ["CB400 SUPER FOUR", "CB400SF", "CB400 SUPER BOL D'OR", "CB400SB"], typeCodes: ["NC42", "2BL-NC42", "EBL-NC42"] },
  "honda-cb750-hornet": { maker: "honda", name: "CB750 HORNET", displacementCc: 754, aliases: ["CB750 HORNET", "ホーネット750", "Hornet 750"], typeCodes: ["RH24", "8BL-RH24"] },
  "honda-xl750-transalp": { maker: "honda", name: "XL750 TRANSALP", displacementCc: 754, aliases: ["XL750 TRANSALP", "XL750", "Transalp 750", "トランザルプ750"], typeCodes: ["RD16", "8BL-RD16"] },
  "honda-nc750x": { maker: "honda", name: "NC750X", displacementCc: 745, aliases: ["NC750X", "NC750X DCT"], typeCodes: ["RH23", "8BL-RH23", "RH09", "8BL-RH09"] },
  "honda-x-adv": { maker: "honda", name: "X-ADV", displacementCc: 745, aliases: ["X-ADV", "X-ADV750"], typeCodes: ["RH21", "8BL-RH21", "RH10", "8BL-RH10", "2BL-RH10"] },
  "honda-cbr600rr": { maker: "honda", name: "CBR600RR", displacementCc: 599, aliases: ["CBR600RR"], typeCodes: ["PC40", "2BL-PC40", "8BL-PC40"] },
  "honda-cbr1000rr-r": { maker: "honda", name: "CBR1000RR-R FIREBLADE", displacementCc: 999, aliases: ["CBR1000RR-R", "CBR1000RR-R SP", "Fireblade 1000RR-R"], typeCodes: ["SC82", "2BL-SC82", "8BL-SC82"] },
  "honda-cb1000-hornet": { maker: "honda", name: "CB1000 HORNET", displacementCc: 999, aliases: ["CB1000 HORNET", "CB1000 HORNET SP", "ホーネット1000", "Hornet 1000"], typeCodes: ["SC86", "8BL-SC86"] },
  "honda-cb1000f": { maker: "honda", name: "CB1000F", displacementCc: 999, aliases: ["CB1000F", "CB1000F SE"] },
  "honda-crf1100l-africa-twin": { maker: "honda", name: "CRF1100L Africa Twin", displacementCc: 1082, aliases: ["CRF1100L", "Africa Twin 1100", "アフリカツイン1100", "CRF1100L Adventure Sports"], typeCodes: ["SD15", "8BL-SD15", "SD10", "2BL-SD10", "8BL-SD10"] },
  "honda-nt1100": { maker: "honda", name: "NT1100", displacementCc: 1082, aliases: ["NT1100"], typeCodes: ["SC90", "8BL-SC90", "SC84", "8BL-SC84"] },
  "honda-gold-wing": { maker: "honda", name: "Gold Wing / Gold Wing Tour", displacementCc: 1833, aliases: ["Gold Wing", "ゴールドウイング", "GL1800", "本田金翼", "黄金之翼", "黃金之翼"], typeCodes: ["SC79", "2BL-SC79", "8BL-SC79"] },
  // ── ヤマハ
  "yamaha-yzf-r25": { maker: "yamaha", name: "YZF-R25", displacementCc: 249, aliases: ["YZF-R25"], typeCodes: ["RG74J", "8BK-RG74J", "RG43J"] },
  "yamaha-mt-25": { maker: "yamaha", family: "yamaha-mt", name: "MT-25", displacementCc: 249, aliases: ["MT-25"], typeCodes: ["RG74J", "8BK-RG74J"] },
  "yamaha-mt-09": { maker: "yamaha", family: "yamaha-mt", name: "MT-09 / MT-09 SP", displacementCc: 888, aliases: ["MT-09", "MT-09 SP", "MT-09 Y-AMT"], typeCodes: ["RN87J", "8BL-RN87J", "RN69J"] },
  "yamaha-xsr900": { maker: "yamaha", family: "yamaha-xsr", name: "XSR900", displacementCc: 888, aliases: ["XSR900"], typeCodes: ["RN80J", "8BL-RN80J"] },
  "yamaha-xsr900-gp": { maker: "yamaha", family: "yamaha-xsr", name: "XSR900 GP", displacementCc: 888, aliases: ["XSR900 GP"], typeCodes: ["RN96J", "8BL-RN96J"] },
  // https://www.yamaha-motor.co.jp/mc/lineup/displacement.html
  "yamaha-yzf-r125": { maker: "yamaha", name: "YZF-R125", displacementCc: 124, aliases: ["YZF-R125"] },
  "yamaha-yzf-r15": { maker: "yamaha", name: "YZF-R15", displacementCc: 155, aliases: ["YZF-R15", "YZF-R15M", "R15 V4"] },
  "yamaha-yzf-r3": { maker: "yamaha", name: "YZF-R3", displacementCc: 320, aliases: ["YZF-R3"] },
  "yamaha-yzf-r6": { maker: "yamaha", name: "YZF-R6", displacementCc: 599, aliases: ["YZF-R6"] },
  "yamaha-yzf-r7": { maker: "yamaha", name: "YZF-R7 (CP2)", displacementCc: 688, aliases: ["YZF-R7"] },
  "yamaha-yzf-r9": { maker: "yamaha", name: "YZF-R9", displacementCc: 888, aliases: ["YZF-R9"] },
  "yamaha-yzf-r1": { maker: "yamaha", name: "YZF-R1 / R1M", displacementCc: 997, aliases: ["YZF-R1", "YZF-R1M"] },
  "yamaha-mt-125": { maker: "yamaha", family: "yamaha-mt", name: "MT-125", displacementCc: 124, aliases: ["MT-125"] },
  "yamaha-mt-03": { maker: "yamaha", family: "yamaha-mt", name: "MT-03 (320)", displacementCc: 320, aliases: ["MT-03"] },
  "yamaha-mt-07": { maker: "yamaha", family: "yamaha-mt", name: "MT-07", displacementCc: 688, aliases: ["MT-07", "MT-07 Y-AMT"] },
  "yamaha-mt-10": { maker: "yamaha", family: "yamaha-mt", name: "MT-10 / MT-10 SP", displacementCc: 997, aliases: ["MT-10", "MT-10 SP"] },
  "yamaha-xsr125": { maker: "yamaha", family: "yamaha-xsr", name: "XSR125", displacementCc: 124, aliases: ["XSR125"] },
  "yamaha-xsr700": { maker: "yamaha", family: "yamaha-xsr", name: "XSR700", displacementCc: 688, aliases: ["XSR700"] },
  "yamaha-tracer9": { maker: "yamaha", name: "TRACER9 / GT / GT+", displacementCc: 888, aliases: ["TRACER9", "TRACER9 GT", "TRACER9 GT+", "トレーサー9"] },
  "yamaha-tenere700": { maker: "yamaha", name: "Ténéré700", displacementCc: 688, aliases: ["Ténéré700", "Tenere700", "テネレ700"] },
  "yamaha-tmax560": { maker: "yamaha", name: "TMAX560 / TECH MAX", displacementCc: 561, aliases: ["TMAX560", "TMAX560 TECH MAX"] },
  "yamaha-xmax-250": { maker: "yamaha", name: "XMAX (250)", displacementCc: 249, aliases: ["XMAX250", "XMAX250 TECH MAX"] },
  "yamaha-xmax-300": { maker: "yamaha", name: "XMAX 300", displacementCc: 292, aliases: ["XMAX300", "XMAX300 TECH MAX"] },
  "yamaha-nmax-125": { maker: "yamaha", family: "yamaha-nmax", name: "NMAX125", displacementCc: 124, aliases: ["NMAX125", "エヌマックス125"] },
  "yamaha-nmax-155": { maker: "yamaha", family: "yamaha-nmax", name: "NMAX155", displacementCc: 155, aliases: ["NMAX155", "エヌマックス155", "NMAX Turbo"] },
  "yamaha-tricity-125": { maker: "yamaha", family: "yamaha-tricity", name: "トリシティ125", displacementCc: 124, aliases: ["トリシティ125", "Tricity125"] },
  "yamaha-tricity-155": { maker: "yamaha", family: "yamaha-tricity", name: "トリシティ155", displacementCc: 155, aliases: ["トリシティ155", "Tricity155"] },
  "yamaha-tricity-300": { maker: "yamaha", family: "yamaha-tricity", name: "トリシティ300", displacementCc: 292, aliases: ["トリシティ300", "Tricity300"] },
  "yamaha-x-force": { maker: "yamaha", name: "X FORCE", displacementCc: 155, aliases: ["X FORCE", "X FORCE155", "Xフォース", "Xフォース155"] },
  "yamaha-axis-z": { maker: "yamaha", name: "アクシスZ", displacementCc: 124, aliases: ["アクシスZ", "AXIS Z"] },
  "yamaha-jog-50": { maker: "yamaha", name: "JOG (50)", displacementCc: 49, aliases: ["JOG50", "ジョグ50"] },
  "yamaha-vino-50": { maker: "yamaha", name: "ビーノ (50)", displacementCc: 49, aliases: ["Vino50", "ビーノ50"] },
  "yamaha-sr400": { maker: "yamaha", name: "SR400", displacementCc: 399, aliases: ["SR400", "SR400 Final Edition"] },
  "yamaha-serow-250": { maker: "yamaha", name: "セロー250", displacementCc: 249, aliases: ["セロー250", "SEROW250", "XT250"] },
  "yamaha-wr250r": { maker: "yamaha", name: "WR250R", displacementCc: 249, aliases: ["WR250R"] },
  "yamaha-wr250x": { maker: "yamaha", name: "WR250X", displacementCc: 249, aliases: ["WR250X"] },
  // ── カワサキ
  "kawasaki-zx-25r": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja ZX-25R / ZX-25RR", displacementCc: 249, aliases: ["ZX-25R", "ZX-25RR", "Ninja ZX-25R", "Ninja ZX-25RR"], typeCodes: ["ZX250H", "8BK-ZX250H", "ZX250E", "2BK-ZX250E"] },
  "kawasaki-zx-4r": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja ZX-4R / ZX-4RR", displacementCc: 399, aliases: ["ZX-4R", "ZX-4RR", "Ninja ZX-4R", "Ninja ZX-4RR"], typeCodes: ["ZX400P", "8BL-ZX400P"] },
  "kawasaki-eliminator-400": { maker: "kawasaki", name: "エリミネーター (400)", displacementCc: 398, aliases: ["エリミネーター400", "ELIMINATOR 400", "ELIMINATOR SE", "川崎消除者"], typeCodes: ["EL400A", "8BL-EL400A"] },
  "kawasaki-z900rs": { maker: "kawasaki", name: "Z900RS / Z900RS CAFE", displacementCc: 948, aliases: ["Z900RS", "Z900RS CAFE", "Z900RS SE"], typeCodes: ["ZR900K", "8BL-ZR900K", "2BL-ZR900C"] },
  // 公開済み slug はそのままにし、MEGURO S1 は別の車種として扱う。
  "kawasaki-w230-meguro-s1": { maker: "kawasaki", name: "W230", displacementCc: 232, aliases: ["W230"], typeCodes: ["BJ230A", "8BK-BJ230A"] },
  "kawasaki-meguro-s1": { maker: "kawasaki", name: "MEGURO S1", displacementCc: 232, aliases: ["MEGURO S1", "メグロS1", "目黒S1"], typeCodes: ["BJ230A", "8BK-BJ230A"] },
  // https://www.kawasaki-motors.com/ja-jp/motorcycle
  "kawasaki-ninja-250": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 250", displacementCc: 248, aliases: ["Ninja250", "ニンジャ250", "忍者250"] },
  "kawasaki-ninja-400": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 400", displacementCc: 398, aliases: ["Ninja400", "ニンジャ400", "忍者400"] },
  "kawasaki-ninja-500": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 500", displacementCc: 451, aliases: ["Ninja500", "ニンジャ500", "忍者500"] },
  "kawasaki-ninja-650": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 650", displacementCc: 649, aliases: ["Ninja650", "ニンジャ650", "忍者650"] },
  "kawasaki-zx-6r": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja ZX-6R", displacementCc: 636, aliases: ["ZX-6R", "Ninja ZX-6R"] },
  "kawasaki-zx-10r": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja ZX-10R / ZX-10RR", displacementCc: 998, aliases: ["ZX-10R", "ZX-10RR", "Ninja ZX-10R", "Ninja ZX-10RR"] },
  "kawasaki-ninja-1000sx": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 1000SX", displacementCc: 1043, aliases: ["Ninja1000SX", "ニンジャ1000SX"] },
  "kawasaki-ninja-1100sx": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja 1100SX", displacementCc: 1099, aliases: ["Ninja1100SX", "Ninja1100SX SE", "ニンジャ1100SX"] },
  "kawasaki-ninja-h2": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja H2", displacementCc: 998, aliases: ["Ninja H2", "ニンジャH2"] },
  "kawasaki-ninja-h2-sx": { maker: "kawasaki", family: "kawasaki-ninja", name: "Ninja H2 SX", displacementCc: 998, aliases: ["Ninja H2 SX", "Ninja H2 SX SE", "ニンジャH2 SX"] },
  "kawasaki-z125-pro": { maker: "kawasaki", name: "Z125 PRO", displacementCc: 124, aliases: ["Z125 PRO"] },
  "kawasaki-z250": { maker: "kawasaki", name: "Z250", displacementCc: 248, aliases: ["Z250"] },
  "kawasaki-z400": { maker: "kawasaki", name: "Z400", displacementCc: 398, aliases: ["Z400"] },
  "kawasaki-z500": { maker: "kawasaki", name: "Z500", displacementCc: 451, aliases: ["Z500"] },
  "kawasaki-z650": { maker: "kawasaki", name: "Z650", displacementCc: 649, aliases: ["Z650"] },
  "kawasaki-z650rs": { maker: "kawasaki", name: "Z650RS", displacementCc: 649, aliases: ["Z650RS"] },
  "kawasaki-z900": { maker: "kawasaki", name: "Z900", displacementCc: 948, aliases: ["Z900", "Z900 SE"] },
  "kawasaki-z1100": { maker: "kawasaki", name: "Z1100", displacementCc: 1099, aliases: ["Z1100", "Z1100 SE"] },
  "kawasaki-z-h2": { maker: "kawasaki", name: "Z H2", displacementCc: 998, aliases: ["Z H2", "Z H2 SE"] },
  "kawasaki-eliminator-500": { maker: "kawasaki", name: "Eliminator 500", displacementCc: 451, aliases: ["Eliminator500", "エリミネーター500"] },
  "kawasaki-versys-x250": { maker: "kawasaki", family: "kawasaki-versys", name: "VERSYS-X 250", displacementCc: 248, aliases: ["VERSYS-X250", "VERSYS-X250 TOURER", "ヴェルシスX250"] },
  "kawasaki-versys-650": { maker: "kawasaki", family: "kawasaki-versys", name: "VERSYS 650", displacementCc: 649, aliases: ["VERSYS650", "ヴェルシス650"] },
  "kawasaki-versys-1100": { maker: "kawasaki", family: "kawasaki-versys", name: "VERSYS 1100", displacementCc: 1099, aliases: ["VERSYS1100", "VERSYS1100 SE", "ヴェルシス1100"] },
  "kawasaki-w800": { maker: "kawasaki", name: "W800", displacementCc: 773, aliases: ["W800", "W800 STREET", "W800 CAFE"] },
  "kawasaki-meguro-k3": { maker: "kawasaki", name: "MEGURO K3", displacementCc: 773, aliases: ["MEGURO K3", "メグロK3", "目黒K3"] },
  "kawasaki-klx230": { maker: "kawasaki", name: "KLX230 / S", displacementCc: 232, aliases: ["KLX230", "KLX230S"] },
  "kawasaki-klx230sm": { maker: "kawasaki", name: "KLX230SM", displacementCc: 232, aliases: ["KLX230SM"] },
  "kawasaki-klx230-sherpa": { maker: "kawasaki", name: "KLX230 SHERPA", displacementCc: 232, aliases: ["KLX230 SHERPA", "KLX230シェルパ"] },
  // ── スズキ
  "suzuki-v-strom-250sx": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム250SX", displacementCc: 249, aliases: ["Vストローム250SX", "V-Strom 250SX", "V-Strom SX"], typeCodes: ["EL11L", "8BK-EL11L"] },
  "suzuki-gsx-8r": { maker: "suzuki", name: "GSX-8R", displacementCc: 775, aliases: ["GSX-8R"], typeCodes: ["EM1AA", "8BL-EM1AA"] },
  "suzuki-gsx-8s": { maker: "suzuki", name: "GSX-8S", displacementCc: 775, aliases: ["GSX-8S"], typeCodes: ["EM1AA", "8BL-EM1AA"] },
  "suzuki-hayabusa": { maker: "suzuki", name: "Hayabusa (隼)", displacementCc: 1339, aliases: ["Hayabusa", "GSX1300R", "ハヤブサ", "スズキ隼", "铃木隼"], typeCodes: ["EJ11A", "8BL-EJ11A"] },
  "suzuki-dr-z4s": { maker: "suzuki", name: "DR-Z4S", displacementCc: 398, aliases: ["DR-Z4S"] },
  "suzuki-dr-z4sm": { maker: "suzuki", name: "DR-Z4SM", displacementCc: 398, aliases: ["DR-Z4SM"] },
  // https://www1.suzuki.co.jp/motor/lineup/
  "suzuki-address-125": { maker: "suzuki", name: "アドレス125", displacementCc: 124, aliases: ["アドレス125", "Address125"] },
  "suzuki-address-v125": { maker: "suzuki", name: "アドレスV125", displacementCc: 124, aliases: ["アドレスV125", "Address V125", "Address V125G", "Address V125S"] },
  "suzuki-address-v50": { maker: "suzuki", name: "アドレスV50", displacementCc: 49, aliases: ["アドレスV50", "Address V50"] },
  "suzuki-lets-50": { maker: "suzuki", name: "レッツ (50)", displacementCc: 49, aliases: ["スズキレッツ", "Suzuki Let's", "レッツ50"] },
  "suzuki-avenis-125": { maker: "suzuki", name: "アヴェニス125", displacementCc: 124, aliases: ["アヴェニス125", "Avenis125"] },
  "suzuki-burgman-street-125ex": { maker: "suzuki", name: "バーグマンストリート125EX", displacementCc: 124, aliases: ["バーグマンストリート125EX", "Burgman Street125EX"] },
  "suzuki-gsx-r125": { maker: "suzuki", name: "GSX-R125", displacementCc: 124, aliases: ["GSX-R125"] },
  "suzuki-gsx-s125": { maker: "suzuki", name: "GSX-S125", displacementCc: 124, aliases: ["GSX-S125"] },
  "suzuki-gixxer-150": { maker: "suzuki", family: "suzuki-gixxer", name: "ジクサー150", displacementCc: 154, aliases: ["ジクサー150", "Gixxer150", "Gixxer155"] },
  "suzuki-gixxer-250": { maker: "suzuki", family: "suzuki-gixxer", name: "ジクサー250", displacementCc: 249, aliases: ["ジクサー250", "Gixxer250"] },
  "suzuki-gixxer-sf250": { maker: "suzuki", family: "suzuki-gixxer", name: "ジクサーSF250", displacementCc: 249, aliases: ["ジクサーSF250", "Gixxer SF250"] },
  "suzuki-gsx250r": { maker: "suzuki", name: "GSX250R", displacementCc: 248, aliases: ["GSX250R"] },
  "suzuki-v-strom-250": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム250", displacementCc: 248, aliases: ["Vストローム250", "V-Strom250", "DL250"] },
  "suzuki-v-strom-650": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム650 / XT", displacementCc: 645, aliases: ["Vストローム650", "Vストローム650XT", "V-Strom650", "V-Strom650XT", "DL650"] },
  "suzuki-v-strom-800": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム800", displacementCc: 775, aliases: ["Vストローム800", "V-Strom800", "DL800"] },
  "suzuki-v-strom-800de": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム800DE", displacementCc: 775, aliases: ["Vストローム800DE", "V-Strom800DE", "DL800DE"] },
  "suzuki-v-strom-1050": { maker: "suzuki", family: "suzuki-v-strom", name: "Vストローム1050 / DE", displacementCc: 1036, aliases: ["Vストローム1050", "Vストローム1050DE", "V-Strom1050", "V-Strom1050DE", "DL1050"] },
  "suzuki-burgman-400": { maker: "suzuki", name: "バーグマン400", displacementCc: 399, aliases: ["バーグマン400", "Burgman400", "AN400", "スカイウェイブ400", "Skywave400"] },
  "suzuki-sv650": { maker: "suzuki", name: "SV650", displacementCc: 645, aliases: ["SV650"] },
  "suzuki-sv650x": { maker: "suzuki", name: "SV650X", displacementCc: 645, aliases: ["SV650X"] },
  "suzuki-gsx-8t": { maker: "suzuki", name: "GSX-8T", displacementCc: 775, aliases: ["GSX-8T"] },
  "suzuki-gsx-8tt": { maker: "suzuki", name: "GSX-8TT", displacementCc: 775, aliases: ["GSX-8TT"] },
  "suzuki-katana": { maker: "suzuki", name: "KATANA (1000)", displacementCc: 998, aliases: ["KATANA", "カタナ", "スズキ刀", "铃木刀", "鈴木刀"] },
  "suzuki-gsx-s1000": { maker: "suzuki", name: "GSX-S1000", displacementCc: 998, aliases: ["GSX-S1000"] },
  "suzuki-gsx-s1000gt": { maker: "suzuki", name: "GSX-S1000GT", displacementCc: 998, aliases: ["GSX-S1000GT"] },
  "suzuki-gsx-s1000gx": { maker: "suzuki", name: "GSX-S1000GX", displacementCc: 998, aliases: ["GSX-S1000GX"] },
  "suzuki-gsx-r1000": { maker: "suzuki", name: "GSX-R1000 / GSX-R1000R", displacementCc: 999, aliases: ["GSX-R1000", "GSX-R1000R"] },
  // ── ハスクバーナ（KTM グループ）
  "husqvarna-svartpilen-250": { maker: "ktm", family: "husqvarna-svartpilen", name: "スヴァルトピレン250", displacementCc: 248.8, aliases: ["スヴァルトピレン250", "Svartpilen 250", "黑箭250"] },
  "husqvarna-svartpilen-401": { maker: "ktm", family: "husqvarna-svartpilen", name: "スヴァルトピレン401", displacementCc: 398.6, aliases: ["スヴァルトピレン401", "Svartpilen 401", "黑箭401"] },
  "husqvarna-svartpilen-801": { maker: "ktm", family: "husqvarna-svartpilen", name: "スヴァルトピレン801", displacementCc: 799, aliases: ["スヴァルトピレン801", "Svartpilen 801", "黑箭801"] },
  "husqvarna-vitpilen-401": { maker: "ktm", family: "husqvarna-vitpilen", name: "ヴィットピレン401", displacementCc: 398.6, aliases: ["ヴィットピレン401", "Vitpilen 401", "白箭401"] },
  // https://www.husqvarna-motorcycles.com/ja-jp/models.html
  "husqvarna-svartpilen-125": { maker: "ktm", family: "husqvarna-svartpilen", name: "スヴァルトピレン125", displacementCc: 125, aliases: ["スヴァルトピレン125", "Svartpilen125", "黑箭125"] },
  "husqvarna-vitpilen-801": { maker: "ktm", family: "husqvarna-vitpilen", name: "ヴィットピレン801", displacementCc: 799, aliases: ["ヴィットピレン801", "Vitpilen801", "白箭801"] },
  "husqvarna-norden-901": { maker: "ktm", name: "Norden 901", displacementCc: 889, aliases: ["Norden901", "Norden901 Expedition", "ノーデン901"] },
  "husqvarna-701-enduro": { maker: "ktm", name: "701 ENDURO", displacementCc: 692.7, aliases: ["701 ENDURO", "ハスクバーナ701エンデューロ"] },
  "husqvarna-701-supermoto": { maker: "ktm", name: "701 SUPERMOTO", displacementCc: 692.7, aliases: ["701 SUPERMOTO", "ハスクバーナ701スーパーモト"] },
  // ── KTM：https://www.ktm.com/ja-jp/models.html
  "ktm-390-duke": { maker: "ktm", family: "ktm-duke", name: "390 DUKE", displacementCc: 398.7, aliases: ["390 DUKE", "KTM 390 DUKE", "390公爵", "デューク390"] },
  "ktm-125-duke": { maker: "ktm", family: "ktm-duke", name: "125 DUKE", displacementCc: 124.9, aliases: ["125 DUKE", "125公爵", "デューク125"] },
  "ktm-250-duke": { maker: "ktm", family: "ktm-duke", name: "250 DUKE", displacementCc: 249, aliases: ["250 DUKE", "250公爵", "デューク250"] },
  "ktm-790-duke": { maker: "ktm", family: "ktm-duke", name: "790 DUKE", displacementCc: 799, aliases: ["790 DUKE", "790公爵", "デューク790"] },
  "ktm-890-duke": { maker: "ktm", family: "ktm-duke", name: "890 DUKE / R", displacementCc: 889, aliases: ["890 DUKE", "890 DUKE R", "890公爵", "デューク890"] },
  "ktm-990-duke": { maker: "ktm", family: "ktm-duke", name: "990 DUKE / R", displacementCc: 947, aliases: ["990 DUKE", "990 DUKE R", "990公爵", "デューク990"] },
  "ktm-1390-super-duke-r": { maker: "ktm", family: "ktm-duke", name: "1390 SUPER DUKE R / EVO", displacementCc: 1350, aliases: ["1390 SUPER DUKE R", "1390 SUPER DUKE R EVO", "1390スーパーデュークR"] },
  "ktm-rc-125": { maker: "ktm", name: "RC 125", displacementCc: 124.7, aliases: ["RC125"] },
  "ktm-rc-390": { maker: "ktm", name: "RC 390", displacementCc: 373, aliases: ["RC390"] },
  "ktm-390-adventure": { maker: "ktm", name: "390 ADVENTURE (LC4c)", displacementCc: 398.7, aliases: ["390 ADVENTURE", "390 ADVENTURE R", "390 ADVENTURE X", "390アドベンチャー"] },
  "ktm-790-adventure": { maker: "ktm", name: "790 ADVENTURE", displacementCc: 799, aliases: ["790 ADVENTURE", "790アドベンチャー"] },
  "ktm-890-adventure": { maker: "ktm", name: "890 ADVENTURE / R", displacementCc: 889, aliases: ["890 ADVENTURE", "890 ADVENTURE R", "890アドベンチャー"] },
  "ktm-1390-super-adventure": { maker: "ktm", name: "1390 SUPER ADVENTURE", displacementCc: 1350, aliases: ["1390 SUPER ADVENTURE", "1390 SUPER ADVENTURE S EVO", "1390スーパーアドベンチャー"] },
  "ktm-690-enduro-r": { maker: "ktm", name: "690 ENDURO R", displacementCc: 692.7, aliases: ["690 ENDURO R", "690エンデューロR"] },
  "ktm-690-smc-r": { maker: "ktm", name: "690 SMC R", displacementCc: 692.7, aliases: ["690 SMC R"] },
  // ── トライアンフ：https://www.triumphmotorcycles.co.jp/motorcycles
  "triumph-speed-400": { maker: "triumph", name: "スピード400", displacementCc: 398, aliases: ["スピード400", "Speed400"] },
  "triumph-scrambler-400x": { maker: "triumph", name: "スクランブラー400 X", displacementCc: 398, aliases: ["スクランブラー400X", "Scrambler400X"] },
  "triumph-street-triple-765": { maker: "triumph", name: "ストリートトリプル765", displacementCc: 765, aliases: ["ストリートトリプル765", "Street Triple 765", "Street Triple RS", "青蛙王子765"] },
  "triumph-trident-660": { maker: "triumph", family: "triumph-trident", name: "トライデント660", displacementCc: 660, aliases: ["トライデント660", "Trident660", "三叉戟660"] },
  "triumph-trident-800": { maker: "triumph", family: "triumph-trident", name: "トライデント800", displacementCc: 798, aliases: ["トライデント800", "Trident800", "三叉戟800"] },
  "triumph-daytona-660": { maker: "triumph", name: "デイトナ660", displacementCc: 660, aliases: ["デイトナ660", "Daytona660"] },
  "triumph-tiger-sport-660": { maker: "triumph", family: "triumph-tiger-sport", name: "タイガースポーツ660", displacementCc: 660, aliases: ["タイガースポーツ660", "Tiger Sport660"] },
  "triumph-tiger-sport-800": { maker: "triumph", family: "triumph-tiger-sport", name: "タイガースポーツ800", displacementCc: 798, aliases: ["タイガースポーツ800", "Tiger Sport800"] },
  "triumph-tiger-900": { maker: "triumph", name: "タイガー900", displacementCc: 888, aliases: ["タイガー900", "Tiger900", "Tiger900 GT Pro", "Tiger900 Rally Pro"] },
  "triumph-tiger-1200": { maker: "triumph", name: "タイガー1200", displacementCc: 1160, aliases: ["タイガー1200", "Tiger1200", "Tiger1200 GT Explorer", "Tiger1200 Rally Explorer"] },
  "triumph-bonneville-t100": { maker: "triumph", name: "ボンネビルT100", displacementCc: 900, aliases: ["ボンネビルT100", "Bonneville T100"] },
  "triumph-bonneville-t120": { maker: "triumph", name: "ボンネビルT120", displacementCc: 1200, aliases: ["ボンネビルT120", "Bonneville T120", "Bonneville T120 Black"] },
  "triumph-speed-twin-900": { maker: "triumph", family: "triumph-speed-twin", name: "スピードツイン900", displacementCc: 900, aliases: ["スピードツイン900", "Speed Twin900", "Street Twin", "ストリートツイン"] },
  "triumph-speed-twin-1200": { maker: "triumph", family: "triumph-speed-twin", name: "スピードツイン1200", displacementCc: 1200, aliases: ["スピードツイン1200", "Speed Twin1200", "Speed Twin1200 RS"] },
  "triumph-scrambler-900": { maker: "triumph", name: "スクランブラー900", displacementCc: 900, aliases: ["スクランブラー900", "Triumph Scrambler900", "Street Scrambler", "ストリートスクランブラー"] },
  "triumph-scrambler-1200": { maker: "triumph", name: "スクランブラー1200", displacementCc: 1200, aliases: ["スクランブラー1200", "Scrambler1200", "Scrambler1200 X", "Scrambler1200 XE"] },
  "triumph-bonneville-bobber": { maker: "triumph", name: "ボンネビルボバー", displacementCc: 1200, aliases: ["ボンネビルボバー", "Bonneville Bobber"] },
  "triumph-bonneville-speedmaster": { maker: "triumph", name: "ボンネビルスピードマスター", displacementCc: 1200, aliases: ["ボンネビルスピードマスター", "Bonneville Speedmaster"] },
  "triumph-speed-triple-1200": { maker: "triumph", name: "スピードトリプル1200", displacementCc: 1160, aliases: ["スピードトリプル1200", "Speed Triple1200", "Speed Triple1200 RS", "Speed Triple1200 RR"] },
  "triumph-rocket-3": { maker: "triumph", name: "ロケット3", displacementCc: 2458, aliases: ["ロケット3", "Rocket3", "Rocket3 Storm", "Rocket3 R", "Rocket3 GT"] },
  // ── BMW：https://www.bmw-motorrad.jp/ja/models/modeloverview.html
  "bmw-r1300gs": { maker: "bmw", name: "R 1300 GS", displacementCc: 1300, aliases: ["R1300GS", "宝马1300GS", "寶馬1300GS", "水鸟1300", "水鳥1300"] },
  "bmw-r1300gs-adventure": { maker: "bmw", name: "R 1300 GS Adventure", displacementCc: 1300, aliases: ["R1300GS Adventure", "R1300GSA", "R1300GSアドベンチャー"] },
  "bmw-r1300r": { maker: "bmw", name: "R 1300 R", displacementCc: 1300, aliases: ["R1300R"] },
  "bmw-r1300rs": { maker: "bmw", name: "R 1300 RS", displacementCc: 1300, aliases: ["R1300RS"] },
  "bmw-r1300rt": { maker: "bmw", name: "R 1300 RT", displacementCc: 1300, aliases: ["R1300RT"] },
  "bmw-r1250gs": { maker: "bmw", name: "R 1250 GS / Adventure", displacementCc: 1254, aliases: ["R1250GS", "R1250GS Adventure", "R1250GSA", "水鸟1250", "水鳥1250"] },
  "bmw-f450gs": { maker: "bmw", name: "F 450 GS", displacementCc: 420, aliases: ["F450GS"] },
  "bmw-f800gs": { maker: "bmw", name: "F 800 GS (895)", displacementCc: 895, aliases: ["F800GS"] },
  "bmw-f900gs": { maker: "bmw", name: "F 900 GS", displacementCc: 895, aliases: ["F900GS"] },
  "bmw-f900gs-adventure": { maker: "bmw", name: "F 900 GS Adventure", displacementCc: 895, aliases: ["F900GS Adventure", "F900GSA"] },
  "bmw-f900r": { maker: "bmw", name: "F 900 R", displacementCc: 895, aliases: ["F900R"] },
  "bmw-f900xr": { maker: "bmw", name: "F 900 XR", displacementCc: 895, aliases: ["F900XR"] },
  "bmw-g310r": { maker: "bmw", name: "G 310 R", displacementCc: 312, aliases: ["G310R"] },
  "bmw-g310gs": { maker: "bmw", name: "G 310 GS", displacementCc: 312, aliases: ["G310GS"] },
  "bmw-s1000rr": { maker: "bmw", name: "S 1000 RR", displacementCc: 999, aliases: ["S1000RR"] },
  "bmw-s1000r": { maker: "bmw", name: "S 1000 R", displacementCc: 999, aliases: ["S1000R"] },
  "bmw-s1000xr": { maker: "bmw", name: "S 1000 XR", displacementCc: 999, aliases: ["S1000XR"] },
  "bmw-m1000rr": { maker: "bmw", name: "M 1000 RR", displacementCc: 999, aliases: ["M1000RR"] },
  "bmw-r12": { maker: "bmw", name: "R 12", displacementCc: 1170, aliases: ["BMW R12", "R12"] },
  "bmw-r12-ninet": { maker: "bmw", name: "R 12 nineT", displacementCc: 1170, aliases: ["R12 nineT"] },
  "bmw-r12-gs": { maker: "bmw", name: "R 12 G/S", displacementCc: 1170, aliases: ["R12 G/S"] },
  "bmw-c400gt": { maker: "bmw", name: "C 400 GT", displacementCc: 350, aliases: ["C400GT"] },
  "bmw-k1600gt": { maker: "bmw", name: "K 1600 GT / GTL / B", displacementCc: 1649, aliases: ["K1600GT", "K1600GTL", "K1600B", "K1600 Grand America"] },
  // ── ドゥカティ：https://www.ducati.com/jp/ja/bikes
  "ducati-panigale-v4": { maker: "ducati", name: "パニガーレV4", displacementCc: 1103, aliases: ["パニガーレV4", "Panigale V4", "Panigale V4S"] },
  "ducati-panigale-v4r": { maker: "ducati", name: "パニガーレV4 R", displacementCc: 998, aliases: ["パニガーレV4R", "Panigale V4R"] },
  "ducati-panigale-v2": { maker: "ducati", name: "パニガーレV2 (890)", displacementCc: 890, aliases: ["パニガーレV2", "Panigale V2", "Panigale V2S"] },
  "ducati-streetfighter-v4": { maker: "ducati", name: "ストリートファイターV4", displacementCc: 1103, aliases: ["ストリートファイターV4", "Streetfighter V4", "Streetfighter V4S"] },
  "ducati-streetfighter-v2": { maker: "ducati", name: "ストリートファイターV2 (890)", displacementCc: 890, aliases: ["ストリートファイターV2", "Streetfighter V2", "Streetfighter V2S"] },
  "ducati-monster-937": { maker: "ducati", name: "Monster (937)", displacementCc: 937, aliases: ["Monster937", "モンスター937"] },
  "ducati-multistrada-v4": { maker: "ducati", name: "ムルティストラーダV4", displacementCc: 1158, aliases: ["ムルティストラーダV4", "Multistrada V4", "Multistrada V4S", "Multistrada V4 Rally", "Multistrada V4 Pikes Peak"] },
  "ducati-multistrada-v2": { maker: "ducati", name: "ムルティストラーダV2 (890)", displacementCc: 890, aliases: ["ムルティストラーダV2", "Multistrada V2", "Multistrada V2S"] },
  "ducati-desertx": { maker: "ducati", name: "DesertX (937)", displacementCc: 937, aliases: ["DesertX937", "DesertX Rally", "デザートXラリー"] },
  "ducati-desertx-v2": { maker: "ducati", name: "DesertX V2 (890)", displacementCc: 890, aliases: ["DesertX V2", "デザートX V2"] },
  "ducati-scrambler-800": { maker: "ducati", name: "Scrambler (803)", displacementCc: 803, aliases: ["Ducati Scrambler800", "Scrambler Icon", "Scrambler Full Throttle", "Scrambler Nightshift", "スクランブラーアイコン", "スクランブラーナイトシフト"] },
  "ducati-diavel-v4": { maker: "ducati", name: "ディアベルV4", displacementCc: 1158, aliases: ["ディアベルV4", "Diavel V4"] },
  // ── ハーレーダビッドソン（排気量は MY2025 の仕様）
  // https://www.harley-davidson.com/jp/ja/motorcycles/2025/index.html
  "harley-x350": { maker: "harley", name: "Harley-Davidson X350", displacementCc: 353, aliases: ["Harley-Davidson X350", "ハーレーX350", "X350"] },
  "harley-x500": { maker: "harley", name: "Harley-Davidson X500", displacementCc: 500, aliases: ["Harley-Davidson X500", "ハーレーX500", "X500"] },
  "harley-sportster-s": { maker: "harley", name: "Sportster S", displacementCc: 1252, aliases: ["Sportster S", "スポーツスターS", "RH1250S"] },
  "harley-nightster": { maker: "harley", name: "Nightster / Special", displacementCc: 975, aliases: ["Nightster", "Nightster Special", "ナイトスター", "RH975", "RH975S"] },
  "harley-pan-america-1250": { maker: "harley", name: "Pan America 1250", displacementCc: 1252, aliases: ["Pan America1250", "Pan America1250 Special", "パンアメリカ1250", "RA1250", "RA1250S"] },
  "harley-street-glide": { maker: "harley", name: "Street Glide", displacementCc: 1923, aliases: ["Street Glide", "ストリートグライド", "FLHX"] },
  "harley-road-glide": { maker: "harley", name: "Road Glide", displacementCc: 1923, aliases: ["Road Glide", "ロードグライド", "FLTRX"] },
  "harley-breakout": { maker: "harley", name: "Breakout", displacementCc: 1923, aliases: ["Breakout", "ブレイクアウト", "FXBR"] },
  // ── ロイヤルエンフィールド：https://www.royalenfield.com/jp/ja/motorcycles/
  "royal-enfield-classic-350": { maker: "royal-enfield", family: "royal-enfield-classic", name: "Classic 350", displacementCc: 349, aliases: ["Royal Enfield Classic350", "Classic350", "クラシック350"] },
  "royal-enfield-classic-650": { maker: "royal-enfield", family: "royal-enfield-classic", name: "Classic 650", displacementCc: 648, aliases: ["Royal Enfield Classic650", "Classic650", "クラシック650"] },
  "royal-enfield-meteor-350": { maker: "royal-enfield", name: "Meteor 350", displacementCc: 349, aliases: ["Meteor350", "メテオ350", "メテオール350"] },
  "royal-enfield-hunter-350": { maker: "royal-enfield", name: "Hunter 350", displacementCc: 349, aliases: ["Hunter350", "ハンター350"] },
  "royal-enfield-bullet-350": { maker: "royal-enfield", name: "Bullet 350 (J-series)", displacementCc: 349, aliases: ["Bullet350", "ブリット350", "バレット350"] },
  "royal-enfield-himalayan-411": { maker: "royal-enfield", family: "royal-enfield-himalayan", name: "Himalayan (411)", displacementCc: 411, aliases: ["Himalayan411", "ヒマラヤ411", "ヒマラヤン411", "喜马拉雅411", "喜馬拉雅411"] },
  "royal-enfield-himalayan-450": { maker: "royal-enfield", family: "royal-enfield-himalayan", name: "Himalayan 450", displacementCc: 452, aliases: ["Himalayan450", "ヒマラヤ450", "ヒマラヤン450", "喜马拉雅450", "喜馬拉雅450"] },
  "royal-enfield-guerrilla-450": { maker: "royal-enfield", name: "Guerrilla 450", displacementCc: 452, aliases: ["Guerrilla450", "ゲリラ450"] },
  "royal-enfield-interceptor-650": { maker: "royal-enfield", name: "Interceptor / INT 650", displacementCc: 648, aliases: ["Interceptor650", "INT650", "インターセプター650"] },
  "royal-enfield-continental-gt650": { maker: "royal-enfield", name: "Continental GT 650", displacementCc: 648, aliases: ["Continental GT650", "コンチネンタルGT650"] },
  "royal-enfield-super-meteor-650": { maker: "royal-enfield", name: "Super Meteor 650", displacementCc: 648, aliases: ["Super Meteor650", "スーパーメテオ650", "スーパーメテオール650"] },
  "royal-enfield-shotgun-650": { maker: "royal-enfield", name: "Shotgun 650", displacementCc: 648, aliases: ["Shotgun650", "ショットガン650"] },
  "royal-enfield-bear-650": { maker: "royal-enfield", name: "Bear 650", displacementCc: 648, aliases: ["Bear650", "ベア650"] },
  "royal-enfield-scram-411": { maker: "royal-enfield", name: "Scram 411", displacementCc: 411, aliases: ["Scram411", "スクラム411"] },
  // ── ピアッジオグループ（Aprilia / Moto Guzzi / Vespa）
  // https://www.aprilia.com/jp_JA/ / https://www.motoguzzi.com/jp_JA/ / https://www.vespa.com/jp_JA/
  "aprilia-rs457": { maker: "piaggio", name: "Aprilia RS 457", displacementCc: 457, aliases: ["Aprilia RS457", "アプリリアRS457", "RS457"] },
  "aprilia-rs660": { maker: "piaggio", name: "Aprilia RS 660", displacementCc: 659, aliases: ["Aprilia RS660", "アプリリアRS660", "RS660", "RS660 Factory"] },
  "aprilia-rsv4": { maker: "piaggio", name: "Aprilia RSV4 / Factory (1099)", displacementCc: 1099, aliases: ["RSV4", "RSV4 Factory"] },
  "aprilia-tuono-457": { maker: "piaggio", family: "aprilia-tuono", name: "Aprilia Tuono 457", displacementCc: 457, aliases: ["Tuono457", "トゥオーノ457"] },
  "aprilia-tuono-660": { maker: "piaggio", family: "aprilia-tuono", name: "Aprilia Tuono 660", displacementCc: 659, aliases: ["Tuono660", "Tuono660 Factory", "トゥオーノ660"] },
  "aprilia-tuono-v4": { maker: "piaggio", family: "aprilia-tuono", name: "Aprilia Tuono V4 (1099)", displacementCc: 1099, aliases: ["Tuono V4", "Tuono V4 Factory", "トゥオーノV4"] },
  "aprilia-tuareg-660": { maker: "piaggio", name: "Aprilia Tuareg 660", displacementCc: 659, aliases: ["Tuareg660", "トゥアレグ660"] },
  "aprilia-sr-gt200": { maker: "piaggio", name: "Aprilia SR GT 200", displacementCc: 174, aliases: ["Aprilia SR GT200", "SR GT200", "アプリリアSR GT200"] },
  "moto-guzzi-v7": { maker: "piaggio", name: "Moto Guzzi V7 (853)", displacementCc: 853, aliases: ["Moto Guzzi V7", "モトグッツィV7", "V7 Stone", "V7 Special", "V7 Sport"] },
  "moto-guzzi-v85": { maker: "piaggio", name: "Moto Guzzi V85", displacementCc: 853, aliases: ["Moto Guzzi V85", "V85 TT", "V85 TT Travel", "V85 Strada", "モトグッツィV85"] },
  "moto-guzzi-v100-mandello": { maker: "piaggio", name: "Moto Guzzi V100 Mandello", displacementCc: 1042, aliases: ["V100 Mandello", "V100マンデッロ"] },
  "moto-guzzi-stelvio": { maker: "piaggio", name: "Moto Guzzi Stelvio (1042)", displacementCc: 1042, aliases: ["Moto Guzzi Stelvio", "モトグッツィステルビオ", "Stelvio1042"] },
  "vespa-primavera-125": { maker: "piaggio", name: "Vespa Primavera 125", displacementCc: 124, aliases: ["Vespa Primavera125", "Primavera125", "プリマベーラ125"] },
  "vespa-primavera-150": { maker: "piaggio", name: "Vespa Primavera 150", displacementCc: 155, aliases: ["Vespa Primavera150", "Primavera150", "プリマベーラ150"] },
  "vespa-sprint-125": { maker: "piaggio", name: "Vespa Sprint 125", displacementCc: 124, aliases: ["Vespa Sprint125", "Sprint125", "スプリント125"] },
  "vespa-sprint-150": { maker: "piaggio", name: "Vespa Sprint 150", displacementCc: 155, aliases: ["Vespa Sprint150", "Sprint150", "スプリント150"] },
  "vespa-gts-300": { maker: "piaggio", name: "Vespa GTS 300", displacementCc: 278, aliases: ["Vespa GTS300", "GTS300", "GTS Super300", "GTS SuperTech300", "ベスパGTS300"] },
  "vespa-gts-310": { maker: "piaggio", name: "Vespa GTS 310", displacementCc: 310, aliases: ["Vespa GTS310", "GTS310", "GTS Super310", "GTS SuperTech310", "ベスパGTS310"] },
  // ── インド：https://www.heromotocorp.com/ / https://www.bajajauto.com/ / https://www.tvsmotor.com/
  "hero-xpulse-200": { maker: "hero", name: "Hero Xpulse 200 4V", displacementCc: 199.6, aliases: ["Xpulse200", "Xpulse200 4V", "エクスパルス200"] },
  "hero-xpulse-210": { maker: "hero", name: "Hero Xpulse 210", displacementCc: 210, aliases: ["Xpulse210", "エクスパルス210"] },
  "hero-karizma-xmr": { maker: "hero", name: "Hero Karizma XMR 210", displacementCc: 210, aliases: ["Karizma XMR210", "Karizma XMR", "カリズマXMR"] },
  "hero-mavrick-440": { maker: "hero", name: "Hero Mavrick 440", displacementCc: 440, aliases: ["Mavrick440", "マーヴリック440"] },
  "bajaj-pulsar-ns200": { maker: "bajaj", name: "Bajaj Pulsar NS200", displacementCc: 199.5, aliases: ["Pulsar NS200", "パルサーNS200"] },
  "bajaj-pulsar-ns400z": { maker: "bajaj", name: "Bajaj Pulsar NS400Z", displacementCc: 373.27, aliases: ["Pulsar NS400Z", "パルサーNS400Z"] },
  "bajaj-dominar-400": { maker: "bajaj", name: "Bajaj Dominar 400", displacementCc: 373.3, aliases: ["Dominar400", "ドミナー400"] },
  "tvs-apache-rr310": { maker: "tvs", name: "TVS Apache RR 310", displacementCc: 312.2, aliases: ["TVS Apache RR310", "Apache RR310", "アパッチRR310"] },
  "tvs-apache-rtr310": { maker: "tvs", name: "TVS Apache RTR 310", displacementCc: 312.2, aliases: ["TVS Apache RTR310", "Apache RTR310", "アパッチRTR310"] },
  "tvs-apache-rtr200": { maker: "tvs", name: "TVS Apache RTR 200 4V", displacementCc: 197.75, aliases: ["Apache RTR200", "Apache RTR200 4V", "アパッチRTR200"] },
  "tvs-ronin": { maker: "tvs", name: "TVS Ronin", displacementCc: 225.9, aliases: ["TVS Ronin", "TVSローニン"] },
  // ── 中国
  "zxmoto-500rr": { maker: "zxmoto", name: "張雪機車 500RR (ZXMOTO 500RR)", displacementCc: 470, aliases: ["張雪機車 500RR", "张雪机车 500RR", "张雪500RR", "ZXMOTO 500RR", "ZX-500RR", "500RR"] },
  "zxmoto-820rr": { maker: "zxmoto", name: "張雪機車 820RR (ZXMOTO 820RR)", displacementCc: 819, aliases: ["張雪機車 820RR", "张雪机车 820RR", "张雪820RR", "張雪820RR", "ZXMOTO 820RR", "820RR"] },
  // 中国仕様：https://www.cfmoto.com/motorcycles/450sr / 北米名：https://www.cfmotousa.com/motorcycles
  // この 2 車種は中国向け取扱説明書の「整数排量」。商品ページの 449.5 / 675cc とは表記が異なる（docs/vehicles.md）。
  "cfmoto-450sr": { maker: "cfmoto", name: "CFMOTO 450SR / 450SR-S", displacementCc: 449, aliases: ["450SR", "450SR-S", "450SS", "CFMOTO 450SR", "春风450SR", "春風450SR"] },
  "cfmoto-675sr-r": { maker: "cfmoto", name: "CFMOTO 675SR-R", displacementCc: 674, aliases: ["675SR-R", "675SS", "CFMOTO 675SR", "春风675SR", "春風675SR"] },
  "cfmoto-250sr": { maker: "cfmoto", name: "CFMOTO 250SR", displacementCc: 249, aliases: ["250SR", "春风250SR", "春風250SR"] },
  "cfmoto-300sr": { maker: "cfmoto", name: "CFMOTO 300SR / 300SS", displacementCc: 292, aliases: ["300SR", "300SS", "春风300SR", "春風300SR"] },
  "cfmoto-450nk": { maker: "cfmoto", family: "cfmoto-nk", name: "CFMOTO 450NK", displacementCc: 449, aliases: ["450NK", "春风450NK", "春風450NK"] },
  "cfmoto-675nk": { maker: "cfmoto", family: "cfmoto-nk", name: "CFMOTO 675NK", displacementCc: 675, aliases: ["675NK", "春风675NK", "春風675NK"] },
  "cfmoto-800nk": { maker: "cfmoto", family: "cfmoto-nk", name: "CFMOTO 800NK", displacementCc: 799, aliases: ["800NK", "春风800NK", "春風800NK"] },
  "cfmoto-450mt": { maker: "cfmoto", name: "CFMOTO 450MT / Ibex 450", displacementCc: 449, aliases: ["450MT", "Ibex450", "春风450MT", "春風450MT"] },
  "cfmoto-800mt": { maker: "cfmoto", name: "CFMOTO 800MT / Ibex 800", displacementCc: 799, aliases: ["800MT", "800MT Explore", "Ibex800", "春风800MT", "春風800MT"] },
  "cfmoto-800mt-x": { maker: "cfmoto", name: "CFMOTO 800MT-X", displacementCc: 799, aliases: ["800MT-X", "春风800MT-X", "春風800MT-X"] },
  "cfmoto-700cl-x": { maker: "cfmoto", name: "CFMOTO 700CL-X", displacementCc: 693, aliases: ["700CL-X", "700CL-X Sport", "700CL-X Heritage", "春风700CL-X", "春風700CL-X"] },
  "cfmoto-450cl-c": { maker: "cfmoto", name: "CFMOTO 450CL-C", displacementCc: 449, aliases: ["450CL-C", "春风450CL-C", "春風450CL-C"] },
  "qjmotor-srk-600": { maker: "qjmotor", name: "QJMOTOR SRK600 / 追600", displacementCc: 600, aliases: ["SRK600", "追600", "钱江追600", "錢江追600"] },
  // https://it.qjmotor.com/product_list/1.html
  "qjmotor-srk-400": { maker: "qjmotor", name: "QJMOTOR SRK 400", displacementCc: 400, aliases: ["SRK400", "钱江追400", "錢江追400"] },
  "qjmotor-srk-800rr": { maker: "qjmotor", name: "QJMOTOR SRK 800 RR", displacementCc: 778, aliases: ["SRK800RR", "赛800", "賽800", "钱江赛800", "錢江賽800"] },
  "qjmotor-srv-550": { maker: "qjmotor", name: "QJMOTOR SRV 550", displacementCc: 554, aliases: ["SRV550"] },
  "voge-cu525": { maker: "voge", name: "VOGE CU525 (無極 CU525)", displacementCc: 494, aliases: ["CU525", "VOGE CU525", "无极CU525", "無極CU525", "无极525巡航"] },
  // https://www.vogeglobal.com/ds525x / https://vogemotorcycles.com/post/what-are-the-voge-models-finding-the-right-model-for-you-904
  "voge-ds525x": { maker: "voge", name: "VOGE DS525X", displacementCc: 494, aliases: ["DS525X", "525DSX", "无极DS525X", "無極DS525X"] },
  "voge-ds625x": { maker: "voge", name: "VOGE DS625X", displacementCc: 581, aliases: ["DS625X", "625DSX", "无极DS625X", "無極DS625X"] },
  "voge-ds900x": { maker: "voge", name: "VOGE DS900X", displacementCc: 895, aliases: ["DS900X", "900DSX", "无极DS900X", "無極DS900X"] },
  "voge-r625": { maker: "voge", name: "VOGE R625", displacementCc: 581, aliases: ["VOGE R625", "R625", "无极R625", "無極R625"] },
};

/** 名前の中の区切り（空白、ハイフン類、中黒、アポストロフィ、下線）。正規表現の文字クラスの中身。長音の「ー」は語の一部なので含めない。 */
export const NAME_SEPARATORS = "\\s\\-\\u2010-\\u2015\\u2212・'’_";

/** 名前の照合キー：全角と半角（NFKC）、大文字と小文字、区切りの違いを消す。 */
export function aliasKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(new RegExp(`[${NAME_SEPARATORS}]+`, "g"), "");
}

function byDisplacement<K extends string>(classes: Record<K, { maxCc: number }>, cc: number): K {
  return (Object.keys(classes) as K[]).find((k) => cc <= classes[k].maxCc)!;
}

export function vehicleClassOf(model: Pick<VehicleModel, "displacementCc">): VehicleClass {
  return byDisplacement(VEHICLE_CLASSES, model.displacementCc);
}

export function licenseClassOf(model: Pick<VehicleModel, "displacementCc">): LicenseClass {
  return byDisplacement(LICENSE_CLASSES, model.displacementCc);
}
