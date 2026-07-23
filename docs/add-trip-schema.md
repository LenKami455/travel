# 旅程下書きインポート スキーマ(v11・A)

LINEやメモに残った旅程テキストを、Nagiの「JSONから復元」に読み込ませて旅程の下書きを
作るためのスキーマ。**Nagi本体はAI変換を行わない**(`docs/v11-design.md` 参照)。
このスキーマに沿ったJSONを外部のAI(Claudeとの会話など)に作ってもらい、
ファイルとして保存して「バックアップ / 復元」→「JSONから復元」に読み込ませる。

## 外部AIへの依頼テンプレ

以下をそのままAIに貼り付けて使う:

> このやりとりで決めた旅程を、次のJSONスキーマで出力してください。
> 場所の緯度経度が分かる場合は `newSpots` に入れてください。分からない場合は省略して構いません。
> 出力はコードブロックのJSONのみにしてください。
>
> ```jsonc
> {
>   "trip": { "name":"旅程名", "subtitle":"任意の一言(しおり表紙に表示)",
>     "days":[
>       { "date":"YYYY-MM-DD",
>         "entries":[
>           {"type":"stay","spotName":"スポット名","arrive":"14:00","depart":"16:00","memo":"任意"},
>           {"type":"transit","mode":"car","from":"出発地名","to":"到着地名","dep":"16:30","arr":"17:40"},
>           {"type":"place","name":"立ち寄り地名","arrive":"18:00","depart":"18:30","memo":"任意"},
>           {"type":"note","text":"任意のメモ"}
>         ]
>       }
>     ]
>   },
>   "newSpots":[ {"name":"スポット名","lat":33.852,"lng":132.786} ]
> }
> ```

## フィールド

- `trip.name` (必須) / `trip.subtitle` (任意)
- `trip.days[].date` (必須・`YYYY-MM-DD`)
- `trip.days[].entries[]` — 4種類:
  - `stay`: `spotName`(必須)・`arrive`・`depart`・`memo`
  - `transit`: `mode`(`train`/`bus`/`car`/`walk`/`ship`/`plane`)・`from`・`to`・`dep`・`arr`・`line`(路線名、任意)
  - `place`: `name`(必須)・`arrive`・`depart`・`memo`
  - `note`: `text`
- `newSpots[]` — `spotName` が既存スポットに一致しない場合の候補。`lat`/`lng` が分かれば入れる。
  無くても取り込みは可能(Nagi側の取り込みプレビューで手入力する)。

## 取り込み側の挙動

1. Nagiが `stay` の `spotName` を既存スポット名と突き合わせる(完全一致)
2. 一致しなければ `newSpots` の座標を使い、無ければプレビュー画面で緯度経度を手入力してもらう
   (自動ジオコーディングはしない — APIキーをNagi本体に持たせないため)
3. 座標が確定するまで取り込みは完了しない(星空スコア等の計算が座標前提のため)
4. 確認後、新規スポット+新規旅程としてマージ登録される(既存データは変更しない)

## 非対応

- ショット・機材チェックリスト・写真日記・訪問ログはこのスキーマの対象外(旅程の骨組みのみ)
- 既存旅程への追記(このスキーマは新規旅程の作成のみ)
