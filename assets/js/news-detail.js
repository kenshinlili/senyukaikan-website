/* news-detail.html — 新闻详情页（按 ?id= 读取 news.json 中的一条）*/
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
  function qParam(name) {
    var m = window.location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  var loaded = false;
  var data = [];

  function render() {
    var lang = currentLang();
    var root = document.getElementById("newsDetail");
    var bc = document.getElementById("bcTitle");
    if (!root) return;

    var id = qParam("id");
    if (!id) {
      root.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "記事IDが指定されていません。" : "未指定新闻稿 ID。") + "</p>";
      return;
    }
    var item = data.find(function (n) { return n.id === id; });
    if (!item) {
      root.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "指定された記事が見つれませんでした。" : "未找到该新闻稿。") +
        ' <a href="news.html">' + (lang === "jp" ? "一覧へ戻る" : "返回列表") + "</a></p>";
      return;
    }

    // 外链模式：直接跳转原文，不在本站渲染正文
    if (item.mode === "link" && item.sourceUrl) {
      var linkLabel = lang === "jp" ? "元記事を開く ↗" : "打开原文 ↗";
      var linkNote = lang === "jp"
        ? "この記事は外部リンクとして掲載されています。"
        : "本篇以外部链接形式发布，点击下方按钮前往原文。";
      root.innerHTML =
        '<div class="container nd-linkmode">' +
          '<p class="nd-summary">' + esc(linkNote) + "</p>" +
          '<p><a class="btn btn-primary" href="' + esc(item.sourceUrl) +
            '" target="_blank" rel="noopener">' + linkLabel + "</a></p>" +
          '<p class="nd-back"><a href="news.html">← ' +
            (lang === "jp" ? "一覧へ戻る" : "返回新闻稿列表") + "</a></p>" +
        "</div>";
      return;
    }

    var t = item[lang] || item.cn || {};
    document.title = t.title + " | 日本川渝会館";
    if (bc) bc.textContent = t.title;

    var hero = item.image
      ? '<figure class="nd-hero"><img src="' + esc(item.image) +
        '" alt="' + esc(t.title) + '" loading="eager" decoding="async" /></figure>'
      : "";

    var cite = "";
    if (item.source) {
      var label = lang === "jp" ? "出典：" : "来源：";
      if (item.sourceUrl) {
        cite = '<p class="nd-source"><span class="src-label">' + label + "</span>" +
          '<a href="' + esc(item.sourceUrl) + '" target="_blank" rel="noopener external">' +
          esc(item.source) + "</a></p>";
      } else {
        cite = '<p class="nd-source"><span class="src-label">' + label + "</span>" +
          esc(item.source) + "</p>";
      }
    }

    root.innerHTML =
      '<div class="container">' +
      hero +
      '<header class="nd-head">' +
        '<span class="nd-date">' + esc(item.date) + "</span>" +
        "<h1>" + esc(t.title) + "</h1>" +
        (t.summary ? '<p class="nd-summary">' + esc(t.summary) + "</p>" : "") +
      "</header>" +
      '<div class="nd-body">' + nl2br(t.body || "") + "</div>" +
      cite +
      '<p class="nd-back"><a href="news.html">← ' +
        (lang === "jp" ? "一覧へ戻る" : "返回新闻稿列表") +
      "</a></p>" +
      "</div>";
  }

  fetch("assets/news.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (json) {
      loaded = true;
      data = json;
      render();
    })
    .catch(function () {
      var root = document.getElementById("newsDetail");
      if (root) root.innerHTML =
        '<p class="news-empty container">新闻稿加载失败（请通过 http 访问）。</p>';
    });

  var obs = new MutationObserver(function () { if (loaded) render(); });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
})();