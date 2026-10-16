# 車種辞書の収録と更新

`industry/vehicles.ts` はニュースの原文に現れる名前を車種の slug に揃える辞書です。日本の公道用モデルを中心に、海外の主要モデルと、生産終了後も記事やリコールに出るモデルを収録します。販売中の車種の一覧や、全地域・全年式の諸元台帳ではありません。参照資料の確認日：2026-10-16。

## 収録の単位

同じエンジンを使っていても CB650R と CBR650R、GSX-8R と GSX-8S のような別車種は別の slug にします。SP / SE / DCT / E-Clutch など同じ車種の仕様違いはまとめます。既存の slug は変えません。旧 `kawasaki-w230-meguro-s1` は W230 に残し、MEGURO S1 には別の slug を加えています。

`maker` は既存の `taxonomy.ts` の企業キーです。Husqvarna は `ktm`、Aprilia・Moto Guzzi・Vespa は `piaggio` になります。辞書を増やすだけで企業分類を新設しません。

排気量は車名の数字から作らず、収録する世代の公式諸元を使います。国内仕様があるものは日本の諸元を優先し、小数が公表されているものはそのまま持ちます。例：390 DUKE は 398.7cc、Svartpilen 401 は 398.6cc、Himalayan 450 は 452cc。Vストローム250 は 248cc、250SX は 249cc で別車種です。

同名車の世代間の排気量変更は、この辞書だけでは判定できません。F 800 GS は 895cc の現行世代、MT-03 は 320cc の並列2気筒、YZF-R7 は 688cc の CP2 世代、Panigale V2・Streetfighter V2・Multistrada V2 は 890cc 世代を収録しています。旧世代を扱う記事の正確な諸元・免許判定には、年式や型式の照合が別途必要です。型式の一覧も全世代を網羅していません。

電動車、新基準原付の出力制限仕様、公道走行できない競技専用車は追加対象にしていません。現状の区分関数は通常の内燃機関の排気量だけを扱います。これらを収録する変更では、出力や区分を明示するデータ設計と検証が先に必要です。

## 別名と型式

- 日中英の車名、確認できる海外販売名を追加します。簡体字と繁体字はそれぞれ必要です。全角半角・大小文字・空白・ハイフンの違いは `aliasKey` が扱うので重複して書きません。
- PCX、NMAX、レブルなど排気量が定まらない名前は `VEHICLE_FAMILIES` に置きます。モデルの別名には数字だけ、メーカー名＋数字だけ、一般的なエンジンの呼び方を入れません。「张雪三缸」は車種を特定しないので外しています。
- 北米販売名の 450SS / 675SS / Ibex 450 なども同じ車種の別名にできます。ただし販売地域の装備や諸元が完全に同一であることを意味しません。
- 国交省の型式と車台番号の頭は `typeCodes` に置きます。同じ型式を共有する兄弟車には両方に書き、型式だけを挙げた原文では両方を候補にします。例：8BL-RH17 は CB650R と CBR650R、8BL-NC65 は CBR400R と NX400。車名だけの原文から兄弟車を追加することはありません。
- 中国名の「追」と「赛」は別の車種です。SRK600 の「追600」を「赛600」の別名として扱いません。

CFMOTO の排気量は資料によって表記が異なります。450SR の商品ページは 449.5cc、675SR-R は 675cc と書きますが、中国向け取扱説明書の「整数排量」はそれぞれ 449mL、674mL です。この 2 件は従来の説明書の値を維持しています。商品名の数字に合わせて値を変更しません。

## 主な確認先

メーカーの車種一覧から各車の主要諸元・取扱説明書へ進みます。販売終了車は製品アーカイブや当時の公式発表を参照します。

