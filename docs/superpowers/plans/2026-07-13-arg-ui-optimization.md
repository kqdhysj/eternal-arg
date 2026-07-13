# 永恒号 ARG UI Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改 `app.js` 和 ARG 内容/逻辑的前提下，完成全部 13 个 HTML 页面的 UI 优化、来源识别与桌面端验收。

**Architecture:** 所有视觉修改保留在各 HTML 的内嵌 CSS 与必要语义标记中，不引入共享运行时依赖。`index.html` 在 `app.js` 之后使用一个容错的 `MutationObserver` 为终端新增输出添加来源类；其余页面只调整现有样式和结构，不改变事件处理器。

**Tech Stack:** HTML5、内嵌 CSS、原生浏览器 JavaScript、PowerShell 静态契约检查、Python 静态服务器、浏览器交互验收。

## Global Constraints

- 不修改 `app.js`；其 SHA-256 必须保持 `7363c83fbdab95dbe5ab3c78087e15cddaf795deb73defbd0494475623134ef8`。
- 主题色固定为林汐蓝 `#88ccff`、深空黑 `#0a0e17`、面板黑 `#111827cc`、警告橙 `#ffaa5e`、危险红 `#ff6666`、正常绿 `#44ff44`、暗淡灰 `#556677`。
- 不改变 ARG 文本、线索、密码、文件路径、页面链接关系或现有交互逻辑。
- 直接修改现有 HTML 与内嵌 CSS，不新增共享样式依赖。
- 桌面端优先，不新增响应式重排；终端界面圆角不超过 `2px`。
- 不使用渐变按钮、阴影、毛玻璃、黑客绿、emoji UI 或复杂入场动画。
- 文档正文最小字号 `14px`，行距不低于 `2.0`。
- 用户已有的 `csdn-post.html` 删除状态不恢复、不暂存、不提交。

---

## File Map

- `index.html`：登录舱门、终端排版、时钟线索、来源后处理脚本。
- `blog.html`：陈远工程日志的时间轴、纸张排版与技术语义。
- `tick-log.html`：Tick 深色日志、搜索与筛选反馈。
- `launch-news.html`：新闻正文、引文、评论与门户交互外观。
- `archive.html`：项目档案文档与缓存/返回入口。
- `node-7f.html`：林汐隔离节点日记与缓存/返回入口。
- `passenger-51.html`：0x2B 极简节点记录与缓存/返回入口。
- `relay-7f-a3.html`：工程拆解报告与缓存/返回入口。
- `rescue-report.html`：官方救援报告与缓存/返回入口。
- `about-xinhua.html`：冷淡官方机构页面。
- `quantumcloud.html`：意识保险商业页面。
- `deepcomm.html`：深空通讯商业页面。
- `kepler-realty.html`：星际地产商业页面。

### Task 1: 终端主页与来源后处理

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `app.js` 创建的 `#terminal`、`#prompt`、`#clock`、`.login-msg` 和逐行 `<div>` 输出。
- Produces: `.source-node-2b`、`.source-node-7f`、`.source-cache` 三个纯展示类；不返回数据、不修改终端状态。

- [ ] **Step 1: 运行修改前静态契约并确认失败**

```powershell
$html = Get-Content -Raw -Encoding UTF8 index.html
if ($html -notmatch 'line-height:2(?:\.0)?') { throw 'EXPECTED FAIL: terminal line-height is not 2.0' }
if ($html -notmatch 'MutationObserver') { throw 'EXPECTED FAIL: source observer missing' }
```

Expected: FAIL，首先报告终端行距不是 `2.0`。

- [ ] **Step 2: 实现舱门认证、时钟和来源色条 CSS**

在 `index.html` 的 `<style>` 中重构登录区，并加入以下稳定接口：

