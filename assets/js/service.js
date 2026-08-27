/* service.html — 会馆服务（场地租赁横幅见 service.html 静态部分；
   此脚本只渲染下方 6 项核心服务卡 — 压缩、去 NO 标、去每卡 CTA） */
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

  // 各服务的固定图标（按业务类型）
  var ICONS = {
    "2190541": "📋", // 行政手续
    "2190542": "⚖", // 法务·税务
    "2190543": "🏢", // 公司设立
    "2190544": "🛍", // 产品展示·市场调查
    "2190545": "🔬", // 产品检验
    "2190546": "🌐"  // 面向日本市场的本地化
  };

  function renderList(data) {
    var grid = document.getElementById("serviceGrid");
    if (!grid) return;
    var lang = currentLang();
    if (!data.length) {
      grid.innerHTML = '<p class="news-empty">' +
        (lang === "jp" ? "現在、サービスはありません。" : "暂无服务。") + "</p>";
      return;
    }
    grid.innerHTML = data.map(function (item) {
      var cn = (item.cn && item.cn.title) || "";
      var jp = (item.jp && item.jp.title) || "";
      var t = item[lang] || item.cn || {};
      var icon = ICONS[String(item.id)] || item.icon || "◆";
      var summary = t.summary
        ? '<p class="srv-summary">' + esc(t.summary) + '</p>'
        : '<p class="srv-pending">' +
          (lang === "jp" ? "詳細は近日公開予定。" : "详情待补充。") +
          '</p>';
      return '<article class="srv-card">' +
        '<div class="srv-head">' +
          '<span class="srv-ico" aria-hidden="true">' + icon + '</span>' +
        '</div>' +
        '<h3 class="srv-title">' +
          '<span class="t-cn">' + esc(cn) + '</span>' +
          '<span class="t-jp">' + esc(jp) + '</span>' +
        '</h3>' +
        summary +
        '</article>';
    }).join("");
  }

  function renderMsg(msg) {
    var grid = document.getElementById("serviceGrid");
    if (grid) grid.innerHTML = '<p class="news-empty">' + esc(msg) + "</p>";
  }

  var loaded = false;
  function load() {
    fetch("assets/services.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (json) {
        loaded = true;
        renderList(json);
      })
      .catch(function () {
        renderMsg("服务数据加载失败（请通过 http 访问，而非本地文件）。");
      });
  }
  load();

  document.addEventListener("senyu:lang", function () {
    if (loaded) load();
  });
})();