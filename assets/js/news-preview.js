/* news-preview.js — 首页新闻资讯板块：取最新 4 篇 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentLang() {
    return document.documentElement.classList.contains("lang-jp") ? "jp" : "cn";
  }

  function render(data) {
    var root = document.getElementById("newsPreview");
    if (!root) return;
    var lang = currentLang();
    var items = (data || []).slice(0, 4);
    if (!items.length) {
      root.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "現在、記事はありません。" : "暂无新闻稿。") + "</p>";
      return;
    }
    root.innerHTML = items.map(function (item) {
      var t = item[lang] || item.cn || {};
      var isLink = item.mode === "link" && item.sourceUrl;
      var href = isLink ? item.sourceUrl : "news-detail.html?id=" + encodeURIComponent(item.id);
      var attr = isLink ? ' target="_blank" rel="noopener external"' : "";
      var thumb = item.image
        ? '<a class="np-thumb" href="' + esc(href) + '"' + attr + ' tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" width="320" height="180" /></a>'
        : '<a class="np-thumb np-thumb-placeholder" href="' + esc(href) + '"' + attr + ' tabindex="-1" aria-hidden="true">' +
          '<span>NEWS</span></a>';
      return '<article class="np-card">' +
        thumb +
        '<div class="np-body">' +
          '<span class="np-date">' + esc(item.date) + "</span>" +
          '<h3 class="np-title"><a href="' + esc(href) + '"' + attr + ">" + esc(t.title) + "</a></h3>" +
        "</div>" +
        "</article>";
    }).join("");
  }

  var loaded = false;
  function load() {
    fetch("assets/news.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        loaded = true;
        window.__newsPreviewData = json;
        render(json);
      })
      .catch(function () {
        var root = document.getElementById("newsPreview");
        if (root) root.innerHTML = '<p class="news-empty">' +
          (currentLang() === "jp" ? "読み込みに失敗しました。" : "加载失败") + "</p>";
      });
  }
  load();

  // 语言切换时重渲
  var obs = new MutationObserver(function () { if (loaded) render(window.__newsPreviewData || []); });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();
