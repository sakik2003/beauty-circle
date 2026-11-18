/* =========================================================
   Seiten: Start, Stadt, Kategorie, Studio, Pakete, Rechtliches
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  const P = BC.pages;
  const CFG = BC.cfg;

  // ---------- Startseite (Onboarding)
  const sparkle = (x, y, s) => `<path class="c-sand" transform="translate(${x} ${y}) scale(${s})" d="M0-14C1.5-3 3-1.5 14 0 3 1.5 1.5 3 0 14-1.5 3-3 1.5-14 0-3-1.5-1.5-3 0-14z"/>`;
  const illustration = () => `<svg class="illu" viewBox="0 0 320 290" role="img" aria-label="Illustration: Nagellack vor einem Herz">
      ${sparkle(34, 54, 1)}${sparkle(286, 36, .8)}${sparkle(26, 226, .7)}${sparkle(292, 214, 1)}
      <circle class="c-sky" cx="160" cy="148" r="118"/>
      <path class="c-pink" d="M160 262C70 205 38 150 52 108 66 66 120 52 160 98c40-46 94-32 108 10 14 42-18 97-108 154z"/>
      <rect class="c-white" x="226" y="80" width="14" height="44" rx="3"/><rect class="c-white" x="211" y="95" width="44" height="14" rx="3"/>
      <rect class="c-ink" x="134" y="58" width="52" height="64" rx="14"/>
      <rect class="c-ink" x="142" y="116" width="36" height="24" rx="4"/>
      <rect class="c-lav" x="116" y="136" width="88" height="96" rx="20"/>
      <rect class="s-ink" x="116" y="136" width="88" height="96" rx="20"/>
      <rect class="c-white" x="131" y="152" width="13" height="42" rx="6.5"/>
      <circle class="c-white" cx="137" cy="206" r="5"/>
    </svg>`;

  P.home = () => {
    const city = BC.currentCity();
    const S = BC.S();
    return {
      title: `${CFG.appName} – Beauty-Empfehlungen von Frauen für Frauen`,
      html: `
      <section class="onboard">
        ${illustration()}
        <h1>Beauty, die immer nah ist</h1>
        <p>Die besten Studios deiner Stadt, empfohlen von Frauen.</p>
        <a class="btn btn-primary" href="#/s/${city}">Los geht's</a>
      </section>
      <section class="section">
        <div class="section-head"><h2>Stadt wählen</h2></div>
        <div class="group">${BC.cities().map((c, i) => `<a class="row-item" href="#/s/${c.slug}">
          <span class="ri-icon" style="--tint:var(--${["sky", "pink", "yellow", "green"][i % 4]}-strong)">${BC.icon("pin", 18)}</span>
          <span class="ri-body"><strong>${esc(c.name)}</strong><span class="ri-sub">${BC.studios(c.slug).length} Studios · ${(CFG.communitySize[c.slug] || 500).toLocaleString("de-DE")} Frauen</span></span>
          ${S.citySlug === c.slug ? `<span class="ri-value">Deine Stadt</span>` : ""}${BC.chev()}</a>`).join("")}</div>
      </section>`
    };
  };

  // ---------- Entdecken (Stadtseite)
  const citySwitch = (citySlug) => `<select class="city-select" data-change="city-switch" aria-label="Stadt wechseln">${BC.cities().map((c) => `<option value="${c.slug}" ${c.slug === citySlug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>`;
  P.city = (citySlug) => {
    const city = BC.city(citySlug);
    const all = BC.studios(citySlug);
    const top = all.slice(0, 5);
    const online = all.filter((s) => s.bookingMode === "online" && !top.includes(s)).slice(0, 4);
    return {
      title: `Beauty in ${city.name} – ${CFG.appName}`,
      html: `
      ${BC.pageHead("Entdecken", { eyebrow: `${all.length} Studios in ${esc(city.name)}`, trailing: citySwitch(citySlug) })}
      <a class="search-field" href="#/s/${citySlug}/k/alle">${BC.icon("search", 18)} Studios suchen</a>

      <section class="section" style="margin-top:22px">
        <div class="cat-scroll">${BC.categories().map((c) => `<a class="cat-item" href="#/s/${citySlug}/k/${c.slug}">${BC.ph(c.hue, c.icon)}<span>${esc(c.name.split(" ")[0])}</span></a>`).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Beliebt in ${esc(city.name)}</h2><a href="#/s/${citySlug}/k/alle">Alle</a></div>
        <div class="tiles">${top.map(BC.studioTile).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Sofort online buchbar</h2></div>
        ${BC.studioList(online)}
      </section>`
    };
  };

  // ---------- Studioliste
  P.category = (citySlug, catSlug) => {
    const city = BC.city(citySlug);
    const cat = catSlug === "alle" ? { slug: "alle", name: "Alle Studios" } : BC.category(catSlug);
    if (!cat) return P.notFound();
    const fkey = `${citySlug}/${catSlug}`;
    const f = (BC.ui.filters[fkey] = BC.ui.filters[fkey] || {});
    const catF = catSlug === "alle" ? undefined : catSlug;
    const all = BC.studios(citySlug, { category: catF });
    const list = BC.studios(citySlug, Object.assign({}, f, { category: catF }));
    const districts = [...new Set(all.map((s) => s.district))].sort();
    const langs = [...new Set(all.flatMap((s) => s.languages))].sort();
    const sel = (name, label, options) => `<label class="field"><span>${label}</span><select data-change="filter" data-key="${fkey}" data-name="${name}">
      ${options.map(([v, t]) => `<option value="${esc(v)}" ${String(f[name] || "") === String(v) ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    return {
      title: `${cat.name} in ${city.name} – ${CFG.appName}`,
      html: `
      ${BC.navBar(esc(cat.name), `#/s/${citySlug}`)}
      <div class="chips" role="group" aria-label="Buchungsart">
        ${[["", "Alle"], ["online", "Online"], ["request", "Anfrage"], ["manual", "Direkt"]].map(([v, t]) =>
          `<button class="chip ${String(f.mode || "") === v ? "active" : ""}" aria-pressed="${String(f.mode || "") === v}" data-act="filter-mode" data-key="${fkey}" data-mode="${v}">${t}</button>`).join("")}
      </div>
      <details class="disclosure" ${["district", "price", "language"].some((k) => f[k]) ? "open" : ""}><summary>Filter & Sortierung</summary>
        <div class="filters" style="margin-top:8px">
          ${sel("district", "Bezirk", [["", "Alle"], ...districts.map((d) => [d, d])])}
          ${sel("price", "Preis", [["", "Alle"], ["1", "€"], ["2", "€€"], ["3", "€€€"]])}
          ${sel("language", "Sprache", [["", "Alle"], ...langs.map((l) => [l, l])])}
          ${sel("sort", "Sortieren", [["score", "Beliebteste"], ["online", "Online zuerst"], ["price", "Günstigste"], ["reviews", "Meiste Bewertungen"]])}
        </div>
      </details>
      <div class="spread" style="margin:14px 4px 8px"><span class="footnote" style="margin:0">${list.length} ${list.length === 1 ? "Studio" : "Studios"}</span>
        ${Object.values(f).some(Boolean) ? `<button class="link-btn" data-act="filter-reset" data-key="${fkey}">Zurücksetzen</button>` : ""}</div>
      ${list.length ? BC.studioList(list) : BC.empty("", "Keine Studios mit diesen Filtern.", `<button class="btn btn-secondary" data-act="filter-reset" data-key="${fkey}">Filter zurücksetzen</button>`)}`
    };
  };
  BC.changes.filter = (el) => { BC.ui.filters[el.dataset.key][el.dataset.name] = el.value; BC.render(); };
  BC.actions["filter-reset"] = (el) => { BC.ui.filters[el.dataset.key] = {}; BC.render(); };
  BC.actions["filter-mode"] = (el) => { BC.ui.filters[el.dataset.key].mode = el.dataset.mode; BC.render(); };

  // ---------- Studio-Profil
  P.studio = (citySlug, slug) => {
    const st = BC.studio(citySlug, slug);
    if (!st) return P.notFound();
    const city = BC.city(citySlug);
    const services = BC.servicesOf(st.id);
    if (!BC.ui.single || BC.ui.single.studioId !== st.id) BC.ui.single = { studioId: st.id, serviceId: services[0].id, slotId: null, start: null };
    const single = BC.ui.single;
    const reviews = BC.reviewsOf(st.id);
    const r = BC.ratingOf(st);
    const os = BC.openState(st);
    const serviceSelect = `<label class="field"><span>Leistung</span><select data-change="single-service">${services.map((v) => `<option value="${v.id}" ${v.id === single.serviceId ? "selected" : ""}>${esc(v.name)} · ${BC.euro(v.price)}</option>`).join("")}</select></label>`;
    const service = BC.service(single.serviceId);

    let booking = "";
    if (st.bookingMode === "online") {
      booking = `<div class="spread" style="margin-bottom:14px"><h2 style="margin:0">Termin buchen</h2>${BC.modeBadge("online")}</div>
        <div class="stack">${serviceSelect}${BC.slotPicker(st, "single", "single-slot", single.slotId)}
        <button class="btn btn-primary btn-block" data-act="single-book" ${single.slotId ? "" : "disabled"}>${single.slotId ? `Buchen · ${BC.fmtDateTime(single.start)}` : "Uhrzeit wählen"}</button></div>`;
    } else if (st.bookingMode === "request") {
      const min = BC.toLocalInput(Date.now() + 3600000);
      booking = `<div class="spread" style="margin-bottom:6px"><h2 style="margin:0">Termin anfragen</h2>${BC.modeBadge("request")}</div>
        <p class="footnote" style="margin:0 0 14px">Bis zu drei Wunschtermine – das Studio bestätigt einen.</p>
        <form data-submit="single-request" class="stack">${serviceSelect}
          ${[1, 2, 3].map((n) => `<label class="field"><span>Wunschtermin ${n}${n === 1 ? "" : " (optional)"}</span><input type="datetime-local" name="t${n}" min="${min}" step="1800" ${n === 1 ? "required" : ""}></label>`).join("")}
          <button class="btn btn-primary btn-block" type="submit">Anfrage senden</button>
        </form>`;
    } else {
      booking = `<h2>Termin vereinbaren</h2><div class="stack">${serviceSelect}${BC.contactCard(st, { service: service.name, hideHead: true, key: "single-c" })}</div>`;
    }

    const myReviewForm = `<form class="stack" data-submit="review" data-studio="${st.id}" style="margin-top:10px">
      ${BC.hasBookedWith(st.id) ? `<p class="small verified">Deine Bewertung wird als „verifiziert“ markiert.</p>` : ""}
      <fieldset style="border:none;padding:0;margin:0"><legend class="sr-only">Sterne</legend>
        <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="st-${n}" name="rating" value="${n}" ${n === 5 ? "required" : ""}><label for="st-${n}" title="${n} Sterne">★</label>`).join("")}</div></fieldset>
      <label class="field"><span>Leistung</span><select name="service">${services.map((v) => `<option value="${v.categorySlug}">${esc(v.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Deine Erfahrung</span><textarea name="text" required minlength="10" maxlength="800" placeholder="Wie war das Ergebnis?"></textarea></label>
      <label class="field"><span>Fotos (max. 4)</span><input type="file" name="photos" accept="image/*" multiple></label>
      <button class="btn btn-primary" type="submit">Veröffentlichen</button>
    </form>`;

    return {
      title: `${st.name} – ${BC.category(st.categories[0]).name} in ${city.name}`,
      html: `
      ${BC.navBar("", `#/s/${citySlug}/k/${st.categories[0]}`, BC.favBtn(st))}
      ${BC.cover(st)}
      <div class="studio-head">
        <h1>${esc(st.name)}</h1>
        <div class="ri-sub">${st.categories.map((c) => esc(BC.category(c).name)).join(" · ")} · ${esc(st.district)}</div>
      </div>
      <div class="info-boxes">
        <div class="info-box"><span>Bewertung</span><strong>★ ${r.rating.toFixed(1).replace(".", ",")}</strong></div>
        <div class="info-box"><span>Preise ab</span><strong>${BC.euro(BC.fromPrice(st))}</strong></div>
        <div class="info-box"><span>Heute</span><strong class="open-state ${os.open ? "is-open" : "is-closed"}">${os.open ? "Offen" : "Zu"}</strong></div>
      </div>

      <div class="card" id="booking">${booking}</div>

      <section class="section">
        <div class="section-head"><h2>Leistungen</h2></div>
        <div class="group">${services.map((v) => `<div class="service-row"><div><div>${esc(v.name)}</div><div class="xs">ca. ${v.durationMin} Min.</div></div><span style="font-weight:500">${BC.euro(v.price)}</span></div>`).join("")}</div>
      </section>

      ${st.bookingMode !== "manual" ? `<section class="section"><div class="section-head"><h2>Kontakt</h2></div>${BC.contactCard(st, { service: service.name, hideHead: true, key: "single-c", notice: false })}</section>` : ""}

      <section class="section">
        <div class="section-head"><h2>Öffnungszeiten</h2></div>
        <div class="card" style="padding:6px 16px">${BC.hoursTable(st)}</div>
        <p class="footnote">${esc(st.address)}, ${esc(city.name)} · Sprachen: ${st.languages.map(esc).join(", ")}</p>
      </section>

      <section class="section">
        <div class="section-head"><h2>Bewertungen</h2><span class="rating">${BC.icon("star", 14, true)}${r.rating.toFixed(1).replace(".", ",")} <span class="muted">(${r.count})</span></span></div>
        <div class="group">
          ${reviews.slice(0, 4).map((rv) => `<div class="review"><div class="row" style="flex-wrap:nowrap">${BC.avatar(rv.author)}<div style="flex:1;min-width:0"><strong style="font-weight:500">${esc(rv.author)}</strong>${rv.verified ? ` <span class="verified">${BC.icon("check", 12)} verifiziert</span>` : ""}<div class="xs">${BC.ago(rv.date)}</div></div><span class="rating">${BC.icon("star", 13, true)}${rv.rating}</span></div>
            <p>${esc(rv.text)}</p>
            ${rv.images && rv.images.length ? `<div class="row" style="margin-top:8px">${rv.images.map((src) => `<img src="${esc(src)}" alt="Foto von ${esc(rv.author)}" style="height:72px;width:72px;object-fit:cover;border-radius:12px">`).join("")}</div>` : ""}
          </div>`).join("")}
        </div>
        <div class="card" style="margin-top:12px;padding:6px 16px 14px"><details class="disclosure"><summary>Bewertung schreiben</summary>${myReviewForm}</details></div>
      </section>`
    };
  };
  BC.changes["single-service"] = (el) => {
    BC.ui.single.serviceId = el.value;
    const card = document.querySelector('[data-contact="single-c"]');
    if (card) {
      card.dataset.service = BC.service(el.value).name;
      const date = card.querySelector('input[type="date"]');
      card.querySelector("textarea").value = BC.contactMessage(card.dataset.service, date && date.value ? BC.fmtDateLong(BC.parseLocal(date.value + "T12:00")) : "");
      BC.updateContactLinks(card);
    }
  };
  BC.actions["single-slot"] = (el) => { BC.ui.single.slotId = el.dataset.slot; BC.ui.single.start = Number(el.dataset.start); BC.render(); };
  BC.actions["single-book"] = () => {
    const s = BC.ui.single;
    if (!s.slotId) return;
    const S = BC.S();
    S.bookings.push({ id: BC.uid(), studioId: s.studioId, serviceId: s.serviceId, type: "online", status: "confirmed", start: s.start, createdAt: Date.now() });
    S.bookedSlots.push(s.slotId);
    BC.save();
    BC.ui.single = null;
    BC.toast("Gebucht. Du findest den Termin unter „Meine Buchungen“.");
    BC.go("#/konto/buchungen");
  };
  BC.submits["single-request"] = (form) => {
    const times = ["t1", "t2", "t3"].map((n) => form.elements[n].value).filter(Boolean).map(BC.parseLocal);
    if (!times.length) return BC.toast("Bitte mindestens einen Wunschtermin angeben.");
    const S = BC.S();
    S.bookings.push({ id: BC.uid(), studioId: BC.ui.single.studioId, serviceId: BC.ui.single.serviceId, type: "request", status: "pending", requestedTimes: times, createdAt: Date.now() });
    BC.save();
    BC.ui.single = null;
    BC.toast(`Anfrage gesendet! Das Studio antwortet meist schnell (Demo: ${CFG.requestConfirmSeconds} Sek.).`);
    BC.go("#/konto/buchungen");
  };

  // Fotos verkleinern, damit sie in den Browser-Speicher passen
  const shrink = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 360, scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
  BC.submits.review = async (form) => {
    const rating = Number((form.querySelector('input[name="rating"]:checked') || {}).value);
    const text = form.elements.text.value.trim();
    if (!rating || text.length < 10) return BC.toast("Bitte Sterne wählen und mindestens 10 Zeichen schreiben.");
    const files = Array.from(form.elements.photos.files || []).filter((f) => f.type.startsWith("image/")).slice(0, 4);
    const images = (await Promise.all(files.map(shrink))).filter(Boolean);
    const studioId = form.dataset.studio;
    BC.S().reviews.push({ id: BC.uid(), studioId, author: CFG.demoUser.firstName, rating, text, categorySlug: form.elements.service.value, images, photos: 0, verified: BC.hasBookedWith(studioId), date: Date.now() });
    BC.save();
    BC.toast("Danke für deine Bewertung! 💕");
    BC.render();
  };

  // ---------- Paketübersicht
  P.packages = (citySlug) => {
    const city = BC.city(citySlug);
    return {
      title: `Pakete in ${city.name} – ${CFG.appName}`,
      html: `
      ${BC.pageHead("Pakete", { eyebrow: esc(city.name), plus: `#/s/${citySlug}/pakete/eigenes`, plusLabel: "Eigenes Paket erstellen" })}
      <p class="page-sub">Paket wählen, Studio pro Leistung aussuchen, fertig.</p>
      <div class="grid grid-2">${BC.packages(citySlug).map((p) => BC.packageCard(p, citySlug)).join("")}</div>
      <div class="group section">
        <a class="row-item" href="#/s/${citySlug}/pakete/eigenes"><span class="ri-icon" style="--tint:var(--fill-strong)">${BC.icon("plus", 18)}</span>
          <span class="ri-body"><strong>Eigenes Paket</strong><span class="ri-sub">Leistungen frei kombinieren</span></span>${BC.chev()}</a>
      </div>`
    };
  };

  // ---------- Login / Registrierung (nur Oberfläche)
  P.login = () => ({
    title: `Anmelden – ${CFG.appName}`,
    html: `<div class="card" style="max-width:440px;margin:20px auto">
      <h1>Willkommen zurück</h1>
      <p class="muted small">Demo: Du bist bereits als <strong>${esc(CFG.demoUser.firstName)}</strong> angemeldet.</p>
      <form class="stack" data-submit="demo-login">
        <label class="field"><span>E-Mail</span><input type="email" autocomplete="off" placeholder="name@beispiel.de"></label>
        <label class="field"><span>Passwort</span><input type="password" autocomplete="off" placeholder="••••••••"></label>
        <button class="btn btn-primary btn-block" type="submit">Anmelden</button>
        <button class="btn btn-block" type="submit">✉️ Login-Link per E-Mail</button>
      </form>
      <p class="small center" style="margin-top:12px">Neu hier? <a href="#/registrieren">Konto erstellen</a></p></div>`
  });
  P.register = () => ({
    title: `Registrieren – ${CFG.appName}`,
    html: `<div class="card" style="max-width:480px;margin:20px auto">
      <h1>Werde Teil der Community</h1>
      <div class="notice notice-info small" style="margin-bottom:14px"><span class="ic">💕</span><div>${esc(CFG.appName)} ist ein geschützter Raum <strong>nur für Frauen</strong>.</div></div>
      <form class="stack" data-submit="demo-login">
        <label class="field"><span>Vorname *</span><input required autocomplete="off"></label>
        <label class="field"><span>E-Mail *</span><input type="email" required autocomplete="off"></label>
        <label class="field"><span>Passwort *</span><input type="password" required minlength="8" autocomplete="new-password"></label>
        <label class="field"><span>Deine Stadt</span><select>${BC.cities().map((c) => `<option>${esc(c.name)}</option>`).join("")}</select></label>
        <label class="check small"><input type="checkbox" required> <span>Ich bestätige, dass ich eine Frau bin, und akzeptiere die <a href="#/regeln">Community-Regeln</a>.</span></label>
        <label class="check small"><input type="checkbox" required> <span>Ich habe die <a href="#/datenschutz">Datenschutzerklärung</a> gelesen.</span></label>
        <button class="btn btn-primary btn-block" type="submit">Konto erstellen</button>
      </form></div>`
  });
  BC.submits["demo-login"] = (form) => { form.reset(); BC.toast(`Demo: Du bist als ${CFG.demoUser.firstName} angemeldet.`); BC.go("#/konto"); };

  // ---------- Rechtliches & Regeln (Platzhalter)
  P.rules = () => ({
    title: `Community-Regeln – ${CFG.appName}`,
    html: `<div class="prose"><h1>Community-Regeln</h1>
      <p>${esc(CFG.appName)} ist ein sicherer Raum für Frauen. Damit das so bleibt:</p>
      <ol>
        <li><strong>Respekt:</strong> Kein Body-Shaming, keine Beleidigungen, keine Diskriminierung.</li>
        <li><strong>Ehrlich bewerten:</strong> Nur eigene Erfahrungen teilen. Gekaufte Bewertungen werden gelöscht.</li>
        <li><strong>Keine versteckte Werbung:</strong> Wer zu einem Studio gehört, sagt das offen.</li>
        <li><strong>Privatsphäre:</strong> Keine Fotos oder Daten anderer Personen ohne Erlaubnis.</li>
        <li><strong>Melden statt streiten:</strong> Nutze den Melden-Button – unser Team prüft jede Meldung.</li>
      </ol>
      <p class="muted">Verstöße können zur Sperrung des Kontos führen.</p></div>`
  });
  P.impressum = () => ({
    title: "Impressum",
    html: `<div class="prose"><h1>Impressum</h1><div class="notice notice-warn"><span class="ic">⚠️</span><div>Platzhalter – vor dem Start durch echte Angaben ersetzen (Name, Anschrift, Kontakt, ggf. Handelsregister, USt-ID).</div></div>
      <p style="margin-top:14px">[Name / Firma]<br>[Straße Nr.]<br>[PLZ Ort]<br>E-Mail: [kontakt@…]</p></div>`
  });
  P.datenschutz = () => ({
    title: "Datenschutz",
    html: `<div class="prose"><h1>Datenschutz</h1><div class="notice notice-warn"><span class="ic">⚠️</span><div>Platzhalter – die endgültige Datenschutzerklärung sollte von einer Fachperson erstellt werden.</div></div>
      <h2>Was dieser Prototyp speichert</h2>
      <p>Alle Eingaben (Merkliste, Pakete, Buchungen, Chat-Nachrichten, Bewertungen) werden <strong>nur in deinem Browser</strong> (localStorage) gespeichert und nicht an einen Server gesendet. Über „Konto → Alle Daten löschen“ entfernst du sie vollständig.</p>
      <h2>Externe Inhalte</h2><p>Karten werden von OpenStreetMap, Schriften von Google Fonts geladen.</p></div>`
  });

  P.notFound = () => ({
    title: "Seite nicht gefunden",
    html: BC.empty("🫣", "Diese Seite gibt es leider nicht.", `<a class="btn btn-primary" href="#/">Zur Startseite</a>`)
  });
})();
