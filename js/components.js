/* =========================================================
   Wiederverwendbare Bausteine (geben HTML-Text zurück)
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  BC.ui = { slotDay: {}, topCat: "", filters: {} };

  // ---------- Linien-Icons (24×24, Strichstärke 1.8)
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    bag: '<path d="M4 8h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  BC.icon = (name, size, fill) => `<svg width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ---------- Pastellfarben aus dem Design-System
  BC.tint = (h) => {
    h = ((h % 360) + 360) % 360;
    if (h >= 300 || h < 12) return "var(--pink)";
    if (h >= 220) return "var(--lav)";
    if (h >= 150) return "var(--sky)";
    return "var(--sand)";
  };

  // ---------- Kennzeichen der Buchungsart
  const MODES = {
    online: { cls: "mode-online", icon: "calendar", text: "Online buchbar" },
    request: { cls: "mode-request", icon: "clock", text: "Anfrage möglich" },
    manual: { cls: "mode-manual", icon: "phone", text: "Nur manuell buchbar" }
  };
  BC.MODES = MODES;
  BC.modeBadge = (mode) => {
    const m = MODES[mode];
    return `<span class="mode-badge ${m.cls}">${BC.icon(m.icon, 14)}${m.text}</span>`;
  };

  // ---------- Kleinteile
  BC.ph = (hue, icon, cls, extra) => `<div class="ph ${cls || ""}" style="--tint:${BC.tint(hue)}" aria-hidden="true">${icon || ""}${extra || ""}</div>`;
  BC.studioIcon = (st) => BC.category(st.categories[0]).icon;
  BC.ratingHtml = (st) => { const r = BC.ratingOf(st); return `<span class="rating">${BC.icon("star", 14, true)}${r.rating.toFixed(1).replace(".", ",")} <span class="muted">(${r.count})</span></span>`; };
  BC.priceLevel = (n) => `<span class="price-level" title="Preisniveau"><b>${"€".repeat(n)}</b>${"€".repeat(3 - n)}</span>`;
  BC.avatar = (name) => `<span class="avatar" style="--tint:${BC.tint(BC.hueOf(name))}" aria-hidden="true">${esc(name.charAt(0))}</span>`;
  BC.empty = (icon, text, ctaHtml) => `<div class="empty card"><div class="big">${icon}</div><p>${text}</p>${ctaHtml || ""}</div>`;
  BC.isFav = (id) => BC.S().favorites.includes(id);
  BC.favBtn = (st) => `<button class="fav-btn" data-act="fav" data-id="${st.id}" aria-pressed="${BC.isFav(st.id)}" aria-label="${BC.isFav(st.id) ? "Von Merkliste entfernen" : "Merken"}">${BC.icon("heart", 18)}</button>`;

  // ---------- Studio-Karte (flächig in Pastell, wie die Terminkarten)
  BC.studioCard = (st, opts) => {
    opts = opts || {};
    const cats = st.categories.map((c) => BC.category(c).name).join(" · ");
    return `<article class="studio-card" style="--tint:${BC.tint(st.hue)}">
      <a href="#/s/${st.citySlug}/studio/${st.slug}">
        <h3>${opts.rank ? `<span class="rank">${opts.rank}</span>` : ""}${esc(st.name)}</h3>
        <div class="meta">${esc(st.district)} · ${esc(cats)}</div>
      </a>
      <div class="foot">${BC.ratingHtml(st)}${BC.priceLevel(st.priceLevel)}<span style="margin-left:auto">${BC.modeBadge(st.bookingMode)}</span></div>
      ${BC.favBtn(st)}
    </article>`;
  };

  // ---------- Paket-Karte
  BC.packageCard = (p, citySlug) => `<a class="pkg-card card-link" style="--tint:${BC.tint(p.hue)}" href="#/s/${citySlug}/pakete/${p.slug}">
      <span class="pkg-icon" aria-hidden="true">${p.icon}</span>
      <h3>${esc(p.name)}</h3>
      <span class="items">${p.items.map((i) => esc(i.label)).join(" · ")}</span>
      <span class="go">${p.discountPercent ? `<span class="tag">−${p.discountPercent} %</span>` : "<span></span>"}${BC.icon("arrow", 20)}</span>
    </a>`;

  // ---------- Kontaktkarte (für manuelle Studios / als Alternative)
  BC.contactMessage = (serviceName, dateText) =>
    `Hallo, ich habe euch über ${BC.cfg.appName} gefunden und möchte gern ${serviceName || "einen Termin"} buchen. ` +
    `Habt ihr ${dateText ? "am " + dateText : "in den nächsten Tagen"} etwas frei? Liebe Grüße, ${BC.cfg.demoUser.firstName}`;

  const waHref = (st, msg) => `https://wa.me/${st.whatsapp}?text=${encodeURIComponent(msg)}`;
  const mailHref = (st, msg) => `mailto:${st.email}?subject=${encodeURIComponent("Terminanfrage über " + BC.cfg.appName)}&body=${encodeURIComponent(msg)}`;
  BC.updateContactLinks = (card) => {
    const st = BC.studioById(card.dataset.studio);
    const msg = card.querySelector("textarea").value;
    card.querySelector("[data-wa]").href = waHref(st, msg);
    card.querySelector("[data-mail]").href = mailHref(st, msg);
  };

  BC.hoursTable = (st) => {
    const today = new Date().getDay();
    const order = [1, 2, 3, 4, 5, 6, 0];
    return `<table class="hours">${order.map((d) => {
      const h = st.openingHours[d];
      return `<tr class="${d === today ? "today" : ""}"><td>${BC.DAYS[d]}</td><td>${h ? `${h[0]}:00 – ${h[1]}:00` : "geschlossen"}</td></tr>`;
    }).join("")}</table>`;
  };

  /* opts: key (eindeutig), service (Name), wishDate (yyyy-mm-dd), notice (bool), collapsed (bool), wizIndex */
  BC.contactCard = (st, opts) => {
    opts = opts || {};
    const key = opts.key || st.id;
    const dateText = opts.wishDate ? BC.fmtDateLong(BC.parseLocal(opts.wishDate + "T12:00")) : "";
    const msg = opts.message || BC.contactMessage(opts.service, dateText);
    const os = BC.openState(st);
    const city = BC.city(st.citySlug).name;
    const showNotice = opts.notice !== false && st.bookingMode === "manual";
    const inner = `
      ${showNotice ? `<div class="notice notice-manual" role="note"><span class="ic">${BC.icon("phone", 20)}</span><div><strong>Nicht über ${esc(BC.cfg.appName)} buchbar.</strong><br>Kontaktiere das Studio direkt – alles, was du brauchst, steht hier.</div></div>` : ""}
      <div class="contact-actions">
        <a class="btn btn-wa" data-wa href="${waHref(st, msg)}" target="_blank" rel="noopener">${BC.icon("chat", 18)} Per WhatsApp schreiben</a>
        <a class="btn btn-sm" href="tel:+${st.whatsapp}">${BC.icon("phone", 16)} Anrufen</a>
        <a class="btn btn-sm" data-mail href="${mailHref(st, msg)}">${BC.icon("mail", 16)} E-Mail</a>
        <a class="btn btn-sm" href="https://instagram.com/${esc(st.instagram)}" target="_blank" rel="noopener">${BC.icon("insta", 16)} Instagram</a>
        <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address + ", " + city)}" target="_blank" rel="noopener">${BC.icon("pin", 16)} Route</a>
      </div>
      <div class="contact-meta">
        <div class="row"><span>${esc(st.phone)}</span><button class="link-btn" data-act="copy-text" data-text="${esc(st.phone)}">${BC.icon("copy", 14)} kopieren</button></div>
        <div class="row"><span style="overflow-wrap:anywhere">${esc(st.email)}</span><button class="link-btn" data-act="copy-text" data-text="${esc(st.email)}">${BC.icon("copy", 14)} kopieren</button></div>
        <div class="muted">${esc(st.address)}, ${esc(city)}</div>
        <div class="open-state ${os.open ? "is-open" : "is-closed"}">${BC.icon("clock", 14)} ${os.text}</div>
        <details class="collapse"><summary>Öffnungszeiten</summary>${BC.hoursTable(st)}</details>
      </div>
      <hr>
      ${opts.withDate !== false ? `<label class="field"><span>Wunschdatum (optional)</span>
        <input type="date" min="${BC.ymd(Date.now())}" value="${esc(opts.wishDate || "")}" data-change="contact-date" ${opts.wizIndex != null ? `data-i="${opts.wizIndex}"` : ""}></label>` : ""}
      <label class="field" style="margin-top:10px"><span>Deine Nachricht</span>
        <textarea data-input="contact-msg" rows="4">${esc(msg)}</textarea></label>
      <button class="btn btn-sm" data-act="copy-msg" style="margin-top:8px">${BC.icon("copy", 16)} Nachricht kopieren</button>`;
    if (opts.collapsed) {
      return `<details class="collapse contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
        <summary>Kontaktdaten anzeigen</summary>${inner}</details>`;
    }
    return `<div class="contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
      ${opts.hideHead ? "" : `<h3>${esc(st.name)}</h3>`}${inner}</div>`;
  };

  // ---------- Terminauswahl (Online-Studios) – Datumsleiste wie im Vorbild
  BC.slotPicker = (st, key, act, selectedId, extraAttr) => {
    const slots = BC.slots(st);
    if (!slots.length) return `<p class="muted">Aktuell keine freien Online-Termine.</p>`;
    const days = [];
    slots.forEach((s) => { const d = BC.ymd(s.start); if (!days.includes(d)) days.push(d); });
    const selected = slots.find((s) => s.id === selectedId);
    let day = BC.ui.slotDay[key] || (selected ? BC.ymd(selected.start) : days[0]);
    if (!days.includes(day)) day = days[0];
    const times = slots.filter((s) => BC.ymd(s.start) === day);
    return `<div class="slot-picker">
      <div class="slot-days" role="group" aria-label="Tag wählen">${days.map((d) => {
        const dt = new Date(BC.parseLocal(d + "T12:00"));
        return `<button class="chip slot-day ${d === day ? "active" : ""}" data-act="slot-day" data-key="${esc(key)}" data-day="${d}" aria-pressed="${d === day}">
          <span class="d1">${dt.getDate()}. ${dt.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}</span><span class="d2">${BC.DAYS[dt.getDay()].slice(0, 2)}</span></button>`;
      }).join("")}</div>
      <div class="slot-times" role="group" aria-label="Uhrzeit wählen">${times.map((s) =>
        `<button class="chip ${s.id === selectedId ? "active" : ""}" aria-pressed="${s.id === selectedId}" data-act="${act}" data-slot="${s.id}" data-start="${s.start}" ${extraAttr || ""}>${BC.fmtTime(s.start)}</button>`
      ).join("")}</div>
    </div>`;
  };

  // ---------- Allgemeine Aktionen dieser Bausteine
  BC.actions["slot-day"] = (el) => { BC.ui.slotDay[el.dataset.key] = el.dataset.day; BC.render(); };
  BC.actions.fav = (el) => {
    const S = BC.S();
    const id = el.dataset.id;
    if (S.favorites.includes(id)) { S.favorites = S.favorites.filter((f) => f !== id); BC.toast("Von der Merkliste entfernt"); }
    else { S.favorites.push(id); BC.toast("Gemerkt"); }
    BC.save(); BC.render();
  };
  BC.actions["copy-msg"] = async (el) => {
    const card = el.closest("[data-contact]");
    const ok = await BC.copy(card.querySelector("textarea").value);
    BC.toast(ok ? "Nachricht kopiert" : "Kopieren nicht möglich – bitte markieren und kopieren.");
  };
  BC.actions["copy-text"] = async (el) => {
    const ok = await BC.copy(el.dataset.text);
    BC.toast(ok ? `Kopiert: ${el.dataset.text}` : "Kopieren nicht möglich – bitte markieren und kopieren.");
  };
  BC.inputs["contact-msg"] = (el) => BC.updateContactLinks(el.closest("[data-contact]"));
  BC.changes["contact-date"] = (el) => {
    const card = el.closest("[data-contact]");
    const val = el.value;
    const dateText = val ? BC.fmtDateLong(BC.parseLocal(val + "T12:00")) : "";
    card.querySelector("textarea").value = BC.contactMessage(card.dataset.service, dateText);
    BC.updateContactLinks(card);
    if (el.dataset.i != null && BC.onWishDate) BC.onWishDate(Number(el.dataset.i), val);
  };
})();