```css
#terminal{line-height:2}
#clock{min-width:190px;border:1px solid rgba(136,204,255,.36);padding:2px 10px;text-align:right;color:#88ccff;letter-spacing:1px}
#clock::before{content:'SYS.TIME // ';color:#556677}
.login-box{position:relative;width:440px;padding:42px 40px;background:#111827cc;border:1px solid rgba(136,204,255,.45);text-align:left}
.login-box::before,.login-box::after{content:'';position:absolute;left:-18px;right:-18px;height:1px;background:rgba(136,204,255,.28)}
.login-box::before{top:14px}.login-box::after{bottom:14px}
.login-box input{border:1px solid rgba(136,204,255,.35);border-radius:0}
.login-box input:focus{border-color:#88ccff;outline:1px solid rgba(136,204,255,.22);outline-offset:2px}
.login-msg:not(:empty){animation:auth-error .18s steps(2,end) 3}
@keyframes auth-error{50%{color:#0a0e17;background:#ff6666}}
#terminal>div[class*="source-"]{margin:2px 0;padding-left:12px;border-left:2px solid transparent}
#terminal>.source-node-2b{border-left-color:#ffaa5e;background:rgba(255,170,94,.035)}
#terminal>.source-node-7f{border-left-color:#88ccff;background:rgba(136,204,255,.035)}
#terminal>.source-cache{border-left-color:#556677;background:rgba(85,102,119,.045)}
@media (prefers-reduced-motion:reduce){.login-msg:not(:empty),#terminal .glitch{animation:none}}
```

为用户名和密码输入添加可见 `<label>`，把访客按钮的内联 hover 改为 CSS 类，保持现有 ID 与点击处理不变。

- [ ] **Step 3: 在 `app.js` 引用之后添加完整后处理脚本**

```html
<script>
(() => {
  const terminal = document.getElementById('terminal');
  const prompt = document.getElementById('prompt');
  if (!terminal || !prompt || typeof MutationObserver === 'undefined') return;

  const classify = (line) => {
    if (!(line instanceof HTMLElement)) return;
    const text = line.textContent || '';
    const cwd = prompt.textContent || '';
    const inNode2B = /\/mnt\/0x2B/i.test(cwd);
    const inNode7F = /\/mnt\/7F-A3/i.test(cwd);
    const isNode2B = inNode2B || /隔离节点\s*0x2B|连接到.*0x2B|\/mnt\/0x2B/i.test(text);
    const isNode7F = inNode7F || /7F-A3-02-1953|连接到.*7F-A3|\/mnt\/7F-A3/i.test(text);
    const isCache = /船舰网页缓存系统|正在打开系统缓存|深空通讯链路中恢复的历史网页/i.test(text);
    if (isNode2B) line.classList.add('source-node-2b');
    else if (isNode7F) line.classList.add('source-node-7f');
    else if (isCache) line.classList.add('source-cache');
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) classify(node);
    }
  });
  observer.observe(terminal, { childList: true });
})();
</script>
```

- [ ] **Step 4: 重跑静态契约并检查 `app.js`**

```powershell
$html = Get-Content -Raw -Encoding UTF8 index.html
if ($html -notmatch '#terminal\{[^}]*line-height:2') { throw 'terminal line-height contract failed' }
if ($html -notmatch 'MutationObserver' -or $html -notmatch "childList:\s*true") { throw 'observer contract failed' }
if ($html -notmatch 'source-node-2b' -or $html -notmatch 'source-node-7f' -or $html -notmatch 'source-cache') { throw 'source classes missing' }
$hash = (Get-FileHash -Algorithm SHA256 app.js).Hash.ToLowerInvariant()
if ($hash -ne '7363c83fbdab95dbe5ab3c78087e15cddaf795deb73defbd0494475623134ef8') { throw 'app.js changed' }
```

Expected: PASS，无输出。

- [ ] **Step 5: 浏览器验证并提交**

Run: `python -m http.server 4173 --bind 127.0.0.1`

