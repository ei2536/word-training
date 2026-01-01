/* ============================================
   データ読み込み
============================================ */
let words = JSON.parse(localStorage.getItem("words") || "[]");

/*
  genres の構造（3階層）:
  {
    "英語": {
      "文法": ["時制", "助動詞"],
      "単語": ["動詞", "名詞"]
    }
  }
*/
let genres = JSON.parse(localStorage.getItem("genres") || "{}");

let current = null;
let mode = null;

let totalQuestions = 0;
let currentNumber = 0;
let correctCount = 0;
let quizOrder = [];

/* ============================================
   ページ切り替え
============================================ */
// ページ切り替え関数
function showPage(page) {
  // 全ページ非表示
  document.getElementById("home").style.display = "none";
  document.getElementById("genrePage").style.display = "none";
  document.getElementById("settings").style.display = "none";
  document.getElementById("quiz").style.display = "none";
  document.getElementById("resultPage").style.display = "none";

  // 指定ページを表示
  document.getElementById(page).style.display = "block";

  // ページごとの更新処理
  if (page === "home") {
    updateWordTree();    // 単語一覧を更新
  }
  if (page === "genrePage") {
    updateGenreTree();   // ジャンル一覧を更新
  }
}

/* ============================================
   genres を words から復元（必要な場合）
============================================ */
function rebuildGenresFromWordsIfNeeded() {
  if (Object.keys(genres).length === 0 && words.length > 0) {
    genres = {};
    words.forEach(w => {
      const g = w.genre;
      const sg = w.subGenre;
      const ssg = w.subSubGenre;

      if (!g) return; // おかしいデータはスキップ

      if (!genres[g]) genres[g] = {};
      if (!genres[g][sg]) genres[g][sg] = [];
      if (ssg && !genres[g][sg].includes(ssg)) {
        genres[g][sg].push(ssg);
      }
    });
    saveGenres();
  }
}

/* ============================================
   ジャンル管理（3階層）
============================================ */

