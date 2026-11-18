/* =========================================================
   Wiederverwendbare Bausteine (geben HTML-Text zurück)
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  BC.ui = { slotDay: {}, topCat: "", filters: {} };

  // ---------- Kennzeichen der Buchungsart
  const MODES = {
    online: { cls: "mode-online", icon: "📅", text: "Online buchbar" },
    request: { cls: "mode-request", icon: "⏳", text: "Anfrage möglich" },
    manual: { cls: "mode-manual", icon: "📞", text: "Nur manuell buchbar" }
  };
  BC.MODES = MODES;
  BC.modeBadge = (mode) => {
    const m = MODES[mode];
    return `<span class="mode-badge ${m.cls}"><span aria-hidden="true">${m.icon}</span>${m.text}</span>`;
  };

  // ---------- Kleinteile
  BC.ph = (hue, icon, cls, extra) => `<div class="ph ${cls || ""}" style="--h:${hue}" aria-hidden="true">${icon || ""}${extra || ""}</div>`;
  BC.studioIcon = (st) => BC.category(st.categories[0]).icon;
  BC.ratingHtml = (st) => { const r = BC.ratingOf(st); return `<span class="rating">★ ${r.rating.toFixed(1).replace(".", ",")} <span class="muted">(${r.count})</span></span>`; };
  BC.priceLevel = (n) => `<span class="price-level" title="Preisniveau"><b>${"€".repeat(n)}</b>${"€".repeat(3 - n)}</span>`;
  BC.avatar = (name) => `<span class="avatar" style="--h:${BC.hueOf(name)}" aria-hidden="true">${esc(name.charAt(0))}</span>`;
  BC.empty = (icon, text, ctaHtml) => `<div class="empty card"><div class="big">${icon}</div><p>${text}</p>${ctaHtml || ""}</div>`;
  BC.isFav = (id) => BC.S().favorites.includes(id);
  BC.favBtn = (st) => `<button class="fav-btn" data-act="fav" data-id="${st.id}" aria-pressed="${BC.isFav(st.id)}" aria-label="${BC.isFav(st.id) ? "Von Merkliste entfernen" : "Merken"}">${BC.isFav(st.id) ? "❤️" : "🤍"}</button>`;

  // ---------- Studio-Karte
  BC.studioCard = (st, opts) => {
    opts = opts || {};
    const href = `#/s/${st.citySlug}/studio/${st.slug}`;
    const cats = st.categories.map((c) => BC.category(c).name).join(" · ");
    return `<article class="card studio-card">
      <a href="${href}" class="sr-only">${esc(st.name)} ansehen</a>
      ${BC.ph(st.hue, BC.studioIcon(st))}
      <div class="body">
        <a href="${href}" style="color:inherit"><h3>${opts.rank ? `<span class="tag tag-gold">#${opts.rank}</span> ` : ""}${esc(st.name)}</h3></a>
        <div class="meta">${esc(st.district)} · ${esc(cats)}</div>
        <div class="row">${BC.ratingHtml(st)} ${BC.priceLevel(st.priceLevel)}</div>
        ${BC.modeBadge(st.bookingMode)}
      </div>
      ${BC.favBtn(st)}
    </article>`;
  };

  // ---------- Paket-Karte
  BC.packageCard = (p, citySlug) => `<a class="card card-link pkg-card" href="#/s/${citySlug}/pakete/${p.slug}">
      ${BC.ph(p.hue, p.icon)}
      <div class="spread"><h3 style="margin:0">${esc(p.name)}</h3>${p.discountPercent ? `<span class="tag">−${p.discountPercent} %</span>` : ""}</div>
      <ul>${p.items.map((i) => `<li>${esc(i.label)}</li>`).join("")}</ul>
      <span class="btn btn-soft btn-sm">Paket zusammenstellen →</span>
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
      ${showNotice ? `<div class="notice notice-manual" role="note"><span class="ic" aria-hidden="true">📞</span><div><strong>Dieses Studio kann nicht über ${esc(BC.cfg.appName)} gebucht werden.</strong><br>Bitte kontaktiere es direkt – hier sind alle Kontaktdaten.</div></div>` : ""}
      <div class="contact-actions">
        <a class="btn btn-sm" href="tel:+${st.whatsapp}">📞 Anrufen</a>
        <a class="btn btn-sm btn-wa" data-wa href="${waHref(st, msg)}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <a class="btn btn-sm" data-mail href="${mailHref(st, msg)}">✉️ E-Mail</a>
        <a class="btn btn-sm" href="https://instagram.com/${esc(st.instagram)}" target="_blank" rel="noopener">📸 Instagram</a>
        <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address + ", " + city)}" target="_blank" rel="noopener">📍 Route</a>
      </div>
      <div class="contact-meta">
        <div class="row" style="gap:6px">📞 <span>${esc(st.phone)}</span><button class="link-btn" data-act="copy-text" data-text="${esc(st.phone)}">kopieren</button></div>
        <div class="row" style="gap:6px">✉️ <span style="overflow-wrap:anywhere">${esc(st.email)}</span><button class="link-btn" data-act="copy-text" data-text="${esc(st.email)}">kopieren</button></div>
        <div>📍 ${esc(st.address)}, ${esc(city)}</div>
        <div class="open-state ${os.open ? "is-open" : "is-closed"}">🕒 ${os.text}</div>
        <details class="collapse"><summary>Alle Öffnungszeiten</summary>${BC.hoursTable(st)}</details>
      </div>
      <hr style="margin:14px 0">
      ${opts.withDate !== false ? `<label class="field"><span>Wunschdatum (optional)</span>
        <input type="date" min="${BC.ymd(Date.now())}" value="${esc(opts.wishDate || "")}" data-change="contact-date" ${opts.wizIndex != null ? `data-i="${opts.wizIndex}"` : ""}></label>` : ""}
      <label class="field" style="margin-top:10px"><span>Fertige Nachricht (kannst du anpassen)</span>
        <textarea data-input="contact-msg" rows="4">${esc(msg)}</textarea></label>
      <div class="row" style="margin-top:8px">
        <button class="btn btn-sm" data-act="copy-msg">📋 Nachricht kopieren</button>
        <span class="xs muted">WhatsApp und E-Mail übernehmen den Text automatisch.</span>
      </div>`;
    const head = `<strong>${esc(st.name)}</strong> · <span class="muted small">${esc(st.district)}</span>`;
    if (opts.collapsed) {
      return `<details class="collapse contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
        <summary>Kontaktdaten von ${esc(st.name)} anzeigen</summary>${inner}</details>`;
    }
    return `<div class="contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
      ${opts.hideHead ? "" : `<div style="margin-bottom:10px">${head}</div>`}${inner}</div>`;
  };

  // ---------- Terminauswahl (Online-Studios)
  /* act: Name der Aktion beim Klick auf eine Uhrzeit; key: eindeutig; selectedId: gewählter Slot */
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
        const t = BC.parseLocal(d + "T12:00");
        const dt = new Date(t);
        return `<button class="chip slot-day ${d === day ? "active" : ""}" data-act="slot-day" data-key="${esc(key)}" data-day="${d}" aria-pressed="${d === day}">
          ${BC.DAYS[dt.getDay()].slice(0, 2)}<small>${BC.pad(dt.getDate())}.${BC.pad(dt.getMonth() + 1)}.</small></button>`;
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
    else { S.favorites.push(id); BC.toast("Zur Merkliste hinzugefügt ❤️"); }
    BC.save(); BC.render();
  };
  BC.actions["copy-msg"] = async (el) => {
    const card = el.closest("[data-contact]");
    const ok = await BC.copy(card.querySelector("textarea").value);
    BC.toast(ok ? "Nachricht kopiert – jetzt einfügen und senden 📋" : "Kopieren nicht möglich – bitte markieren und kopieren.");
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