验证登录失败红闪、访客登录、正常命令、`ssh 0x2B`、`cd /mnt/0x2B`、`ssh 7F-A3`、`cd /mnt/7F-A3`、`/cache`；普通 `/help` 行不得出现来源色条。

```powershell
git add -- index.html
git commit -m "feat: refine Eternal terminal interface"
```

### Task 2: 缓存徽章与沉浸式文档

**Files:**
- Modify: `archive.html`
- Modify: `node-7f.html`
- Modify: `passenger-51.html`
- Modify: `relay-7f-a3.html`
- Modify: `rescue-report.html`

**Interfaces:**
- Produces: 五页统一的首元素 `.cache-badge` 和底部 `.terminal-return`；博客、Tick、新闻页在后续任务复用同一视觉契约。

- [ ] **Step 1: 运行徽章/可读性基线检查并确认失败**

```powershell
$pages = 'archive.html','node-7f.html','passenger-51.html','relay-7f-a3.html','rescue-report.html'
foreach ($page in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch '<body>\s*<div class="cache-badge"') { throw "EXPECTED FAIL: $page cache badge missing at top" }
  if ($html -notmatch 'terminal-return') { throw "EXPECTED FAIL: $page terminal return missing" }
}
```

Expected: FAIL，在第一份缺少徽章的页面停止。

- [ ] **Step 2: 为五页添加统一顶部徽章和返回行动区**

每页 `<body>` 后第一个元素加入：

```html
<div class="cache-badge">永恒号系统缓存 · 恢复自深空通讯链路 <span aria-hidden="true">|</span> <a href="index.html">← 返回船舰终端</a></div>
```

每页样式中加入主题无关的硬边契约：

```css
.cache-badge{width:100%;padding:5px 14px;background:#0a0e17;color:#556677;border-bottom:1px solid rgba(136,204,255,.24);font:10px/1.6 Consolas,'Courier New',monospace;letter-spacing:1px;text-align:center}
.cache-badge a{color:#88ccff;text-decoration:none}
.cache-badge a:hover,.cache-badge a:focus-visible{color:#fff;text-decoration:underline;text-underline-offset:3px}
.terminal-return{margin-top:40px;padding:14px 0;border-top:1px solid currentColor;text-align:center}
.terminal-return a{display:inline-block;padding:5px 10px;color:#88ccff;text-decoration:none;border:1px solid rgba(136,204,255,.35)}
.terminal-return a:hover,.terminal-return a:focus-visible{border-color:#88ccff;color:#fff;outline:none}
```

将现有底部终端链接包裹或替换为 `.terminal-return`，不改变 href。

- [ ] **Step 3: 校准五页正文，不改变页面身份**

```css
/* 每页合并到现有选择器，不额外覆盖专用标题/元数据 */
body{font-size:14px;line-height:2}
.section p,.entry .line,p{font-size:14px;line-height:2}
```

- `archive.html` 使用冷灰档案纸，不使用纯白背景。
- `node-7f.html` 保持林汐蓝深空日记。
- `passenger-51.html` 将纯黑换为 `#0a0e17`。
- `relay-7f-a3.html` 保留暖色工程纸。
- `rescue-report.html` 将纯白换为冷白纸色 `#f4f5f3`，保留红章和表格。

- [ ] **Step 4: 重跑契约、浏览器检查并提交**

```powershell
$pages = 'archive.html','node-7f.html','passenger-51.html','relay-7f-a3.html','rescue-report.html'
foreach ($page in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch '<body>\s*<div class="cache-badge"') { throw "$page badge order failed" }
  if ($html -notmatch 'terminal-return') { throw "$page return contract failed" }
  if ($html -notmatch 'line-height:\s*2') { throw "$page line-height failed" }
}
```

浏览器确认徽章始终位于最顶部、表格/ASCII 图不溢出、正文可读、返回链接醒目。