function addGenre() {
  const g = document.getElementById("newGenre").value.trim();
  if (!g) return;

  if (!genres[g]) genres[g] = {};

  saveGenres();
  document.getElementById("newGenre").value = "";
  updateGenreTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function addSubGenre(genre) {
  const name = prompt("サブジャンル名を入力（空欄不可）");
  if (!name) return;

  if (!genres[genre][name]) genres[genre][name] = [];

  saveGenres();
  updateGenreTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function addSubSubGenre(genre, sub) {
  const name = prompt("サブサブジャンル名を入力（空欄不可）");
  if (!name) return;

  genres[genre][sub].push(name);
  genres[genre][sub] = [...new Set(genres[genre][sub])];

  saveGenres();
  updateGenreTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function deleteGenre(genre) {
  if (!confirm(`「${genre}」を削除しますか？\nこのジャンルの単語もすべて削除されます。`)) return;

  words = words.filter(w => w.genre !== genre);
  delete genres[genre];

  saveWords();
  saveGenres();
  updateGenreTree();
  updateWordTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function deleteSubGenre(genre, sub) {
  if (!confirm(`「${genre} → ${sub}」を削除しますか？\nこのサブジャンルの単語もすべて削除されます。`)) return;

  words = words.filter(w => !(w.genre === genre && w.subGenre === sub));
  delete genres[genre][sub];

  saveWords();
  saveGenres();
  updateGenreTree();
  updateWordTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function deleteSubSubGenre(genre, sub, subsub) {
  if (!confirm(`「${genre} → ${sub} → ${subsub}」を削除しますか？\nこのサブサブジャンルの単語もすべて削除されます。`)) return;

  words = words.filter(w => !(w.genre === genre && w.subGenre === sub && w.subSubGenre === subsub));
  genres[genre][sub] = genres[genre][sub].filter(s => s !== subsub);

  saveWords();
  saveGenres();
  updateGenreTree();
  updateWordTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();
}

function updateGenreTree() {
  const container = document.getElementById("genreTree");
  container.innerHTML = "";

  const sortedGenres = Object.keys(genres).sort();

  sortedGenres.forEach(genre => {
    const genreDiv = document.createElement("div");
    genreDiv.className = "tree-genre";

    genreDiv.innerHTML = `
      <div class="tree-title" onclick="toggleTree(this)">
        ▶ ${genre}
        <button class="small-btn" onclick="event.stopPropagation(); addSubGenre('${genre}')">サブ追加</button>
        <button class="small-btn" onclick="event.stopPropagation(); deleteGenre('${genre}')">削除</button>
      </div>
      <div class="tree-sub-container" style="display:none;"></div>
    `;

    const subContainer = genreDiv.querySelector(".tree-sub-container");

    Object.keys(genres[genre]).forEach(sub => {
      const subDiv = document.createElement("div");
      subDiv.className = "tree-sub";

      subDiv.innerHTML = `
        <div class="tree-sub-title" onclick="toggleTree(this)">
          ▶ ${sub}
          <button class="small-btn" onclick="event.stopPropagation(); addSubSubGenre('${genre}', '${sub}')">サブサブ追加</button>
          <button class="small-btn" onclick="event.stopPropagation(); deleteSubGenre('${genre}', '${sub}')">削除</button>
        </div>
        <div class="tree-subsub-container" style="display:none;"></div>
      `;

      const subSubContainer = subDiv.querySelector(".tree-subsub-container");

      genres[genre][sub].forEach(subsub => {
        const subSubDiv = document.createElement("div");
        subSubDiv.className = "tree-subsub";

        subSubDiv.innerHTML = `
          <div class="tree-subsub-title">
            ${subsub}
            <button class="small-btn" onclick="event.stopPropagation(); deleteSubSubGenre('${genre}', '${sub}', '${subsub}')">削除</button>
          </div>
        `;

        subSubContainer.appendChild(subSubDiv);
      });

      subContainer.appendChild(subDiv);
    });

    container.appendChild(genreDiv);
  });
}

function toggleTree(el) {
  const next = el.nextElementSibling;
  if (!next) return;

  if (next.style.display === "none") {
    next.style.display = "block";
    el.innerHTML = el.innerHTML.replace("▶", "▼");
  } else {
    next.style.display = "none";
    el.innerHTML = el.innerHTML.replace("▼", "▶");
  }
}

function saveGenres() {
  localStorage.setItem("genres", JSON.stringify(genres));
}

/* ============================================
   単語登録（3階層）
============================================ */

function updateGenreSelectWord() {
  const sel = document.getElementById("genreSelectWord");
  sel.innerHTML = `<option value="">ジャンルを選択</option>`;

  Object.keys(genres).sort().forEach(g => {
    const op = document.createElement("option");
    op.value = g;
    op.textContent = g;
    sel.appendChild(op);
  });

  updateSubGenreSelectWord();
}

function updateSubGenreSelectWord() {
  const genre = document.getElementById("genreSelectWord").value;
  const sel = document.getElementById("subGenreSelectWord");

  sel.innerHTML = `<option value="">サブジャンルを選択</option>`;

  if (!genre) return;

  Object.keys(genres[genre]).sort().forEach(s => {
    const op = document.createElement("option");
    op.value = s;
    op.textContent = s;
    sel.appendChild(op);
  });

  updateSubSubGenreSelectWord();
}

function updateSubSubGenreSelectWord() {
  const genre = document.getElementById("genreSelectWord").value;
  const sub = document.getElementById("subGenreSelectWord").value;
  const sel = document.getElementById("subSubGenreSelectWord");

  sel.innerHTML = `<option value="">サブサブジャンルを選択</option>`;

  if (!genre || !sub) return;

  genres[genre][sub].forEach(s => {
    const op = document.createElement("option");
    op.value = s;
    op.textContent = s;
    sel.appendChild(op);
  });
}

function addWord() {
  const w = document.getElementById("word").value.trim();
  const wa = document.getElementById("wordAlts").value.trim();
  const m = document.getElementById("meaning").value.trim();

  const g = document.getElementById("genreSelectWord").value;
  const s = document.getElementById("subGenreSelectWord").value;
  const ss = document.getElementById("subSubGenreSelectWord").value;

  if (!w || !m || !g || !s || !ss) {
    alert("単語・意味・ジャンル・サブジャンル・サブサブジャンルは必須です");
    return;
  }

  const alts = wa ? wa.split(",").map(x => x.trim()) : [];

  words.push({
    word: w,
    wordAlts: alts,
    meaning: m,
    genre: g,
    subGenre: s,
    subSubGenre: ss,
    enabled: true
  });

  saveWords();

  document.getElementById("word").value = "";
  document.getElementById("wordAlts").value = "";
  document.getElementById("meaning").value = "";

  updateWordTree();

  // ★ 登録した単語の位置まで自動でツリーを開く
setTimeout(() => {
  openWordPath(g, s, ss, w);
}, 50);
}

function saveWords() {
  localStorage.setItem("words", JSON.stringify(words));
}

/* ============================================
   単語一覧（3階層）
============================================ */

function updateWordTree() {
  const container = document.getElementById("wordTree");
  container.innerHTML = "";

  const sortedGenres = Object.keys(genres).sort();

  sortedGenres.forEach(genre => {
    const genreDiv = document.createElement("div");
    genreDiv.className = "tree-genre";

    genreDiv.innerHTML = `
      <div class="tree-title" onclick="toggleTree(this)">▶ ${genre}</div>
      <div class="tree-sub-container" style="display:none;"></div>
    `;

    const subContainer = genreDiv.querySelector(".tree-sub-container");

    Object.keys(genres[genre]).forEach(sub => {
      const subDiv = document.createElement("div");
      subDiv.className = "tree-sub";

      subDiv.innerHTML = `
        <div class="tree-sub-title" onclick="toggleTree(this)">▶ ${sub}</div>
        <div class="tree-subsub-container" style="display:none;"></div>
      `;

      const subSubContainer = subDiv.querySelector(".tree-subsub-container");

      genres[genre][sub].forEach(subsub => {
        const subSubDiv = document.createElement("div");
        subSubDiv.className = "tree-subsub";

        subSubDiv.innerHTML = `
          <div class="tree-subsub-title" onclick="toggleTree(this)">▶ ${subsub}</div>
          <div class="tree-table-container" style="display:none;"></div>
        `;

        const tableContainer = subSubDiv.querySelector(".tree-table-container");

        const list = words.filter(
          w => w.genre === genre && w.subGenre === sub && w.subSubGenre === subsub
        );

        // ★ ここでクリック伝播を完全に止める
        tableContainer.addEventListener("click", event => event.stopPropagation());

        tableContainer.appendChild(createWordTable(list));

        subSubContainer.appendChild(subSubDiv);
      });

      subContainer.appendChild(subDiv);
    });

    container.appendChild(genreDiv);
  });
}

function openWordPath(genre, sub, subsub, word) {
  const container = document.getElementById("wordTree");

  // ① まず全部閉じる
  container.querySelectorAll(".tree-sub-container, .tree-subsub-container, .tree-table-container")
    .forEach(el => el.style.display = "none");

  container.querySelectorAll(".tree-title, .tree-sub-title, .tree-subsub-title")
    .forEach(el => {
      el.innerHTML = el.innerHTML.replace("▼", "▶");
    });

  // ② ジャンルを開く
  const genreTitle = [...container.querySelectorAll(".tree-title")]
    .find(el => el.innerText.includes(genre));
  if (genreTitle) {
    genreTitle.click();
  }

  // ③ サブジャンルを開く
  const subTitle = [...container.querySelectorAll(".tree-sub-title")]
    .find(el => el.innerText.includes(sub));
  if (subTitle) {
    subTitle.click();
  }

  // ④ サブサブジャンルを開く
  const subsubTitle = [...container.querySelectorAll(".tree-subsub-title")]
    .find(el => el.innerText.includes(subsub));
  if (subsubTitle) {
    subsubTitle.click();
  }

  // ⑤ その単語の行までスクロール
  const row = [...container.querySelectorAll("tr")]
    .find(r => r.children[1] && r.children[1].innerText === word);

  if (row) {
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function searchWords() {
  const keyword = document.getElementById("searchWord").value.trim().toLowerCase();

  if (keyword === "") {
    updateWordTree(); // 空なら通常表示
    return;
  }

  const container = document.getElementById("wordTree");
  container.innerHTML = "";

  // キーワードを含む単語を抽出
  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(keyword) ||
    w.meaning.toLowerCase().includes(keyword) ||
    w.wordAlts.some(a => a.toLowerCase().includes(keyword))
  );

  // 検索結果をテーブルで表示
  container.appendChild(createWordTable(filtered));
}

function createWordTable(list) {
  const table = document.createElement("table");
  table.className = "word-table";

  table.innerHTML = `
    <tr>
      <th>出題</th>
      <th>単語</th>
      <th>別解</th>
      <th>意味</th>
      <th>編集</th>
      <th>削除</th>
    </tr>
  `;

  list.forEach(w => {
    const row = document.createElement("tr");

    // ★★★ ここで tr 自体のクリックを止める ★★★
    row.addEventListener("click", event => event.stopPropagation());

    row.innerHTML = `
      <td><input type="checkbox" ${w.enabled ? "checked" : ""} onclick="event.stopPropagation(); toggleEnabled('${w.word}')"></td>
      <td>${w.word}</td>
      <td>${w.wordAlts.join(" / ")}</td>
      <td>${w.meaning}</td>

      <td><button class="editBtn" onclick="event.stopPropagation(); editWord('${w.word}')">編集</button></td>
      <td><button class="deleteBtn" onclick="event.stopPropagation(); deleteWord('${w.word}')">削除</button></td>
    `;

    table.appendChild(row);
  });

  return table;
}

function toggleEnabled(wordName) {
  const w = words.find(w => w.word === wordName);
  w.enabled = !w.enabled;
  saveWords();
}

function deleteWord(wordName) {
  if (!confirm(`${wordName} を削除しますか？`)) return;

  words = words.filter(w => w.word !== wordName);
  saveWords();
  updateWordTree();
}

/* ============================================
   編集機能
============================================ */

function editWord(wordName) {
  const container = document.getElementById("wordTree");
  const rows = container.querySelectorAll("tr");

  rows.forEach(row => {
    if (row.children[1] && row.children[1].innerText === wordName) {
      const w = words.find(x => x.word === wordName);

      row.innerHTML = `
        <td><input type="checkbox" ${w.enabled ? "checked" : ""} onclick="event.stopPropagation(); toggleEnabled('${w.word}')"></td>
        <td><input id="editWord" value="${w.word}"></td>
        <td><input id="editAlts" value="${w.wordAlts.join(', ')}"></td>
        <td><input id="editMeaning" value="${w.meaning}"></td>
        <td><button class="editBtn" onclick="event.stopPropagation(); saveWord('${w.word}')">保存</button></td>
        <td><button class="deleteBtn" onclick="event.stopPropagation(); updateWordTree()">キャンセル</button></td>
      `;
    }
  });
}

function saveWord(oldName) {
  const newName = document.getElementById("editWord").value.trim();
  const newAlts = document.getElementById("editAlts").value.split(",").map(s => s.trim());
  const newMeaning = document.getElementById("editMeaning").value.trim();

  const w = words.find(x => x.word === oldName);
  if (!w) return;

  w.word = newName;
  w.wordAlts = newAlts;
  w.meaning = newMeaning;

  // ★ ツリーを再描画しない（閉じる原因なので）
  // updateWordTree(); ← 削除

  // ★ 編集していた行だけ元の表示に戻す
  const container = document.getElementById("wordTree");
  const rows = container.querySelectorAll("tr");

  rows.forEach(row => {
    if (row.children[1] && row.children[1].querySelector("#editWord")) {

      row.innerHTML = `
        <td><input type="checkbox" ${w.enabled ? "checked" : ""} onclick="event.stopPropagation(); toggleEnabled('${w.word}')"></td>
        <td>${w.word}</td>
        <td>${w.wordAlts.join(" / ")}</td>
        <td>${w.meaning}</td>
        <td><button class="editBtn" onclick="event.stopPropagation(); editWord('${w.word}')">編集</button></td>
        <td><button class="deleteBtn" onclick="event.stopPropagation(); deleteWord('${w.word}')">削除</button></td>
      `;
    }
  });
}

/* ============================================
   出題設定（3階層）
============================================ */

function updateGenreSelectSetting() {
  const sel = document.getElementById("genreSelectSetting");
  sel.innerHTML = `<option value="all">すべてのジャンル</option>`;

  Object.keys(genres).sort().forEach(g => {
    const op = document.createElement("option");
    op.value = g;
    op.textContent = g;
    sel.appendChild(op);
  });

  updateSubGenreSelectSetting();
}

function updateSubGenreSelectSetting() {
  const genre = document.getElementById("genreSelectSetting").value;
  const sel = document.getElementById("subGenreSelectSetting");

  sel.innerHTML = `
    <option value="all">すべて</option>
    <option value="">（サブジャンルなし）</option>
  `;

  if (genre === "all") {
    updateSubSubGenreSelectSetting();
    return;
  }

  Object.keys(genres[genre]).sort().forEach(s => {
    const op = document.createElement("option");
    op.value = s;
    op.textContent = s;
    sel.appendChild(op);
  });

  updateSubSubGenreSelectSetting();
}

function updateSubSubGenreSelectSetting() {
  const genre = document.getElementById("genreSelectSetting").value;
  const sub = document.getElementById("subGenreSelectSetting").value;
  const sel = document.getElementById("subSubGenreSelectSetting");

  // 先に現在の値を保存
  const prevValue = sel.value;

  // 一旦クリア
  sel.innerHTML = "";

  // 基本の2つ
  sel.appendChild(new Option("すべて", "all"));
  sel.appendChild(new Option("（サブサブジャンルなし）", ""));

  // サブジャンルが実際の名前のときだけ追加
  if (genre !== "all" && sub !== "all" && sub !== "") {
    const list = genres[genre][sub];
    if (list) {
      list.forEach(s => {
        sel.appendChild(new Option(s, s));
      });
    }
  }

  // 以前の選択が存在するなら復元
  if ([...sel.options].some(o => o.value === prevValue)) {
    sel.value = prevValue;
  } else {
    sel.value = "all";
  }

  updateQuizCountMax();
}

/* ============================================
   出題数の最大値を自動設定
============================================ */

function updateQuizCountMax() {
  const genre = document.getElementById("genreSelectSetting").value;
  const sub = document.getElementById("subGenreSelectSetting").value;
  const subsub = document.getElementById("subSubGenreSelectSetting").value;

  let enabledWords = words.filter(w => w.enabled);

  let max = 0;

  if (genre === "all") {
    max = enabledWords.length;
  } else if (sub === "all") {
    max = enabledWords.filter(w => w.genre === genre).length;
  } else if (subsub === "all") {
    max = enabledWords.filter(
      w => w.genre === genre && w.subGenre === sub
    ).length;
  } else {
    max = enabledWords.filter(
      w => w.genre === genre && w.subGenre === sub && w.subSubGenre === subsub
    ).length;
  }

  const input = document.getElementById("quizCount");
  input.max = max;
  input.value = max;
}

/* ============================================
   クイズ（ランダム出題・最大数自動設定）
============================================ */

function startQuiz() {
  const genre = document.getElementById("genreSelectSetting").value;
  const sub = document.getElementById("subGenreSelectSetting").value;
  const subsub = document.getElementById("subSubGenreSelectSetting").value;

  let enabledWords = words.filter(w => w.enabled);

  if (genre !== "all") enabledWords = enabledWords.filter(w => w.genre === genre);
  if (sub !== "all") enabledWords = enabledWords.filter(w => w.subGenre === sub);
  if (subsub !== "all") enabledWords = enabledWords.filter(w => w.subSubGenre === subsub);

  if (enabledWords.length === 0) {
    alert("出題できる単語がありません");
    return;
  }

  // ★ ユーザーが入力した出題数を取得
  let count = Number(document.getElementById("quizCount").value);

  // ★ 入力が不正なら最大値にする
  if (!count || count <= 0 || count > enabledWords.length) {
    count = enabledWords.length;
  }

  // ★ ここで初めて totalQuestions を決める
  totalQuestions = count;

  // ★ 入力欄も正しい値に更新
  document.getElementById("quizCount").value = count;

  mode = document.getElementById("quizMode").value;

  currentNumber = 1;
  correctCount = 0;

  // ★ 出題数に合わせて問題をシャッフルして切り取る
  createQuizOrder(enabledWords.slice(0, count));

  showPage("quiz");
  nextQuestion();
}

/* ============================================
   ランダム出題順（Fisher–Yates）
============================================ */

function createQuizOrder(list) {
  quizOrder = [];

  for (let i = 0; i < list.length; i++) {
    quizOrder.push(i);
  }

  for (let i = quizOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizOrder[i], quizOrder[j]] = [quizOrder[j], quizOrder[i]];
  }

  quizOrder = quizOrder.slice(0, totalQuestions);
}

/* ============================================
   問題表示
============================================ */

function nextQuestion() {
  if (currentNumber > totalQuestions) {
    showResult();
    return;
  }

  const genre = document.getElementById("genreSelectSetting").value;
  const sub = document.getElementById("subGenreSelectSetting").value;
  const subsub = document.getElementById("subSubGenreSelectSetting").value;

  let enabledWords = words.filter(w => w.enabled);

  if (genre !== "all") enabledWords = enabledWords.filter(w => w.genre === genre);
  if (sub !== "all") enabledWords = enabledWords.filter(w => w.subGenre === sub);
  if (subsub !== "all") enabledWords = enabledWords.filter(w => w.subSubGenre === subsub);

  current = enabledWords[quizOrder[currentNumber - 1]];

  document.getElementById("progress").innerText =
    `第 ${currentNumber} 問 / 全 ${totalQuestions} 問`;

  document.getElementById("question").innerText =
    mode === "meaning" ? `問題：${current.word}` : `問題：${current.meaning}`;

  document.getElementById("answer").value = "";
  document.getElementById("result").innerText = "";
  document.getElementById("nextBtn").style.display = "none";
}

/* ============================================
   回答チェック
============================================ */

function checkAnswer() {
  const ans = document.getElementById("answer").value.trim().toLowerCase();

  const correctList =
    mode === "meaning"
      ? [current.meaning]
      : [current.word, ...(current.wordAlts || [])];

  let correct = false;

  for (const c of correctList) {
    if (ans === c.toLowerCase()) {
      correct = true;
      break;
    }
  }

  if (correct) correctCount++;

  document.getElementById("result").innerText = correct
    ? "正解！"
    : `不正解… 正解は「${correctList.join(" / ")}」`;

  document.getElementById("nextBtn").style.display = "block";
}

/* ============================================
   次の問題へ
============================================ */

function goNext() {
  currentNumber++;
  nextQuestion();
}

/* ============================================
   結果表示
============================================ */

function showResult() {
  showPage("resultPage");
  document.getElementById("score").innerText =
    `正解数：${correctCount} / ${totalQuestions}`;
}

/* ============================================
   再スタート
============================================ */

function restart() {
  showPage("settings");
}

/* ============================================
   初期化
============================================ */

function init() {
  // 必要なら genres を words から復元
  rebuildGenresFromWordsIfNeeded();

  // 画面に反映
  updateGenreTree();
  updateWordTree();
  updateGenreSelectWord();
  updateGenreSelectSetting();

  // 最初に表示するページ
  showPage("settings");
}

// ページ読み込み時に実行
init();