| ブランド | 公式資料 |
|---|---|
| Honda | [車種一覧・製品アーカイブ](https://www.honda.co.jp/motor-lineup/)、[CB650R / CBR650R の共通型式](https://global.honda/jp/news/2024/2240411-cb650r.html)、[CBR400R / NX400 の型式](https://www.honda.co.jp/recall/motor/info/240919_5538.html)、[GB350 C の発表](https://global.honda/jp/news/2024/2240912-gb350c.html) |
| Yamaha | [排気量別一覧](https://www.yamaha-motor.co.jp/mc/lineup/displacement.html)、[YZF-R1 公式カタログ](https://www.yamaha-motor.co.jp/mc/lineup/pdf/Catalog_yzf-r1_2023.pdf) |
| Kawasaki | [モデル比較](https://www.kawasaki-motors.com/ja-jp/purchase-tools/compare-vehicles/motorcycle/ninja) |
| Suzuki | [排気量付き車種一覧](https://www1.suzuki.co.jp/motor/lineup/) |
| KTM | [モデル一覧](https://www.ktm.com/ja-jp/models.html)、[390 DUKE の発表・398.7cc](https://www.ktm.com/ja-jp/ktm-world/news/2024_NEW_KTM_390_DUKE.html) |
| Husqvarna | [Svartpilen 401・398.6cc](https://www.husqvarna-motorcycles.com/ja-jp/models/naked/svartpilen/svartpilen-401-2026.html)、[Vitpilen 801・799cc](https://www.husqvarna-motorcycles.com/ja-jp/models/naked/vitpilen/vitpilen-801-2026.html)、[旧モデルの公式発表](https://www.husqvarna-motorcycles.com/ja-jp/news/2022-street-model.html) |
| Triumph | [Trident 660](https://www.triumphmotorcycles.com/motorcycles/roadsters/trident/specification)、[Daytona 660](https://www.triumphmotorcycles.com/motorcycles/sport/daytona-660/specification)、[Trident 800・798cc の発表](https://www.triumphmotorcycles.com/for-the-ride/news/motorcycles/triumph-reveals-all-new-trident-800-2025-28-10) |
| BMW | [モデル一覧](https://www.bmw-motorrad.jp/ja/models/modeloverview.html)、[F 800 GS](https://www.bmw-motorrad.jp/ja/models/adventure/f800gs/technicaldata.html)、[F 450 GS・420cc](https://www.bmw-motorrad.jp/ja/models/adventure/f450gs/technicaldata.html) |
| Ducati | [新 Panigale V2・890cc](https://www.ducati.com/jp/ja/bikes/panigale/panigale-v2)、[新 DesertX V2・890cc](https://www.ducati.com/jp/ja/bikes/desertx/desertx-v2)、[Testastretta・937cc](https://www.ducati.com/jp/ja/company/innovation/engines/testastretta) |
| Harley-Davidson | [MY2025 日本向け一覧](https://www.harley-davidson.com/jp/ja/motorcycles/2025/index.html) |
| Royal Enfield | [日本向け一覧](https://www.royalenfield.com/jp/ja/motorcycles/)、[Himalayan 450 の公式諸元](https://www.royalenfield.com/content/dam/open-pdf/royal-enfield-new-himalayan-450_technical_specifications.pdf) |
| Aprilia / Moto Guzzi | [Aprilia](https://www.aprilia.com/jp_JA/index/)、[Moto Guzzi](https://www.motoguzzi.com/)、[Stelvio・1042cc](https://www.motoguzzi.com/gb_EN/models/stelvio/) |
| Vespa | [公式カタログ・排気量比較](https://www.vespa.com/wlassets/vespa/master/brochure/EICMA/EN-DIGITAL-Vespa-Range-11-2022/original/EN-DIGITAL-Vespa%2BRange-11-2022.pdf)、[GTS 310](https://www.vespa.com/en_EN/models/gts/gts-310-hpe-2024/) |
| Hero / Bajaj / TVS | [Hero モデル比較](https://www.heromotocorp.com/en-in/products/compare-page.html)、[Bajaj 海外モデル](https://www.bajajauto.com/en-np/bikes)、[Apache RR310・312.2cc](https://www.tvsmotor.com/en/cd/our-products/tvs-apache-rr-310)、[Apache RTR310](https://www.tvsmotor.com/tvs-apache/apache-rtr-310) |
| ZXMOTO | [500RR・470cc](https://global.zxmoto.com/index.php?c=show&id=40)、[820RR](https://global.zxmoto.com/index.php?c=show&id=65) |
| CFMOTO | [中国モデル](https://www.cfmoto.com/)、[450SR 取扱説明書](https://www.cfmoto.com/upload/file/20250307/450SR%20CF400-12%286AQV-380101-2300-11%20CN253%29-20250303.pdf)、[675SR-R 取扱説明書](https://cfimages.cfmoto.com/cfmoto/675_SR_R_CF_650_10_6_GUV_380101_5600_11_CN_24_C_20250822_80203a9109.pdf)、[北米販売名](https://www.cfmotousa.com/motorcycles) |
| QJMOTOR | [公式一覧](https://www.qjmotor.com/)、[追600](https://www.qjmotor.com/car.html?id=41)、[SRK 800 RR](https://it.qjmotor.com/products_details/48.html) |
| VOGE | [DS525X・494cc](https://www.vogeglobal.com/ds525x)、[英国公式のモデル・排気量比較](https://vogemotorcycles.com/post/what-are-the-voge-models-finding-the-right-model-for-you-904) |

## 追加後の確認

```bash
node --test tests/vehicles.test.ts modules/vehicles/tests/*.test.ts
npm run typecheck
```

辞書のテストは slug・企業・排気量・系列の参照、正規化後の別名の重複を検査します。照合のテストは全別名を単独で読み、別車種や系列に化けないこと、全型式が共有する車種だけに一致することを確かめます。新たに収録した名前が未収録名のテストに使われていたら、その期待値も更新します。これらはデータの整合性の検証であり、公式諸元の事実確認を代わりに行うものではありません。

別名や系列を追加しても、保存済み記事の解析結果は自動で書き換わりません。必要な記事だけ通常の再解析に回します。既存の slug を維持しているので、今回の辞書拡充のためのテーブル変更やデータ削除はありません。