```powershell
git add -- archive.html node-7f.html passenger-51.html relay-7f-a3.html rescue-report.html
git commit -m "style: improve cached document readability"
```

### Task 3: 陈远博客与 Tick 日志

**Files:**
- Modify: `blog.html`
- Modify: `tick-log.html`

**Interfaces:**
- Consumes: Task 2 的 `.cache-badge` 视觉契约。
- Produces: `.tech-block`、`.log-search`、`.filter.active` 明确状态。

- [ ] **Step 1: 运行基线检查并确认失败**

```powershell
$blog = Get-Content -Raw -Encoding UTF8 blog.html
$tick = Get-Content -Raw -Encoding UTF8 tick-log.html
if ($blog -match 'backdrop-filter|box-shadow') { throw 'EXPECTED FAIL: blog forbidden effects remain' }
if ($blog -notmatch 'tech-block') { throw 'EXPECTED FAIL: blog technical block missing' }
if ($tick -notmatch 'class="log-search"') { throw 'EXPECTED FAIL: Tick terminal search missing' }
```

Expected: FAIL。

- [ ] **Step 2: 精修博客时间轴和技术段落**

- 移除 `backdrop-filter` 与所有 `box-shadow`。
- `.post-card` 圆角降至 `2px`，hover 只改变边框色。
- 保留纸张底色和时间轴，时间轴使用实色细线，不使用渐变。
- 给包含命令、路径、节点和设备编号的引用添加 `class="tech-block"`。
- 删除博客现有 `@media(max-width:768px)` 重排，不新增窄屏布局。

```css
.tech-block{font-family:Consolas,'Courier New','Microsoft YaHei',monospace;font-style:normal;letter-spacing:.2px;background:#f1eadc;border-left:3px solid #b8753e;color:#594734}
.post-card{border-radius:2px;box-shadow:none}
.post-card:hover{border-color:#d4a86a;box-shadow:none}
.timeline::before{background:#d4a86a}
```

在 `<body>` 第一项添加统一 `.cache-badge`。

- [ ] **Step 3: 完成 Tick 深色日志、搜索和筛选反馈**

- body、navbar、main、footer 统一深空背景层级。
- 搜索容器加入 `class="log-search"`，保留原 `onkeyup`。
- 筛选项加入按钮式边框；active 使用林汐蓝边框、浅蓝背景和 `::before` 状态符。
- `.entry` 增加 `8px 0 10px` 间距，hover 只改变背景。
- 给 `.filter .count` 添加 `pointer-events:none`，避免计数徽章成为事件目标；不修改现有 `filterLog` 函数。
- 删除 Tick 现有窄屏 `@media` 重排。

```css
.toolbar .filter{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border:1px solid #2a3040;color:#aabbcc}
.toolbar .filter.active{border-color:#88ccff;background:rgba(136,204,255,.08);color:#88ccff}
.toolbar .filter.active::before{content:'>';color:#88ccff}
.toolbar .filter .count{pointer-events:none;border-radius:2px}
```

在最顶部保留/统一 `.cache-badge`。

- [ ] **Step 4: 契约与交互验证后提交**

```powershell
$blog = Get-Content -Raw -Encoding UTF8 blog.html
$tick = Get-Content -Raw -Encoding UTF8 tick-log.html
if ($blog -match 'backdrop-filter|box-shadow') { throw 'blog forbidden effects remain' }
if ($blog -notmatch 'tech-block') { throw 'blog technical block missing' }
if ($tick -notmatch 'pointer-events:none') { throw 'Tick filter count event contract failed' }
if ($tick -notmatch 'class="log-search"') { throw 'Tick search contract failed' }
```

浏览器确认博客归档与涂黑文本正常；Tick 搜索后再点四种筛选，active 始终落在整个筛选按钮上。

```powershell
git add -- blog.html tick-log.html
git commit -m "style: refine engineering blog and Tick logs"
```

### Task 4: 发射新闻与官方机构页面

