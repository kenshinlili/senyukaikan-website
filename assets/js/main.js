/* 日本川渝会館 — 交互脚本（共享部分：导航、语言切换、表单） */
(function () {
  "use strict";

  // 年份
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 顶部导航滚动态
  var header = document.getElementById("header");
  var onScroll = function () {
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 移动端菜单
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  var closeMenu = function () {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) closeMenu();
    });
  }

  // ===== 语言切换（JP / 中文）=====
  // 4 个页面统一：<a class="lang-btn" data-lang="jp|cn"> 中日按钮
  // 优先用 JS 拦截切换（无 reload）；URL ?lang=jp|cn 也能直接生效（SEO 友好 / JS 失败兜底）
  var LANG_KEY = "senyukaikan_lang";
  var langBtns = document.querySelectorAll(".lang-btn");
  function getInitialLang() {
    try {
      var fromUrl = new URLSearchParams(location.search).get("lang");
      if (fromUrl === "jp" || fromUrl === "cn") return fromUrl;
    } catch (e) {}
    try { var v = localStorage.getItem(LANG_KEY); if (v === "jp" || v === "cn") return v; } catch (e) {}
    return "cn";
  }
  function setLang(lang, opts) {
    if (lang !== "jp" && lang !== "cn") lang = "cn";
    document.documentElement.classList.remove("lang-cn", "lang-jp");
    document.documentElement.classList.add("lang-" + lang);
    langBtns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    if (!opts || !opts.skipUrl) {
      try {
        var url = new URL(location.href);
        url.searchParams.set("lang", lang);
        history.replaceState(null, "", url.toString());
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("senyu:lang", { detail: { lang: lang } }));
  }
  langBtns.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      setLang(b.dataset.lang);
    });
    // 防止拖拽/右键菜单等干扰
    b.addEventListener("dragstart", function (e) { e.preventDefault(); });
  });
  // 兜底：事件委托到 document。即便 langBtns 没匹配到（如 CDN 旧 JS 缓存），
  // 任何 `.lang-btn` 点击都会触发切换。
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest(".lang-btn");
    if (!a || !a.dataset || !a.dataset.lang) return;
    e.preventDefault();
    setLang(a.dataset.lang);
  });
  setLang(getInitialLang(), { skipUrl: !location.search });

  // ===== 联系表单（提交至 Formspree，无后端）=====
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  var errEl = document.getElementById("formError");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var contact = form.contact.value.trim();
      if (!name || !contact) {
        alert("请填写称呼与联系方式 / お名前と連絡先をご記入ください");
        return;
      }
      var btn = form.querySelector("button");
      var origHTML = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "...";
      if (errEl) errEl.hidden = true;

      var endpoint = form.getAttribute("action") || "";
      // 软约束：未配置 Formspree ID 时，降级提示
      if (endpoint.indexOf("{FORMSPREE_ID}") !== -1) {
        if (note) note.hidden = true;
        if (errEl) {
          errEl.hidden = false;
          errEl.querySelector(".t-cn").textContent =
            "表单尚未配置：请联系 AI 把 {FORMSPREE_ID} 替换为你的 Formspree 表单 ID，或直接发邮件至 info@senyukaikan.co.jp。";
          errEl.querySelector(".t-jp").textContent =
            "フォーム未設定：AIに指示して {FORMSPREE_ID} を Formspree のフォーム ID に差し替えてください。";
        }
        btn.disabled = false;
        btn.innerHTML = origHTML;
        return;
      }

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (r) {
        if (r.ok) {
          if (note) note.hidden = false;
          btn.innerHTML = document.documentElement.classList.contains("lang-jp")
            ? "送信済み ✓" : "已提交 ✓";
          form.reset();
        } else {
          throw new Error("HTTP " + r.status);
        }
      }).catch(function () {
        // Formspree 在国内访问不稳定：fetch 失败时回退到 mailto，
        // 用户可在邮件客户端直接发送，零依赖、稳定可达。
        if (errEl) errEl.hidden = false;
        var isJp = document.documentElement.classList.contains("lang-jp");
        var subject = (isJp ? "【日本川渝会館】お問い合わせ：" : "【日本川渝会館】咨询：") + (form.name.value || "");
        var bodyText =
          (isJp ? "お名前：" : "称呼：") + (form.name.value || "") + "\n" +
          (isJp ? "連絡先：" : "联系方式：") + (form.contact.value || "") + "\n" +
          (isJp ? "メッセージ：\n" : "留言：\n") + (form.message.value || "");
        var mailto = "mailto:info@senyukaikan.co.jp?subject=" + encodeURIComponent(subject) +
                     "&body=" + encodeURIComponent(bodyText);
        // 打开邮件客户端（同时保留 formspree 提交按钮，用户可重试）
        window.location.href = mailto;
        btn.innerHTML = isJp ? "メール送信画面へ..." : "已打开邮件发送...";
        setTimeout(function () { btn.disabled = false; btn.innerHTML = origHTML; }, 4000);
      });
    });
  }
})();

