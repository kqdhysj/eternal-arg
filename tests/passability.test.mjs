import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const projectRoot = path.resolve(import.meta.dirname, '..');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.children = [];
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.className = '';
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.listeners = {};
  }

  appendChild(child) {
    this.children.push(child);
    this.scrollHeight = this.children.length;
    if (this.id === 'terminal') {
      this.ownerOutput.push({
        text: child.textContent,
        className: child.className,
      });
    }
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  focus() {}

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
    if (this.id === 'terminal') this.ownerOutput.length = 0;
  }

  get innerHTML() {
    return this._innerHTML || '';
  }
}

function loadGame() {
  const output = [];
  const opened = [];
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      const el = new FakeElement(id);
      el.ownerOutput = output;
      elements.set(id, el);
    }
    return elements.get(id);
  }

  const document = {
    body: new FakeElement('body'),
    createElement: () => {
      const el = new FakeElement();
      el.ownerOutput = output;
      return el;
    },
    getElementById: getElement,
    addEventListener() {},
  };
  document.body.ownerOutput = output;

  const context = {
    console,
    document,
    window: {
      open(url) {
        opened.push(url);
      },
    },
    setInterval: () => 0,
    setTimeout: () => 0,
    Math,
    Date,
    atob: globalThis.atob,
  };
  context.globalThis = context;

  const source = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
  const expose = `
globalThis.__game = {
  exec,
  tryLogin,
  loginUser,
  loginPass,
  get output() { return __output; },
  get opened() { return __opened; },
  get currentUser() { return currentUser; },
  get cwd() { return cwd; },
  get state() { return gameState; },
  clearOutput() { __output.length = 0; },
};
`;
  context.__output = output;
  context.__opened = opened;
  vm.runInNewContext(source + expose, context, { filename: 'app.js' });
  return context.__game;
}

function textSince(game, startIndex) {
  return game.output.slice(startIndex).map((line) => line.text).join('\n');
}

function loginAs(game, user, password) {
  game.loginUser.value = user;
  game.loginPass.value = password;
  game.tryLogin(false);
}

function run(game, command) {
  const start = game.output.length;
  game.exec(command);
  return textSince(game, start);
}

function assertOutputIncludes(output, expected, label) {
  assert.ok(
    output.includes(expected),
    `${label}\nExpected output to include: ${expected}\nActual output:\n${output}`,
  );
}

const game = loadGame();

loginAs(game, 'lchen', 'linxi');
assert.equal(game.currentUser, 'LINCHEN', '小写账号 lchen 应该能登录到 LINCHEN。');

let output = run(game, 'logs');
assertOutputIncludes(output, 'audit', '线索中出现的无斜杠命令 logs 应可执行。');

output = run(game, 'logs lchen-notes');
assertOutputIncludes(output, '陈远的加密日志密码', '管理员调查笔记应该可读。');

assert.doesNotThrow(() => {
  output = run(game, 'logs missing-thread');
}, '错误通讯记录 ID 不应该让终端脚本抛异常。');
assertOutputIncludes(output, '未找到记录', '错误通讯记录 ID 应给出玩家可读反馈。');

assert.doesNotThrow(() => {
  output = run(game, 'decrypt_logs missing-thread 0000');
}, '错误加密记录 ID 不应该让终端脚本抛异常。');
assertOutputIncludes(output, '记录不存在', '错误加密记录 ID 应给出玩家可读反馈。');

loginAs(game, 'cyuan', 'gear1953');
assert.equal(game.currentUser, 'CHENYUAN', '小写账号 cyuan 应该能登录到 CHENYUAN。');

output = run(game, 'decrypt encrypted/personal.log 19530727');
assertOutputIncludes(output, '解密成功', '陈远个人日志应该能用相对路径解密。');

output = run(game, 'chmod +r relay_notes.txt');
assertOutputIncludes(output, '+r 已生效', '陈远应该能给 relay_notes.txt 加读权限。');

output = run(game, 'cat relay_notes.txt');
assertOutputIncludes(output, '7F-A3-02-1953', 'relay_notes.txt 应该能提示转发器节点。');

output = run(game, 'scan');
assertOutputIncludes(output, '发现 1 个隐藏条目', '陈远目录扫描应该发现 .ssh。');

output = run(game, 'cat .ssh/known_hosts');
assertOutputIncludes(output, '0x2B', 'known_hosts 应该暴露 0x2B。');

loginAs(game, 'lxi', 'tick7');
assert.equal(game.currentUser, 'LINXI', '小写账号 lxi 应该能登录到 LINXI。');

output = run(game, 'decrypt hidden/message.txt 0217');
assertOutputIncludes(output, '解密成功', '林汐隐藏文件应该能用相对路径解密。');

output = run(game, 'ssh 0x2b');
assertOutputIncludes(output, '文件系统已挂载至 /mnt/0x2B', 'SSH 节点地址大小写不应卡住玩家。');

output = run(game, 'cd /mnt/0x2b');
assertOutputIncludes(output, '', '小写 /mnt/0x2b 应该能进入已挂载节点。');
assert.equal(game.cwd.toLowerCase(), '/mnt/0x2b');

output = run(game, 'cat journal.txt');
assertOutputIncludes(output, 'passenger-51.html', '0x2B 日志应该提示 passenger-51 页面。');

output = run(game, 'ssh 7f-a3');
assertOutputIncludes(output, '文件系统已挂载至 /mnt/7F-A3', '转发器节点地址大小写不应卡住玩家。');

output = run(game, 'cd /mnt/7f-a3');
assertOutputIncludes(output, '', '小写 /mnt/7f-a3 应该能进入转发器节点。');
assert.equal(game.cwd.toLowerCase(), '/mnt/7f-a3');

output = run(game, 'cat relay_log.txt');
assertOutputIncludes(output, '暗杀工具', '转发器日志应该能揭示最终真相。');

output = run(game, 'decrypt /var/log/shadow.log 2148');
assertOutputIncludes(output, '解密成功', 'shadow.log 应该能被最终密码解开。');

output = run(game, 'cache passenger-51');
assertOutputIncludes(output, '正在打开系统缓存', 'passenger-51 缓存页应该能打开。');

output = run(game, 'cache rescue');
assertOutputIncludes(output, '正在打开系统缓存', 'rescue 缓存页应该能打开。');

assert.deepEqual(
  game.opened.slice(-2),
  ['passenger-51.html', 'rescue-report.html'],
  '通关路线最后应该打开两个真相页面。',
);
