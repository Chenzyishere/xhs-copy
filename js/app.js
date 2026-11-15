(function () {
  const set = window.COPY_SET;
  if (!set) return;

  const $ = function (id) {
    return document.getElementById(id);
  };

  const params = new URLSearchParams(location.search);
  const today = "2026-11-15";
  let current = params.get("date") || today;
  if (!set.daysData.some(function (d) { return d.date === current; })) {
    current = set.daysData[0].date;
  }

  $("meta").textContent =
    set.note + " · 共 " + set.daysData.length + " 天 · " + (set.daysData.length * 3) + " 条";

  const daysNav = $("days");
  set.daysData.forEach(function (day) {
    const btn = document.createElement("button");
    btn.className = "day-btn" + (day.date === current ? " is-on" : "");
    btn.type = "button";
    btn.textContent = day.date.slice(5).replace("-", "/") + " " + day.weekday;
    btn.addEventListener("click", function () {
      current = day.date;
      history.replaceState(null, "", "?date=" + day.date);
      render();
    });
    daysNav.appendChild(btn);
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

  function render() {
    Array.prototype.forEach.call(daysNav.children, function (btn, i) {
      btn.classList.toggle("is-on", set.daysData[i].date === current);
    });

    const day = set.daysData.filter(function (d) {
      return d.date === current;
    })[0];
    const board = $("board");
    board.innerHTML =
      '<div class="day-head"><h2>' +
      escapeHtml(day.date + " " + day.weekday) +
      "</h2><span>三条都可单独复制</span></div><div class='cards' id='cards'></div>";

    const cards = $("cards");
    day.slots.forEach(function (slot, idx) {
      const article = document.createElement("article");
      article.className = "card";
      article.innerHTML =
        '<div class="card-top"><p class="kind kind-' +
        (slot.type === "硬广" ? "ad" : "soft") +
        '">' +
        escapeHtml(slot.time + " · " + slot.type) +
        "</p><p class='persona'>" +
        escapeHtml(slot.series) +
        "</p></div><h3>" +
        escapeHtml(slot.title) +
        '</h3><div class="card-body">' +
        block("封面", slot.cover) +
        block("正文", slot.body) +
        block("标签", slot.tags) +
        block("首评", slot.comment) +
        '</div><div class="actions"></div>';

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
      void idx;
    });
  }

  render();
})();
