/* =========================================================
   Wiederverwendbare Bausteine (geben HTML-Text zurück)
   Stil: angelehnt an Apples Human Interface Guidelines –
   große Titel, gruppierte Listen, klare Hierarchie, viel Luft.
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  BC.ui = { slotDay: {}, topCat: "", filters: {} };

  // ---------- Linien-Icons (24×24)
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
    back: '<path d="m15 6-6 6 6 6"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
  };
  BC.icon = (name, size, fill) => `<svg width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ---------- Farben je Kategorie (Palette der Vorlage)
  const CAT_COLOR = { friseur: "yellow", naegel: "pink", pedikuere: "sky", wimpern: "green", brows: "sky", waxing: "yellow", kosmetik: "green", makeup: "pink" };
  BC.catColor = (slug) => CAT_COLOR[slug] || "pink";
  BC.tint = (h) => {
    h = ((h % 360) + 360) % 360;
    if (h >= 300 || h < 12) return "var(--pink)";
    if (h >= 220) return "var(--green)";
    if (h >= 150) return "var(--sky)";
    return "var(--yellow)";
  };

  // ---------- Illustrationen (eigene, flach, im Stil der Vorlage)
  const K = "#1C1C1E", W = "#FFFFFF", PINK = "#FF88D3", SKY = "#84E2FA", GREEN = "#A6F686", YEL = "#FFCD20";
  const o = `stroke="${K}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const ILLUS = {
    friseur: `<path d="M27 37 45 11" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M37 37 19 11" stroke="${K}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="22" cy="45" r="8.5" fill="${YEL}" ${o}/><circle cx="42" cy="45" r="8.5" fill="${YEL}" ${o}/><circle cx="22" cy="45" r="3.2" fill="${W}"/><circle cx="42" cy="45" r="3.2" fill="${W}"/><circle cx="32" cy="30" r="2.5" fill="${K}"/>`,
    naegel: `<rect x="25" y="7" width="14" height="19" rx="4" fill="${K}"/><rect x="27" y="24" width="10" height="7" fill="${K}"/>
      <rect x="15" y="29" width="34" height="27" rx="10" fill="${PINK}" ${o}/><rect x="20" y="34" width="5" height="14" rx="2.5" fill="${W}" opacity=".8"/>`,
    pedikuere: `<path d="M21 31c0-7 5-11 11-11s11 5 11 13c0 12-4 22-11 22-8 0-11-9-11-24z" fill="#F9D2B3" ${o}/>
      <circle cx="22.5" cy="19" r="3.4" fill="#F9D2B3" ${o}/><circle cx="29.5" cy="14.5" r="3.8" fill="#F9D2B3" ${o}/><circle cx="37" cy="15" r="3.4" fill="#F9D2B3" ${o}/><circle cx="43" cy="19.5" r="2.9" fill="#F9D2B3" ${o}/><circle cx="46.5" cy="25.5" r="2.5" fill="#F9D2B3" ${o}/>
      <circle cx="29.5" cy="13.6" r="1.8" fill="${SKY}"/><circle cx="37" cy="14.2" r="1.6" fill="${SKY}"/><circle cx="22.5" cy="18.2" r="1.6" fill="${SKY}"/>`,
    wimpern: `<path d="M9 35c8-10 16-14 23-14s15 4 23 14c-8 10-16 14-23 14S17 45 9 35z" fill="${W}" ${o}/>
      <circle cx="32" cy="35" r="8.5" fill="${GREEN}" ${o}/><circle cx="32" cy="35" r="3.6" fill="${K}"/><circle cx="34.5" cy="32.5" r="1.4" fill="${W}"/>
      <path d="m17 27-4-6M24 23.5l-2.5-7M32 22v-7.5M40 23.5l2.5-7M47 27l4-6" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/>`,
    brows: `<path d="M12 28c9-9 25-11 40-3" stroke="#5B3A2E" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <path d="M18 43c8 6 20 6 28 0" stroke="${K}" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="m22 46-2 4M32 48v4.5M42 46l2 4" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
      <path transform="translate(51 13)" d="M0-7C.7-1.5 1.5-.7 7 0 1.5.7.7 1.5 0 7-.7 1.5-1.5.7-7 0-1.5-.7-.7-1.5 0-7z" fill="${YEL}" ${o}/>`,
    waxing: `<path d="M41 7l6 2.2-8 25-5.2-1.8z" fill="#F4DDB8" ${o}/>
      <rect x="14" y="31" width="34" height="23" rx="7" fill="${W}" ${o}/><ellipse cx="31" cy="31" rx="17" ry="5" fill="${YEL}" ${o}/><path d="M22 33c0 5 3 5 3 9" stroke="${YEL}" stroke-width="3.2" stroke-linecap="round"/>`,
    kosmetik: `<rect x="15" y="17" width="34" height="11" rx="4.5" fill="${GREEN}" ${o}/><rect x="13" y="27" width="38" height="27" rx="9" fill="${W}" ${o}/>
      <circle cx="32" cy="40.5" r="6.5" fill="${GREEN}" ${o}/><path transform="translate(50 11)" d="M0-6C.6-1.3 1.3-.6 6 0 1.3.6.6 1.3 0 6-.6 1.3-1.3.6-6 0-1.3-.6-.6-1.3 0-6z" fill="${YEL}" ${o}/>`,
    makeup: `<rect x="21" y="37" width="22" height="20" rx="3.5" fill="${K}"/><rect x="23.5" y="26" width="17" height="12" fill="#D9D9DE" ${o}/>
      <path d="M25.5 26V14l13-7v19z" fill="${PINK}" ${o}/><rect x="25" y="42" width="3" height="10" rx="1.5" fill="${W}" opacity=".35"/>`
  };
  BC.illus = (slug, size) => `<svg width="${size || 40}" height="${size || 40}" viewBox="0 0 64 64" aria-hidden="true" fill="none">${ILLUS[slug] || ILLUS.naegel}</svg>`;
  const catByIcon = (icon) => BC.categories().find((c) => c.icon === icon);

  // Bildfläche: Illustration der Kategorie auf passendem Pastellgrund
  BC.ph = (hue, icon, cls, extra) => {
    const cat = catByIcon(icon);
    const color = cat ? `var(--${BC.catColor(cat.slug)})` : BC.tint(hue);
    return `<div class="ph ${cls || ""}" style="--tint:${color}" aria-hidden="true">${cat ? BC.illus(cat.slug, "62%") : icon || ""}${extra || ""}</div>`;
  };
  BC.studioIcon = (st) => BC.category(st.categories[0]).icon;
  BC.thumb = (st, size) => {
    const c = st.categories[0];
    return `<span class="thumb" style="--tint:var(--${BC.catColor(c)});width:${size || 52}px;height:${size || 52}px" aria-hidden="true">${BC.illus(c, Math.round((size || 52) * 0.68))}</span>`;
  };
  // Titelbild eines Studios: Illustration groß auf Pastellfläche mit ruhigen Formen
  BC.cover = (st, cls) => {
    const c = st.categories[0], c2 = st.categories[1];
    const r = BC.data.rng(st.id + "cover");
    const x1 = Math.round(10 + r() * 25), x2 = Math.round(65 + r() * 25);
    return `<div class="cover ${cls || ""}" style="--tint:var(--${BC.catColor(c)});--blob:var(--${BC.catColor(c)}-strong);--x1:${x1}%;--x2:${x2}%" role="img" aria-label="Titelbild ${esc(st.name)}">
      <span class="cover-main">${BC.illus(c, "100%")}</span>
      ${c2 ? `<span class="cover-side">${BC.illus(c2, "100%")}</span>` : ""}
    </div>`;
  };

  // ---------- Kennzeichen der Buchungsart (dezent: Punkt + Text)
  const MODES = {
    online: { cls: "mode-online", text: "Online buchbar", short: "Online buchbar" },
    request: { cls: "mode-request", text: "Anfrage möglich", short: "Auf Anfrage" },
    manual: { cls: "mode-manual", text: "Nur manuell buchbar", short: "Nur direkt beim Studio" }
  };
  BC.MODES = MODES;
  BC.modeBadge = (mode, short) => `<span class="mode-badge ${MODES[mode].cls}"><span class="dot" aria-hidden="true"></span>${short ? MODES[mode].short : MODES[mode].text}</span>`;

  // ---------- Kleinteile
  BC.ratingHtml = (st) => { const r = BC.ratingOf(st); return `<span class="rating">${BC.icon("star", 13, true)}${r.rating.toFixed(1).replace(".", ",")} <span class="muted">(${r.count})</span></span>`; };
  BC.priceLevel = (n) => `<span class="price-level" title="Preisniveau"><b>${"€".repeat(n)}</b>${"€".repeat(3 - n)}</span>`;
  BC.avatar = (name) => `<span class="avatar" style="--tint:${BC.tint(BC.hueOf(name))}" aria-hidden="true">${esc(name.charAt(0))}</span>`;
  BC.empty = (icon, text, ctaHtml) => `<div class="empty">${icon ? `<div class="big">${icon}</div>` : ""}<p>${text}</p>${ctaHtml || ""}</div>`;
  BC.isFav = (id) => BC.S().favorites.includes(id);
  BC.favBtn = (st, cls) => `<button class="fav-btn ${cls || ""}" data-act="fav" data-id="${st.id}" aria-pressed="${BC.isFav(st.id)}" aria-label="${BC.isFav(st.id) ? "Von Merkliste entfernen" : "Merken"}">${BC.icon("heart", 20, BC.isFav(st.id))}</button>`;
  BC.fromPrice = (st) => Math.min(...BC.servicesOf(st.id).map((v) => v.price));
  BC.chev = () => `<span class="chev">${BC.icon("chevron", 18)}</span>`;

  // ---------- Studio als Listenzeile (iOS-Liste)
  BC.studioRow = (st) => {
    const r = BC.ratingOf(st);
    return `<a class="row-item" href="#/s/${st.citySlug}/studio/${st.slug}">
      ${BC.thumb(st)}
      <span class="ri-body"><strong>${esc(st.name)}</strong>
        <span class="ri-sub">${esc(BC.category(st.categories[0]).name)} · ${esc(st.district)}</span>
        <span class="ri-meta"><span class="rating">${BC.icon("star", 12, true)}${r.rating.toFixed(1).replace(".", ",")}</span> · ab ${BC.euro(BC.fromPrice(st))} · ${BC.modeBadge(st.bookingMode, true)}</span></span>
      ${BC.chev()}</a>`;
  };
  BC.studioList = (list) => `<div class="group">${list.map(BC.studioRow).join("")}</div>`;
  BC.studioCard = (st) => BC.studioList([st]);

  // Große Karte mit Titelbild (horizontal scrollbar)
  BC.studioTile = (st) => {
    const r = BC.ratingOf(st);
    return `<a class="tile" href="#/s/${st.citySlug}/studio/${st.slug}">
      ${BC.cover(st)}
      <span class="tile-body"><strong>${esc(st.name)}</strong>
        <span class="ri-sub">${esc(BC.category(st.categories[0]).name)} · ${esc(st.district)}</span>
        <span class="ri-meta"><span class="rating">${BC.icon("star", 12, true)}${r.rating.toFixed(1).replace(".", ",")}</span> · ab ${BC.euro(BC.fromPrice(st))}</span></span></a>`;
  };

  // ---------- Kopfzeilen
  // Großer Titel für Hauptseiten
  BC.pageHead = (title, opts) => {
    opts = opts || {};
    return `<div class="large-head">${opts.eyebrow ? `<span class="eyebrow">${opts.eyebrow}</span>` : ""}
      <div class="lh-row"><h1>${title}</h1>${opts.trailing || ""}${opts.plus ?`<a class="icon-btn dark" href="${opts.plus}" aria-label="${esc(opts.plusLabel || "Neu")}">${BC.icon("plus", 22)}</a>` : ""}</div></div>`;
  };
  // Navigationsleiste für Unterseiten: Zurück, Titel mittig, optional rechts
  BC.navBar = (title, backHref, trailing) => `<div class="nav-bar">
      <a class="icon-btn" href="${backHref}" aria-label="Zurück">${BC.icon("back", 22)}</a>
      <span class="nb-title">${title}</span>
      <span class="nb-trail">${trailing || ""}</span></div>`;

  // ---------- Paket-Karte mit Bild aus den enthaltenen Kategorien
  BC.packageCover = (p) => {
    const cats = [...new Set(p.items.map((i) => i.categorySlug))].slice(0, 3);
    return `<div class="pkg-cover" style="--tint:${BC.tint(p.hue)}" aria-hidden="true">${cats.map((c) => `<span class="pc-bubble" style="--tint:var(--${BC.catColor(c)})">${BC.illus(c, "70%")}</span>`).join("")}</div>`;
  };
  BC.packageCard = (p, citySlug) => `<a class="pkg-card" href="#/s/${citySlug}/pakete/${p.slug}">
      ${BC.packageCover(p)}
      <span class="tile-body"><span class="spread"><strong>${esc(p.name)}</strong>${p.discountPercent ? `<span class="tag">−${p.discountPercent} %</span>` : ""}</span>
      <span class="ri-sub">${p.items.map((i) => esc(i.label)).join(" · ")}</span></span>
    </a>`;

  // ---------- Kontakt (gruppierte Zeilen wie in iOS "Kontakte")
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

  const cRow = (icon, color, title, sub, attrs, trailing) => `<a class="row-item" ${attrs}>
      <span class="ri-icon" style="--tint:${color}">${BC.icon(icon, 18)}</span>
      <span class="ri-body"><strong>${title}</strong>${sub ? `<span class="ri-sub">${sub}</span>` : ""}</span>${trailing || BC.chev()}</a>`;

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
      ${showNotice ? `<div class="callout"><strong>Nicht über ${esc(BC.cfg.appName)} buchbar</strong><span>Dieses Studio vergibt Termine nur direkt. Schreib oder ruf an – deine Nachricht ist schon vorbereitet.</span></div>` : ""}
      <div class="group">
        ${cRow("chat", "var(--green-strong)", "WhatsApp", "Nachricht ist vorbereitet", `data-wa href="${waHref(st, msg)}" target="_blank" rel="noopener"`)}
        ${cRow("phone", "var(--sky-strong)", "Anrufen", esc(st.phone), `href="tel:+${st.whatsapp}"`, `<button class="link-btn" data-act="copy-text" data-text="${esc(st.phone)}" aria-label="Nummer kopieren">${BC.icon("copy", 16)}</button>`)}
        ${cRow("mail", "var(--yellow-strong)", "E-Mail", esc(st.email), `data-mail href="${mailHref(st, msg)}"`)}
        ${cRow("insta", "var(--pink-strong)", "Instagram", "@" + esc(st.instagram), `href="https://instagram.com/${esc(st.instagram)}" target="_blank" rel="noopener"`)}
        ${cRow("pin", "var(--fill-strong)", "Route", `${esc(st.address)}, ${esc(city)}`, `href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address + ", " + city)}" target="_blank" rel="noopener"`)}
      </div>
      <p class="footnote"><span class="open-state ${os.open ? "is-open" : "is-closed"}">${os.text}</span></p>
      <details class="disclosure"><summary>Nachricht ansehen und anpassen</summary>
        <div class="stack" style="margin-top:10px">
          ${opts.withDate !== false ? `<label class="field"><span>Wunschdatum (optional)</span>
            <input type="date" min="${BC.ymd(Date.now())}" value="${esc(opts.wishDate || "")}" data-change="contact-date" ${opts.wizIndex != null ? `data-i="${opts.wizIndex}"` : ""}></label>` : ""}
          <label class="field"><span>Nachricht</span><textarea data-input="contact-msg" rows="4">${esc(msg)}</textarea></label>
          <button class="btn btn-secondary" data-act="copy-msg">${BC.icon("copy", 16)} Nachricht kopieren</button>
        </div></details>`;
    if (opts.collapsed) {
      return `<details class="disclosure contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
        <summary>Kontakt zu ${esc(st.name)}</summary>${inner}</details>`;
    }
    return `<div class="contact-card" data-contact="${esc(key)}" data-studio="${st.id}" data-service="${esc(opts.service || "")}">
      ${opts.hideHead ? "" : `<h3>${esc(st.name)}</h3>`}${inner}</div>`;
  };

  // ---------- Terminauswahl: Wochentag + Datum im Kreis, darunter Uhrzeiten
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
        return `<button class="slot-day ${d === day ? "active" : ""}" data-act="slot-day" data-key="${esc(key)}" data-day="${d}" aria-pressed="${d === day}" aria-label="${BC.fmtDateLong(dt)}">
          <span class="wd">${BC.DAYS[dt.getDay()].slice(0, 2)}</span><span class="num">${dt.getDate()}</span></button>`;
      }).join("")}</div>
      <p class="footnote" style="margin:6px 0 10px">${BC.fmtDateLong(BC.parseLocal(day + "T12:00"))}</p>
      <div class="slot-times" role="group" aria-label="Uhrzeit wählen">${times.map((s) =>
        `<button class="time-chip ${s.id === selectedId ? "active" : ""}" aria-pressed="${s.id === selectedId}" data-act="${act}" data-slot="${s.id}" data-start="${s.start}" ${extraAttr || ""}>${BC.fmtTime(s.start)}</button>`
      ).join("")}</div>
    </div>`;
  };

  // ---------- Allgemeine Aktionen dieser Bausteine
  BC.actions["slot-day"] = (el) => { BC.ui.slotDay[el.dataset.key] = el.dataset.day; BC.render(); };
  BC.actions.fav = (el) => {
    const S = BC.S();
    const id = el.dataset.id;
    if (S.favorites.includes(id)) { S.favorites = S.favorites.filter((f) => f !== id); BC.toast("Von der Merkliste entfernt"); }
    else { S.favorites.push(id); BC.toast("Zur Merkliste hinzugefügt"); }
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