**Files:**
- Modify: `launch-news.html`
- Modify: `about-xinhua.html`

**Interfaces:**
- Produces: 新闻 `.article-lead` 首字下沉、统一最顶部缓存徽章；about 页面不消费终端色变量。

- [ ] **Step 1: 运行基线检查并确认失败**

```powershell
$news = Get-Content -Raw -Encoding UTF8 launch-news.html
if ($news -notmatch 'article-lead') { throw 'EXPECTED FAIL: drop cap lead missing' }
if ($news -match '@keyframes\s+(heroPulse|fadeInUp|slideIn)') { throw 'EXPECTED FAIL: complex animations remain' }
```

- [ ] **Step 2: 精修新闻正文并保留所有互动**

- 在 `<body>` 最顶部添加 `.cache-badge`。
- 将正文首段标为 `class="article-lead"`，加入：

```css
.article-lead::first-letter{float:left;font:700 3.25em/.82 Georgia,'Songti SC',serif;color:#9e302f;margin:.08em .14em 0 0}
.article .pullquote{background:#f0f1f3;border-left:4px solid #9e302f;color:#31343a;animation:none}
```

- 删除 `heroPulse`、`fadeInUp`、`slideIn` 动画引用和规则。
- 删除新闻页现有三条窄屏 `@media` 重排。
- 评论、推荐、弹层、下拉导航只保留即时 hover，不改变 onclick。
- 页面、评论卡片与弹层背景改为轻微冷调纸色，避免纯白大面积背景。

- [ ] **Step 3: 保持 about 的官方冷淡感**

```css
body{background:#eef0f2;color:#20252b;line-height:2}
.section{border-color:#d8dde2}
a:hover,a:focus-visible{color:#9e302f;text-decoration:underline;text-underline-offset:3px}
```

不得向 `about-xinhua.html` 新增 `#88ccff`、终端扫描线或终端面板样式。

- [ ] **Step 4: 静态与浏览器验证后提交**

```powershell
$news = Get-Content -Raw -Encoding UTF8 launch-news.html
$about = Get-Content -Raw -Encoding UTF8 about-xinhua.html
if ($news -notmatch 'article-lead::first-letter') { throw 'news drop cap missing' }
if ($news -match '@keyframes\s+(heroPulse|fadeInUp|slideIn)') { throw 'news complex animations remain' }
if ($about -match '#88ccff') { throw 'about page was terminalized' }
```

浏览器逐项点击导航下拉、热搜、评论折叠、评论操作、推荐卡片、通知提示和 cookie 按钮。

```powershell
git add -- launch-news.html about-xinhua.html
git commit -m "style: improve launch news editorial layout"
```

### Task 5: 三个外部商业页面

**Files:**
- Modify: `quantumcloud.html`
- Modify: `deepcomm.html`
- Modify: `kepler-realty.html`

**Interfaces:**
- Produces: 主题独立但满足全局可读性、硬边控件和键盘焦点要求的外部页面。

- [ ] **Step 1: 运行可读性基线并确认失败**

```powershell
$pages = 'quantumcloud.html','deepcomm.html','kepler-realty.html'
foreach ($page in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch 'focus-visible') { throw "EXPECTED FAIL: $page keyboard focus missing" }
  if ($html -notmatch 'line-height:\s*2') { throw "EXPECTED FAIL: $page body line-height missing" }
}
```

- [ ] **Step 2: 分别校准三种商业主题**

- `quantumcloud.html`：保留紫色意识保险视觉，移除标题文字渐变，改为实色；卡片圆角不超过 `2px`。
- `deepcomm.html`：保留深蓝通讯视觉，推荐标记改为直角标签；提升低对比度说明文字。
- `kepler-realty.html`：保留深绿地产视觉；房源占位区可保留环境色背景，但按钮与卡片使用硬边、无阴影。

每页加入：

