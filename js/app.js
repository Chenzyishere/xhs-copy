(function () {
  const set = window.COPY_SET;
  if (!set) return;

  const STATUS_KEY = "xhs-copy-status-v1";
  const FILTER_KEY = "xhs-copy-filter-v1";
  const TOKEN_KEY = "xhs-copy-gh-token";
  const GH = {
    owner: "Chenzyishere",
    repo: "xhs-copy",
    branch: "status",
    path: "status.json",
  };
  const LABELS = { todo: "未发", posted: "已发", revise: "待改" };
  const ORDER = ["todo", "posted", "revise"];
  const WD = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  const $ = function (id) {
    return document.getElementById(id);
  };

  function loadMap() {
    try {
      return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
    } catch (err) {
      return {};
    }
  }

  let statusMap = loadMap();
  let statusSha = "";
  let syncing = false;
  let filter = localStorage.getItem(FILTER_KEY) || "all";
  if (filter !== "all" && filter !== "open" && filter !== "revise") filter = "all";

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function persist() {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
  }

  function slotKey(date, time) {
    return date + "|" + time;
  }

  function getStatus(date, time) {
    return statusMap[slotKey(date, time)] || "todo";
  }

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function decodeBase64(text) {
    const bin = atob(String(text).replace(/\n/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function ghHeaders(withAuth) {
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const token = getToken();
    if (withAuth && token) headers.Authorization = "Bearer " + token;
    return headers;
  }

  function ghUrl() {
    return (
      "https://api.github.com/repos/" +
      GH.owner +
      "/" +
      GH.repo +
      "/contents/" +
      GH.path +
      "?ref=" +
      encodeURIComponent(GH.branch)
    );
  }

  function payloadJson() {
    return JSON.stringify({
      updated: new Date().toISOString(),
      slots: statusMap,
    });
  }

  function applyRemote(data) {
    if (!data || typeof data !== "object") return;
    if (data.slots && typeof data.slots === "object") statusMap = data.slots;
    else statusMap = data;
    persist();
  }

  async function pullRemote() {
    if (!getToken()) return false;
    const res = await fetch(ghUrl(), { headers: ghHeaders(true) });
    if (res.status === 404) {
      statusSha = "";
      return true;
    }
    if (!res.ok) throw new Error("read " + res.status);
    const file = await res.json();
    statusSha = file.sha || "";
    applyRemote(JSON.parse(decodeBase64(file.content)));
    return true;
  }

  async function putStatus(sha) {
    const body = {
      message: "Update copy desk status",
      content: encodeBase64(payloadJson()),
      branch: GH.branch,
    };
    if (sha) body.sha = sha;
    return fetch(
      "https://api.github.com/repos/" +
        GH.owner +
        "/" +
        GH.repo +
        "/contents/" +
        GH.path,
      {
        method: "PUT",
        headers: Object.assign(ghHeaders(true), { "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      }
    );
  }

  async function pushRemote() {
    if (!getToken()) return false;
    const snapshot = JSON.parse(JSON.stringify(statusMap));
    let res = await putStatus(statusSha);
    if (res.status === 409 || res.status === 422) {
      await pullRemote();
      statusMap = snapshot;
      persist();
      res = await putStatus(statusSha);
    }
    if (!res.ok) throw new Error("write " + res.status);
    const file = await res.json();
    statusSha = (file.content && file.content.sha) || file.sha || statusSha;
    return true;
  }

  function queuePush() {
    if (syncing) return;
    syncing = true;
    pushRemote()
      .catch(function () {
        showToast("同步失败，已先存在这台设备");
      })
      .then(function () {
        syncing = false;
        paintMeta();
      });
  }

  function setStatus(date, time, value) {
    const key = slotKey(date, time);
    if (value === "todo") delete statusMap[key];
    else statusMap[key] = value;
    persist();
    queuePush();
  }

  function dayByDate(iso) {
    return (
      set.daysData.filter(function (d) {
        return d.date === iso;
      })[0] || null
    );
  }

  function dayCounts(day) {
    const counts = { todo: 0, posted: 0, revise: 0 };
    if (!day) return counts;
    day.slots.forEach(function (slot) {
      counts[getStatus(day.date, slot.time)] += 1;
    });
    return counts;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function isoFrom(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function parseIso(iso) {
    const p = String(iso || "").split("-").map(Number);
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return null;
    return { y: p[0], m: p[1], d: p[2] };
  }

  function weekdayOf(iso) {
    const p = parseIso(iso);
    if (!p) return "";
    return WD[new Date(p.y, p.m - 1, p.d).getDay()];
  }

  function todayIso() {
    const d = new Date();
    return isoFrom(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function monthGrid(y, m) {
    const first = new Date(y, m - 1, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(y, m - 1, 1 - startOffset);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({
        iso: isoFrom(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        inMonth: d.getMonth() === m - 1,
        n: d.getDate(),
      });
    }
    if (
      cells.slice(35).every(function (c) {
        return !c.inMonth;
      })
    ) {
      cells.length = 35;
    }
    return cells;
  }

  const params = new URLSearchParams(location.search);
  let current = params.get("date") || todayIso();
  if (!parseIso(current)) current = todayIso();
  const curParts = parseIso(current);
  let viewYear = curParts.y;
  let viewMonth = curParts.m;

  function totals() {
    let posted = 0;
    let revise = 0;
    let all = 0;
    set.daysData.forEach(function (day) {
      day.slots.forEach(function (slot) {
        all += 1;
        const st = getStatus(day.date, slot.time);
        if (st === "posted") posted += 1;
        if (st === "revise") revise += 1;
      });
    });
    return { posted: posted, revise: revise, all: all };
  }

  function paintMeta() {
    const t = totals();
    const sync = getToken() ? "已接 GitHub 同步" : "状态先存在这台设备，点同步设置可跨设备";
    $("meta").textContent =
      set.note +
      " · 共 " +
      set.daysData.length +
      " 天 · " +
      t.all +
      " 条 · 已发 " +
      t.posted +
      " · 待改 " +
      t.revise +
      " · " +
      sync;
  }

  const daysNav = $("days");
  const filters = $("filters");
  [
    ["all", "全部"],
    ["open", "未发完"],
    ["revise", "待改"],
  ].forEach(function (item) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.dataset.filter = item[0];
    btn.textContent = item[1];
    btn.addEventListener("click", function () {
      filter = item[0];
      localStorage.setItem(FILTER_KEY, filter);
      render();
    });
    filters.appendChild(btn);
  });

  const backup = document.createElement("button");
  backup.type = "button";
  backup.className = "filter-btn ghost";
  backup.textContent = "备份状态";
  backup.addEventListener("click", function () {
    copy(JSON.stringify(statusMap), "状态");
  });
  filters.appendChild(backup);

  const restore = document.createElement("button");
  restore.type = "button";
  restore.className = "filter-btn ghost";
  restore.textContent = "导入状态";
  restore.addEventListener("click", function () {
    const raw = window.prompt("把备份的状态 JSON 贴进来");
    if (!raw) return;
    try {
      const next = JSON.parse(raw);
      if (!next || typeof next !== "object") throw new Error("bad");
      statusMap = next.slots && typeof next.slots === "object" ? next.slots : next;
      persist();
      queuePush();
      showToast("状态已导入");
      render();
    } catch (err) {
      showToast("导入失败，检查是不是整段 JSON");
    }
  });
  filters.appendChild(restore);

  const syncBtn = document.createElement("button");
  syncBtn.type = "button";
  syncBtn.className = "filter-btn ghost";
  syncBtn.textContent = "同步设置";
  syncBtn.addEventListener("click", function () {
    $("sync").hidden = !$("sync").hidden;
  });
  filters.appendChild(syncBtn);

  $("sync-save").addEventListener("click", function () {
    const token = $("sync-token").value.trim();
    if (!token) {
      showToast("先贴 token");
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    pullRemote()
      .then(function () {
        return pushRemote();
      })
      .then(function () {
        showToast("同步已接通");
        $("sync").hidden = true;
        $("sync-token").value = "";
        render();
      })
      .catch(function () {
        showToast("同步失败，检查 token 是否有 Contents 读写");
      });
  });
  $("sync-clear").addEventListener("click", function () {
    localStorage.removeItem(TOKEN_KEY);
    statusSha = "";
    $("sync-token").value = "";
    $("sync").hidden = true;
    showToast("已改为只存在这台设备");
    paintMeta();
  });

  function fullText(slot) {
    return slot.title + "\n\n" + slot.body + "\n\n" + slot.tags;
  }

  function showToast(text) {
    const el = $("toast");
    el.textContent = text;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function copy(text, label) {
    const done = function () {
      showToast("已复制" + (label || ""));
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }

  function block(label, text) {
    return (
      '<div class="block"><p class="block-label">' +
      escapeHtml(label) +
      "</p><pre>" +
      escapeHtml(text) +
      "</pre></div>"
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cellClass(cell) {
    const day = dayByDate(cell.iso);
    const bits = ["cal-cell"];
    if (!cell.inMonth) bits.push("is-other");
    if (cell.iso === current) bits.push("is-on");
    if (cell.iso === todayIso()) bits.push("is-today");
    if (!day) {
      bits.push("is-empty");
      if (filter === "revise") bits.push("is-dim");
      return bits.join(" ");
    }
    const c = dayCounts(day);
    if (c.revise) bits.push("is-revise");
    if (c.posted === day.slots.length) bits.push("is-done");
    else if (c.posted) bits.push("is-part");
    if (filter === "open" && c.posted === day.slots.length) bits.push("is-dim");
    if (filter === "revise" && !c.revise) bits.push("is-dim");
    return bits.join(" ");
  }

  function paintDays() {
    daysNav.innerHTML = "";
    const head = document.createElement("div");
    head.className = "cal-head";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cal-nav";
    prev.textContent = "上月";
    prev.addEventListener("click", function () {
      viewMonth -= 1;
      if (viewMonth < 1) {
        viewMonth = 12;
        viewYear -= 1;
      }
      render();
    });
    const label = document.createElement("p");
    label.className = "cal-title";
    label.textContent = viewYear + " 年 " + viewMonth + " 月";
    const next = document.createElement("button");
    next.type = "button";
    next.className = "cal-nav";
    next.textContent = "下月";
    next.addEventListener("click", function () {
      viewMonth += 1;
      if (viewMonth > 12) {
        viewMonth = 1;
        viewYear += 1;
      }
      render();
    });
    head.appendChild(prev);
    head.appendChild(label);
    head.appendChild(next);
    daysNav.appendChild(head);

    const week = document.createElement("div");
    week.className = "cal-week";
    ["一", "二", "三", "四", "五", "六", "日"].forEach(function (name) {
      const el = document.createElement("span");
      el.textContent = name;
      week.appendChild(el);
    });
    daysNav.appendChild(week);

    const grid = document.createElement("div");
    grid.className = "cal-grid";
    monthGrid(viewYear, viewMonth).forEach(function (cell) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = cellClass(cell);
      btn.dataset.date = cell.iso;
      const num = document.createElement("span");
      num.className = "cal-n";
      num.textContent = String(cell.n);
      btn.appendChild(num);
      const day = dayByDate(cell.iso);
      if (day) {
        const dots = document.createElement("span");
        dots.className = "cal-dots";
        day.slots.forEach(function (slot) {
          const i = document.createElement("i");
          i.className = getStatus(day.date, slot.time);
          dots.appendChild(i);
        });
        btn.appendChild(dots);
      }
      btn.addEventListener("click", function () {
        current = cell.iso;
        const p = parseIso(cell.iso);
        viewYear = p.y;
        viewMonth = p.m;
        history.replaceState(null, "", "?date=" + cell.iso);
        render();
      });
      grid.appendChild(btn);
    });
    daysNav.appendChild(grid);

    Array.prototype.forEach.call(filters.querySelectorAll("[data-filter]"), function (btn) {
      btn.classList.toggle("is-on", btn.dataset.filter === filter);
    });
  }

  function renderEmpty() {
    const board = $("board");
    board.innerHTML =
      '<div class="day-head"><h2>' +
      escapeHtml(current + " " + weekdayOf(current)) +
      "</h2><span>这一天还没有稿</span></div><div class='cards cards-one' id='cards'></div>";
    const article = document.createElement("article");
    article.className = "card card-wait";
    article.innerHTML =
      "<h3>敬请期待</h3><div class='card-body'><p class='wait-copy'>这一天还没有稿。有内容的日子从 2026-11-15 到 12-31。</p></div>";
    $("cards").appendChild(article);
  }

  function renderDay(day) {
    const c = dayCounts(day);
    const board = $("board");
    board.innerHTML =
      '<div class="day-head"><h2>' +
      escapeHtml(day.date + " " + day.weekday) +
      "</h2><span>已发 " +
      c.posted +
      "/" +
      day.slots.length +
      (c.revise ? " · 待改 " + c.revise : "") +
      " · 点卡片改状态</span></div><div class='cards' id='cards'></div>";

    const cards = $("cards");
    day.slots.forEach(function (slot) {
      const st = getStatus(day.date, slot.time);
      const article = document.createElement("article");
      article.className = "card is-" + st;
      article.innerHTML =
        '<div class="card-top"><p class="kind kind-' +
        (slot.type === "硬广" ? "ad" : "soft") +
        '">' +
        escapeHtml(slot.time + " · " + slot.type) +
        "</p><p class='persona'>" +
        escapeHtml(slot.series) +
        "</p></div><h3>" +
        escapeHtml(slot.title) +
        '</h3><div class="marks"></div><div class="card-body">' +
        block("封面", slot.cover) +
        block("正文", slot.body) +
        block("标签", slot.tags) +
        block("首评", slot.comment) +
        '</div><div class="actions"></div>';

      const marks = article.querySelector(".marks");
      ORDER.forEach(function (value) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mark-btn mark-" + value + (st === value ? " is-on" : "");
        btn.textContent = LABELS[value];
        btn.addEventListener("click", function () {
          setStatus(day.date, slot.time, value);
          render();
        });
        marks.appendChild(btn);
      });

      const actions = article.querySelector(".actions");
      [
        ["复制发布包", fullText(slot), ""],
        ["标题", slot.title, "标题"],
        ["正文", slot.body, "正文"],
        ["标签", slot.tags, "标签"],
        ["首评", slot.comment, "首评"],
      ].forEach(function (item, i) {
        const btn = document.createElement("button");
        btn.type = "button";
        if (i > 0) btn.className = "ghost";
        btn.textContent = item[0];
        btn.addEventListener("click", function () {
          copy(item[1], item[2]);
        });
        actions.appendChild(btn);
      });
      cards.appendChild(article);
    });
  }

  function render() {
    paintMeta();
    paintDays();
    const day = dayByDate(current);
    if (day) renderDay(day);
    else renderEmpty();
  }

  render();
  if (getToken()) {
    pullRemote()
      .then(function () {
        render();
      })
      .catch(function () {
        showToast("远程状态读取失败，先用这台设备的");
      });
  }
})();
