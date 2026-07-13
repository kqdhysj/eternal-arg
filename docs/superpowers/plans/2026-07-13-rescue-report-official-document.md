# 救援调查报告高拟真公文 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `rescue-report.html` 重构为符合中国党政机关上行文视觉习惯的虚构绝密调查报告，同时完整保留剧情线索和 ARG 导航。

**Architecture:** 继续使用单文件 HTML 与内嵌 CSS，不引入依赖或 JavaScript。页面拆为外部缓存界面、中央公文纸张和外部终端操作区；公文内部按份号/密级、红头、文号/签发人、标题、正文、落款印章、附注和版记顺序组织。

**Tech Stack:** HTML5、CSS3、Windows 中文字体回退、内联 SVG 虚构印章、Microsoft Edge/Playwright 视觉验收。

## Global Constraints

- 只修改 `rescue-report.html`；设计说明和计划文档除外。
- 保留四个正文部分、现场发现表格、勘查附注及其线索含义。
- 保留 `index.html` 返回链接和缓存上下文，不新增 JavaScript。
- 使用“深空航行事故联合调查组”等虚构名称，不使用真实机关名称、国徽或现存机关印章。
- 桌面端呈现接近 A4 的纸张，390px 窄屏不得横向溢出。
- 打印时隐藏缓存徽章和终端操作区。
- 不暂存、不恢复、不提交用户现有的 `csdn-post.html` 删除状态。

---

### Task 1: 建立公文纸张与红色机关标志结构

**Files:**
- Modify: `rescue-report.html`

**Interfaces:**
- Consumes: 现有静态页面、`index.html` 返回链接。
- Produces: `.document-shell`、`.official-document`、`.document-flags`、`.agency-mark`、`.red-rule`、`.document-meta` 和 `.document-title` 结构，供正文与版记继续使用。

- [ ] **Step 1: 记录改造前的穿帮特征**

Run:

```powershell
rg -n "red-head|JU LIAN SHEN KONG JIU YUAN JU|top-secret|watermark" rescue-report.html
```

Expected: 命中红底版头、拼音副标题、巨幅绝密框和满屏水印结构，证明待修问题存在。

- [ ] **Step 2: 将页面外壳改为纸张式布局**

在内嵌 CSS 中建立以下核心令牌与容器；链接焦点态、响应式和打印规则分别在本任务 Step 4 与 Task 2 Step 5 补齐：

```css
:root{--paper:#fff;--desk:#d8d8d4;--ink:#111;--red:#d40000;--muted:#5e5e5e}
body{background:var(--desk);color:var(--ink);font-family:'FangSong','STFangsong','SimSun',serif}
.document-shell{width:min(210mm,calc(100% - 32px));margin:52px auto 24px}
.official-document{background:var(--paper);padding:24mm 28mm 22mm;box-shadow:0 4px 22px rgba(0,0,0,.16)}
```

- [ ] **Step 3: 用上行文发文字号结构替换影视道具版头**

删除 `.top-secret`、`.red-head .sub` 与 `.watermark` 对应 DOM，改为：

```html
<header class="document-header">
  <div class="document-flags"><span>0001</span><strong>绝密★长期</strong></div>
  <div class="agency-mark">深空航行事故联合调查组文件</div>
  <div class="red-rule" aria-hidden="true"><span>★</span></div>
  <div class="document-meta">
    <span>深空联调〔97〕9号</span>
    <span>签发人：<strong>曙光号舰长</strong></span>
  </div>
</header>
```

- [ ] **Step 4: 校准标题与移动端版头**

标题保留“关于永恒号事故现场勘查情况的报告”，使用小标宋回退栈。添加 `@media (max-width:600px)`，将纸张宽度改为 `100%`、缩小页边距与版头字距，并允许标题自然换行。

- [ ] **Step 5: 验证旧版穿帮元素已移除**

Run:

```powershell
$html = Get-Content -Raw -Encoding UTF8 rescue-report.html
if ($html -match 'JU LIAN|class="top-secret"|class="watermark"|class="red-head"') { throw '旧版头仍存在' }
if ($html -notmatch '深空航行事故联合调查组文件' -or $html -notmatch '绝密★长期' -or $html -notmatch '深空联调〔97〕9号') { throw '新版头不完整' }
```

Expected: Exit 0，无输出。

### Task 2: 校准正文、落款印章与版记

**Files:**
- Modify: `rescue-report.html`

**Interfaces:**
- Consumes: Task 1 的 `.official-document` 容器和文首结构。
- Produces: `.document-body`、`.signing-block`、`.official-seal`、`.field-note`、`.imprint`，并保留页面原有故事文本。

- [ ] **Step 1: 统一公文正文排版**

将四个章节放入 `.document-body`，正文使用仿宋回退栈与两字符缩进；一级标题使用黑体且左对齐。表格取消灰底，以细线和明确列宽呈现：

