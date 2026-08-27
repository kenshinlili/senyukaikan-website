/* news.html — 新闻列表页（加载 news.json 全量）*/
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, "<br/>");
  }

  function currentLang() {
    return document.documentElement.classList.contains("lang-jp") ? "jp" : "cn";
  }

  function renderList(data) {
    var list = document.getElementById("newsList");
    if (!list) return;
    var lang = currentLang();
    if (!data.length) {
      list.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "現在、記事はありません。" : "暂无新闻稿。") + "</p>";
      return;
    }
    list.innerHTML = data.map(function (item) {
      var t = item[lang] || item.cn || {};
      var isLink = item.mode === "link" && item.sourceUrl;
      var href = isLink ? item.sourceUrl : "news-detail.html?id=" + encodeURIComponent(item.id);
      var attr = isLink ? ' target="_blank" rel="noopener external"' : "";
      var titleHTML = '<a class="nc-title" href="' + esc(href) + '"' + attr + ">" + esc(t.title) + "</a>";
      var moreLabel = isLink
        ? (lang === "jp" ? "元記事を見る →" : "查看原文 →")
        : (lang === "jp" ? "続きを読む →" : "阅读全文 →");
      var moreHTML = '<a class="nc-more" href="' + esc(href) + '"' + attr + ">" + moreLabel + "</a>";
      var badge = isLink
        ? '<span class="nc-badge">' + (lang === "jp" ? "↗ 外部リンク" : "↗ 外部链接") + "</span>"
        : "";
      var img = item.image
        ? '<a class="nc-thumb" href="' + esc(href) + '"' + attr + ' aria-hidden="true" tabindex="-1">' +
          '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" width="320" height="180" /></a>'
        : "";
      var srcLine = item.source
        ? '<p class="nc-source"><span class="src-label">' +
          (lang === "jp" ? "出典：" : "来源：") + "</span>" + esc(item.source) + "</p>"
        : "";
      return '<article class="news-row' + (isLink ? " is-link" : "") + '">' +
        img +
        '<div class="nc-body">' +
          '<span class="nc-date">' + esc(item.date) + "</span>" + badge +
          '<h3 class="nc-title">' + titleHTML + "</h3>" +
          (t.summary ? '<p class="nc-summary">' + esc(t.summary) + "</p>" : "") +
          srcLine +
          moreHTML +
        "</div>" +
        "</article>";
    }).join("");
  }

  function renderMsg(msg) {
    var list = document.getElementById("newsList");
    if (list) list.innerHTML = '<p class="news-empty">' + esc(msg) + "</p>";
  }

  var loaded = false;
  function load() {
    fetch("assets/news.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        loaded = true;
        window.__newsPageData = json;
        renderList(json);
      })
      .catch(function () {
        renderMsg("新闻稿加载失败（请通过 http 访问，而非本地文件）。");
      });
  }
  load();

  // 监听语言切换
  document.addEventListener("senyu:lang", function () {
    if (loaded) renderList(window.__newsPageData || []);
  });
  // 兼容旧触发
  var origSetLang = window.setLang;
  if (typeof origSetLang === "function") {
    // 由 main.js 接管语言切换，本脚本只在 data 变化时重渲
  }

  // 简单轮询：监听 <html> class 变化（语言切换）
  var obs = new MutationObserver(function () {
    if (loaded) renderList(window.__newsPageData || []);
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();