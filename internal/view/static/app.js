/* =========================================================
   StarKeeper · 星群管家 控制台
   原生 JavaScript，无需构建
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const PAGE = document.body.dataset.page || '';
  const DEMO = document.body.dataset.demo === 'true';
  const CSRF = ($('meta[name="csrf-token"]') || {}).content || '';
  const raw = $('#page-data');
  const DATA = raw ? JSON.parse(raw.textContent || '{}') : {};
  const CURRENCY = (DATA.currency) || '积分';

  const savedTheme = localStorage.getItem('sk-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  /* ----------------------------- 基础工具 ----------------------------- */
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const num = (n) => Number(n || 0).toLocaleString('zh-CN');
  const dateTime = (ts) => ts ? new Date(ts * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const toInput = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000), p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const fromInput = (v) => v ? Math.floor(new Date(v).getTime() / 1000) : 0;
  const future = (h) => toInput(Math.floor(Date.now() / 1000) + h * 3600);

  async function api(path, opt = {}) {
    const method = (opt.method || 'GET').toUpperCase();
    const headers = { Accept: 'application/json', ...(opt.headers || {}) };
    let body = opt.body;
    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    if (!['GET', 'HEAD'].includes(method)) headers['X-CSRF-Token'] = CSRF;
    const res = await fetch(path, { method, headers, body, credentials: 'same-origin' });
    const isJSON = (res.headers.get('content-type') || '').includes('json');
    const payload = isJSON ? await res.json() : { ok: res.ok, data: await res.text() };
    if (res.status === 401) { location.href = '/login'; throw new Error('登录已过期'); }
    if (!res.ok || payload.ok === false) throw new Error(payload.error || '请求失败');
    return payload.data !== undefined ? payload.data : payload;
  }

  function toast(message, type = 'ok') {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-ico">${type === 'err' ? '!' : type === 'info' ? 'i' : '✓'}</span><span>${esc(message)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 220); }, 3200);
  }

  function busy(btn, state) {
    if (!btn) return;
    if (state) {
      btn.dataset.html = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span><span>处理中</span>';
    } else {
      btn.disabled = false;
      if (btn.dataset.html) btn.innerHTML = btn.dataset.html;
    }
  }

  function copyText(t) {
    navigator.clipboard?.writeText(t).then(() => toast('已复制')).catch(() => toast('复制失败', 'err'));
  }

  function modal(opts) {
    const root = $('#modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal ${opts.wide ? 'wide' : opts.narrow ? 'narrow' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><h2>${esc(opts.title || '')}</h2>${opts.subtitle ? `<p>${esc(opts.subtitle)}</p>` : ''}</div>
          <button class="modal-close" type="button" aria-label="关闭"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ''}
      </div>`;
    root.appendChild(overlay);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 160);
      document.removeEventListener('keydown', keyHandler);
      opts.onClose?.();
    };
    const keyHandler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', keyHandler);
    $('.modal-close', overlay).addEventListener('click', close);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    setTimeout(() => $('input:not([type=hidden]), textarea, select', overlay)?.focus(), 80);
    const result = { overlay, body: $('.modal-body', overlay), close };
    opts.onMount?.(result);
    return result;
  }

  function confirmBox({ title, message, confirmText = '确认', danger = true }) {
    return new Promise((resolve) => {
      let confirmed = false;
      const m = modal({
        title, narrow: true,
        body: `<p class="confirm-text">${message}</p>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>`,
        onClose: () => { if (!confirmed) resolve(false); }
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-ok]', m.overlay).onclick = () => { confirmed = true; m.close(); resolve(true); };
    });
  }

  /* ----------------------------- Telegram 预览 ----------------------------- */
  const STARTER = {
    welcome: '<b>✨ 欢迎 {name} 加入 {group}</b>\n\n很高兴在这里遇见你，群里有 <b>{count}</b> 位伙伴。\n{mention} 先看看群规，再和大家打个招呼吧 👋\n\n<b>今日关键词</b>　真诚 · 分享 · 共创',
    verify: '🛡️ <b>人类验证</b>\n\n{mention}，为了保持群聊干净，请完成下面的小问题：\n🧮 <b>{question}</b>\n⏳ {timeout} 秒内有效。',
    verify_success: '✅ <b>验证通过</b>\n\n欢迎正式加入 <b>{group}</b>，{mention}！\n发言权限已经解锁，去和大家打个招呼吧 ✨',
    checkin: '📅 <b>签到成功</b>\n\n{name} 今天获得 <b>+{points}</b> {currency}\n🔥 连续签到 <b>{streak}</b> 天　·　当前余额 <b>{balance}</b>\n\n明天也要记得回来呀。',
    redpacket: '🧧 <b>{title}</b>\n\n{note}\n\n💎 总积分 <b>{total}</b>　·　红包 <b>{count}</b> 个\n⏰ {expire}\n\n点击下方按钮，试试今天的手气 👇',
    campaign: '🎁 <b>{name}</b>\n\n发布一件以「秋日」为主题的创作，即可参与抽奖。\n🏆 3 位幸运创作者，每人 <b>{prize}</b> 积分。\n\n👥 已有 <b>{entries}</b> 位伙伴参与\n⏰ 截止时间：{end}',
    rules: '📜 <b>{group} · 群规</b>\n\n{rules}\n\n<i>友善是这里最重要的通行证。</i>',
    ad: '<b>📷 从「拍到」到「拍好」</b>\n\n6 节直播课，拆解光线、构图与色彩。\n群友专属价 <b>¥199</b>，今晚 24 点截止。',
    schedule: '<b>☀️ 早安，{group}</b>\n\n今天也请带着好奇心出发。\n在群里分享一件让你觉得「世界真有趣」的小事吧。\n\n<i>{date} · 星群助手</i>',
    shop: '🛍️ <b>{group} · 积分商城</b>\n\n{items}\n\n发送 /me 查看余额，点击按钮即可兑换。',
    tasks: '🎯 <b>任务中心</b>\n\n{tasks}\n\n发送 /shop 看看积分能换什么。',
    store: '⭐ <b>数字商品</b>\n\n{products}\n\n点击按钮创建 Stars 发票，支付成功后发放内容。',
    ticket: '🎫 <b>工单已提交</b>\n\n编号：<code>#{ticket_id}</code>\n管理员会在后台看到并回复你，请留意机器人私聊。',
    help: '🛰️ <b>星群管家</b>\n\n{commands}\n\n广告与违规内容会被自动处理。'
  };

  const SAMPLE = {
    name: 'Luna', username: '@luna_star', group: '星际摄影交流群', count: '1,286',
    date: '11月08日 21:30', points: '18', streak: '7', balance: '326', question: '3 + 5 = ?',
    timeout: '5 分钟', title: '周末胶片福利', note: '谢谢你这一周在群里的每一次快门与分享。',
    total: '888', expire: '11月12日 23:59', entries: '128', end: '11月12日 23:59',
    currency: '积分', code: 'AUTUMN100', prize: '500', mention: '<a href="#">Luna</a>',
    rules: '1. 友善交流，不攻击、不引战。\n2. 禁止任何形式的广告与拉人。\n3. 分享作品请注明出处。',
    items: '🎓 <b>课程优惠券</b> · <b>200</b> 积分\n📦 <b>摄影预设包</b> · <b>300</b> 积分',
    tasks: '<b>每日签到</b> <code>1/1</code> · 可领取\n<b>今日冒个泡</b> <code>3/5</code>',
    products: '<b>星群会员 · 月卡</b> · <b>100</b> Stars\n<b>摄影预设包</b> · <b>50</b> Stars',
    ticket_id: '1024',
    commands: '/checkin 签到　/me 我的积分　/rank 排行榜\n/shop 积分商城　/tasks 任务中心'
  };

  function withVars(body, vars = {}) {
    const all = { ...SAMPLE, ...vars };
    return String(body || '').replace(/\{([a-z_]+)\}/g, (m, k) => all[k] !== undefined ? all[k] : m);
  }

  function groupButtonRows(buttons) {
    const list = (buttons || []).filter((b) => b && b.text).slice(0, 8);
    if (!list.length) return [];
    if (list.some((b) => Number(b.row) > 0)) {
      const map = new Map();
      const order = [];
      list.forEach((b) => {
        const row = Number(b.row) > 0 ? Number(b.row) : 1;
        if (!map.has(row)) { map.set(row, []); order.push(row); }
        map.get(row).push(b);
      });
      return order.map((r) => map.get(r));
    }
    const rows = [];
    for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
    return rows;
  }

  function preview(body, buttons, opts = {}) {
    const rows = groupButtonRows(buttons);
    let rowsHTML = '';
    rows.forEach((row) => {
      const cols = Math.max(1, row.length);
      rowsHTML += `<div class="tg-action-row" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${row.map((b) => `<span class="tg-btn">${esc(b.text)}</span>`).join('')}</div>`;
    });
    const safe = String(body || '').replace(/<script[\s\S]*?<\/script>/gi, '');
    return `<div class="tg-preview">
      <div class="tg-head"><span class="tg-avatar">✦</span><div><strong>${esc(opts.group || SAMPLE.group)}</strong><small>1,286 members</small></div><span class="dot-menu">⋮</span></div>
      <div class="tg-chat"><div class="tg-bubble">
        ${opts.media ? `<div class="tg-media">${opts.media ? `<img src="${esc(opts.media)}" alt="">` : '🖼'}</div>` : ''}
        ${withVars(safe, opts.vars)}
        <span class="tg-time">21:30 · via @starkeeper_bot</span>
      </div>${rowsHTML ? `<div class="tg-actions">${rowsHTML}</div>` : ''}</div>
      <div class="tg-foot"><span>支持 HTML · <b>粗体</b> <i>斜体</i> <code>代码</code></span><span>${CURRENCY}</span></div>
    </div>`;
  }

  function buttonEditor(container, initial = [], onChange) {
    if (!container) return { get: () => [] };
    function normalize(list) {
      const buttons = (list || []).map((b) => ({ text: b.text || '', type: b.type || 'callback', value: b.value || '', row: Number(b.row) || 0 }));
      if (!buttons.length) return [[{ text: '', type: 'callback', value: 'checkin', row: 1 }]];
      if (buttons.some((b) => b.row > 0)) {
        const map = new Map(), order = [];
        buttons.forEach((b) => {
          const r = b.row || 1;
          if (!map.has(r)) { map.set(r, []); order.push(r); }
          map.get(r).push({ ...b, row: r });
        });
        return order.map((r) => map.get(r));
      }
      const rows = [];
      for (let i = 0; i < buttons.length; i += 2) {
        rows.push(buttons.slice(i, i + 2).map((b, j) => ({ ...b, row: rows.length + 1 })));
      }
      return rows;
    }
    let state = normalize(initial);
    const trash = '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';
    const plus = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';

    const total = () => state.reduce((n, row) => n + row.length, 0);
    function draw() {
      container.innerHTML = state.map((row, r) => `
        <div class="button-row-block" data-r="${r}">
          <div class="button-row-head">
            <div><strong>第 ${r + 1} 行</strong><span>${row.length} 个按钮</span></div>
            <div class="row-actions">
              <button type="button" class="row-mini" data-add-col title="这一行再加一个按钮" ${total() >= 8 || row.length >= 4 ? 'disabled' : ''}>＋ 按钮</button>
              <button type="button" class="row-mini danger" data-del-row title="删除整行" ${state.length <= 1 ? 'disabled' : ''}>删除行</button>
            </div>
          </div>
          <div class="button-row-grid" style="grid-template-columns:repeat(${Math.max(1, row.length)},minmax(0,1fr))">
            ${row.map((b, c) => `
              <div class="button-cell" data-c="${c}">
                <div class="button-cell-head"><span>${r + 1}.${c + 1}</span><button type="button" class="cell-del" data-del-btn title="删除按钮">${trash}</button></div>
                <input data-k="text" value="${esc(b.text)}" placeholder="按钮文字" maxlength="48">
                <select data-k="type"><option value="callback"${b.type === 'callback' ? ' selected' : ''}>回调动作</option><option value="url"${b.type === 'url' ? ' selected' : ''}>打开链接</option></select>
                <input data-k="value" value="${esc(b.value)}" placeholder="${b.type === 'url' ? 'https://…' : 'checkin / rules / rank'}">
              </div>`).join('')}
          </div>
        </div>`).join('') +
        `<button type="button" class="btn btn-ghost btn-sm" data-add-row style="width:fit-content" ${total() >= 8 ? 'disabled' : ''}>＋ 添加一行</button>
         <small class="field-hint">每行 1–4 个按钮，最多 8 个。按钮在 Telegram 中的排列会与右侧预览一致。</small>`;
      $$('input[data-k], select[data-k]', container).forEach((inp) => {
        inp.addEventListener('input', () => {
          const block = inp.closest('.button-row-block'), cell = inp.closest('.button-cell');
          const r = Number(block.dataset.r), c = Number(cell.dataset.c);
          state[r][c][inp.dataset.k] = inp.value;
          if (inp.dataset.k === 'type') draw();
          onChange?.();
        });
      });
      $$('[data-add-col]', container).forEach((b) => b.addEventListener('click', () => {
        const r = Number(b.closest('.button-row-block').dataset.r);
        if (state[r].length >= 4 || total() >= 8) return;
        state[r].push({ text: '', type: 'callback', value: 'checkin', row: r + 1 });
        draw(); onChange?.();
      }));
      $$('[data-del-btn]', container).forEach((b) => b.addEventListener('click', () => {
        const block = b.closest('.button-row-block'), r = Number(block.dataset.r), c = Number(b.closest('.button-cell').dataset.c);
        state[r].splice(c, 1);
        if (!state[r].length) state.splice(r, 1);
        if (!state.length) state = [[{ text: '', type: 'callback', value: 'checkin', row: 1 }]];
        draw(); onChange?.();
      }));
      $$('[data-del-row]', container).forEach((b) => b.addEventListener('click', () => {
        if (state.length <= 1) return;
        state.splice(Number(b.closest('.button-row-block').dataset.r), 1);
        draw(); onChange?.();
      }));
      $('[data-add-row]', container)?.addEventListener('click', () => {
        if (total() >= 8) return;
        state.push([{ text: '', type: 'callback', value: 'checkin', row: state.length + 1 }]);
        draw(); onChange?.();
      });
    }
    draw();
    return {
      get: () => state.flatMap((row, r) => row.filter((b) => b.text.trim()).map((b) => ({
        text: b.text.trim(), type: b.type, value: b.value.trim(), row: r + 1
      }))).slice(0, 8),
      set: (v) => { state = normalize(v); draw(); }
    };
  }

  const groupOptions = (groups, selected = 0) =>
    '<option value="0">全部群组</option>' + (groups || []).map((g) =>
      `<option value="${g.id}"${Number(selected) === g.id ? ' selected' : ''}>${esc(g.title)}</option>`).join('');

  const findTemplate = (id, scene) => {
    const list = DATA.templates || [];
    return list.find((t) => Number(t.id) === Number(id)) || list.find((t) => t.scene === scene) || null;
  };

  async function upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    return api('/api/upload', { method: 'POST', body: fd });
  }

  /* ----------------------------- 全局交互 ----------------------------- */
  function initGlobal() {
    const sidebar = $('#sidebar'), scrim = $('#sidebar-scrim');
    const toggle = (open) => { sidebar?.classList.toggle('open', open); scrim?.classList.toggle('open', open); };
    $('#menu-btn')?.addEventListener('click', () => toggle(!sidebar.classList.contains('open')));
    scrim?.addEventListener('click', () => toggle(false));
    $$('.nav-item').forEach((a) => a.addEventListener('click', () => toggle(false)));

    const dropdown = $('#user-dropdown');
    $('#user-btn')?.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown?.classList.remove('open'));

    $('#theme-btn')?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('sk-theme', next);
    });

    $('#logout-btn')?.addEventListener('click', async () => {
      try { await api('/api/auth/logout', { method: 'POST', body: {} }); location.href = '/login'; }
      catch (e) { toast(e.message, 'err'); }
    });
  }

  function initLogin() {
    const form = $('#login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#login-submit'), err = $('#login-error');
      err.textContent = '';
      busy(btn, true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            username: $('#login-username').value.trim(),
            password: $('#login-password').value,
            remember: form.elements.remember.checked
          })
        });
        const payload = await res.json();
        if (!res.ok || !payload.ok) throw new Error(payload.error || '登录失败');
        location.href = payload.data.redirect || '/';
      } catch (ex) {
        err.textContent = ex.message;
        busy(btn, false);
        $('#login-password').focus();
      }
    });
  }

  /* ----------------------------- 总览 ----------------------------- */
  function smoothPath(points) {
    if (!points.length) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function drawChart(series) {
    const box = $('#activity-chart');
    if (!box || !series?.length) return;
    const W = 760, H = 220, pad = { l: 32, r: 12, t: 16, b: 28 };
    const max = Math.max(10, ...series.flatMap((p) => [p.join, p.checkin, p.verify]));
    const nice = Math.ceil(max / 10) * 10;
    const X = (i) => pad.l + i * (W - pad.l - pad.r) / Math.max(1, series.length - 1);
    const Y = (v) => pad.t + (1 - v / nice) * (H - pad.t - pad.b);
    const points = (k) => series.map((p, i) => ({ x: X(i), y: Y(p[k] || 0), v: p[k] || 0 }));
    const checkin = points('checkin'), join = points('join');
    let grid = '';
    for (let i = 0; i <= 3; i++) {
      const y = Y(nice / 3 * i);
      grid += `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="rgba(148,163,184,.11)" stroke-dasharray="3 5"/>`;
      grid += `<text x="${pad.l - 8}" y="${y + 3}" text-anchor="end" fill="#5f6a88" font-size="8.5">${Math.round(nice / 3 * i)}</text>`;
    }
    const labels = series.map((p, i) => `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" fill="#5f6a88" font-size="8.5">${esc(p.label)}</text>`).join('');
    const dots = checkin.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#0b1224" stroke="#a78bfa" stroke-width="1.5"><title>${esc(series[i].label)} 签到 ${p.v}</title></circle>`).join('') +
      join.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="2.3" fill="#22d3ee"><title>${esc(series[i].label)} 入群 ${p.v}</title></circle>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".3"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
      ${grid}<path d="${smoothPath(checkin)} L${X(series.length - 1)},${Y(0)} L${X(0)},${Y(0)} Z" fill="url(#areaFill)"/>
      <path d="${smoothPath(join)}" fill="none" stroke="#22d3ee" stroke-opacity=".6" stroke-width="1.3" stroke-dasharray="4 5"/>
      <path d="${smoothPath(checkin)}" fill="none" stroke="url(#lineGrad)" stroke-width="2.2"/>${dots}${labels}</svg>`;
  }

  /* ----------------------------- 群组列表 ----------------------------- */
  function initGroups() {
    const addGroup = () => {
      const m = modal({
        title: '接入一个新的群组',
        subtitle: '机器人需要先被添加为群管理员',
        body: `<label class="field"><span>群组 ID 或公开 @username</span><input id="g-chat" placeholder="-1001234567890 或 @your_group"><small class="field-hint">${DEMO ? '演示模式可以直接填写任意数字 ID。' : '填写群组数字 ID 或公开用户名，机器人必须已在群内。'}</small></label>
          <label class="field"><span>显示名称 <em>可选</em></span><input id="g-title" placeholder="不填则自动读取 Telegram 群名"></label>
          <label class="field"><span>时区</span><select id="g-tz"><option value="Asia/Shanghai">Asia/Shanghai · 北京时间</option><option value="Asia/Tokyo">Asia/Tokyo</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option><option value="UTC">UTC</option></select></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>接入群组</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          await api('/api/groups', { method: 'POST', body: { chat_id: $('#g-chat').value.trim(), title: $('#g-title').value.trim(), timezone: $('#g-tz').value } });
          toast('群组已接入'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#add-group-btn')?.addEventListener('click', addGroup);
    $$('.js-group-toggle').forEach((el) => el.addEventListener('change', async () => {
      try {
        await api(`/api/groups/${el.dataset.id}`, { method: 'PUT', body: { is_active: el.checked } });
        toast(el.checked ? '群组已启用' : '群组已暂停');
      } catch (e) { el.checked = !el.checked; toast(e.message, 'err'); }
    }));
    $('#group-search')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('[data-group-card]').forEach((card) => {
        card.style.display = !q || card.dataset.name.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ----------------------------- 群组配置 ----------------------------- */
  function readSettings(form) {
    const s = { ...(DATA.settings || {}) };
    $$('[name]', form).forEach((el) => {
      const k = el.name;
      if (el.type === 'checkbox') s[k] = el.checked;
      else if (el.type === 'number' || k.endsWith('_id')) s[k] = Number(el.value || 0);
      else s[k] = el.value;
    });
    return s;
  }

  function initGroup() {
    if (!DATA.group) return;
    $$('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.tab-pane').forEach((p) => p.classList.toggle('active', p.id === `pane-${btn.dataset.tab}`));
      history.replaceState(null, '', `?tab=${btn.dataset.tab}`);
    }));

    const form = $('#settings-form');
    $$('.save-settings').forEach((btn) => btn.addEventListener('click', async () => {
      busy(btn, true);
      try {
        DATA.settings = await api(`/api/groups/${DATA.group.id}/settings`, { method: 'PUT', body: readSettings(form) });
        toast('群组配置已保存');
      } catch (e) { toast(e.message, 'err'); }
      busy(btn, false);
    }));

    $$('[data-preview-select]').forEach((sel) => {
      const target = document.getElementById(sel.dataset.previewTarget);
      const paint = () => {
        const t = findTemplate(sel.value, sel.dataset.scene);
        if (target && t) target.innerHTML = preview(t.body, t.buttons, {
          media: t.media_url, group: DATA.group.title,
          vars: { group: DATA.group.title, count: num(DATA.group.member_count) }
        });
      };
      sel.addEventListener('change', paint);
      paint();
    });

    $$('[data-edit-template]').forEach((btn) => btn.addEventListener('click', () => {
      const scene = btn.dataset.editTemplate;
      const field = { welcome: 'welcome_template_id', verify: 'verify_template_id', verify_success: 'verify_success_template_id', checkin: 'checkin_template_id' }[scene];
      const select = field ? form?.querySelector(`[name="${field}"]`) : null;
      const tpl = select ? findTemplate(select.value, scene) : findTemplate(0, scene);
      openTemplateEditor(tpl || null, scene);
    }));

    $('#group-active-toggle')?.addEventListener('change', async (e) => {
      try {
        await api(`/api/groups/${DATA.group.id}`, { method: 'PUT', body: { is_active: e.target.checked } });
        toast(e.target.checked ? '群组已启用' : '群组已暂停');
      } catch (ex) { e.target.checked = !e.target.checked; toast(ex.message, 'err'); }
    });

    $('#sync-group-btn')?.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      try {
        const g = await api(`/api/groups/${DATA.group.id}/sync`, { method: 'POST', body: {} });
        toast(`已同步，${num(g.member_count)} 位成员`);
        setTimeout(() => location.reload(), 500);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    });

    $('#test-send-btn')?.addEventListener('click', () => {
      const m = modal({
        title: '发送测试消息',
        subtitle: `会真实发送到 ${DATA.group.title}`,
        body: `<label class="field"><span>文案</span><textarea id="t-body" rows="7" placeholder="<b>你好</b>，这是测试消息。"></textarea></label>
          <label class="field"><span>图片地址 <em>可选</em></span><input id="t-media" placeholder="https://…"></label>
          <div class="field"><span>按钮</span><div id="t-buttons"></div></div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-send>发送</button>`
      });
      const editor = buttonEditor($('#t-buttons'), []);
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-send]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          await api(`/api/groups/${DATA.group.id}/test`, { method: 'POST', body: { body: $('#t-body').value, media_url: $('#t-media').value, buttons: editor.get() } });
          toast('测试消息已发送'); m.close();
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    });

    $('#delete-group-btn')?.addEventListener('click', async () => {
      if (!await confirmBox({ title: '移除群组', message: `确定从控制台移除「${esc(DATA.group.title)}」吗？<br>不会把机器人移出 Telegram 群，但本群数据将不可恢复。`, confirmText: '移除群组' })) return;
      try { await api(`/api/groups/${DATA.group.id}`, { method: 'DELETE' }); location.href = '/groups'; }
      catch (e) { toast(e.message, 'err'); }
    });
  }

  /* ----------------------------- 模板工坊 ----------------------------- */
  function openTemplateEditor(tpl, defaultScene = 'welcome') {
    const scenes = DATA.scenes || [];
    const scene = tpl ? tpl.scene : defaultScene;
    const m = modal({
      title: tpl ? '编辑模板' : '新建模板',
      subtitle: '文案、封面与按钮会实时出现在预览中',
      wide: true,
      body: `<div class="editor-layout">
        <div class="editor-form">
          <div class="field-row">
            <label class="field"><span>模板名称</span><input id="te-name" maxlength="60" value="${esc(tpl?.name || '')}" placeholder="例如：秋日欢迎卡"></label>
            <label class="field"><span>场景</span><select id="te-scene">${scenes.map((s) => `<option value="${s.key}"${s.key === scene ? ' selected' : ''}>${s.icon} ${esc(s.label)}</option>`).join('')}</select></label>
          </div>
          <label class="field"><span>文案 <em>支持 Telegram HTML</em></span><textarea id="te-body" rows="10" placeholder="<b>欢迎 {name}</b>">${esc(tpl?.body || STARTER[scene] || '')}</textarea>
            <div class="var-chips" id="te-vars"></div>
          </label>
          <div class="field"><span>封面图片 <em>可选</em></span>
            <div class="media-drop">
              <div id="te-thumb" style="width:44px;height:44px;border-radius:8px;background:rgba(139,92,246,.15);display:grid;place-items:center;overflow:hidden">🖼</div>
              <div class="media-info"><span id="te-media">${esc(tpl?.media_url || '未选择图片')}</span><small>PNG / JPG / WEBP，上传后自动托管</small></div>
              <button class="btn btn-sm" type="button" id="te-upload">上传</button>
              <input id="te-file" type="file" accept="image/*" hidden>
            </div>
          </div>
          <div class="field"><span>按钮 <em>最多 8 个</em></span><div id="te-buttons"></div><small class="field-hint">回调动作：<code>checkin</code> 签到、<code>rules</code> 群规、<code>rank</code> 排行榜。</small></div>
        </div>
        <div class="editor-preview"><div class="preview-label"><span>LIVE PREVIEW</span><span class="tag tag-violet">Telegram</span></div><div id="te-preview"></div></div>
      </div>`,
      footer: `<span class="modal-note">变量会在发送时自动替换</span><button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${tpl ? '保存修改' : '创建模板'}</button>`
    });

    let mediaURL = tpl?.media_url || '';
    let paint = () => {};
    const editor = buttonEditor($('#te-buttons'), tpl?.buttons || [{ text: '📜 阅读群规', type: 'callback', value: 'rules' }], () => paint());
    paint = () => {
      $('#te-preview').innerHTML = preview($('#te-body').value, editor.get(), { media: mediaURL });
    };
    const vars = ['name', 'username', 'mention', 'group', 'count', 'date', 'points', 'streak', 'balance', 'currency', 'question', 'timeout', 'title', 'note', 'total', 'expire', 'entries', 'end', 'prize', 'rules', 'body', 'items', 'tasks', 'products', 'ticket_id', 'commands'];
    $('#te-vars').innerHTML = vars.map((v) => `<button type="button" class="var-chip" data-var="${v}">{${v}}</button>`).join('');
    $$('#te-vars [data-var]').forEach((b) => b.addEventListener('click', () => {
      const ta = $('#te-body'), token = `{${b.dataset.var}}`, pos = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, pos) + token + ta.value.slice(pos);
      ta.focus(); ta.selectionStart = ta.selectionEnd = pos + token.length; paint();
    }));
    $('#te-body').addEventListener('input', paint);
    $('#te-scene').addEventListener('change', () => {
      const current = $('#te-body').value.trim();
      if (!current || Object.values(STARTER).includes(current)) {
        $('#te-body').value = STARTER[$('#te-scene').value] || '';
      }
      paint();
    });
    $('#te-upload').onclick = () => $('#te-file').click();
    $('#te-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const res = await upload(file);
        mediaURL = res.url;
        $('#te-media').textContent = mediaURL;
        $('#te-thumb').innerHTML = `<img src="${esc(mediaURL)}" style="width:44px;height:44px;object-fit:cover" alt="">`;
        paint(); toast('图片已上传');
      } catch (ex) { toast(ex.message, 'err'); }
    };
    paint();
    $('[data-cancel]', m.overlay).onclick = m.close;
    $('[data-save]', m.overlay).onclick = async (e) => {
      busy(e.currentTarget, true);
      try {
        const payload = { name: $('#te-name').value.trim(), scene: $('#te-scene').value, body: $('#te-body').value, media_url: mediaURL, buttons: editor.get(), parse_mode: 'HTML' };
        if (tpl) await api(`/api/templates/${tpl.id}`, { method: 'PUT', body: payload });
        else await api('/api/templates', { method: 'POST', body: payload });
        toast(tpl ? '模板已更新' : '模板已创建'); m.close(); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    };
  }

  async function showTemplateVersions(id) {
    try {
      const versions = await api(`/api/templates/${id}/versions`);
      const tpl = (DATA.templates || []).find((t) => t.id === Number(id));
      const m = modal({
        title: '历史版本', subtitle: tpl ? tpl.name : '', wide: true,
        body: versions.length ? `<div class="table-wrap"><table><thead><tr><th>版本</th><th>时间</th><th>说明</th><th>内容</th><th></th></tr></thead><tbody>
          ${versions.map((v) => `<tr><td class="mono">#${v.id}</td><td class="tiny">${dateTime(v.created_at)}</td><td class="tiny">${esc(v.note || '编辑保存')}</td><td class="tiny" style="max-width:280px">${esc((v.body || '').replace(/<[^>]*>/g, ' ').slice(0, 60))}</td><td><button class="btn btn-sm" data-restore="${v.id}">恢复</button></td></tr>`).join('')}
          </tbody></table></div>` : `<div class="empty" style="padding:30px"><p>还没有历史版本</p></div>`,
        footer: `<span class="modal-note">最多保留最近 30 个版本</span><button class="btn" data-close>关闭</button>`
      });
      $('[data-close]', m.overlay).onclick = m.close;
      $$('[data-restore]', m.overlay).forEach((b) => b.addEventListener('click', async () => {
        if (!await confirmBox({ title: '恢复版本', message: '当前内容会被替换为这个历史版本，确定吗？', confirmText: '恢复' })) return;
        try {
          await api(`/api/templates/${id}/versions/${b.dataset.restore}/restore`, { method: 'POST', body: {} });
          toast('版本已恢复'); m.close(); setTimeout(() => location.reload(), 400);
        } catch (e) { toast(e.message, 'err'); }
      }));
    } catch (e) { toast(e.message, 'err'); }
  }

  function initTemplates() {
    $$('[data-template-card]').forEach((card) => {
      const find = () => (DATA.templates || []).find((t) => t.id === Number(card.dataset.id));
      card.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openTemplateEditor(find())));
      card.querySelector('[data-history]')?.addEventListener('click', () => showTemplateVersions(card.dataset.id));
      card.querySelector('[data-duplicate]')?.addEventListener('click', async () => {
        try { await api(`/api/templates/${card.dataset.id}/duplicate`, { method: 'POST', body: {} }); toast('已复制模板'); setTimeout(() => location.reload(), 350); }
        catch (e) { toast(e.message, 'err'); }
      });
      card.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除模板', message: '引用该模板的群组会自动回退到场景默认模板。', confirmText: '删除模板' })) return;
        try { await api(`/api/templates/${card.dataset.id}`, { method: 'DELETE' }); card.remove(); toast('模板已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
    $$('[data-new-template]').forEach((b) => b.addEventListener('click', () => openTemplateEditor(null, b.dataset.newTemplate || 'welcome')));
    let activeScene = '';
    const applyFilter = () => {
      const q = ($('#tpl-search')?.value || '').trim().toLowerCase();
      $$('[data-template-card]').forEach((card) => {
        const t = (DATA.templates || []).find((x) => x.id === Number(card.dataset.id)) || {};
        const hay = `${t.name || ''} ${t.body || ''} ${(t.buttons || []).map((b) => b.text).join(' ')}`.toLowerCase();
        const show = (!activeScene || card.dataset.scene === activeScene) && (!q || hay.includes(q));
        card.style.display = show ? '' : 'none';
      });
    };
    $$('[data-scene-filter]').forEach((chip) => chip.addEventListener('click', () => {
      $$('[data-scene-filter]').forEach((c) => c.classList.toggle('active', c === chip));
      activeScene = chip.dataset.sceneFilter;
      applyFilter();
    }));
    $('#tpl-search')?.addEventListener('input', applyFilter);
  }

  /* ----------------------------- 定时任务 ----------------------------- */
  function openScheduleEditor(sc) {
    const isEdit = !!sc;
    const mode = sc?.mode || 'daily';
    const days = String(sc?.weekdays || '1,2,3,4,5,6,7').split(',');
    const m = modal({
      title: isEdit ? '编辑定时任务' : '新建定时任务',
      subtitle: '把重要的话，放在刚刚好的时间',
      wide: true,
      body: `<div class="editor-layout"><div class="editor-form">
        <div class="field-row">
          <label class="field"><span>任务名称</span><input id="se-name" value="${esc(sc?.name || '')}" placeholder="每日早安电台"></label>
          <label class="field"><span>发送到</span><select id="se-group">${groupOptions(DATA.groups, sc?.group_id || 0)}</select></label>
        </div>
        <div class="field-row">
          <label class="field"><span>发送模式</span><select id="se-mode">
            <option value="daily"${mode === 'daily' ? ' selected' : ''}>每天</option>
            <option value="weekly"${mode === 'weekly' ? ' selected' : ''}>每周</option>
            <option value="interval"${mode === 'interval' ? ' selected' : ''}>固定间隔</option>
            <option value="cron"${mode === 'cron' ? ' selected' : ''}>Cron 表达式</option>
            <option value="once"${mode === 'once' ? ' selected' : ''}>单次发送</option>
          </select></label>
          <label class="field" data-mode="once"><span>发送时间</span><input type="datetime-local" id="se-runat" value="${toInput(sc?.run_at || (Date.now() / 1000 + 7200))}"></label>
          <label class="field" data-mode="daily weekly"><span>时间 HH:MM</span><input id="se-time" value="${esc(sc?.time_of_day || '09:00')}"></label>
          <label class="field" data-mode="interval"><span>间隔（分钟）</span><input type="number" id="se-interval" value="${sc?.interval_minutes || 60}"></label>
          <label class="field" data-mode="cron"><span>Cron</span><input id="se-cron" value="${esc(sc?.cron_expr || '0 9 * * 1-5')}"></label>
        </div>
        <div class="field" data-mode="weekly"><span>星期</span><div class="row" id="se-days">
          ${['一', '二', '三', '四', '五', '六', '日'].map((d, i) => `<label class="check"><input type="checkbox" value="${i + 1}"${days.includes(String(i + 1)) ? ' checked' : ''}>周${d}</label>`).join('')}
        </div></div>
        <label class="field"><span>消息内容</span><textarea id="se-body" rows="7">${esc(sc?.body || STARTER.schedule)}</textarea>
          <div class="var-chips"><button type="button" class="var-chip" data-var="group">{group}</button><button type="button" class="var-chip" data-var="date">{date}</button><button type="button" class="var-chip" data-var="count">{count}</button></div>
        </label>
        <div class="field"><span>按钮</span><div id="se-buttons"></div></div>
        <label class="field"><span>图片地址 <em>可选</em></span><input id="se-media" value="${esc(sc?.media_url || '')}" placeholder="https://…"></label>
      </div><div class="editor-preview"><div class="preview-label"><span>LIVE PREVIEW</span><span class="tag tag-violet">Telegram</span></div><div id="se-preview"></div></div></div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${isEdit ? '保存修改' : '创建任务'}</button>`
    });
    let paint = () => {};
    const editor = buttonEditor($('#se-buttons'), sc?.buttons || [], () => paint());
    paint = () => { $('#se-preview').innerHTML = preview($('#se-body').value, editor.get(), { media: $('#se-media').value.trim() }); };
    const syncMode = () => {
      const v = $('#se-mode').value;
      $$('[data-mode]', m.overlay).forEach((el) => { el.style.display = el.dataset.mode.split(' ').includes(v) ? '' : 'none'; });
      paint();
    };
    $('#se-mode').addEventListener('change', syncMode);
    $('#se-body').addEventListener('input', paint);
    $('#se-media').addEventListener('input', paint);
    $$('[data-var]', m.overlay).forEach((b) => b.addEventListener('click', () => { $('#se-body').value += `{${b.dataset.var}}`; paint(); }));
    syncMode();
    $('[data-cancel]', m.overlay).onclick = m.close;
    $('[data-save]', m.overlay).onclick = async (e) => {
      const payload = {
        name: $('#se-name').value.trim(), group_id: Number($('#se-group').value), body: $('#se-body').value.trim(),
        media_url: $('#se-media').value.trim(), buttons: editor.get(), mode: $('#se-mode').value,
        run_at: fromInput($('#se-runat').value), time_of_day: $('#se-time').value.trim(),
        weekdays: $$('#se-days input:checked').map((i) => i.value).join(','),
        interval_minutes: Number($('#se-interval').value || 60), cron_expr: $('#se-cron').value.trim(),
        status: sc?.status || 'active'
      };
      if (!payload.name || !payload.body) { toast('请填写任务名称和消息内容', 'err'); return; }
      busy(e.currentTarget, true);
      try {
        if (isEdit) await api(`/api/schedules/${sc.id}`, { method: 'PUT', body: payload });
        else await api('/api/schedules', { method: 'POST', body: payload });
        toast(isEdit ? '任务已更新' : '任务已创建'); m.close(); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    };
  }

  function initSchedules() {
    $$('.new-schedule-btn').forEach((b) => b.addEventListener('click', () => openScheduleEditor(null)));
    $$('[data-schedule]').forEach((row) => {
      const find = () => (DATA.schedules || []).find((s) => s.id === Number(row.dataset.schedule));
      row.querySelector('[data-edit]')?.addEventListener('click', () => openScheduleEditor(find()));
      row.querySelector('[data-run]')?.addEventListener('click', async (e) => {
        if (!await confirmBox({ title: '立即发送', message: '将立即向目标群组发送这条消息。', confirmText: '立即发送', danger: false })) return;
        busy(e.currentTarget, true);
        try {
          const r = await api(`/api/schedules/${row.dataset.schedule}/run`, { method: 'POST', body: {} });
          toast(`已发送到 ${r.sent} 个群组`); setTimeout(() => location.reload(), 400);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      });
      row.querySelector('[data-toggle]')?.addEventListener('click', async () => {
        try {
          const r = await api(`/api/schedules/${row.dataset.schedule}/toggle`, { method: 'POST', body: {} });
          toast(r.status === 'active' ? '任务已启用' : '任务已暂停');
          setTimeout(() => location.reload(), 300);
        } catch (ex) { toast(ex.message, 'err'); }
      });
      row.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除任务', message: '删除后无法恢复，已发送记录会保留。', confirmText: '删除任务' })) return;
        try { await api(`/api/schedules/${row.dataset.schedule}`, { method: 'DELETE' }); row.remove(); toast('任务已删除'); }
        catch (ex) { toast(ex.message, 'err'); }
      });
    });
    $('#schedule-search')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('[data-schedule]').forEach((row) => { row.style.display = !q || row.dataset.name.toLowerCase().includes(q) ? '' : 'none'; });
    });
  }

  /* ----------------------------- 签到积分 ----------------------------- */
  function initCheckin() {
    $('#checkin-group')?.addEventListener('change', (e) => { location.href = `/checkin?group=${e.target.value}`; });
    const adjust = (account) => {
      const m = modal({
        title: '调整成员积分',
        subtitle: '正数加分，负数扣除，会写入积分流水',
        body: `<div class="bot-card" style="margin-bottom:16px"><span class="avatar">${esc((account.first_name || account.username || '?').slice(0, 2))}</span><div><strong>${esc(account.first_name || account.username || '未命名')}</strong><small>@${esc(account.username || '—')} · ${account.user_id}</small></div><b style="margin-left:auto;font-size:18px">${num(account.balance)}</b></div>
          <label class="field"><span>调整数值</span><input type="number" id="ad-amount" value="100"></label>
          <label class="field"><span>备注</span><input id="ad-remark" placeholder="活动奖励 / 违规扣除"></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>确认调整</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const r = await api('/api/points/adjust', { method: 'POST', body: {
            group_id: DATA.selected?.id || Number($('#checkin-group').value), user_id: account.user_id,
            username: account.username || '', first_name: account.first_name || '',
            amount: Number($('#ad-amount').value), remark: $('#ad-remark').value.trim()
          } });
          toast(`调整完成，余额 ${num(r.balance)}`); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $$('[data-adjust]').forEach((b) => b.addEventListener('click', () => {
      const acc = (DATA.accounts || []).find((a) => a.user_id === Number(b.dataset.adjust));
      if (acc) adjust(acc);
    }));
    $$('.manual-adjust-btn').forEach((b) => b.addEventListener('click', () => {
      const m = modal({
        title: '手动调整积分', subtitle: '根据用户 ID 补发或扣除',
        body: `<label class="field"><span>用户 ID</span><input id="ma-uid" placeholder="700100001"></label>
          <div class="field-row"><label class="field"><span>用户名</span><input id="ma-user" placeholder="luna_star"></label><label class="field"><span>昵称</span><input id="ma-name" placeholder="Luna"></label></div>
          <div class="field-row"><label class="field"><span>调整数值</span><input type="number" id="ma-amount" value="100"></label><label class="field"><span>备注</span><input id="ma-remark" placeholder="活动奖励"></label></div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>确认调整</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          await api('/api/points/adjust', { method: 'POST', body: {
            group_id: DATA.selected?.id || Number($('#checkin-group').value),
            user_id: Number($('#ma-uid').value), username: $('#ma-user').value.trim(),
            first_name: $('#ma-name').value.trim(), amount: Number($('#ma-amount').value),
            remark: $('#ma-remark').value.trim()
          } });
          toast('积分已调整'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    }));
  }

  /* ----------------------------- 积分红包 ----------------------------- */
  function openPacketEditor() {
    const m = modal({
      title: '发一个积分红包', subtitle: '从积分池发放，领取后自动到账', wide: true,
      body: `<div class="editor-layout"><div class="editor-form">
        <label class="field"><span>发送到</span><select id="rp-group">${(DATA.groups || []).map((g) => `<option value="${g.id}">${esc(g.title)}</option>`).join('')}</select></label>
        <label class="field"><span>红包标题</span><input id="rp-title" value="周末福利红包" maxlength="60"></label>
        <label class="field"><span>一句祝福</span><textarea id="rp-note" rows="3">谢谢你这一周在群里的每一次分享。</textarea></label>
        <div class="field-row-3">
          <label class="field"><span>总积分</span><input type="number" id="rp-total" value="888" min="1"></label>
          <label class="field"><span>个数</span><input type="number" id="rp-count" value="18" min="1"></label>
          <label class="field"><span>分配</span><select id="rp-mode"><option value="random">拼手气</option><option value="equal">均分</option></select></label>
        </div>
        <div class="field-row">
          <label class="field"><span>过期时间</span><input type="datetime-local" id="rp-expire" value="${future(48)}"></label>
          <label class="field"><span>按钮文字</span><input id="rp-button" value="🧧 抢红包" maxlength="32"></label>
        </div>
        <label class="field"><span>红包卡片模板</span><select id="rp-template"><option value="0">使用场景默认模板</option>${(DATA.templates || []).map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      </div><div class="editor-preview"><div class="preview-label"><span>LIVE PREVIEW</span><span class="tag tag-rose">红包</span></div><div id="rp-preview"></div></div></div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>创建红包</button>`
    });
    const paint = () => {
      const t = findTemplate($('#rp-template').value, 'redpacket');
      const body = t?.body || '🧧 <b>{title}</b>\n\n{note}\n\n总积分 <b>{total}</b> · <b>{count}</b> 个红包\n⏰ {expire}';
      $('#rp-preview').innerHTML = preview(body, [{ text: $('#rp-button').value, type: 'callback', value: 'rp' }], {
        vars: { title: $('#rp-title').value, note: $('#rp-note').value, total: $('#rp-total').value, count: $('#rp-count').value, expire: dateTime(fromInput($('#rp-expire').value)) }
      });
    };
    ['#rp-title', '#rp-note', '#rp-total', '#rp-count', '#rp-button', '#rp-expire'].forEach((s) => $(s)?.addEventListener('input', paint));
    $('#rp-template')?.addEventListener('change', paint);
    paint();
    $('[data-cancel]', m.overlay).onclick = m.close;
    $('[data-save]', m.overlay).onclick = async (e) => {
      busy(e.currentTarget, true);
      try {
        await api('/api/redpackets', { method: 'POST', body: {
          group_id: Number($('#rp-group').value), title: $('#rp-title').value.trim(), note: $('#rp-note').value.trim(),
          total_points: Number($('#rp-total').value), total_count: Number($('#rp-count').value),
          mode: $('#rp-mode').value, expire_at: fromInput($('#rp-expire').value),
          button_text: $('#rp-button').value.trim(), template_id: Number($('#rp-template').value)
        } });
        toast('红包草稿已创建'); m.close(); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    };
  }

  async function packetDetail(id) {
    try {
      const d = await api(`/api/redpackets/${id}`);
      const rp = d.packet;
      const m = modal({
        title: rp.title, subtitle: d.group?.title || '', wide: true,
        body: `<div class="packet-stats" style="margin-bottom:12px">
            <div><span>领取进度</span><b>${rp.claimed_count} / ${rp.total_count}</b></div>
            <div><span>已发放</span><b>${num(rp.claimed_points)} / ${num(rp.total_points)}</b></div>
            <div><span>状态</span><b>${rp.status === 'active' ? '进行中' : rp.status === 'finished' ? '已抢完' : rp.status === 'expired' ? '已过期' : '草稿'}</b></div>
          </div><div class="progress" style="margin-bottom:16px"><i style="width:${Math.min(100, rp.claimed_count * 100 / Math.max(1, rp.total_count))}%"></i></div>
          <div class="table-wrap"><table><thead><tr><th>成员</th><th>积分</th><th>时间</th></tr></thead><tbody>
          ${(d.claims || []).length ? d.claims.map((c) => `<tr><td><div class="person"><span class="avatar">${esc((c.first_name || c.username || '?').slice(0, 2))}</span><div><strong>${esc(c.first_name || c.username)}</strong><small>@${esc(c.username || '—')}</small></div></div></td><td><b style="color:var(--amber)">+${c.points}</b></td><td>${dateTime(c.created_at)}</td></tr>`).join('') : '<tr><td colspan="3"><div class="empty" style="padding:24px"><p>还没有人领取</p></div></td></tr>'}
          </tbody></table></div>`,
        footer: `<button class="btn" data-close>关闭</button>`
      });
      $('[data-close]', m.overlay).onclick = m.close;
    } catch (e) { toast(e.message, 'err'); }
  }

  function initRedPackets() {
    $('#new-packet-btn')?.addEventListener('click', openPacketEditor);
    $$('[data-packet]').forEach((card) => {
      card.querySelector('[data-send]')?.addEventListener('click', async (e) => {
        if (!await confirmBox({ title: '发送红包', message: '确认现在把红包发送到群里吗？', confirmText: '发送红包', danger: false })) return;
        busy(e.currentTarget, true);
        try { await api(`/api/redpackets/${card.dataset.packet}/send`, { method: 'POST', body: {} }); toast('红包已发出 🧧'); setTimeout(() => location.reload(), 400); }
        catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      });
      card.querySelector('[data-view]')?.addEventListener('click', () => packetDetail(card.dataset.packet));
      card.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除红包', message: '已领取的积分不会退回。', confirmText: '删除' })) return;
        try { await api(`/api/redpackets/${card.dataset.packet}`, { method: 'DELETE' }); card.remove(); toast('红包已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
      card.querySelector('[data-pause]')?.addEventListener('click', async (e) => {
        const next = e.currentTarget.dataset.status === 'paused' ? 'active' : 'paused';
        try { await api(`/api/redpackets/${card.dataset.packet}/status`, { method: 'POST', body: { status: next } }); toast(next === 'paused' ? '红包已暂停' : '红包已恢复'); setTimeout(() => location.reload(), 300); }
        catch (ex) { toast(ex.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 营销活动 ----------------------------- */
  function openCampaignEditor(c) {
    const isEdit = !!c;
    const type = c?.type || 'lottery';
    const selected = c ? JSON.parse(c.group_ids || '[]') : (DATA.groups || []).map((g) => g.id);
    const m = modal({
      title: isEdit ? '编辑营销活动' : '创建营销活动', subtitle: '抽奖聚人气，兑换码做转化', wide: true,
      body: `<div class="editor-layout"><div class="editor-form">
        <div class="field-row">
          <label class="field"><span>活动名称</span><input id="cp-name" value="${esc(c?.name || '')}" placeholder="秋日创作马拉松"></label>
          <label class="field"><span>类型</span><select id="cp-type"><option value="lottery"${type === 'lottery' ? ' selected' : ''}>🎁 抽奖</option><option value="redeem"${type === 'redeem' ? ' selected' : ''}>🎟 兑换码</option></select></label>
        </div>
        <div class="field"><span>投放群组 <em>不选则全部启用群组</em></span><div class="row" style="gap:8px 14px;max-height:90px;overflow:auto;padding:8px 10px;border:1px solid var(--line);border-radius:10px">
          ${(DATA.groups || []).map((g) => `<label class="check"><input class="cp-group" type="checkbox" value="${g.id}"${selected.includes(g.id) ? ' checked' : ''}>${esc(g.title)}</label>`).join('')}
        </div></div>
        <div class="field-row">
          <label class="field"><span>开始时间</span><input type="datetime-local" id="cp-start" value="${toInput(c?.start_at || Date.now() / 1000)}"></label>
          <label class="field"><span>结束时间</span><input type="datetime-local" id="cp-end" value="${toInput(c?.end_at || (Date.now() / 1000 + 604800))}"></label>
        </div>
        <div class="field-row" data-ctype="lottery">
          <label class="field"><span>开奖时间</span><input type="datetime-local" id="cp-draw" value="${toInput(c?.draw_at || (Date.now() / 1000 + 604800))}"></label>
          <label class="field"><span>奖池积分</span><input type="number" id="cp-prize" value="${c?.prize_pool || 1500}" min="1"></label>
          <label class="field"><span>中奖人数</span><input type="number" id="cp-winners" value="${c?.winners_count || 3}" min="1"></label>
        </div>
        <div class="field-row" data-ctype="redeem">
          <label class="field"><span>兑换码数量</span><input type="number" id="cp-codes" value="20" min="1" max="1000"></label>
          <label class="field"><span>每码积分</span><input type="number" id="cp-codepoints" value="100" min="1"></label>
        </div>
        <label class="field"><span>活动文案</span><textarea id="cp-body" rows="6">${esc(c?.body || STARTER.campaign)}</textarea></label>
        <div class="field"><span>按钮 <em>会自动追加报名按钮</em></span><div id="cp-buttons"></div></div>
        <label class="field"><span>图片地址 <em>可选</em></span><input id="cp-media" value="${esc(c?.media_url || '')}" placeholder="https://…"></label>
      </div><div class="editor-preview"><div class="preview-label"><span>LIVE PREVIEW</span><span class="tag tag-amber">Campaign</span></div><div id="cp-preview"></div></div></div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${isEdit ? '保存修改' : '创建活动'}</button>`
    });
    let paint = () => {};
    const editor = buttonEditor($('#cp-buttons'), c?.buttons || [], () => paint());
    paint = () => {
      const buttons = editor.get();
      if (!buttons.some((b) => b.value.startsWith('join'))) buttons.push({ text: '🎯 报名参与', type: 'callback', value: 'join' });
      $('#cp-preview').innerHTML = preview($('#cp-body').value, buttons, {
        media: $('#cp-media').value.trim(),
        vars: { name: $('#cp-name').value || '秋日创作马拉松', entries: '128', end: dateTime(fromInput($('#cp-end').value)) }
      });
    };
    const syncType = () => {
      $$('[data-ctype]', m.overlay).forEach((el) => { el.style.display = el.dataset.ctype === $('#cp-type').value ? '' : 'none'; });
      paint();
    };
    $('#cp-type').addEventListener('change', syncType);
    ['#cp-name', '#cp-body', '#cp-media', '#cp-end'].forEach((s) => $(s)?.addEventListener('input', paint));
    syncType();
    $('[data-cancel]', m.overlay).onclick = m.close;
    $('[data-save]', m.overlay).onclick = async (e) => {
      const payload = {
        name: $('#cp-name').value.trim(), type: $('#cp-type').value,
        group_ids: $$('.cp-group:checked').map((i) => Number(i.value)),
        start_at: fromInput($('#cp-start').value), end_at: fromInput($('#cp-end').value),
        draw_at: fromInput($('#cp-draw').value), body: $('#cp-body').value.trim(),
        media_url: $('#cp-media').value.trim(), buttons: editor.get(),
        prize_pool: Number($('#cp-prize').value || 0), winners_count: Number($('#cp-winners').value || 1),
        code_count: Number($('#cp-codes').value || 20), code_points: Number($('#cp-codepoints').value || 100)
      };
      if (!payload.name || !payload.body) { toast('请填写活动名称与文案', 'err'); return; }
      busy(e.currentTarget, true);
      try {
        if (isEdit) await api(`/api/campaigns/${c.id}`, { method: 'PUT', body: payload });
        else await api('/api/campaigns', { method: 'POST', body: payload });
        toast(isEdit ? '活动已更新' : '活动已创建'); m.close(); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    };
  }

  async function campaignEntries(id) {
    try {
      const d = await api(`/api/campaigns/${id}/entries`);
      const c = (DATA.campaigns || []).find((x) => x.id === Number(id));
      const redeem = c?.type === 'redeem';
      const entries = d.entries || [], winners = d.winners || [], codes = d.codes || [];
      const m = modal({
        title: c?.name || '活动详情', subtitle: redeem ? '兑换码使用情况' : '报名与中奖名单', wide: true,
        body: redeem ? `<div class="row" style="margin-bottom:12px"><span class="tag tag-violet">${codes.filter((x) => x.status === 'used').length} / ${codes.length} 已使用</span><button class="btn btn-sm" id="copy-codes">复制全部兑换码</button></div>
          <div class="code-grid">${codes.length ? codes.map((x) => `<div class="code-chip ${x.status === 'used' ? 'used' : ''}">${esc(x.code)}</div>`).join('') : '<div class="empty"><p>还没有兑换码</p></div>'}</div>`
        : `<div class="campaign-stats" style="margin-bottom:14px"><div><span>报名人数</span><b>${entries.length}</b></div><div><span>中奖人数</span><b>${winners.length}</b></div><div><span>奖池</span><b>${num(c?.prize_pool || 0)}</b></div></div>
          <div class="table-wrap"><table><thead><tr><th>成员</th><th>群组 ID</th><th>报名时间</th></tr></thead><tbody>
          ${entries.length ? entries.map((e) => `<tr><td><div class="person"><span class="avatar">${esc((e.first_name || e.username || '?').slice(0, 2))}</span><div><strong>${esc(e.first_name || e.username)}</strong><small>@${esc(e.username || '—')}</small></div></div></td><td>${e.group_id}</td><td>${dateTime(e.created_at)}</td></tr>`).join('') : '<tr><td colspan="3"><div class="empty" style="padding:24px"><p>还没有人报名</p></div></td></tr>'}
          </tbody></table></div>${winners.length ? `<div class="row" style="margin-top:14px">${winners.map((w) => `<span class="tag tag-amber">🏅 ${esc(w.username || w.user_id)} +${w.points}</span>`).join('')}</div>` : ''}`,
        footer: `<button class="btn" data-close>关闭</button>`
      });
      $('[data-close]', m.overlay).onclick = m.close;
      $('#copy-codes')?.addEventListener('click', () => copyText(codes.map((x) => x.code).join('\n')));
    } catch (e) { toast(e.message, 'err'); }
  }

  function initCampaigns() {
    $('#new-campaign-btn')?.addEventListener('click', () => openCampaignEditor(null));
    $$('[data-campaign]').forEach((card) => {
      const find = () => (DATA.campaigns || []).find((c) => c.id === Number(card.dataset.campaign));
      card.querySelector('[data-edit]')?.addEventListener('click', () => openCampaignEditor(find()));
      card.querySelector('[data-view]')?.addEventListener('click', () => campaignEntries(card.dataset.campaign));
      card.querySelector('[data-publish]')?.addEventListener('click', async (e) => {
        if (!await confirmBox({ title: '发布活动', message: '将把活动卡片发送到目标群组。', confirmText: '发布活动', danger: false })) return;
        busy(e.currentTarget, true);
        try { const r = await api(`/api/campaigns/${card.dataset.campaign}/publish`, { method: 'POST', body: {} }); toast(`已发布到 ${r.sent} 个群组`); setTimeout(() => location.reload(), 400); }
        catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      });
      card.querySelector('[data-draw]')?.addEventListener('click', async (e) => {
        if (!await confirmBox({ title: '立即开奖', message: '将随机抽取中奖者并自动发放积分，操作不可撤销。', confirmText: '确认开奖' })) return;
        busy(e.currentTarget, true);
        try { const w = await api(`/api/campaigns/${card.dataset.campaign}/draw`, { method: 'POST', body: {} }); toast(`开奖完成，${w.length} 位中奖者`); setTimeout(() => location.reload(), 450); }
        catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      });
      card.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除活动', message: '报名记录与兑换码会一并删除，已发放积分不回收。', confirmText: '删除活动' })) return;
        try { await api(`/api/campaigns/${card.dataset.campaign}`, { method: 'DELETE' }); card.remove(); toast('活动已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 广告管理 ----------------------------- */
  function openAdEditor(ad) {
    const isEdit = !!ad;
    const m = modal({
      title: isEdit ? '编辑广告位' : '新建广告位', subtitle: '按时段轮播，把推广放在合适的位置', wide: true,
      body: `<div class="editor-layout"><div class="editor-form">
        <div class="field-row"><label class="field"><span>广告名称</span><input id="ad-name" value="${esc(ad?.name || '')}" placeholder="摄影进阶课"></label>
          <label class="field"><span>投放群组</span><select id="ad-group">${groupOptions(DATA.groups, ad?.group_id || 0)}</select></label></div>
        <label class="field"><span>广告文案</span><textarea id="ad-body" rows="6">${esc(ad?.body || STARTER.ad)}</textarea></label>
        <div class="field"><span>按钮</span><div id="ad-buttons"></div></div>
        <div class="field-row"><label class="field"><span>开始时间 <em>可选</em></span><input type="datetime-local" id="ad-start" value="${ad?.start_at ? toInput(ad.start_at) : ''}"></label>
          <label class="field"><span>结束时间 <em>可选</em></span><input type="datetime-local" id="ad-end" value="${ad?.end_at ? toInput(ad.end_at) : ''}"></label></div>
        <div class="field-row"><label class="field"><span>轮播间隔（分钟）</span><input type="number" id="ad-interval" min="5" value="${ad?.interval_minutes || 720}"></label>
          <label class="field"><span>保存后</span><select id="ad-status"><option value="paused"${!ad || ad.status !== 'active' ? ' selected' : ''}>暂停</option><option value="active"${ad?.status === 'active' ? ' selected' : ''}>立即启用</option></select></label></div>
        <label class="field"><span>图片地址 <em>可选</em></span><input id="ad-media" value="${esc(ad?.media_url || '')}" placeholder="https://…"></label>
      </div><div class="editor-preview"><div class="preview-label"><span>LIVE PREVIEW</span><span class="tag tag-cyan">Ad</span></div><div id="ad-preview"></div></div></div>`,
      footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${isEdit ? '保存修改' : '创建广告'}</button>`
    });
    let paint = () => {};
    const editor = buttonEditor($('#ad-buttons'), ad?.buttons || [], () => paint());
    paint = () => { $('#ad-preview').innerHTML = preview($('#ad-body').value, editor.get(), { media: $('#ad-media').value.trim() }); };
    $('#ad-body').addEventListener('input', paint);
    $('#ad-media').addEventListener('input', paint);
    paint();
    $('[data-cancel]', m.overlay).onclick = m.close;
    $('[data-save]', m.overlay).onclick = async (e) => {
      const payload = {
        name: $('#ad-name').value.trim(), group_id: Number($('#ad-group').value), body: $('#ad-body').value.trim(),
        media_url: $('#ad-media').value.trim(), buttons: editor.get(),
        start_at: fromInput($('#ad-start').value), end_at: fromInput($('#ad-end').value),
        interval_minutes: Number($('#ad-interval').value || 720), status: $('#ad-status').value
      };
      if (!payload.name || !payload.body) { toast('请填写广告名称与文案', 'err'); return; }
      busy(e.currentTarget, true);
      try {
        if (isEdit) await api(`/api/ads/${ad.id}`, { method: 'PUT', body: payload });
        else await api('/api/ads', { method: 'POST', body: payload });
        toast(isEdit ? '广告已更新' : '广告已创建'); m.close(); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    };
  }

  function initAds() {
    $('#new-ad-btn')?.addEventListener('click', () => openAdEditor(null));
    $$('[data-ad]').forEach((card) => {
      const find = () => (DATA.ads || []).find((a) => a.id === Number(card.dataset.ad));
      card.querySelector('[data-edit]')?.addEventListener('click', () => openAdEditor(find()));
      card.querySelector('[data-toggle]')?.addEventListener('click', async () => {
        try { const r = await api(`/api/ads/${card.dataset.ad}/toggle`, { method: 'POST', body: {} }); toast(r.status === 'active' ? '广告已启用' : '广告已暂停'); setTimeout(() => location.reload(), 300); }
        catch (e) { toast(e.message, 'err'); }
      });
      card.querySelector('[data-send]')?.addEventListener('click', async (e) => {
        if (!await confirmBox({ title: '立即投放', message: '将立即向目标群组发送这条广告。', confirmText: '立即投放', danger: false })) return;
        busy(e.currentTarget, true);
        try { const r = await api(`/api/ads/${card.dataset.ad}/send`, { method: 'POST', body: {} }); toast(`已投放到 ${r.sent} 个群组`); setTimeout(() => location.reload(), 400); }
        catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      });
      card.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除广告', message: '删除后不再轮播。', confirmText: '删除' })) return;
        try { await api(`/api/ads/${card.dataset.ad}`, { method: 'DELETE' }); card.remove(); toast('广告已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 广告拦截 ----------------------------- */
  function initAntispam() {
    $('#antispam-group')?.addEventListener('change', (e) => { location.href = `/antispam?group=${e.target.value}`; });
    const form = $('#antispam-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!DATA.selected) return;
      const btn = $('#antispam-save');
      busy(btn, true);
      try {
        DATA.settings = await api(`/api/groups/${DATA.selected.id}/settings`, { method: 'PUT', body: readSettings(form) });
        toast('拦截规则已保存');
      } catch (ex) { toast(ex.message, 'err'); }
      busy(btn, false);
    });
  }

  /* ----------------------------- 机器人账号 ----------------------------- */
  function initBots() {
    const add = () => {
      const m = modal({
        title: '添加机器人账号', subtitle: '使用 @BotFather 创建的 Token；每个机器人独立轮询',
        body: `<label class="field"><span>备注名称</span><input id="nb-name" placeholder="例如：摄影群小助手"></label>
          <label class="field"><span>Bot Token</span><input type="password" id="nb-token" placeholder="123456789:AA..."></label>
          <div class="field-hint">Token 会加密保存在本机数据库；保存后会立即调用 getMe 校验并启动轮询。</div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>验证并添加</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          await api('/api/bots', { method: 'POST', body: { name: $('#nb-name').value.trim(), token: $('#nb-token').value.trim() } });
          toast('机器人已添加并开始轮询'); m.close(); setTimeout(() => location.reload(), 500);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#new-bot-account')?.addEventListener('click', add);
    $('#new-bot-account-2')?.addEventListener('click', add);
    $$('[data-bot-reconnect]').forEach((b) => b.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      const card = b.closest('[data-bot-account]');
      try { await api(`/api/bots/${card.dataset.botAccount}/reconnect`, { method: 'POST', body: {} }); toast('已重连'); setTimeout(() => location.reload(), 400); }
      catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    }));
    $$('[data-bot-delete]').forEach((b) => b.addEventListener('click', async () => {
      const card = b.closest('[data-bot-account]');
      if (!await confirmBox({ title: '删除机器人账号', message: '该机器人绑定的群组配置会一并删除，且无法恢复。确定吗？', confirmText: '删除' })) return;
      try { await api(`/api/bots/${card.dataset.botAccount}`, { method: 'DELETE' }); card.remove(); toast('机器人已删除'); }
      catch (e) { toast(e.message, 'err'); }
    }));
  }

  /* ----------------------------- 备份 ----------------------------- */
  function initBackup() {
    $('#backup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#backup-file');
      if (!input.files?.length) { toast('请选择备份文件', 'err'); return; }
      const btn = $('#backup-upload');
      const fd = new FormData();
      fd.append('file', input.files[0]);
      busy(btn, true);
      try {
        const res = await fetch('/api/backup/restore', { method: 'POST', body: fd, headers: { 'X-CSRF-Token': DATA.csrf } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || '上传失败');
        toast('备份已上传，重启服务后生效');
        setTimeout(() => location.reload(), 600);
      } catch (ex) { toast(ex.message, 'err'); busy(btn, false); }
    });
  }

  /* ----------------------------- 工单 ----------------------------- */
  function initTickets() {
    $$('[data-ticket-reply]').forEach((b) => b.addEventListener('click', () => {
      const t = (DATA.tickets || []).find((x) => x.id === Number(b.dataset.ticketReply));
      if (!t) return;
      const m = modal({
        title: `回复工单 #${t.id}`, subtitle: t.subject,
        body: `<div class="code-block" style="white-space:pre-wrap;margin-bottom:14px">${esc(t.body)}</div>
          <label class="field"><span>回复内容 <em>会私聊发送给提交人</em></span><textarea id="tk-reply" rows="5" placeholder="说明处理结果…"></textarea></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>发送回复</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        const reply = $('#tk-reply').value.trim();
        if (!reply) { toast('请输入回复内容', 'err'); return; }
        busy(e.currentTarget, true);
        try {
          const r = await api(`/api/tickets/${t.id}/reply`, { method: 'POST', body: { reply } });
          toast(r.dm_sent ? '回复已发送' : '回复已保存，但私聊发送失败，请确认对方已启动机器人');
          m.close(); setTimeout(() => location.reload(), 500);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    }));
    $$('[data-ticket-close]').forEach((b) => b.addEventListener('click', async () => {
      if (!await confirmBox({ title: '关闭工单', message: '关闭后仍会保留记录。', confirmText: '关闭' })) return;
      try { await api(`/api/tickets/${b.dataset.ticketClose}/close`, { method: 'POST', body: {} }); toast('工单已关闭'); setTimeout(() => location.reload(), 300); }
      catch (e) { toast(e.message, 'err'); }
    }));
  }

  /* ----------------------------- 开放平台 ----------------------------- */
  function initDeveloper() {
    $('#new-api-key')?.addEventListener('click', () => {
      const m = modal({
        title: '新建 API Key', subtitle: 'Token 只会展示一次，请立即保存', narrow: true,
        body: `<label class="field"><span>用途备注</span><input id="ak-name" placeholder="例如：CRM 同步"></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>生成 Key</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const r = await api('/api/api-keys', { method: 'POST', body: { name: $('#ak-name').value.trim() } });
          const token = r.token;
          m.close();
          const t = modal({
            title: 'API Key 已生成', subtitle: '关闭后将无法再次查看完整 Token',
            body: `<div class="code-block" style="font-size:12px;word-break:break-all">${esc(token)}</div>
              <div class="row" style="margin-top:14px"><button class="btn btn-sm" id="copy-api-token">复制 Token</button><span class="tiny muted">请保存到密码管理器</span></div>`,
            footer: `<button class="btn btn-primary" data-close>我已保存</button>`
          });
          $('#copy-api-token', t.overlay).onclick = () => copyText(token);
          $('[data-close]', t.overlay).onclick = () => { t.close(); location.reload(); };
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    });
    $$('[data-key-delete]').forEach((b) => b.addEventListener('click', async () => {
      if (!await confirmBox({ title: '删除 API Key', message: '使用这个 Key 的集成会立即失效。', confirmText: '删除 Key' })) return;
      try { await api(`/api/api-keys/${b.dataset.keyDelete}`, { method: 'DELETE' }); b.closest('tr').remove(); toast('API Key 已删除'); }
      catch (e) { toast(e.message, 'err'); }
    }));
    $$('[data-key-toggle]').forEach((b) => b.addEventListener('click', async () => {
      try { await api(`/api/api-keys/${b.dataset.keyToggle}/toggle`, { method: 'POST', body: { active: b.dataset.active !== '1' } }); toast('状态已更新'); setTimeout(() => location.reload(), 300); }
      catch (e) { toast(e.message, 'err'); }
    }));

    const hookEditor = (h) => {
      const edit = !!h;
      const m = modal({
        title: edit ? '编辑 Webhook' : '新建 Webhook', subtitle: '外部服务接收 JSON 事件，可用 HMAC 校验签名',
        body: `<div class="field-row"><label class="field"><span>名称</span><input id="wh-name" value="${esc(h?.name || '')}" placeholder="CRM 同步"></label>
          <label class="field"><span>状态</span><select id="wh-status"><option value="active"${!h || h.status === 'active' ? ' selected' : ''}>启用</option><option value="paused"${h?.status === 'paused' ? ' selected' : ''}>暂停</option></select></label></div>
          <label class="field"><span>URL</span><input id="wh-url" value="${esc(h?.url || '')}" placeholder="https://example.com/webhook"></label>
          <label class="field"><span>事件 <em>逗号分隔，留空为全部</em></span><input id="wh-events" value="${esc(h?.events || '')}" placeholder="member.joined,checkin.completed"></label>
          <label class="field"><span>签名 Secret <em>可选</em></span><input id="wh-secret" value="${esc(h?.secret || '')}" placeholder="用于 HMAC-SHA256"></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '创建'}</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        const payload = {
          name: $('#wh-name').value.trim(), url: $('#wh-url').value.trim(),
          events: $('#wh-events').value.trim(), secret: $('#wh-secret').value.trim(), status: $('#wh-status').value
        };
        try {
          if (edit) await api(`/api/webhooks/${h.id}`, { method: 'PUT', body: payload });
          else await api('/api/webhooks', { method: 'POST', body: payload });
          toast(edit ? 'Webhook 已更新' : 'Webhook 已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#new-webhook')?.addEventListener('click', () => hookEditor(null));
    $$('[data-hook-edit]').forEach((b) => b.addEventListener('click', () => {
      const h = (DATA.webhooks || []).find((x) => x.id === Number(b.dataset.hookEdit));
      if (h) hookEditor(h);
    }));
    $$('[data-hook-test]').forEach((b) => b.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      try { await api(`/api/webhooks/${b.dataset.hookTest}/test`, { method: 'POST', body: {} }); toast('测试事件已发送'); }
      catch (ex) { toast(ex.message, 'err'); }
      busy(e.currentTarget, false);
    }));
    $$('[data-hook-delete]').forEach((b) => b.addEventListener('click', async () => {
      if (!await confirmBox({ title: '删除 Webhook', message: '删除后不再推送事件。', confirmText: '删除' })) return;
      try { await api(`/api/webhooks/${b.dataset.hookDelete}`, { method: 'DELETE' }); b.closest('tr').remove(); toast('Webhook 已删除'); }
      catch (e) { toast(e.message, 'err'); }
    }));
  }

  /* ----------------------------- 数字商品 ----------------------------- */
  function initStars() {
    const editor = (p) => {
      const edit = !!p;
      const mode = p?.delivery_mode || 'content';
      const m = modal({
        title: edit ? '编辑数字商品' : '新建数字商品', subtitle: '固定内容、一次性卡密或重复卡密，按商品选择', wide: true,
        body: `<label class="field"><span>商品名称</span><input id="sp-name" value="${esc(p?.name || '')}" placeholder="例如：会员月卡"></label>
          <label class="field"><span>商品说明</span><textarea id="sp-desc" rows="2">${esc(p?.description || '')}</textarea></label>
          <div class="field-row-3">
            <label class="field"><span>价格（Stars）</span><input type="number" id="sp-price" value="${p?.price_stars ?? 50}" min="1"></label>
            <label class="field"><span>发放模式</span><select id="sp-mode">
              <option value="content"${mode === 'content' ? ' selected' : ''}>固定内容（可重复）</option>
              <option value="code_once"${mode === 'code_once' ? ' selected' : ''}>一次性卡密池</option>
              <option value="code_reuse"${mode === 'code_reuse' ? ' selected' : ''}>重复卡密/口令</option>
            </select></label>
            <label class="field"><span>状态</span><select id="sp-status"><option value="active"${!p || p.status === 'active' ? ' selected' : ''}>在售</option><option value="paused"${p?.status === 'paused' ? ' selected' : ''}>下架</option></select></label>
          </div>
          <div class="field-row">
            <label class="field"><span>排序权重</span><input type="number" id="sp-sort" value="${p?.sort ?? 0}"></label>
            <label class="field"><span>卡密池剩余</span><input value="${p?.code_unused ?? 0} / ${p?.code_total ?? 0}" disabled></label>
          </div>
          <label class="field"><span id="sp-content-label">支付成功后发放的内容</span><textarea id="sp-content" rows="4" placeholder="固定内容 / 重复卡密；一次性卡密商品可留空">${esc(p?.content || '')}</textarea>
            <small class="field-hint" id="sp-content-hint">会通过机器人私聊发给买家；一次性卡密会从卡密池分配。</small>
          </label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '创建商品'}</button>`
      });
      const syncMode = () => {
        const v = $('#sp-mode').value;
        const label = $('#sp-content-label');
        const hint = $('#sp-content-hint');
        if (v === 'code_once') {
          label.textContent = '备用说明（可留空）';
          hint.textContent = '支付成功后从「卡密」池原子分配一条未使用卡密，发完即止。';
        } else if (v === 'code_reuse') {
          label.textContent = '重复卡密 / 通用口令';
          hint.textContent = '所有买家都会收到这段相同内容，可重复使用。';
        } else {
          label.textContent = '支付成功后发放的内容';
          hint.textContent = '每次支付都发送相同内容，可重复使用。';
        }
      };
      $('#sp-mode', m.overlay).addEventListener('change', syncMode);
      syncMode();
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const payload = {
            name: $('#sp-name').value.trim(), description: $('#sp-desc').value.trim(),
            price_stars: Number($('#sp-price').value || 0), content: $('#sp-content').value.trim(),
            delivery_mode: $('#sp-mode').value, status: $('#sp-status').value, sort: Number($('#sp-sort').value || 0)
          };
          if (edit) await api(`/api/stars/products/${p.id}`, { method: 'PUT', body: payload });
          else await api('/api/stars/products', { method: 'POST', body: payload });
          toast(edit ? '商品已更新' : '商品已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };

    const openCodes = async (p) => {
      const m = modal({
        title: `卡密池 · ${p.name}`, subtitle: '每条卡密只会被发放一次', wide: true,
        body: `<div id="code-panel">加载中…</div>`,
        footer: `<button class="btn" data-close>关闭</button>`
      });
      $('[data-close]', m.overlay).onclick = m.close;
      const render = async () => {
        const wrap = $('#code-panel', m.overlay);
        try {
          const r = await api(`/api/stars/products/${p.id}/codes`);
          const codes = r.codes || [];
          wrap.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="small muted">剩余 <b>${r.unused}</b> / 共 ${codes.length}</span></div>
            <label class="field"><span>批量导入卡密 <em>每行一条，自动去重</em></span><textarea id="code-input" rows="4" placeholder="CODE-001&#10;CODE-002"></textarea></label>
            <button class="btn btn-primary" id="code-add" style="width:100%;margin-bottom:14px">导入卡密</button>
            <div class="table-wrap"><table><thead><tr><th>卡密</th><th>状态</th><th>订单</th><th></th></tr></thead><tbody>
              ${codes.length ? codes.map((c) => `<tr><td><code>${esc(c.code)}</code></td><td>${c.status === 'unused' ? '<span class="tag tag-emerald">未使用</span>' : '<span class="tag tag-muted">已使用</span>'}</td><td class="tiny">${c.order_id ? '#' + c.order_id : '—'}</td><td><button class="btn btn-sm btn-ghost" data-code-del="${c.id}" style="color:var(--rose)">删除</button></td></tr>`).join('') : '<tr><td colspan="4"><div class="empty" style="padding:20px"><p>还没有卡密</p></div></td></tr>'}
            </tbody></table></div>`;
          $('#code-add', m.overlay).onclick = async (e) => {
            busy(e.currentTarget, true);
            try {
              const res = await api(`/api/stars/products/${p.id}/codes`, { method: 'POST', body: { codes: $('#code-input').value } });
              toast(`已导入 ${res.added} 条卡密`); await render();
            } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
          };
          $$('[data-code-del]', m.overlay).forEach((b) => b.addEventListener('click', async () => {
            if (!await confirmBox({ title: '删除卡密', message: '删除后无法恢复。', confirmText: '删除' })) return;
            try { await api(`/api/stars/codes/${b.dataset.codeDel}`, { method: 'DELETE' }); await render(); } catch (e2) { toast(e2.message, 'err'); }
          }));
        } catch (ex) { wrap.innerHTML = `<div class="empty" style="padding:20px"><p>${esc(ex.message)}</p></div>`; }
      };
      await render();
    };

    $('#new-star-product')?.addEventListener('click', () => editor(null));
    $('#new-star-product-2')?.addEventListener('click', () => editor(null));
    $$('[data-star-product]').forEach((card) => {
      const p = (DATA.products || []).find((x) => x.id === Number(card.dataset.starProduct));
      card.querySelector('[data-star-edit]')?.addEventListener('click', () => p && editor(p));
      card.querySelector('[data-star-codes]')?.addEventListener('click', () => p && openCodes(p));
      card.querySelector('[data-star-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除数字商品', message: '历史订单会保留，商品从商店移除。', confirmText: '删除商品' })) return;
        try { await api(`/api/stars/products/${card.dataset.starProduct}`, { method: 'DELETE' }); card.remove(); toast('商品已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 模板市场 ----------------------------- */
  function initMarket() {
    $$('[data-install-pack]').forEach((b) => b.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      try {
        const r = await api('/api/market/install', { method: 'POST', body: { pack_id: b.dataset.installPack } });
        toast(`已安装 ${r.installed} 个模板`); setTimeout(() => location.reload(), 450);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    }));
    $('#market-import')?.addEventListener('click', async (e) => {
      let parsed;
      try { parsed = JSON.parse($('#market-json').value); } catch (err) { toast('JSON 格式有误', 'err'); return; }
      const templates = Array.isArray(parsed) ? parsed : parsed.templates;
      if (!Array.isArray(templates) || !templates.length) { toast('没有找到 templates 数组', 'err'); return; }
      busy(e.currentTarget, true);
      try {
        const r = await api('/api/market/import', { method: 'POST', body: { templates } });
        toast(`已导入 ${r.imported} 个模板`); setTimeout(() => location.reload(), 450);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    });
  }

  /* ----------------------------- 会员计划 ----------------------------- */
  function initMemberships() {
    const editor = (p) => {
      const edit = !!p;
      const m = modal({
        title: edit ? '编辑会员计划' : '新建会员计划', subtitle: '用 Telegram Stars 售卖会员时长', wide: true,
        body: `<div class="field-row"><label class="field"><span>计划名称</span><input id="mp-name" value="${esc(p?.name || '')}" placeholder="月卡会员"></label>
          <label class="field"><span>状态</span><select id="mp-status"><option value="active"${!p || p.status === 'active' ? ' selected' : ''}>在售</option><option value="paused"${p?.status === 'paused' ? ' selected' : ''}>下架</option></select></label></div>
          <label class="field"><span>计划说明</span><textarea id="mp-desc" rows="2">${esc(p?.description || '')}</textarea></label>
          <div class="field-row-3"><label class="field"><span>价格（Stars）</span><input type="number" id="mp-price" value="${p?.price_stars ?? 100}" min="1"></label>
          <label class="field"><span>时长（天）</span><input type="number" id="mp-days" value="${p?.days ?? 30}" min="1"></label>
          <label class="field"><span>排序</span><input type="number" id="mp-sort" value="${p?.sort ?? 0}"></label></div>
          <label class="field"><span>会员权益</span><textarea id="mp-benefits" rows="3" placeholder="专属活动 / 资料包 / 群内标识">${esc(p?.benefits || '')}</textarea></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '创建计划'}</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        const payload = {
          name: $('#mp-name').value.trim(), description: $('#mp-desc').value.trim(),
          price_stars: Number($('#mp-price').value || 0), days: Number($('#mp-days').value || 30),
          benefits: $('#mp-benefits').value.trim(), status: $('#mp-status').value, sort: Number($('#mp-sort').value || 0)
        };
        try {
          if (edit) await api(`/api/memberships/plans/${p.id}`, { method: 'PUT', body: payload });
          else await api('/api/memberships/plans', { method: 'POST', body: payload });
          toast(edit ? '计划已更新' : '计划已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#new-membership-plan')?.addEventListener('click', () => editor(null));
    $('#new-membership-plan-2')?.addEventListener('click', () => editor(null));
    $$('[data-plan]').forEach((card) => {
      const p = (DATA.plans || []).find((x) => x.id === Number(card.dataset.plan));
      card.querySelector('[data-plan-edit]')?.addEventListener('click', () => p && editor(p));
      card.querySelector('[data-plan-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除会员计划', message: '历史会员与订单会保留。', confirmText: '删除计划' })) return;
        try { await api(`/api/memberships/plans/${card.dataset.plan}`, { method: 'DELETE' }); card.remove(); toast('计划已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 邀请裂变 ----------------------------- */
  function initInvites() {
    $('#invite-settings')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/api/invites/settings', { method: 'PUT', body: { reward: Number($('#invite-reward').value || 0) } });
        toast('邀请奖励已保存');
      } catch (ex) { toast(ex.message, 'err'); }
    });
  }

  /* ----------------------------- 周报告警 ----------------------------- */
  function initReports() {
    $('#generate-report')?.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      try {
        const r = await api('/api/reports/generate', { method: 'POST', body: { group_id: 0 } });
        toast(r.sent ? '周报已生成并推送' : '周报已生成'); setTimeout(() => location.reload(), 500);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    });
    $('#report-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#report-save');
      busy(btn, true);
      try {
        await api('/api/reports/settings', { method: 'PUT', body: {
          report_chat: $('#report-chat').value.trim(),
          alert_join: Number($('#alert-join').value || 30),
          alert_spam: Number($('#alert-spam').value || 10),
          alert_on: $('#alert-on').checked
        } });
        toast('周报设置已保存'); busy(btn, false);
      } catch (ex) { toast(ex.message, 'err'); busy(btn, false); }
    });
    $$('[data-alert-close]').forEach((b) => b.addEventListener('click', async () => {
      try { await api(`/api/alerts/${b.dataset.alertClose}/close`, { method: 'POST', body: {} }); b.closest('tr').remove(); toast('告警已关闭'); }
      catch (e) { toast(e.message, 'err'); }
    }));
  }

  /* ----------------------------- 团队 ----------------------------- */
  function initTeam() {
    $('#new-admin')?.addEventListener('click', () => {
      const m = modal({
        title: '邀请团队成员', subtitle: '为成员分配角色，不要共享 owner 密码',
        body: `<div class="field-row"><label class="field"><span>用户名</span><input id="tm-username" placeholder="ops_kai"></label>
          <label class="field"><span>显示名称</span><input id="tm-display" placeholder="Kai"></label></div>
          <div class="field-row"><label class="field"><span>角色</span><select id="tm-role">
            <option value="admin">Admin · 日常运营</option>
            <option value="operator" selected>Operator · 内容与工单</option>
            <option value="viewer">Viewer · 只读</option>
          </select></label><label class="field"><span>初始密码</span><input type="password" id="tm-password" placeholder="至少 8 位"></label></div>
          <div class="field-hint">成员创建后可以自行在「系统设置」修改密码。</div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>创建成员</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          await api('/api/admins', { method: 'POST', body: {
            username: $('#tm-username').value.trim(), display_name: $('#tm-display').value.trim(),
            role: $('#tm-role').value, password: $('#tm-password').value
          } });
          toast('成员已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    });
    $$('[data-admin]').forEach((row) => {
      const id = Number(row.dataset.admin);
      row.querySelector('[data-role-select]')?.addEventListener('change', async (e) => {
        try {
          await api(`/api/admins/${id}`, { method: 'PUT', body: { display_name: row.querySelector('.person strong').textContent, role: e.target.value } });
          toast('角色已更新'); setTimeout(() => location.reload(), 300);
        } catch (ex) { toast(ex.message, 'err'); e.target.value = e.target.dataset.previous || e.target.value; }
      });
      row.querySelector('[data-reset-password]')?.addEventListener('click', () => {
        const m = modal({
          title: '重置密码', subtitle: '重置后请通过安全渠道告知成员', narrow: true,
          body: `<label class="field"><span>新密码</span><input type="password" id="tm-newpass" placeholder="至少 8 位"></label>`,
          footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>重置密码</button>`
        });
        $('[data-cancel]', m.overlay).onclick = m.close;
        $('[data-save]', m.overlay).onclick = async (e) => {
          busy(e.currentTarget, true);
          try { await api(`/api/admins/${id}/password`, { method: 'POST', body: { password: $('#tm-newpass').value } }); toast('密码已重置'); m.close(); }
          catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
        };
      });
      row.querySelector('[data-admin-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除成员', message: '该成员会立即失去访问权限。', confirmText: '删除成员' })) return;
        try { await api(`/api/admins/${id}`, { method: 'DELETE' }); row.remove(); toast('成员已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 自动化 ----------------------------- */
  function initAutomations() {
    const editor = (au) => {
      const edit = !!au;
      let conditions = {};
      let actions = [];
      try { conditions = JSON.parse(au?.conditions || '{}'); } catch (e) { conditions = {}; }
      try { actions = JSON.parse(au?.actions || '[]'); } catch (e) { actions = []; }
      if (!Array.isArray(actions) || !actions.length) actions = [{ type: 'message', text: '' }];
      const actionLabels = { message: '发送消息', points: '增加积分', mute: '禁言', kick: '踢出', blacklist: '加入黑名单', webhook: '触发 Webhook' };
      const m = modal({
        title: edit ? '编辑自动化' : '新建自动化', subtitle: '当触发条件满足时，按顺序执行动作', wide: true,
        body: `<div class="field-row">
            <label class="field"><span>规则名称</span><input id="au-name" value="${esc(au?.name || '')}" placeholder="例如：退款关键词转工单"></label>
            <label class="field"><span>适用群组</span><select id="au-group">${groupOptions(DATA.groups, au?.group_id || 0)}</select></label>
          </div>
          <div class="field-row-3">
            <label class="field"><span>触发条件</span><select id="au-trigger">
              <option value="join"${!au || au.trigger === 'join' ? ' selected' : ''}>成员入群</option>
              <option value="message"${au?.trigger === 'message' ? ' selected' : ''}>群内发言</option>
              <option value="checkin"${au?.trigger === 'checkin' ? ' selected' : ''}>完成签到</option>
              <option value="ticket"${au?.trigger === 'ticket' ? ' selected' : ''}>提交工单</option>
            </select></label>
            <label class="field"><span>关键词 <em>可选</em></span><input id="au-keyword" value="${esc(conditions.keyword || '')}" placeholder="退款 / 广告"></label>
            <label class="field"><span>最低积分 <em>可选</em></span><input type="number" id="au-minpoints" value="${conditions.min_points || 0}" min="0"></label>
          </div>
          <div class="field-row">
            <label class="field"><span>触发角色</span><select id="au-role">
              <option value=""${!conditions.role ? ' selected' : ''}>所有人</option>
              <option value="member"${conditions.role === 'member' ? ' selected' : ''}>仅普通成员</option>
              <option value="admin"${conditions.role === 'admin' ? ' selected' : ''}>仅管理员</option>
            </select></label>
            <label class="field"><span>规则状态</span><select id="au-status"><option value="active"${!au || au.status === 'active' ? ' selected' : ''}>启用</option><option value="paused"${au?.status === 'paused' ? ' selected' : ''}>暂停</option></select></label>
          </div>
          <div class="field"><span>动作（按顺序执行）</span><div id="au-actions" class="auto-actions"></div>
            <button type="button" class="btn btn-sm" id="au-add-action" style="margin-top:8px">＋ 添加动作</button>
          </div>
          <div class="field-hint">动作会在机器人收到事件时执行；发送消息时支持 {name}、{mention}、{group}、{points} 等变量。</div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存规则' : '创建规则'}</button>`
      });
      const renderActions = () => {
        const wrap = $('#au-actions', m.overlay);
        wrap.innerHTML = actions.map((a, i) => {
          const fields = [];
          if (a.type === 'message') fields.push(`<textarea data-field="text" rows="2" placeholder="发送内容，支持变量">${esc(a.text || '')}</textarea>`);
          if (a.type === 'points') fields.push(`<input type="number" data-field="points" value="${a.points || 5}" placeholder="积分" style="max-width:100px">`);
          if (a.type === 'mute') fields.push(`<input type="number" data-field="minutes" value="${a.minutes || 10}" placeholder="分钟" style="max-width:100px">`);
          if (a.type === 'webhook') fields.push(`<input data-field="event" value="${esc(a.event || 'automation.triggered')}" placeholder="事件名">`);
          if (a.type === 'blacklist' || a.type === 'kick') fields.push(`<input data-field="detail" value="${esc(a.detail || '')}" placeholder="原因（可选）">`);
          return `<div class="auto-action" data-index="${i}">
            <select data-field="type">${Object.entries(actionLabels).map(([k, v]) => `<option value="${k}"${a.type === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
            ${fields.join('')}
            <button type="button" class="icon-btn" data-remove title="删除动作">✕</button>
          </div>`;
        }).join('');
        const bindField = (el) => {
          const sync = () => {
            const row = el.closest('.auto-action');
            const a = actions[Number(row.dataset.index)];
            const field = el.dataset.field;
            if (field === 'type') {
              a.type = el.value;
              a.text = ''; a.points = 5; a.minutes = 10; a.event = 'automation.triggered'; a.detail = '';
              renderActions();
              return;
            }
            a[field] = el.type === 'number' ? Number(el.value) : el.value;
          };
          el.addEventListener('input', sync);
          if (el.tagName === 'SELECT') el.addEventListener('change', sync);
        };
        $$('[data-field]', wrap).forEach(bindField);
        $$('[data-remove]', wrap).forEach((b) => b.addEventListener('click', () => {
          actions.splice(Number(b.closest('.auto-action').dataset.index), 1);
          if (!actions.length) actions.push({ type: 'message', text: '' });
          renderActions();
        }));
      };
      renderActions();
      $('#au-add-action', m.overlay).onclick = () => { actions.push({ type: 'message', text: '' }); renderActions(); };
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        const payload = {
          name: $('#au-name').value.trim(), group_id: Number($('#au-group').value),
          trigger: $('#au-trigger').value, status: $('#au-status').value,
          conditions: JSON.stringify({
            keyword: $('#au-keyword').value.trim(),
            min_points: Number($('#au-minpoints').value || 0),
            role: $('#au-role').value
          }),
          actions: JSON.stringify(actions.filter((a) => a.type))
        };
        try {
          if (edit) await api(`/api/automations/${au.id}`, { method: 'PUT', body: payload });
          else await api('/api/automations', { method: 'POST', body: payload });
          toast(edit ? '规则已更新' : '规则已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#new-automation')?.addEventListener('click', () => editor(null));
    $('#new-automation-2')?.addEventListener('click', () => editor(null));
    $$('[data-automation]').forEach((card) => {
      const au = (DATA.automations || []).find((x) => x.id === Number(card.dataset.automation));
      card.querySelector('[data-auto-edit]')?.addEventListener('click', () => au && editor(au));
      card.querySelector('[data-auto-toggle]')?.addEventListener('click', async () => {
        try {
          await api(`/api/automations/${card.dataset.automation}/toggle`, { method: 'POST', body: { status: au?.status === 'active' ? 'paused' : 'active' } });
          toast('规则状态已更新'); setTimeout(() => location.reload(), 300);
        } catch (e) { toast(e.message, 'err'); }
      });
      card.querySelector('[data-auto-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除自动化', message: '规则删除后不可恢复。', confirmText: '删除规则' })) return;
        try { await api(`/api/automations/${card.dataset.automation}`, { method: 'DELETE' }); card.remove(); toast('规则已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- AI 助手 ----------------------------- */
  function initAI() {
    $('#ai-group')?.addEventListener('change', (e) => { location.href = `/ai?group=${e.target.value}`; });
    $('#ai-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#ai-save');
      busy(btn, true);
      try {
        await api('/api/ai', { method: 'PUT', body: {
          enabled: $('#ai-enabled').checked,
          capture: $('#ai-capture').checked,
          base_url: $('#ai-base').value.trim(),
          model: $('#ai-model').value.trim(),
          api_key: $('#ai-key').value.trim(),
          system_prompt: $('#ai-system').value.trim(),
          summary_prompt: $('#ai-summary-prompt').value.trim()
        } });
        toast('AI 配置已保存');
        setTimeout(() => location.reload(), 400);
      } catch (ex) { toast(ex.message, 'err'); busy(btn, false); }
    });
    $('#ai-test')?.addEventListener('click', async (e) => {
      const q = $('#ai-question').value.trim();
      if (!q) { toast('请先输入测试问题', 'err'); return; }
      const out = $('#ai-output');
      out.style.display = 'block'; out.textContent = '思考中…';
      busy(e.currentTarget, true);
      try {
        const r = await api('/api/ai/test', { method: 'POST', body: { message: q } });
        out.textContent = r.answer;
      } catch (ex) { out.textContent = '❌ ' + ex.message; }
      busy(e.currentTarget, false);
    });
    $('#ai-summary')?.addEventListener('click', async (e) => {
      if (!DATA.selected) return;
      const out = $('#ai-output');
      out.style.display = 'block'; out.textContent = '正在阅读群聊…';
      busy(e.currentTarget, true);
      try {
        const r = await api('/api/ai/summary', { method: 'POST', body: { group_id: DATA.selected.id, limit: 120 } });
        out.textContent = r.summary;
      } catch (ex) { out.textContent = '❌ ' + ex.message; }
      busy(e.currentTarget, false);
    });

    const knowledgeEditor = (k) => {
      const edit = !!k;
      const m = modal({
        title: edit ? '编辑知识' : '新增知识', subtitle: 'AI 会优先参考这些内容；不要放敏感个人信息', wide: true,
        body: `<div class="field-row"><label class="field"><span>标题</span><input id="kb-title" value="${esc(k?.title || '')}" placeholder="例如：课程退款规则"></label>
          <label class="field"><span>生效范围</span><select id="kb-group">${groupOptions(DATA.groups, k?.group_id || 0)}</select></label></div>
          <label class="field"><span>内容</span><textarea id="kb-content" rows="5" placeholder="写清楚规则、答案、链接与例外情况">${esc(k?.content || '')}</textarea></label>
          <label class="field"><span>状态</span><select id="kb-status"><option value="active"${!k || k.status === 'active' ? ' selected' : ''}>生效</option><option value="paused"${k?.status === 'paused' ? ' selected' : ''}>停用</option></select></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '新增'}</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const payload = { title: $('#kb-title').value.trim(), content: $('#kb-content').value.trim(), group_id: Number($('#kb-group').value), status: $('#kb-status').value };
          if (edit) await api(`/api/ai/knowledge/${k.id}`, { method: 'PUT', body: payload });
          else await api('/api/ai/knowledge', { method: 'POST', body: payload });
          toast(edit ? '知识已更新' : '知识已新增'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#new-knowledge')?.addEventListener('click', () => knowledgeEditor(null));
    $$('[data-knowledge]').forEach((row) => {
      const k = (DATA.knowledge || []).find((x) => x.id === Number(row.dataset.knowledge));
      row.querySelector('[data-knowledge-edit]')?.addEventListener('click', () => k && knowledgeEditor(k));
      row.querySelector('[data-knowledge-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除知识', message: '删除后 AI 不再引用这条内容。', confirmText: '删除' })) return;
        try { await api(`/api/ai/knowledge/${row.dataset.knowledge}`, { method: 'DELETE' }); row.remove(); toast('知识已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 商城与任务 ----------------------------- */
  function initShop() {
    $('#shop-group')?.addEventListener('change', (e) => { location.href = `/shop?group=${e.target.value}`; });
    $$('[data-shop-tab]').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-shop-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('#shop-pane-items, #shop-pane-tasks, #shop-pane-orders, #shop-pane-claims').forEach((p) => {
        p.classList.toggle('active', p.id === `shop-pane-${btn.dataset.shopTab}`);
      });
    }));

    const itemEditor = (it) => {
      const edit = !!it;
      const m = modal({
        title: edit ? '编辑商品' : '新建积分商品', subtitle: '成员在群内发送 /shop 即可看到商品', wide: true,
        body: `<div class="field-row">
            <label class="field"><span>商品名称</span><input id="si-name" value="${esc(it?.name || '')}" placeholder="例如：摄影预设包"></label>
            <label class="field"><span>图标</span><input id="si-icon" value="${esc(it?.icon || '🎁')}" maxlength="4"></label>
          </div>
          <label class="field"><span>商品说明</span><textarea id="si-desc" rows="3">${esc(it?.description || '')}</textarea></label>
          <div class="field-row-3">
            <label class="field"><span>所需积分</span><input type="number" id="si-cost" value="${it?.cost_points ?? 100}" min="0"></label>
            <label class="field"><span>库存 <em>-1 为无限</em></span><input type="number" id="si-stock" value="${it?.stock ?? 10}" min="-1"></label>
            <label class="field"><span>每人限兑</span><input type="number" id="si-limit" value="${it?.per_user_limit ?? 1}" min="1"></label>
          </div>
          <label class="field"><span>发放内容 <em>兑换后私发给成员</em></span><textarea id="si-reward" rows="3" placeholder="兑换码 / 网盘链接 / 联系方式">${esc(it?.reward_text || '')}</textarea></label>
          <div class="field-row-3">
            <label class="field"><span>适用群组</span><select id="si-group">${groupOptions(DATA.groups, it?.group_id || 0)}</select></label>
            <label class="field"><span>状态</span><select id="si-status"><option value="active"${!it || it.status === 'active' ? ' selected' : ''}>上架</option><option value="paused"${it?.status === 'paused' ? ' selected' : ''}>下架</option></select></label>
            <label class="field"><span>排序权重</span><input type="number" id="si-sort" value="${it?.sort ?? 0}"></label>
          </div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '创建商品'}</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const payload = {
            group_id: Number($('#si-group').value), name: $('#si-name').value.trim(),
            description: $('#si-desc').value.trim(), icon: $('#si-icon').value.trim() || '🎁',
            cost_points: Number($('#si-cost').value || 0), stock: Number($('#si-stock').value || 0),
            per_user_limit: Number($('#si-limit').value || 1), reward_text: $('#si-reward').value.trim(),
            status: $('#si-status').value, sort: Number($('#si-sort').value || 0)
          };
          if (edit) await api(`/api/shop/items/${it.id}`, { method: 'PUT', body: payload });
          else await api('/api/shop/items', { method: 'POST', body: payload });
          toast(edit ? '商品已更新' : '商品已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };

    const taskEditor = (t) => {
      const edit = !!t;
      const m = modal({
        title: edit ? '编辑任务' : '新建任务', subtitle: '任务进度由签到、发言或报名活动自动累计', wide: true,
        body: `<div class="field-row">
            <label class="field"><span>任务名称</span><input id="tk-name" value="${esc(t?.name || '')}" placeholder="每日签到"></label>
            <label class="field"><span>任务类型</span><select id="tk-type">
              <option value="checkin"${t?.type === 'checkin' ? ' selected' : ''}>签到</option>
              <option value="message"${t?.type === 'message' ? ' selected' : ''}>群内发言</option>
              <option value="campaign"${t?.type === 'campaign' ? ' selected' : ''}>参加活动</option>
              <option value="manual"${t?.type === 'manual' ? ' selected' : ''}>手动任务</option>
            </select></label>
          </div>
          <label class="field"><span>任务说明</span><input id="tk-desc" value="${esc(t?.description || '')}" placeholder="今天在群里发送 5 条消息"></label>
          <div class="field-row-3">
            <label class="field"><span>目标次数</span><input type="number" id="tk-target" value="${t?.target ?? 1}" min="1"></label>
            <label class="field"><span>奖励积分</span><input type="number" id="tk-reward" value="${t?.reward_points ?? 5}" min="0"></label>
            <label class="field"><span>周期</span><select id="tk-period"><option value="daily"${!t || t.period === 'daily' ? ' selected' : ''}>每日重置</option><option value="once"${t?.period === 'once' ? ' selected' : ''}>一次性</option></select></label>
          </div>
          <div class="field-row">
            <label class="field"><span>适用群组</span><select id="tk-group">${groupOptions(DATA.groups, t?.group_id || 0)}</select></label>
            <label class="field"><span>状态</span><select id="tk-status"><option value="active"${!t || t.status === 'active' ? ' selected' : ''}>启用</option><option value="paused"${t?.status === 'paused' ? ' selected' : ''}>停用</option></select></label>
          </div>
          <div class="field-hint">签到、发言、活动报名会自动累计进度；成员在群里发送 /tasks 可查看并领取奖励。</div>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>${edit ? '保存' : '创建任务'}</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        busy(e.currentTarget, true);
        try {
          const payload = {
            group_id: Number($('#tk-group').value), name: $('#tk-name').value.trim(),
            description: $('#tk-desc').value.trim(), type: $('#tk-type').value,
            target: Number($('#tk-target').value || 1), reward_points: Number($('#tk-reward').value || 0),
            period: $('#tk-period').value, status: $('#tk-status').value
          };
          if (edit) await api(`/api/tasks/${t.id}`, { method: 'PUT', body: payload });
          else await api('/api/tasks', { method: 'POST', body: payload });
          toast(edit ? '任务已更新' : '任务已创建'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };

    $('#new-shop-item')?.addEventListener('click', () => itemEditor(null));
    $('#new-shop-item-2')?.addEventListener('click', () => itemEditor(null));
    $('#new-task')?.addEventListener('click', () => taskEditor(null));
    $$('[data-shop-item]').forEach((card) => {
      const it = (DATA.items || []).find((x) => x.id === Number(card.dataset.shopItem));
      card.querySelector('[data-shop-edit]')?.addEventListener('click', () => it && itemEditor(it));
      card.querySelector('[data-shop-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除商品', message: '已产生的兑换记录会保留，商品从商城移除。', confirmText: '删除商品' })) return;
        try { await api(`/api/shop/items/${card.dataset.shopItem}`, { method: 'DELETE' }); card.remove(); toast('商品已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
    $$('[data-task]').forEach((row) => {
      const t = (DATA.tasks || []).find((x) => x.id === Number(row.dataset.task));
      row.querySelector('[data-task-edit]')?.addEventListener('click', () => t && taskEditor(t));
      row.querySelector('[data-task-delete]')?.addEventListener('click', async () => {
        if (!await confirmBox({ title: '删除任务', message: '任务进度会一并删除。', confirmText: '删除任务' })) return;
        try { await api(`/api/tasks/${row.dataset.task}`, { method: 'DELETE' }); row.remove(); toast('任务已删除'); }
        catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  /* ----------------------------- 安全中心 ----------------------------- */
  function initSecurity() {
    $('#security-group')?.addEventListener('change', (e) => { location.href = `/security?group=${e.target.value}`; });
    $('#security-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!DATA.selected) return;
      const btn = $('#security-save');
      const form = $('#security-form');
      const payload = {
        antiraid_enabled: form.elements.antiraid_enabled.checked,
        join_limit: Number(form.elements.join_limit.value || 8),
        window_sec: Number(form.elements.window_sec.value || 60),
        action: form.elements.action.value,
        auto_blacklist: form.elements.auto_blacklist.checked,
        raid_duration_sec: Number(form.elements.raid_duration_sec.value || 900)
      };
      busy(btn, true);
      try {
        await api(`/api/security/group/${DATA.selected.id}`, { method: 'PUT', body: payload });
        toast('防炸群设置已保存');
        setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); busy(btn, false); }
    });
    $('#unlock-raid')?.addEventListener('click', async () => {
      if (!await confirmBox({ title: '解除防护', message: '确认结束本群当前防炸群防护期？新成员将恢复正常入群。', confirmText: '解除防护', danger: false })) return;
      try {
        await api(`/api/security/group/${DATA.selected.id}/unlock`, { method: 'POST', body: {} });
        toast('防护已解除'); setTimeout(() => location.reload(), 350);
      } catch (ex) { toast(ex.message, 'err'); }
    });

    const openBlack = (userID = '') => {
      const m = modal({
        title: '加入全局黑名单', subtitle: '被拉黑用户入群会被立即封禁',
        body: `<label class="field"><span>用户 ID <em>必填</em></span><input id="bl-uid" value="${esc(userID)}" placeholder="例如 700100001"></label>
          <div class="field-row"><label class="field"><span>用户名</span><input id="bl-username" placeholder="luna_star"></label><label class="field"><span>昵称</span><input id="bl-first" placeholder="Luna"></label></div>
          <label class="field"><span>原因</span><input id="bl-reason" placeholder="批量广告 / 诈骗 / 手动拉黑"></label>
          <label class="field"><span>有效期</span><select id="bl-expire"><option value="0">永久</option><option value="1">1 天</option><option value="7">7 天</option><option value="30">30 天</option></select></label>`,
        footer: `<button class="btn" data-cancel>取消</button><button class="btn btn-primary" data-save>加入黑名单</button>`
      });
      $('[data-cancel]', m.overlay).onclick = m.close;
      $('[data-save]', m.overlay).onclick = async (e) => {
        const days = Number($('#bl-expire').value);
        busy(e.currentTarget, true);
        try {
          await api('/api/blacklist', { method: 'POST', body: {
            user_id: Number($('#bl-uid').value), username: $('#bl-username').value.trim(),
            first_name: $('#bl-first').value.trim(), reason: $('#bl-reason').value.trim(),
            expires_at: days > 0 ? Math.floor(Date.now() / 1000) + days * 86400 : 0
          }});
          toast('已加入全局黑名单'); m.close(); setTimeout(() => location.reload(), 350);
        } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
      };
    };
    $('#add-blacklist-btn')?.addEventListener('click', () => openBlack());
    $('#add-blacklist-btn-2')?.addEventListener('click', () => openBlack());
    $$('[data-bl-delete]').forEach((b) => b.addEventListener('click', async () => {
      if (!await confirmBox({ title: '移出黑名单', message: '确认删除这条黑名单记录？', confirmText: '删除' })) return;
      try { await api(`/api/blacklist/${b.dataset.blDelete}`, { method: 'DELETE' }); b.closest('tr').remove(); toast('已移出黑名单'); }
      catch (e) { toast(e.message, 'err'); }
    }));
    $$('[data-bl-toggle]').forEach((b) => b.addEventListener('click', async () => {
      try {
        await api(`/api/blacklist/${b.dataset.blToggle}/toggle`, { method: 'POST', body: { active: b.dataset.active !== '1' } });
        toast('状态已更新'); setTimeout(() => location.reload(), 300);
      } catch (e) { toast(e.message, 'err'); }
    }));
  }

  /* ----------------------------- 机器人 ----------------------------- */
  function initBot() {
    $('#bot-token-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = $('#bot-token').value.trim();
      const btn = $('#bot-connect');
      if (!token) { toast('请粘贴 Bot Token', 'err'); return; }
      busy(btn, true);
      try {
        await api('/api/bot/connect', { method: 'POST', body: { token } });
        toast('机器人已连接，正在读取信息');
        $('#bot-token').value = '';
        setTimeout(() => location.reload(), 700);
      } catch (ex) {
        toast(ex.message, 'err');
        busy(btn, false);
      }
    });
    $('#bot-refresh')?.addEventListener('click', async (e) => {
      busy(e.currentTarget, true);
      try {
        await api('/api/bot/refresh', { method: 'POST', body: {} });
        toast('机器人信息已刷新');
        setTimeout(() => location.reload(), 500);
      } catch (ex) { toast(ex.message, 'err'); busy(e.currentTarget, false); }
    });
    $('#bot-disconnect')?.addEventListener('click', async () => {
      if (!await confirmBox({ title: '断开机器人', message: '断开后将停止接收群消息，且不再发送任何 Telegram 消息。已保存的 Token 会被删除。', confirmText: '断开连接' })) return;
      try {
        await api('/api/bot/disconnect', { method: 'POST', body: {} });
        toast('已断开机器人');
        setTimeout(() => location.reload(), 400);
      } catch (ex) { toast(ex.message, 'err'); }
    });
  }

  /* ----------------------------- 系统设置 ----------------------------- */
  function initSettings() {
    $('#brand-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#brand-save'), settings = {};
      $$('[data-setting]').forEach((el) => { settings[el.dataset.setting] = el.value; });
      busy(btn, true);
      try { await api('/api/settings', { method: 'PUT', body: { settings } }); toast('设置已保存'); setTimeout(() => location.reload(), 400); }
      catch (ex) { toast(ex.message, 'err'); busy(btn, false); }
    });
    $('#brand-logo-upload')?.addEventListener('click', () => $('#brand-logo-file').click());
    $('#brand-logo-file')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const res = await upload(file);
        const input = document.querySelector('[data-setting="brand_logo"]');
        if (input) input.value = res.url;
        $('#brand-logo-preview').innerHTML = `<img src="${esc(res.url)}" style="width:100%;height:100%;object-fit:cover" alt="">`;
        toast('Logo 已上传，保存设置后生效');
      } catch (ex) { toast(ex.message, 'err'); }
    });
    $('#password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if ($('#pwd-new').value !== $('#pwd-confirm').value) { toast('两次输入的新密码不一致', 'err'); return; }
      const btn = $('#password-save');
      busy(btn, true);
      try {
        await api('/api/settings/password', { method: 'POST', body: { current: $('#pwd-current').value, new: $('#pwd-new').value } });
        toast('密码已更新'); $('#password-form').reset();
      } catch (ex) { toast(ex.message, 'err'); }
      busy(btn, false);
    });
    const markTheme = () => $$('[data-theme-choice]').forEach((x) => {
      x.classList.toggle('active', x.dataset.themeChoice === document.documentElement.dataset.theme);
    });
    markTheme();
    $$('[data-theme-choice]').forEach((b) => b.addEventListener('click', () => {
      document.documentElement.dataset.theme = b.dataset.themeChoice;
      localStorage.setItem('sk-theme', b.dataset.themeChoice);
      markTheme();
    }));
  }

  /* ----------------------------- 启动 ----------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initGlobal();
    if (PAGE === 'login') { initLogin(); return; }
    if (PAGE === 'dashboard') {
      drawChart(DATA.series || []);
    } else if (PAGE === 'groups' && /^\/groups\/\d+/.test(location.pathname)) {
      initGroup();
    } else if (PAGE === 'groups') {
      initGroups();
    } else if (PAGE === 'templates') {
      initTemplates();
    } else if (PAGE === 'schedules') {
      initSchedules();
    } else if (PAGE === 'checkin') {
      initCheckin();
    } else if (PAGE === 'redpackets') {
      initRedPackets();
    } else if (PAGE === 'campaigns') {
      initCampaigns();
    } else if (PAGE === 'ads') {
      initAds();
    } else if (PAGE === 'antispam') {
      initAntispam();
    } else if (PAGE === 'bot') {
      initBot();
    } else if (PAGE === 'security') {
      initSecurity();
    } else if (PAGE === 'shop') {
      initShop();
    } else if (PAGE === 'ai') {
      initAI();
    } else if (PAGE === 'stars') {
      initStars();
    } else if (PAGE === 'developer') {
      initDeveloper();
    } else if (PAGE === 'tickets') {
      initTickets();
    } else if (PAGE === 'backup') {
      initBackup();
    } else if (PAGE === 'bots') {
      initBots();
    } else if (PAGE === 'automations') {
      initAutomations();
    } else if (PAGE === 'team') {
      initTeam();
    } else if (PAGE === 'reports') {
      initReports();
    } else if (PAGE === 'invites') {
      initInvites();
    } else if (PAGE === 'memberships') {
      initMemberships();
    } else if (PAGE === 'market') {
      initMarket();
    } else if (PAGE === 'settings') {
      initSettings();
    }
  });
})();
