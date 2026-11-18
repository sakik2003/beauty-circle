/* =========================================================
   App-Start: Router, Navigation, Theme, Ereignisse
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const P = BC.pages;
  const CFG = BC.cfg;
  const view = document.getElementById("view");
  let lastHash = null;
  let lastNav = null;

  // ---------- Routen
  function resolve(hash) {
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    const [a, b, c, d, e, f] = parts;
    if (!a) return { page: P.home() };
    if (a === "s" && b) {
      if (!BC.city(b)) return { page: P.notFound() };
      const S = BC.S();
      if (S.citySlug !== b) { S.citySlug = b; BC.save(); }
      if (!c) return { page: P.city(b), nav: "entdecken" };
      if (c === "k" && d) return { page: P.category(b, d), nav: "entdecken" };
      if (c === "studio" && d) return { page: P.studio(b, d), nav: "entdecken" };
      if (c === "pakete") return { page: d ? P.wizard(b, d) : P.packages(b), nav: "pakete" };
      if (c === "community") {
        if (!d) return { page: P.community(b), nav: "community" };
        if (e === "t" && f) return { page: P.thread(b, d, f), nav: "community" };
        return { page: P.channel(b, d), nav: "community" };
      }
      return { page: P.notFound() };
    }
    if (a === "konto") {
      if (!b) return { page: P.account(), nav: "konto" };
      if (b === "pakete") return { page: c ? P.myPackage(c) : P.myPackages(), nav: "konto" };
      if (b === "buchungen") return { page: P.bookings(), nav: "konto" };
      if (b === "merkliste") return { page: P.favorites(), nav: "konto" };
    }
    const simple = { login: P.login, registrieren: P.register, regeln: P.rules, impressum: P.impressum, datenschutz: P.datenschutz };
    if (simple[a]) return { page: simple[a](), nav: a === "login" || a === "registrieren" ? "konto" : null };
    return { page: P.notFound() };
  }

  // ---------- Kopf- und Fußnavigation
  function shell(active) {
    const city = BC.currentCity();
    const S = BC.S();
    const open = S.userPackages.reduce((n, up) => n + up.items.filter((i) => i.status === "manual_open").length, 0);
    const items = [
      ["entdecken", "Entdecken", "home", S.citySlug ? `#/s/${city}` : "#/"],
      ["pakete", "Pakete", "bag", `#/s/${city}/pakete`],
      ["community", "Community", "chat", `#/s/${city}/community`],
      ["konto", "Konto", "user", "#/konto"]
    ];
    const isActive = (k) => k === active || (!active && k === "entdecken" && BC.route() === "#/");
    const cur = (k) => (isActive(k) ? 'class="active" aria-current="page"' : "");
    document.getElementById("top-nav").innerHTML = items.map(([k, t, , h]) => `<a href="${h}" ${cur(k)}>${t}</a>`).join("");
    document.getElementById("bottom-nav").innerHTML = items.map(([k, t, ic, h]) =>
      `<a href="${h}" ${cur(k)}>${BC.icon(ic, 24)}${t}${k === "konto" && open ? `<span class="dot" aria-label="${open} offen">${open}</span>` : ""}</a>`).join("");
    const sel = document.getElementById("city-switch");
    sel.innerHTML = BC.cities().map((c) => `<option value="${c.slug}" ${c.slug === city ? "selected" : ""}>${BC.esc(c.name)}</option>`).join("");
    document.getElementById("logo").innerHTML = `<span class="mark" aria-hidden="true"></span>${BC.esc(CFG.appName)}`;
  }

  BC.render = () => {
    BC.processPending();
    const hash = BC.route();
    const { page, nav } = resolve(hash);
    view.innerHTML = page.html;
    document.title = page.title || CFG.appName;
    lastNav = nav;
    shell(nav);
    if (hash !== lastHash) {
      lastHash = hash;
      window.scrollTo(0, 0);
      view.focus({ preventScroll: true });
    }
  };

  // ---------- Theme (hell/dunkel)
  function applyTheme() {
    const t = BC.S().theme;
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  }
  // Darstellung: "system" | "light" | "dark" (Auswahl unter Konto)
  BC.actions.theme = (el) => {
    const v = el.dataset.theme;
    BC.S().theme = v === "system" ? null : v; BC.save(); applyTheme(); BC.render();
  };
  BC.changes["city-switch"] = (el) => { BC.S().citySlug = el.value; BC.save(); BC.go(`#/s/${el.value}`); };

  // ---------- Hinweis zum Speichern
  function cookieNotice() {
    const box = document.getElementById("cookie");
    if (BC.S().cookieOk) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="card cookie row" role="region" aria-label="Hinweis"><span class="small" style="flex:1;min-width:200px">Keine Tracking-Cookies. Deine Eingaben bleiben nur in diesem Browser.</span><button class="btn btn-primary btn-sm" data-act="cookie-ok">Verstanden</button></div>`;
  }
  BC.actions["cookie-ok"] = () => { BC.S().cookieOk = true; BC.save(); cookieNotice(); };

  // ---------- Ereignisse (ein zentraler Verteiler)
  document.addEventListener("click", (e) => {
    // Interne Links ("#/…") über den Router öffnen
    const link = e.target.closest('a[href^="#/"]');
    if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); BC.go(link.getAttribute("href")); return; }
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const fn = BC.actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-change]");
    if (el && BC.changes[el.dataset.change]) BC.changes[el.dataset.change](el, e);
  });
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-input]");
    if (el && BC.inputs[el.dataset.input]) BC.inputs[el.dataset.input](el, e);
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-submit]");
    if (f && BC.submits[f.dataset.submit]) { e.preventDefault(); BC.submits[f.dataset.submit](f, e); }
  });
  window.addEventListener("hashchange", BC.render);

  // Anfragen regelmäßig "bestätigen" lassen (Simulation)
  setInterval(() => {
    if (!BC.processPending()) return;
    const a = document.activeElement;
    const typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if (!typing && /^#\/konto/.test(BC.route())) BC.render();
    else shell(lastNav);
  }, 2000);

  applyTheme();
  cookieNotice();
  BC.render();
})();
