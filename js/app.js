(function () {
  const set = window.COPY_SET;
  if (!set) return;

  const STATUS_KEY = "xhs-copy-status-v1";
  const FILTER_KEY = "xhs-copy-filter-v1";
  const LABELS = { todo: "未发", posted: "已发", revise: "待改" };
  const ORDER = ["todo", "posted", "revise"];

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
  let filter = localStorage.getItem(FILTER_KEY) || "all";
  if (filter !== "all" && filter !== "open" && filter !== "revise") filter = "all";

  function persist() {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
  }

  function slotKey(date, time) {
    return date + "|" + time;
  }

  function getStatus(date, time) {
    return statusMap[slotKey(date, time)] || "todo";
  }

  function setStatus(date, time, value) {
    const key = slotKey(date, time);
    if (value === "todo") delete statusMap[key];
    else statusMap[key] = value;
    persist();
  }

  function dayCounts(day) {
    const counts = { todo: 0, posted: 0, revise: 0 };
    day.slots.forEach(function (slot) {
      counts[getStatus(day.date, slot.time)] += 1;
    });
    return counts;
  }

  function dayClass(day) {
    const c = dayCounts(day);
    if (c.revise) return "is-revise";
    if (c.posted === day.slots.length) return "is-done";
    if (c.posted) return "is-part";
    return "";
  }

  function dayVisible(day) {
    const c = dayCounts(day);
    if (filter === "open") return c.posted < day.slots.length;
    if (filter === "revise") return c.revise > 0;
    return true;
  }

  const params = new URLSearchParams(location.search);
  function todayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  let current = params.get("date") || todayIso();
  if (!set.daysData.some(function (d) { return d.date === current; })) {
    current = set.daysData[0].date;
  }

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
      " · 状态只存在这台设备";
  }

  const daysNav = $("days");
  const months = [];
  set.daysData.forEach(function (day) {
    const key = day.date.slice(0, 7);
    if (!months.length || months[months.length - 1].key !== key) {
      months.push({ key: key, days: [] });
    }
    months[months.length - 1].days.push(day);
  });
  months.forEach(function (month) {
    const row = document.createElement("div");
    row.className = "month-row";
    const lab = document.createElement("span");
    lab.className = "month-label";
    lab.textContent = Number(month.key.slice(5)) + "月";
    row.appendChild(lab);
    month.days.forEach(function (day) {
      const btn = document.createElement("button");
      btn.className = "day-btn";
      btn.type = "button";
      btn.dataset.date = day.date;
      btn.textContent = day.date.slice(8) + " " + day.weekday.slice(-1);
      btn.addEventListener("click", function () {
        current = day.date;
        history.replaceState(null, "", "?date=" + day.date);
        render();
      });
      row.appendChild(btn);
    });
    daysNav.appendChild(row);
  });

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
      statusMap = next;
      persist();
      showToast("状态已导入");
      render();
    } catch (err) {
      showToast("导入失败，检查是不是整段 JSON");
    }
  });
  filters.appendChild(restore);

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
    }, 1400);
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

  function paintDays() {
    Array.prototype.forEach.call(daysNav.querySelectorAll(".day-btn"), function (btn) {
      const day = set.daysData.filter(function (d) {
        return d.date === btn.dataset.date;
      })[0];
      btn.className =
        "day-btn" +
        (btn.dataset.date === current ? " is-on" : "") +
        (day ? " " + dayClass(day) : "");
      btn.hidden = !dayVisible(day);
    });
    Array.prototype.forEach.call(daysNav.querySelectorAll(".month-row"), function (row) {
      const visible = Array.prototype.some.call(row.querySelectorAll(".day-btn"), function (btn) {
        return !btn.hidden;
      });
      row.hidden = !visible;
    });
    Array.prototype.forEach.call(filters.querySelectorAll("[data-filter]"), function (btn) {
      btn.classList.toggle("is-on", btn.dataset.filter === filter);
    });
  }

  function render() {
    paintMeta();
    paintDays();

    const day = set.daysData.filter(function (d) {
      return d.date === current;
    })[0];
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

  render();
})();