```css
.document-body{font-size:16px;line-height:1.9}
.section h2{font-family:'SimHei','STHeiti',sans-serif;font-size:16px;text-align:left;margin:1em 0 0}
.section p{text-indent:2em;margin:0}
table{border-collapse:collapse;margin:1em 0;font-size:15px;line-height:1.65}
td{border:1px solid #555;padding:7px 9px;vertical-align:top}
td:first-child{width:9.5em;background:transparent;font-weight:700}
```

- [ ] **Step 2: 增加落款、成文日期和虚构圆章**

将原有三行文字圆圈替换为不冒用真实机关的内联 SVG 装饰印章，并提供隐藏的文本替代：

```html
<div class="signing-block">
  <p>深空航行事故联合调查组</p>
  <p>第97年9月9日</p>
  <span class="visually-hidden">深空航行事故联合调查组印章</span>
  <svg class="official-seal" aria-hidden="true" viewBox="0 0 160 160">
    <defs>
      <path id="seal-text-path" d="M 26 98 A 58 58 0 1 1 134 98" />
    </defs>
    <circle cx="80" cy="80" r="66" />
    <text><textPath href="#seal-text-path" startOffset="50%" text-anchor="middle">深空航行事故联合调查组</textPath></text>
    <polygon points="80,52 87,70 106,71 91,83 96,102 80,91 64,102 69,83 54,71 73,70" />
    <text class="seal-year" x="80" y="126" text-anchor="middle">第97年</text>
  </svg>
</div>
```

印章需与落款部分重叠、保持半透明墨色；不使用国徽或真实机关图形。

- [ ] **Step 3: 将勘查附注纳入附件式结构**

保留三段附注原文，将标题改为正式标签“附件：现场勘查人员补记”，使用仿宋正文与楷体署名；不再使用独立灰色卡片视觉。

- [ ] **Step 4: 建立正式版记**

使用上下细线与分栏信息替换原页脚：

```html
<footer class="imprint">
  <p><span>抄送：</span>联合深空调查局。</p>
  <p class="imprint-row"><span>深空航行事故联合调查组办公室</span><span>第97年9月9日印发</span></p>
  <p class="archive-number">归档编号：DSR-0097-ETRN</p>
</footer>
```

- [ ] **Step 5: 将 ARG 操作区移到纸张外**

缓存徽章保留在纸张顶部；终端操作提示与返回链接放在 `.terminal-chrome` 中，位于 `</main>` 之后，继续链接 `index.html`。打印样式隐藏 `.cache-badge` 和 `.terminal-chrome`。

- [ ] **Step 6: 验证剧情与导航未丢失**

Run:

```powershell
$html = Get-Content -Raw -Encoding UTF8 rescue-report.html
$required = @('任务概述','现场发现','数据恢复','初步结论','小汐，记得看星星。','我等到她了。','DSR-0097-ETRN','href="index.html"')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "缺少：$item" } }
```

Expected: Exit 0，无输出。

### Task 3: 浏览器与变更边界验收

**Files:**
- Modify: `rescue-report.html`（仅在验收发现问题时修正）
- Do not modify: `csdn-post.html`

**Interfaces:**
- Consumes: 完整的高拟真公文页面。
- Produces: 桌面与 390px 窄屏验证结果，以及只包含目标页面的独立提交。

- [ ] **Step 1: 用浏览器检查桌面视口**

使用本机 Edge/Playwright 打开 `file:///C:/Users/kqdhysj/Desktop/eternal-arg/rescue-report.html`，视口设为 `1440×1000`。断言 `document.documentElement.scrollWidth === document.documentElement.clientWidth`，页面无控制台错误，并截取全页图用于视觉检查。

- [ ] **Step 2: 用浏览器检查 390px 视口**

同一页面改为 `390×844`，再次断言无横向溢出、无控制台错误；检查“深空航行事故联合调查组文件”可辨识、文号与签发人不相互覆盖、表格可在页面内阅读。

- [ ] **Step 3: 检查打印规则与静态结构**

Run:

```powershell
rg -n "@media print|display:none|document-shell|official-document|imprint|terminal-chrome" rescue-report.html
```

Expected: 命中打印隐藏规则、公文纸张、版记和外部 ARG 操作区。

- [ ] **Step 4: 检查变更范围和空白错误**

Run:

```powershell
git diff --check -- rescue-report.html
git status --short
```

Expected: `git diff --check` 无输出；状态中 `rescue-report.html` 为修改，`csdn-post.html` 仍保持用户原有删除状态且未被暂存。

- [ ] **Step 5: 提交页面改造**

Run:

```powershell
git add -- rescue-report.html
git diff --cached --check
git diff --cached --name-only
git commit -m "style: make rescue report resemble official document"
```

Expected: 暂存文件列表只有 `rescue-report.html`，提交成功。