/* ===== 主页新闻预览（与 news.html 列表复用同一 JSON） ===== */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function renderPreview() {
    var newsList = document.getElementById("newsList");
    if (!newsList) return;
    var lang = document.documentElement.classList.contains("lang-jp") ? "jp" : "cn";
    if (!window.__newsData) {
      newsList.innerHTML = '<p class="news-loading">' +
        (lang === "jp" ? "読み込み中…" : "加载中…") + "</p>";
      return;
    }
    var data = window.__newsData;
    if (!data.length) {
      newsList.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "現在、記事はありません。" : "暂无新闻稿。") + "</p>";
      return;
    }
    var limit = parseInt(newsList.getAttribute("data-limit") || "0", 10);
    var items = limit > 0 ? data.slice(0, limit) : data;
    newsList.innerHTML = items.map(function (item) {
      var t = item[lang] || item.cn || {};
      var isLink = item.mode === "link" && item.sourceUrl;
      var href = isLink ? item.sourceUrl : "news-detail.html?id=" + encodeURIComponent(item.id);
      var attr = isLink ? ' target="_blank" rel="noopener external"' : "";
      var badge = isLink
        ? ' <span class="nc-badge">' + (lang === "jp" ? "↗ 外部" : "↗ 外链") + "</span>"
        : "";
      var moreLabel = isLink
        ? (lang === "jp" ? "元記事を見る →" : "查看原文 →")
        : (lang === "jp" ? "続きを読む →" : "阅读全文 →");
      return '<article class="news-card-preview' + (isLink ? " is-link" : "") + '">' +
        '<span class="nc-date">' + esc(item.date) + "</span>" + badge +
        '<a class="nc-title" href="' + esc(href) + '"' + attr + ">" + esc(t.title) + "</a>" +
        (t.summary ? '<p class="nc-summary">' + esc(t.summary) + "</p>" : "") +
        '<a class="nc-more" href="' + esc(href) + '"' + attr + ">" + moreLabel + "</a>" +
        "</article>";
    }).join("");
  }
  var newsList = document.getElementById("newsList");
  if (newsList) {
    fetch("assets/news.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) { window.__newsData = json; renderPreview(); })
      .catch(function () {
        newsList.innerHTML = '<p class="news-empty">新闻稿加载失败（请通过 http 访问，而非本地文件）。</p>';
      });
  }

  document.addEventListener("senyu:lang", function () {
    if (newsList && window.__newsData) renderPreview();
  });
})();

/* ===== 主页落地支援（单句介绍，由 services.json 驱动，无详情页） ===== */
(function () {
  "use strict";
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function renderSupport() {
    var grid = document.getElementById("supportGrid");
    if (!grid || !window.__supportData) return;
    var lang = document.documentElement.classList.contains("lang-jp") ? "jp" : "cn";
    var data = window.__supportData.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    grid.innerHTML = data.map(function (item) {
      var cn = (item.cn && item.cn.title) || "";
      var jp = (item.jp && item.jp.title) || "";
      var t = item[lang] || item.cn || {};
      var num = ("0" + String(item.order || 0)).slice(-2);
      var summary = t.summary ? "<p>" + esc(t.summary) + "</p>" : "";
      return '<div class="support">' +
        '<span class="num">' + esc(num) + "</span>" +
        '<h3><span class="t-cn">' + esc(cn) + "</span><span class="t-jp">' + esc(jp) + "</span></h3>" +
        summary +
        "</div>";
    }).join("");
  }
  var grid = document.getElementById("supportGrid");
  if (grid) {
    fetch("assets/services.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) { window.__supportData = json; renderSupport(); })
      .catch(function () { grid.innerHTML = '<p class="news-empty">支援データの読み込みに失敗しました。</p>'; });
  }
  document.addEventListener("senyu:lang", function () {
    if (grid && window.__supportData) renderSupport();
  });
})();