# 開發說明 DEV(建置流程)

> 自架構遷移 Stage 2a 起,主程式改由 **esbuild** 打包。以下是日常開發與兩機協作的規則。

## 檔案角色

- **`src/`** — **原始碼(唯一真相來源)**。目前是 `src/main.js`;之後會逐步拆成多個 ES module。**只改這裡。**
- **`game.js`** — **建置產物(自動產生,勿手改)**。由 `src/` 打包而成,`inkblade.html` 以 `<script src="game.js">` 載入。**已 commit**,這樣離線雙擊不需 build 也能跑。
- `data/game-config.js`、`data/sound-system.js` — 仍是獨立傳統 script,先不進打包(照舊在 game.js 之前載入)。
- `node_modules/`、`*.map` — 已 gitignore,不進版控。

## 指令

先裝一次:`npm install`(每台機器各一次;node_modules 不進版控)。

- `npm run build` — 打包一次:`src/main.js` → `game.js`。**改完 src 一定要 build**,否則 game.js 沒更新。
- `npm run watch` — 監看 src 自動重建(dev 時開著;含 inline sourcemap 方便除錯)。
- `npm run serve` — 起本機 http(`http://localhost:8080/inkblade.html`),**線上測試**用。
- `npm run check` — `node --check game.js` 語法檢查。

## 兩種跑法

- **線上(主要)**:`npm run serve`(或 `dev.bat` 選 4,會自動開瀏覽器)。根路徑 `localhost:8080/` 有 `index.html` 自動轉址到 `inkblade.html`,所以 `/` 或 `/inkblade.html` 都可進遊戲。
- **一鍵選單**:雙擊 `dev.bat`(Windows)即出選單跑上述指令,免貼指令。
- **離線(輔助)**:雙擊 `inkblade.html`,載入已 commit 的 `game.js` 即可。

## 兩機協作(重要)

- commit 內容:`src/`、`game.js`(產物)、`inkblade.html`、`package.json`、`docs/`。
- **每次 push 前務必 `npm run build`**,確保 `game.js` 與 `src/` 同步(否則另一台/離線會跑到舊碼)。
- 切機器前先 pull/push 對齊(同 SYNC.bat 流程)。

## 遷移現況

- Stage 0 ✅ 內聯 script 抽出成外部檔。
- Stage 2a ✅ 導入 esbuild;`src/main.js`(= 原碼,單一 iife)→ `game.js`。行為不變(原碼本就是 `'use strict'` 的自封閉 iife)。
- Stage 2b(下一步)⏳ 把 `src/main.js` 逐步拆成 ES module(core / combat / render / enemy / ui / boot…),用 import/export;打包器保證單一作用域,無 hoisting 風險。每拆一塊都 build + 實測。
- 詳見 `docs/architecture-migration-plan.md`。
