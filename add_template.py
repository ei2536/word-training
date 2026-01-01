import json

def generate_template_entry(classification_name, keywords, responses, priority):
    """
    response_templates に追加する形式の辞書を生成します。
    """
    # キーワードを正規表現パターンに変換
    pattern = "(" + "|".join(keywords) + ")"

    # 指定の形式で辞書を返す
    return {
        classification_name: {
            "patterns": [pattern],
            "responses": responses,
            "priority": priority
        }
    }


def add_template_to_json_file(file_path, new_entry):
    """
    既存のJSONファイルの response_templates に新しい分類を追加します。
    """
    # JSON を読み込む
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # response_templates が存在しない場合は作る
    if "response_templates" not in data:
        data["response_templates"] = {}

    # new_entry の内容を追加
    for key, value in new_entry.items():
        data["response_templates"][key] = value

    # JSON を上書き保存
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    # 入力を受け取る
    classification = input("分類名を英語で入力してください: ")

    keywords_input = input("キーワードをカンマ区切りで入力してください: ")
    keywords = [k.strip() for k in keywords_input.split(",")]

    responses_input = input("応答を文ごとにカンマ区切りで入力してください: ")
    responses = [r.strip() for r in responses_input.split(",")]

    priority = int(input("優先度を入力してください: "))

    # テンプレート生成
    new_entry = generate_template_entry(classification, keywords, responses, priority)

    # 生成結果を表示
    print("\n生成されたテンプレート:")
    print(json.dumps(new_entry, ensure_ascii=False, indent=2))

    # JSON に追加するか確認
    confirm = input("\nこの内容をJSONファイルに追加しますか？ [y/N]: ")

    if confirm.lower() == "y":
        file_path = input("JSONファイルのパスを入力してください: ")
        add_template_to_json_file(file_path, new_entry)
        print("✅ JSONファイルに追加しました。")
    else:
        print("キャンセルしました。")