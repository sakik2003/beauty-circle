/* =========================================================
   Kern: Hilfsfunktionen, Speicher (localStorage), Datenzugriff
   Datenzugriff ist hier gebündelt – in Phase 2 wird nur dieser
   Teil auf Supabase umgestellt, die Seiten bleiben gleich.
   ========================================================= */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG;
  const D = window.APP_DATA;
  const BC = (window.BC = { actions: {}, changes: {}, inputs: {}, submits: {}, pages: {} });

  // ---------- Hilfsfunktionen
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  BC.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ESC[c]);
  BC.euro = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
  BC.DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  BC.pad = (n) => String(n).padStart(2, "0");
  BC.fmtDate = (t) => new Date(t).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  BC.fmtDateLong = (t) => new Date(t).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  BC.fmtTime = (t) => new Date(t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  BC.fmtDateTime = (t) => `${BC.fmtDate(t)}, ${BC.fmtTime(t)} Uhr`;
  BC.ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}-${BC.pad(d.getMonth() + 1)}-${BC.pad(d.getDate())}`; };
  BC.ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "gerade eben";
    if (m < 60) return `vor ${m} Min.`;
    const h = Math.round(m / 60);
    if (h < 24) return `vor ${h} Std.`;
    const d = Math.round(h / 24);
    return d === 1 ? "gestern" : `vor ${d} Tagen`;
  };
  BC.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  BC.stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
  BC.hueOf = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  BC.parseLocal = (v) => (v ? new Date(v).getTime() : null); // "2026-11-20T14:00" -> ms (lokale Zeit)
  BC.toLocalInput = (t) => { const d = new Date(t); return `${BC.ymd(t)}T${BC.pad(d.getHours())}:${BC.pad(d.getMinutes())}`; };

  // ---------- Speicher (nur in diesem Browser)
  const KEY = "beautycircle_v1";
  const defaults = () => ({
    citySlug: null, theme: null, cookieOk: false,
    favorites: [], userPackages: [], bookings: [], bookedSlots: [], reviews: [],
    messages: [], myReactions: {}, reports: [], blocked: [], bestAnswers: {}, reminders: []
  });
  let S = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) S = Object.assign(defaults(), JSON.parse(raw));
  } catch (e) { /* privates Fenster o. ä. – App läuft ohne Speicher weiter */ }
  BC.S = () => S;
  BC.save = () => { try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorieren */ } };
  BC.resetAll = () => { try { window.localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ } S = defaults(); };

  // ---------- Datenzugriff
  BC.cities = () => D.cities;
  BC.city = (slug) => D.cities.find((c) => c.slug === slug);
  BC.categories = () => D.categories;
  BC.category = (slug) => D.categories.find((c) => c.slug === slug);
  BC.studioById = (id) => D.studios.find((s) => s.id === id);
  BC.studio = (citySlug, slug) => D.studios.find((s) => s.citySlug === citySlug && s.slug === slug);
  BC.servicesOf = (studioId) => D.services.filter((v) => v.studioId === studioId);
  BC.service = (id) => D.services.find((v) => v.id === id);
  BC.servicesIn = (studioId, cat) => D.services.filter((v) => v.studioId === studioId && v.categorySlug === cat);
  BC.matchService = (studioId, cat, hint) => {
    const list = BC.servicesIn(studioId, cat);
    return (hint && list.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()))) || list[0] || null;
  };
  BC.reviewsOf = (studioId) => S.reviews.filter((r) => r.studioId === studioId).concat(D.reviews.filter((r) => r.studioId === studioId)).sort((a, b) => b.date - a.date);
  BC.packages = (citySlug) => D.packages.filter((p) => !p.citySlug || p.citySlug === citySlug);
  BC.pkg = (slug) => D.packages.find((p) => p.slug === slug);
  BC.channels = (citySlug) => D.channels.filter((c) => c.citySlug === citySlug);
  BC.channel = (citySlug, slug) => D.channels.find((c) => c.citySlug === citySlug && c.slug === slug);
  BC.allMessages = () => D.messages.concat(S.messages).filter((m) => !S.blocked.includes(m.author));
  BC.message = (id) => D.messages.concat(S.messages).find((m) => m.id === id);

  // Bewertung inkl. eigener Bewertungen
  BC.ratingOf = (st) => {
    const own = S.reviews.filter((r) => r.studioId === st.id);
    const count = st.reviewCount + own.length;
    const sum = st.rating * st.reviewCount + own.reduce((a, r) => a + r.rating, 0);
    return { rating: Math.round((sum / count) * 10) / 10, count };
  };
  // Community-Ranking: gewichteter Durchschnitt (wenige Bewertungen zählen weniger)
  BC.score = (st) => { const { rating, count } = BC.ratingOf(st); return (rating * count + 4.0 * 25) / (count + 25); };

  BC.studios = (citySlug, f) => {
    f = f || {};
    let list = D.studios.filter((s) => s.citySlug === citySlug);
    if (f.category) list = list.filter((s) => s.categories.includes(f.category));
    if (f.district) list = list.filter((s) => s.district === f.district);
    if (f.price) list = list.filter((s) => s.priceLevel === Number(f.price));
    if (f.mode) list = list.filter((s) => s.bookingMode === f.mode);
    if (f.language) list = list.filter((s) => s.languages.includes(f.language));
    if (f.minRating) list = list.filter((s) => BC.ratingOf(s).rating >= Number(f.minRating));
    const sort = f.sort || "score";
    list.sort((a, b) => {
      if (sort === "price") return a.priceLevel - b.priceLevel || BC.score(b) - BC.score(a);
      if (sort === "reviews") return BC.ratingOf(b).count - BC.ratingOf(a).count;
      if (sort === "online") { const o = { online: 0, request: 1, manual: 2 }; return o[a.bookingMode] - o[b.bookingMode] || BC.score(b) - BC.score(a); }
      return BC.score(b) - BC.score(a);
    });
    return list;
  };

  // Öffnungszeiten
  BC.openState = (st) => {
    const now = new Date();
    const h = st.openingHours[now.getDay()];
    if (!h) return { open: false, text: "Heute geschlossen" };
    const m = now.getHours() * 60 + now.getMinutes();
    if (m >= h[0] * 60 && m < h[1] * 60) return { open: true, text: `Jetzt geöffnet · bis ${h[1]}:00 Uhr` };
    return { open: false, text: m < h[0] * 60 ? `Öffnet heute um ${h[0]}:00 Uhr` : "Jetzt geschlossen" };
  };

  // Freie Termine (nur Online-Studios) – für die nächsten 14 Tage erzeugt
  const slotCache = {};
  BC.slots = (st) => {
    if (st.bookingMode !== "online") return [];
    if (!slotCache[st.id]) {
      const out = [];
      const base = new Date(); base.setHours(0, 0, 0, 0);
      for (let d = 0; d < 14; d++) {
        const day = new Date(base.getTime()); day.setDate(base.getDate() + d);
        const h = st.openingHours[day.getDay()];
        if (!h) continue;
        const r = D.rng(st.id + BC.ymd(day));
        for (let hour = h[0]; hour <= h[1] - 1; hour++) {
          for (const min of [0, 30]) {
            if (r() < 0.62) continue;
            const t = new Date(day.getTime()); t.setHours(hour, min, 0, 0);
            if (t.getTime() < Date.now() + 2 * 3600000) continue;
            out.push({ id: `${st.id}@${t.getTime()}`, studioId: st.id, start: t.getTime() });
          }
        }
      }
      slotCache[st.id] = out;
    }
    return slotCache[st.id].filter((s) => !S.bookedSlots.includes(s.id));
  };

  // Hat die Nutzerin bei diesem Studio gebucht? (für "Verifiziert")
  BC.hasBookedWith = (studioId) =>
    S.bookings.some((b) => b.studioId === studioId && b.status === "confirmed") ||
    S.userPackages.some((p) => p.items.some((i) => i.studioId === studioId && i.status === "manual_done"));

  // ---------- Kleine UI-Helfer
  BC.toast = (text) => {
    const wrap = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = text;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  };
  // Routen werden intern als "#/s/berlin/pakete" geschrieben, in der Adresszeile
  // aber als "#s--berlin--pakete" (nur Buchstaben, Ziffern, Bindestriche – funktioniert auch im geteilten Link)
  BC.toHash = (route) => route.replace(/^#\/?/, "").split("/").filter(Boolean).join("--");
  BC.route = () => {
    const h = location.hash.replace(/^#/, "");
    if (h.startsWith("/")) return "#" + h; // alte Schreibweise
    return "#/" + h.split("--").filter(Boolean).join("/");
  };
  BC.go = (route) => {
    const h = BC.toHash(route);
    if (location.hash.replace(/^#/, "") === h) BC.render(); else location.hash = h;
  };
  // Bestätigung direkt in der Seite (Browser-Dialoge sind in geteilten Links gesperrt)
  BC.confirm = (text, okLabel) => new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `<div class="modal card" role="dialog" aria-modal="true" aria-labelledby="modal-text">
      <p id="modal-text">${BC.esc(text)}</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-m="no">Abbrechen</button><button class="btn btn-primary" data-m="yes">${BC.esc(okLabel || "Ja, weiter")}</button></div></div>`;
    document.body.appendChild(wrap);
    const done = (v) => { wrap.remove(); resolve(v); };
    wrap.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (b) done(b.dataset.m === "yes"); else if (e.target === wrap) done(false); });
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape") done(false); });
    wrap.querySelector('[data-m="yes"]').focus();
  });
  BC.currentCity = () => S.citySlug || D.cities[0].slug;
  BC.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove(); return ok;
    }
  };
  BC.cfg = CFG;
  BC.data = D;
})();
