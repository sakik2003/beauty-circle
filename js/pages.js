/* =========================================================
   Seiten: Start, Stadt, Kategorie, Studio, Pakete, Rechtliches
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  const P = BC.pages;
  const CFG = BC.cfg;

  // ---------- Startseite
  P.home = () => {
    const city = BC.currentCity();
    const S = BC.S();
    return {
      title: `${CFG.appName} – Beauty-Empfehlungen von Frauen für Frauen`,
      html: `
      <section class="hero">
        <div class="kicker">Community · Empfehlungen · Pakete</div>
        <h1>Die besten Beauty-Adressen deiner Stadt.</h1>
        <p>Empfohlen von Frauen für Frauen. Finde Friseur, Nägel, Wimpern & mehr – und buche ganze Pakete wie das <strong>Chaya Paket</strong> in wenigen Schritten.</p>
      </section>

      <section class="section">
        <div class="section-head"><h2>Wähle deine Stadt</h2></div>
        <label class="sr-only" for="city-search">Stadt suchen</label>
        <input id="city-search" type="search" placeholder="🔎 Stadt suchen …" data-input="city-search" style="max-width:360px;margin-bottom:14px">
        <div class="grid grid-3" id="city-grid">
          ${BC.cities().map((c, i) => {
            const n = BC.studios(c.slug).length;
            return `<a class="card card-link city-card" data-name="${esc(c.name.toLowerCase())}" href="#/s/${c.slug}">
              ${BC.ph(330 + i * 40, "🏙️")}
              <div class="body"><div class="spread"><h3 style="margin:0">${esc(c.name)}</h3>${S.citySlug === c.slug ? `<span class="tag">Deine Stadt</span>` : ""}</div>
              <p class="muted small" style="margin:4px 0 0">${n} Studios · ${(CFG.communitySize[c.slug] || 500).toLocaleString("de-DE")} Frauen</p></div>
            </a>`;
          }).join("")}
        </div>
        <p class="muted small" id="city-none" hidden>Diese Stadt gibt es noch nicht – bald kommen weitere dazu! 💕</p>
      </section>

      <section class="section">
        <h2>So funktioniert's</h2>
        <div class="steps3">
          <div class="card"><h3>Entdecken</h3><p class="muted small">Die beliebtesten Studios deiner Stadt – gerankt von der Community, nicht von Werbung.</p></div>
          <div class="card"><h3>Austauschen</h3><p class="muted small">Frag im Stadt-Chat nach Empfehlungen und teile deine Erfahrungen mit Fotos.</p></div>
          <div class="card"><h3>Paket buchen</h3><p class="muted small">Leistungen kombinieren, Studio pro Leistung wählen – online, per Anfrage oder mit direkten Kontaktdaten.</p></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Beliebte Pakete</h2><a href="#/s/${city}/pakete">Alle Pakete →</a></div>
        <div class="grid grid-3">${BC.packages(city).filter((p) => p.popular).map((p) => BC.packageCard(p, city)).join("")}</div>
      </section>

      <section class="section card">
        <h2>Was bedeuten die Kennzeichen?</h2>
        <div class="legend">
          <div class="item">${BC.modeBadge("online")}<span class="small">Freien Termin wählen und sofort fest buchen.</span></div>
          <div class="item">${BC.modeBadge("request")}<span class="small">Wunschtermine senden – das Studio bestätigt.</span></div>
          <div class="item">${BC.modeBadge("manual")}<span class="small">Keine Buchung über die App – du bekommst alle Kontaktdaten und eine fertige Nachricht.</span></div>
        </div>
      </section>`
    };
  };
  BC.inputs["city-search"] = (el) => {
    const q = el.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#city-grid .city-card").forEach((c) => { const ok = c.dataset.name.includes(q); c.hidden = !ok; if (ok) shown++; });
    document.getElementById("city-none").hidden = shown > 0;
  };

  // ---------- Stadtseite
  P.city = (citySlug) => {
    const city = BC.city(citySlug);
    const cats = BC.categories();
    const topCat = BC.ui.topCat;
    const top = BC.studios(citySlug, { category: topCat || undefined }).slice(0, 5);
    const latest = BC.allMessages()
      .filter((m) => !m.parentId && m.channelId.startsWith(`ch-${citySlug}-`))
      .sort((a, b) => b.date - a.date).slice(0, 3);
    return {
      title: `Beauty in ${city.name} – ${CFG.appName}`,
      html: `
      <section class="hero">
        <div class="kicker">${esc(city.name)}</div>
        <h1>Beauty in ${esc(city.name)}</h1>
        <p>${BC.studios(citySlug).length} ausgewählte Studios · ${(CFG.communitySize[citySlug] || 500).toLocaleString("de-DE")} Frauen in der Community</p>
        <div class="row"><a class="btn btn-primary" href="#/s/${citySlug}/pakete">Paket zusammenstellen</a><a class="btn" href="#/s/${citySlug}/community">Zur Community</a></div>
      </section>

      <section class="section">
        <h2>Kategorien</h2>
        <div class="grid grid-cats">${cats.map((c) => `<a class="card card-link cat-tile" href="#/s/${citySlug}/k/${c.slug}">${BC.ph(c.hue, c.icon)}<strong>${esc(c.name)}</strong><span class="xs muted">${BC.studios(citySlug, { category: c.slug }).length} Studios</span></a>`).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Top 5 der Community</h2><span class="xs muted">Gerankt nach Bewertungen – nicht käuflich</span></div>
        <div class="chips" role="group" aria-label="Kategorie für Top 5">
          <button class="chip ${!topCat ? "active" : ""}" aria-pressed="${!topCat}" data-act="top-cat" data-cat="">Alle</button>
          ${cats.map((c) => `<button class="chip ${topCat === c.slug ? "active" : ""}" aria-pressed="${topCat === c.slug}" data-act="top-cat" data-cat="${c.slug}">${c.icon} ${esc(c.name)}</button>`).join("")}
        </div>
        <div class="grid grid-2" style="margin-top:12px">${top.map((s, i) => BC.studioCard(s, { rank: i + 1 })).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Pakete in ${esc(city.name)}</h2><a href="#/s/${citySlug}/pakete">Alle →</a></div>
        <div class="grid grid-3">${BC.packages(citySlug).slice(0, 3).map((p) => BC.packageCard(p, citySlug)).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Neu in der Community</h2><a href="#/s/${citySlug}/community">Alle Kanäle →</a></div>
        <div class="card">${latest.map((m) => {
          const ch = BC.data.channels.find((c) => c.id === m.channelId);
          return `<a class="msg" style="color:inherit;text-decoration:none" href="#/s/${citySlug}/community/${ch.slug}/t/${m.id}">
            ${BC.avatar(m.author)}<div class="msg-body"><div class="msg-head"><strong>${esc(m.author)}</strong><span class="xs muted">#${esc(ch.name)} · ${BC.ago(m.date)}</span>${m.isQuestion ? `<span class="q-badge">Frage</span>` : ""}</div>
            <div class="msg-text">${BC.renderText(m.text, citySlug, true)}</div></div></a>`;
        }).join("")}</div>
      </section>`
    };
  };
  BC.actions["top-cat"] = (el) => { BC.ui.topCat = el.dataset.cat; BC.render(); };

  // ---------- Studioliste einer Kategorie
  P.category = (citySlug, catSlug) => {
    const city = BC.city(citySlug);
    const cat = BC.category(catSlug);
    if (!cat) return P.notFound();
    const fkey = `${citySlug}/${catSlug}`;
    const f = (BC.ui.filters[fkey] = BC.ui.filters[fkey] || {});
    const all = BC.studios(citySlug, { category: catSlug });
    const list = BC.studios(citySlug, Object.assign({}, f, { category: catSlug }));
    const districts = [...new Set(all.map((s) => s.district))].sort();
    const langs = [...new Set(all.flatMap((s) => s.languages))].sort();
    const sel = (name, label, options) => `<label class="field"><span class="xs">${label}</span><select data-change="filter" data-key="${fkey}" data-name="${name}">
      ${options.map(([v, t]) => `<option value="${esc(v)}" ${String(f[name] || "") === String(v) ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    return {
      title: `${cat.name} in ${city.name} – ${CFG.appName}`,
      html: `
      <div class="breadcrumb"><a href="#/s/${citySlug}">${esc(city.name)}</a> › ${esc(cat.name)}</div>
      <h1>${cat.icon} ${esc(cat.name)} in ${esc(city.name)}</h1>
      <div class="card section">
        <div class="filters">
          ${sel("district", "Bezirk", [["", "Alle Bezirke"], ...districts.map((d) => [d, d])])}
          ${sel("price", "Preisniveau", [["", "Alle Preise"], ["1", "€ günstig"], ["2", "€€ mittel"], ["3", "€€€ gehoben"]])}
          ${sel("mode", "Buchungsart", [["", "Alle"], ["online", "📅 Online buchbar"], ["request", "⏳ Anfrage möglich"], ["manual", "📞 Nur manuell"]])}
          ${sel("language", "Sprache", [["", "Alle Sprachen"], ...langs.map((l) => [l, l])])}
          ${sel("minRating", "Bewertung", [["", "Alle"], ["4.5", "ab 4,5 ★"], ["4.7", "ab 4,7 ★"]])}
          ${sel("sort", "Sortieren", [["score", "Beliebteste"], ["online", "Online buchbar zuerst"], ["price", "Preis aufsteigend"], ["reviews", "Meiste Bewertungen"]])}
        </div>
        ${Object.values(f).some(Boolean) ? `<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-act="filter-reset" data-key="${fkey}">✕ Filter zurücksetzen</button>` : ""}
      </div>
      <p class="muted small">${list.length} ${list.length === 1 ? "Studio" : "Studios"} gefunden</p>
      ${list.length ? `<div class="grid grid-2">${list.map((s) => BC.studioCard(s)).join("")}</div>` : BC.empty("🔍", "Keine Studios mit diesen Filtern gefunden.", `<button class="btn btn-soft" data-act="filter-reset" data-key="${fkey}">Filter zurücksetzen</button>`)}`
    };
  };
  BC.changes.filter = (el) => { BC.ui.filters[el.dataset.key][el.dataset.name] = el.value; BC.render(); };
  BC.actions["filter-reset"] = (el) => { BC.ui.filters[el.dataset.key] = {}; BC.render(); };

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
    const serviceSelect = `<label class="field"><span>Leistung</span><select data-change="single-service">${services.map((v) => `<option value="${v.id}" ${v.id === single.serviceId ? "selected" : ""}>${esc(v.name)} – ${BC.euro(v.price)}</option>`).join("")}</select></label>`;
    const service = BC.service(single.serviceId);

    let booking = "";
    if (st.bookingMode === "online") {
      booking = `<h2>Termin buchen</h2>${BC.modeBadge("online")}<div class="stack" style="margin-top:12px">${serviceSelect}
        ${BC.slotPicker(st, "single", "single-slot", single.slotId)}
        <button class="btn btn-primary btn-block" data-act="single-book" ${single.slotId ? "" : "disabled"}>${single.slotId ? `Verbindlich buchen: ${BC.fmtDateTime(single.start)}` : "Bitte Uhrzeit wählen"}</button></div>
        <details class="collapse" style="margin-top:12px"><summary>Lieber direkt Kontakt aufnehmen?</summary>${BC.contactCard(st, { service: service.name, hideHead: true, key: "single-c" })}</details>`;
    } else if (st.bookingMode === "request") {
      const min = BC.toLocalInput(Date.now() + 3600000);
      booking = `<h2>Termin anfragen</h2>${BC.modeBadge("request")}
        <p class="small muted" style="margin-top:8px">Sende bis zu 3 Wunschtermine – das Studio bestätigt einen davon.</p>
        <form data-submit="single-request" class="stack">${serviceSelect}
          ${[1, 2, 3].map((n) => `<label class="field"><span>Wunschtermin ${n}${n === 1 ? " *" : " (optional)"}</span><input type="datetime-local" name="t${n}" min="${min}" step="1800" ${n === 1 ? "required" : ""}></label>`).join("")}
          <button class="btn btn-primary btn-block" type="submit">Anfrage senden</button>
        </form>
        <details class="collapse" style="margin-top:12px"><summary>Lieber direkt Kontakt aufnehmen?</summary>${BC.contactCard(st, { service: service.name, hideHead: true, key: "single-c" })}</details>`;
    } else {
      booking = `<h2>Termin vereinbaren</h2>${serviceSelect}<div style="margin-top:12px">${BC.contactCard(st, { service: service.name, hideHead: true, key: "single-c" })}</div>`;
    }

    const myReviewForm = `<form class="card stack" data-submit="review" data-studio="${st.id}" style="margin-top:14px">
      <h3>Bewertung schreiben</h3>
      ${BC.hasBookedWith(st.id) ? `<p class="small verified">✓ Deine Bewertung wird als „verifiziert“ markiert, weil du hier gebucht hast.</p>` : `<p class="xs muted">Tipp: Nach einer Buchung über ${esc(CFG.appName)} wird deine Bewertung als „verifiziert“ markiert.</p>`}
      <fieldset style="border:none;padding:0;margin:0"><legend class="small" style="font-weight:600">Sterne *</legend>
        <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="st-${n}" name="rating" value="${n}" ${n === 5 ? "required" : ""}><label for="st-${n}" title="${n} Sterne">★</label>`).join("")}</div></fieldset>
      <label class="field"><span>Leistung</span><select name="service">${services.map((v) => `<option value="${v.categorySlug}">${esc(v.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Deine Erfahrung *</span><textarea name="text" required minlength="10" maxlength="800" placeholder="Wie war das Ergebnis, die Beratung, die Atmosphäre?"></textarea></label>
      <label class="field"><span>Fotos (Vorher/Nachher, max. 4)</span><input type="file" name="photos" accept="image/*" multiple></label>
      <button class="btn btn-primary" type="submit">Bewertung veröffentlichen</button>
    </form>`;

    return {
      title: `${st.name} – ${BC.category(st.categories[0]).name} in ${city.name}`,
      html: `
      <div class="breadcrumb"><a href="#/s/${citySlug}">${esc(city.name)}</a> › <a href="#/s/${citySlug}/k/${st.categories[0]}">${esc(BC.category(st.categories[0]).name)}</a> › ${esc(st.name)}</div>
      <div class="studio-hero">
        ${BC.ph(st.hue, BC.studioIcon(st))}
        <div class="spread" style="align-items:flex-start">
          <div>
            <h1 style="margin-bottom:4px">${esc(st.name)}</h1>
            <div class="row small muted">📍 ${esc(st.district)} · ${st.categories.map((c) => esc(BC.category(c).name)).join(" · ")}</div>
            <div class="row" style="margin-top:8px">${BC.ratingHtml(st)} ${BC.priceLevel(st.priceLevel)} ${BC.modeBadge(st.bookingMode)}</div>
          </div>
          <button class="btn" data-act="fav" data-id="${st.id}" aria-pressed="${BC.isFav(st.id)}">${BC.isFav(st.id) ? "❤️ Gemerkt" : "🤍 Merken"}</button>
        </div>
      </div>

      <div class="profile-layout section">
        <div class="stack">
          <div class="gallery">${["Vorher", "Nachher", "Studio"].map((l, i) => BC.ph(st.hue + i * 25, BC.studioIcon(st), "", `<small>Beispielbild · ${l}</small>`)).join("")}</div>
          <div class="card"><p style="margin:0">${esc(st.description)}</p><p class="small muted" style="margin:8px 0 0">🗣️ Sprachen: ${st.languages.map(esc).join(", ")}</p></div>
          <div class="card"><h2>Leistungen & Preise</h2>${services.map((v) => `<div class="service-row"><div><strong>${esc(v.name)}</strong><div class="xs muted">${BC.category(v.categorySlug).icon} ${esc(BC.category(v.categorySlug).name)} · ca. ${v.durationMin} Min.</div></div><strong>${BC.euro(v.price)}</strong></div>`).join("")}</div>
          <div class="card"><h2>Öffnungszeiten</h2><p class="open-state ${BC.openState(st).open ? "is-open" : "is-closed"}">🕒 ${BC.openState(st).text}</p>${BC.hoursTable(st)}</div>
          <div class="card"><h2>Adresse</h2><p>📍 ${esc(st.address)}, ${esc(city.name)}</p>
            <div class="row">
              <a class="btn btn-sm" href="https://www.openstreetmap.org/?mlat=${st.lat}&mlon=${st.lng}#map=16/${st.lat}/${st.lng}" target="_blank" rel="noopener">🗺️ Auf der Karte ansehen</a>
              <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address + ", " + city.name)}" target="_blank" rel="noopener">📍 Route planen</a>
            </div>
            <p class="xs muted" style="margin-top:6px">Kartenposition ungefähr (Beispieldaten).</p></div>
          <div class="card" id="reviews"><div class="spread"><h2 style="margin:0">Bewertungen</h2><span class="rating">★ ${r.rating.toFixed(1).replace(".", ",")} <span class="muted">· ${r.count} Bewertungen</span></span></div>
            ${reviews.map((rv) => `<div class="review"><div class="row">${BC.avatar(rv.author)}<div><strong>${esc(rv.author)}</strong> ${rv.verified ? `<span class="verified">✓ Verifiziert</span>` : ""}<div class="xs muted">${BC.ago(rv.date)} · ${esc(BC.category(rv.categorySlug).name)}</div></div><span class="rating" style="margin-left:auto">${BC.stars(rv.rating)}</span></div>
              <p style="margin:8px 0 0">${esc(rv.text)}</p>
              ${rv.images && rv.images.length ? `<div class="gallery" style="margin-top:8px">${rv.images.map((src) => `<img src="${esc(src)}" alt="Foto von ${esc(rv.author)}" style="height:90px;width:100%;object-fit:cover;border-radius:10px">`).join("")}</div>` : rv.photos ? `<div class="row" style="margin-top:8px">${Array.from({ length: rv.photos }, (_, i) => `<div style="width:64px">${BC.ph(st.hue + i * 30, "📷", "", "")}</div>`).join("")}<span class="xs muted">Vorher/Nachher</span></div>` : ""}
            </div>`).join("")}
            ${myReviewForm}
          </div>
        </div>
        <aside class="card sticky-col" id="booking">${booking}</aside>
      </div>`
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
    BC.toast("Gebucht! 🎉 Du findest den Termin unter „Meine Buchungen“.");
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
      <div class="breadcrumb"><a href="#/s/${citySlug}">${esc(city.name)}</a> › Pakete</div>
      <h1>Beauty-Pakete in ${esc(city.name)}</h1>
      <p class="muted">Wähle ein Paket und such dir für jede Leistung dein Lieblingsstudio aus. Bei online buchbaren Studios gibt's den Paket-Rabatt.</p>
      <div class="grid grid-3 section">
        ${BC.packages(citySlug).map((p) => BC.packageCard(p, citySlug)).join("")}
        <a class="card card-link pkg-card" href="#/s/${citySlug}/pakete/eigenes">
          ${BC.ph(260, "🎀")}<h3>Eigenes Paket</h3><p class="muted small">Stell dir deine Wunsch-Kombination selbst zusammen.</p>
          <span class="btn btn-soft btn-sm">Selbst zusammenstellen →</span></a>
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