```css
body{line-height:2}
a:hover{filter:brightness(1.18)}
a:focus-visible,button:focus-visible{outline:1px solid currentColor;outline-offset:3px}
.btn,.plan,.property{border-radius:2px;box-shadow:none}
```

- [ ] **Step 3: 验证和提交**

```powershell
$pages = 'quantumcloud.html','deepcomm.html','kepler-realty.html'
foreach ($page in $pages) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch 'focus-visible') { throw "$page focus contract failed" }
  if ($html -notmatch 'line-height:\s*2') { throw "$page line-height contract failed" }
  if ($html -match 'box-shadow\s*:') { throw "$page shadow remains" }
}
```

浏览器确认三页仍明显属于不同品牌，新闻页返回链接仍可用。

```powershell
git add -- quantumcloud.html deepcomm.html kepler-realty.html
git commit -m "style: polish external cached services"
```

### Task 6: 全项目静态、交互与视觉验收

**Files:**
- Verify: all 13 `*.html`
- Verify unchanged: `app.js`

**Interfaces:**
- Consumes: Tasks 1–5 的所有页面契约。
- Produces: 验收证据；不新增运行时代码。

- [ ] **Step 1: 检查页面集合、标题唯一性和 app.js 哈希**

```powershell
$expected = 'about-xinhua.html','archive.html','blog.html','deepcomm.html','index.html','kepler-realty.html','launch-news.html','node-7f.html','passenger-51.html','quantumcloud.html','relay-7f-a3.html','rescue-report.html','tick-log.html'
$missing = $expected | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing) { throw "Required HTML missing: $($missing -join ', ')" }
$titles = foreach ($page in $expected) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch '<title>([^<]+)</title>') { throw "$page title missing" }
  $matches[1]
}
if (($titles | Sort-Object -Unique).Count -ne 13) { throw 'titles are not unique' }
$hash = (Get-FileHash -Algorithm SHA256 app.js).Hash.ToLowerInvariant()
if ($hash -ne '7363c83fbdab95dbe5ab3c78087e15cddaf795deb73defbd0494475623134ef8') { throw 'app.js changed' }
```

Expected: PASS，无输出。历史中的 `csdn-post.html` 即使出现在隔离工作树，也不计入这 13 页，不修改、不提交。

- [ ] **Step 2: 检查八个缓存徽章的位置**

```powershell
$cached = 'blog.html','archive.html','launch-news.html','node-7f.html','tick-log.html','relay-7f-a3.html','passenger-51.html','rescue-report.html'
foreach ($page in $cached) {
  $html = Get-Content -Raw -Encoding UTF8 $page
  if ($html -notmatch '<body>\s*<div class="cache-badge"') { throw "$page cache badge is not first" }
}
```

Expected: PASS。

- [ ] **Step 3: 启动本地站点并完成桌面视觉检查**

Run: `python -m http.server 4173 --bind 127.0.0.1`

在 1440×900 桌面视口逐页截图并检查：内容无截断、正文对比度合理、页面身份未混淆、终端入口醒目、无意外水平滚动。

- [ ] **Step 4: 完成交互回归**

- `index.html`：错误登录、访客登录、授权登录、`/help`、`/cache`、0x2B 与 7F-A3 SSH 来源色条。
- `blog.html`：归档展开、所有涂黑内容揭示。
- `tick-log.html`：搜索与 INFO/WARN/CRIT/DATA 组合过滤、导出、打印。
- `launch-news.html`：导航、热搜、评论折叠、弹层、通知和 cookie。
- 其余页面：缓存徽章、返回链接、内部导航。

Expected: 控制台无新增异常，所有既有交互保持可用。

- [ ] **Step 5: 最终差异检查**

```powershell
git diff --check
git status --short
git diff --stat HEAD~5..HEAD
```

Expected: `git diff --check` 无输出；`csdn-post.html` 仍显示为用户原有删除状态且未进入任何提交。
