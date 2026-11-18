/* =========================================================
   Paket-Wizard: Leistungen → Studios → Termine → Zeitplan → Übersicht
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  const CFG = BC.cfg;
  const STEPS = ["Leistungen", "Studios", "Termine", "Zeitplan", "Übersicht"];
  let W = null; // aktueller Wizard-Zustand (nur im Speicher)

  const newItem = (it) => ({
    pid: it.id, categorySlug: it.categorySlug, label: it.label, serviceHint: it.serviceHint || "",
    included: true, studioId: null, serviceId: null, slotId: null, start: null, times: ["", "", ""], wishDate: ""
  });

  function init(citySlug, slug) {
    const custom = slug === "eigenes";
    const pkg = custom
      ? { id: "custom", slug: "eigenes", name: "Mein eigenes Paket", icon: "🎀", hue: 260, discountPercent: 0, description: "Wähle die Leistungen, die du kombinieren möchtest.", items: [] }
      : BC.pkg(slug);
    if (!pkg) return null;
    return { key: `${citySlug}/${slug}`, citySlug, custom, pkg, step: 1, maxStep: 1, onlyOnline: false, sort: "score", open: 0, customName: "", items: pkg.items.map(newItem) };
  }

  const included = () => W.items.filter((i) => i.included);
  const studioOf = (it) => it.studioId && BC.studioById(it.studioId);
  const serviceOf = (it) => it.serviceId && BC.service(it.serviceId);
  const timeOf = (it) => {
    const st = studioOf(it);
    if (!st) return null;
    if (st.bookingMode === "online") return it.start;
    if (st.bookingMode === "request") { const t = it.times.find(Boolean); return t ? BC.parseLocal(t) : null; }
    return null;
  };
  // Überschneidungen inkl. Puffer
  function conflicts() {
    const buf = CFG.bufferMinutes * 60000;
    const timed = included().map((it, idx) => ({ it, idx, start: timeOf(it) })).filter((x) => x.start)
      .map((x) => Object.assign(x, { end: x.start + serviceOf(x.it).durationMin * 60000 }));
    const out = [];
    for (let a = 0; a < timed.length; a++)
      for (let b = a + 1; b < timed.length; b++) {
        const A = timed[a], B = timed[b];
        if (A.start < B.end + buf && B.start < A.end + buf) out.push([A, B]);
      }
    return out;
  }
  const conflictBox = (list) => list.length ? `<div class="notice notice-warn" role="alert"><span class="ic">!</span><div><strong>Termine überschneiden sich</strong> (inkl. ${CFG.bufferMinutes} Min. Puffer für den Weg):<ul style="margin:6px 0 0;padding-left:1.1rem">${list.map(([A, B]) => `<li>${esc(A.it.label)} (${BC.fmtDateTime(A.start)}) und ${esc(B.it.label)} (${BC.fmtDateTime(B.start)})</li>`).join("")}</ul></div></div>` : "";

  function validate(step) {
    if (step === 1 && !included().length) return "Bitte wähle mindestens eine Leistung.";
    if (step === 2) { const miss = included().find((i) => !i.studioId); if (miss) return `Bitte wähle ein Studio für „${miss.label}“.`; }
    if (step === 3) {
      for (const it of included()) {
        const st = studioOf(it);
        if (st.bookingMode === "online" && !it.slotId) return `Bitte wähle einen Termin für „${it.label}“.`;
        if (st.bookingMode === "request" && !it.times.some(Boolean)) return `Bitte gib mindestens einen Wunschtermin für „${it.label}“ an.`;
      }
    }
    return null;
  }

  const priceInfo = () => {
    let sum = 0, onlineSum = 0;
    included().forEach((it) => { const v = serviceOf(it); if (!v) return; sum += v.price; if (studioOf(it).bookingMode === "online") onlineSum += v.price; });
    const discount = Math.round(onlineSum * W.pkg.discountPercent) / 100;
    return { sum, onlineSum, discount, total: sum - discount };
  };

  // ---------- Schritt 1: Leistungen
  function step1() {
    if (W.custom) {
      const chosen = W.items.map((i) => i.categorySlug);
      return `<div class="card"><h2>Was möchtest du kombinieren?</h2>
        <label class="field" style="margin-bottom:14px"><span>Name deines Pakets (optional)</span><input data-input="wiz-name" value="${esc(W.customName)}" placeholder="z. B. Mein Geburtstags-Paket" maxlength="40"></label>
        <div class="grid grid-cats">${BC.categories().map((c) => `<label class="card check" style="align-items:center;box-shadow:none">
          <input type="checkbox" data-change="wiz-cat" data-cat="${c.slug}" ${chosen.includes(c.slug) ? "checked" : ""}><span>${c.icon} ${esc(c.name)}</span></label>`).join("")}</div></div>`;
    }
    return `<div class="card"><h2>Enthaltene Leistungen</h2><p class="small muted">Du kannst einzelne Leistungen abwählen.</p>
      <div class="stack">${W.items.map((it, i) => `<label class="check"><input type="checkbox" data-change="wiz-include" data-i="${i}" ${it.included ? "checked" : ""}>
        <span><strong>${BC.category(it.categorySlug).icon} ${esc(it.label)}</strong><br><span class="xs muted">${esc(BC.category(it.categorySlug).name)}</span></span></label>`).join("")}</div></div>
      <div class="card section"><h3>So geht's weiter</h3><p class="small muted">Im nächsten Schritt wählst du für jede Leistung ein Studio. Daran siehst du, wie gebucht wird:</p>
        <div class="legend">
          <div class="item">${BC.modeBadge("online")}<span class="small">direkt buchen${W.pkg.discountPercent ? ` + ${W.pkg.discountPercent} % Paket-Rabatt` : ""}</span></div>
          <div class="item">${BC.modeBadge("request")}<span class="small">Wunschtermin anfragen</span></div>
          <div class="item">${BC.modeBadge("manual")}<span class="small">selbst kontaktieren – du bekommst alle Kontaktdaten</span></div>
        </div></div>`;
  }

  // ---------- Schritt 2: Studios wählen
  function step2() {
    const tools = `<div class="card row" style="justify-content:space-between">
      <label class="check"><input type="checkbox" data-change="wiz-only-online" ${W.onlyOnline ? "checked" : ""}> <span>Nur online buchbare zeigen</span></label>
      <label class="row small"><span>Sortieren:</span><select data-change="wiz-sort" style="width:auto">
        <option value="score" ${W.sort === "score" ? "selected" : ""}>Beste Bewertung</option>
        <option value="price" ${W.sort === "price" ? "selected" : ""}>Günstigster Preis</option>
        <option value="online" ${W.sort === "online" ? "selected" : ""}>Online buchbar zuerst</option></select></label></div>`;
    const blocks = W.items.map((it, i) => {
      if (!it.included) return "";
      const n = included().indexOf(it) + 1;
      const st = studioOf(it);
      const head = `<div class="wiz-item-head"><h3 style="margin:0"><span class="wiz-num">${n}</span>${BC.category(it.categorySlug).icon} ${esc(it.label)}</h3>${st ? BC.modeBadge(st.bookingMode) : `<span class="xs muted">Noch kein Studio gewählt</span>`}</div>`;
      if (st && W.open !== i) {
        const opts = BC.servicesIn(st.id, it.categorySlug);
        return `<div class="card wiz-item">${head}
          <div class="pick selected" style="margin-top:12px;cursor:default">${BC.ph(st.hue, BC.studioIcon(st))}<div class="info"><strong>${esc(st.name)}</strong><span class="xs muted">${esc(st.district)} · ★ ${BC.ratingOf(st).rating.toFixed(1).replace(".", ",")}</span></div>
            <button class="btn btn-sm" data-act="wiz-open" data-i="${i}">Ändern</button></div>
          <label class="field" style="margin-top:10px"><span class="xs">Leistung</span><select data-change="wiz-service" data-i="${i}">${opts.map((v) => `<option value="${v.id}" ${v.id === it.serviceId ? "selected" : ""}>${esc(v.name)} – ${BC.euro(v.price)} · ${v.durationMin} Min.</option>`).join("")}</select></label>
          ${st.bookingMode === "manual" ? `<p class="xs" style="margin:8px 0 0;color:var(--man)">Nicht online buchbar – im nächsten Schritt bekommst du die Kontaktdaten.</p>` : ""}
        </div>`;
      }
      let list = BC.studios(W.citySlug, { category: it.categorySlug, mode: W.onlyOnline ? "online" : undefined, sort: W.sort === "online" ? "online" : "score" });
      const priceFor = (s) => (BC.matchService(s.id, it.categorySlug, it.serviceHint) || { price: 0 }).price;
      if (W.sort === "price") list = list.slice().sort((a, b) => priceFor(a) - priceFor(b));
      return `<div class="card wiz-item">${head}
        <div class="pick-list" role="list">${list.length ? list.map((s) => {
          const v = BC.matchService(s.id, it.categorySlug, it.serviceHint);
          return `<button class="pick ${s.id === it.studioId ? "selected" : ""}" role="listitem" data-act="wiz-pick" data-i="${i}" data-studio="${s.id}">
            ${BC.ph(s.hue, BC.studioIcon(s))}
            <span class="info"><strong>${esc(s.name)}</strong><span class="xs muted">${esc(s.district)} · ★ ${BC.ratingOf(s).rating.toFixed(1).replace(".", ",")} · ${esc(v.name)}</span><br>${BC.modeBadge(s.bookingMode)}</span>
            <span class="price">${BC.euro(v.price)}</span></button>`;
        }).join("") : `<p class="muted small">Kein online buchbares Studio für diese Leistung. Schalte den Filter aus, um alle Studios zu sehen.</p>`}</div></div>`;
    }).join("");
    return tools + `<div class="section">${blocks}</div>`;
  }

  // ---------- Schritt 3: Termine
  function step3() {
    const c = conflicts();
    const min = BC.toLocalInput(Date.now() + 3600000);
    const blocks = W.items.map((it, i) => {
      if (!it.included) return "";
      const n = included().indexOf(it) + 1;
      const st = studioOf(it), v = serviceOf(it);
      let body = "";
      if (st.bookingMode === "online") {
        body = `<p class="small muted">Wähle einen freien Termin – er wird beim Speichern fest gebucht.</p>${BC.slotPicker(st, "wiz-" + i, "wiz-slot", it.slotId, `data-i="${i}"`)}
          ${it.start ? `<p class="small" style="margin-top:10px;color:var(--ok)"><strong>${BC.fmtDateTime(it.start)}</strong></p>` : ""}`;
      } else if (st.bookingMode === "request") {
        body = `<p class="small muted">Gib bis zu 3 Wunschtermine an – das Studio bestätigt einen davon.</p>
          <div class="grid grid-3">${[0, 1, 2].map((j) => `<label class="field"><span class="xs">Wunschtermin ${j + 1}${j === 0 ? " *" : ""}</span><input type="datetime-local" step="1800" min="${min}" value="${esc(it.times[j])}" data-change="wiz-time" data-i="${i}" data-j="${j}"></label>`).join("")}</div>`;
      } else {
        body = BC.contactCard(st, { key: "wiz-c-" + i, service: v.name, wishDate: it.wishDate, wizIndex: i, hideHead: true });
      }
      return `<div class="card wiz-item"><div class="wiz-item-head"><h3 style="margin:0"><span class="wiz-num">${n}</span>${esc(it.label)}</h3>${BC.modeBadge(st.bookingMode)}</div>
        <p class="small" style="margin:6px 0 12px"><strong>${esc(st.name)}</strong> · ${esc(v.name)} · ${BC.euro(v.price)} · ${v.durationMin} Min.</p>${body}</div>`;
    }).join("");
    return `${conflictBox(c)}<div class="section">${blocks}</div>`;
  }

  // ---------- Schritt 4: Zeitplan
  function step4() {
    const c = conflicts();
    const conflictIdx = new Set(c.flatMap(([A, B]) => [A.it, B.it]));
    const rows = included().map((it) => ({ it, start: timeOf(it), st: studioOf(it), v: serviceOf(it) }));
    const timed = rows.filter((r) => r.start).sort((a, b) => a.start - b.start);
    const open = rows.filter((r) => !r.start);
    return `${c.length ? conflictBox(c) + `<div class="row" style="margin:10px 0"><button class="btn btn-soft" data-act="wiz-goto" data-step="3">Termine anpassen</button><span class="small muted">oder trotzdem weiter</span></div>`
        : `<div class="notice notice-ok"><span class="ic">${BC.icon("check", 20)}</span><div><strong>Alles passt!</strong> Keine Überschneidungen – zwischen den Terminen ist genug Zeit für den Weg.</div></div>`}
      <div class="card section"><h2>Dein Zeitplan</h2>
        <ul class="timeline">${timed.map((r) => `<li class="${conflictIdx.has(r.it) ? "conflict" : ""}"><span class="time">${BC.fmtDate(r.start)}<br>${BC.fmtTime(r.start)}–${BC.fmtTime(r.start + r.v.durationMin * 60000)}</span>
          <span><strong>${esc(r.it.label)}</strong> · ${esc(r.st.name)}<br>${BC.modeBadge(r.st.bookingMode)} ${r.st.bookingMode === "request" ? `<span class="xs muted">Wunschtermin 1 – wartet auf Bestätigung</span>` : ""}</span></li>`).join("")}
        ${open.map((r) => `<li><span class="time muted">Termin offen</span><span><strong>${esc(r.it.label)}</strong> · ${esc(r.st.name)}<br>${BC.modeBadge("manual")} <span class="xs muted">Vereinbarst du direkt mit dem Studio${r.it.wishDate ? ` (Wunsch: ${BC.fmtDate(BC.parseLocal(r.it.wishDate + "T12:00"))})` : ""}</span></span></li>`).join("")}</ul>
        ${open.length ? `<p class="xs muted" style="margin-top:10px">Tipp: Plane die manuellen Termine so, dass sie zu den gebuchten passen.</p>` : ""}</div>`;
  }

  // ---------- Schritt 5: Übersicht
  function step5() {
    const p = priceInfo();
    const groups = { online: [], request: [], manual: [] };
    included().forEach((it) => groups[studioOf(it).bookingMode].push(it));
    const line = (it, extra) => { const st = studioOf(it), v = serviceOf(it); return `<div class="sum-line"><span><strong>${esc(it.label)}</strong> · ${esc(st.name)}<br><span class="xs muted">${esc(v.name)}${extra ? " · " + extra : ""}</span></span><strong>${BC.euro(v.price)}</strong></div>`; };
    return `<div class="card">
      ${groups.online.length ? `<div class="summary-group"><h3>Wird gebucht</h3>${groups.online.map((it) => line(it, BC.fmtDateTime(it.start))).join("")}</div>` : ""}
      ${groups.request.length ? `<div class="summary-group"><h3>Wird angefragt</h3>${groups.request.map((it) => line(it, "Wunsch: " + it.times.filter(Boolean).map((t) => BC.fmtDateTime(BC.parseLocal(t))).join(" / "))).join("")}</div>` : ""}
      ${groups.manual.length ? `<div class="summary-group"><h3>Selbst vereinbaren</h3>${groups.manual.map((it) => line(it, "Kontaktdaten findest du in deiner Checkliste")).join("")}
        <p class="xs muted">Diese Studios kannst du nicht über ${esc(CFG.appName)} buchen. Nach dem Speichern bekommst du eine Checkliste mit allen Kontaktdaten zum Abhaken.</p></div>` : ""}
      <hr>
      <div class="sum-line"><span>Summe aller Leistungen</span><span>${BC.euro(p.sum)}</span></div>
      ${p.discount ? `<div class="sum-line" style="color:var(--ok)"><span>Paket-Rabatt ${W.pkg.discountPercent} % (nur online gebuchte Leistungen)</span><span>−${BC.euro(p.discount)}</span></div>` : ""}
      <div class="sum-line sum-total"><span>Gesamt ca.</span><span>${BC.euro(p.total)}</span></div>
      ${groups.manual.length || groups.request.length ? `<p class="xs muted">Preise bei manuell buchbaren Studios und Anfragen können abweichen. Bezahlt wird direkt im Studio.</p>` : `<p class="xs muted">Bezahlt wird direkt im Studio.</p>`}
      ${conflicts().length ? `<div class="notice notice-warn small" style="margin-top:10px"><span class="ic">!</span><div>Achtung: Einige Termine überschneiden sich.</div></div>` : ""}
    </div>`;
  }

  // ---------- Seite
  BC.pages.wizard = (citySlug, slug) => {
    const key = `${citySlug}/${slug}`;
    if (!W || W.key !== key) W = init(citySlug, slug);
    if (!W) return BC.pages.notFound();
    const city = BC.city(citySlug);
    const name = W.custom && W.customName ? W.customName : W.pkg.name;
    const body = [null, step1, step2, step3, step4, step5][W.step]();
    const next = W.step < 5
      ? `<button class="btn btn-primary" data-act="wiz-next">Weiter: ${STEPS[W.step]} →</button>`
      : `<button class="btn btn-primary" data-act="wiz-save">Paket speichern</button>`;
    return {
      title: `${name} – Pakete in ${city.name}`,
      html: `
      ${BC.navBar(esc(name), `#/s/${citySlug}/pakete`)}
      ${W.items.length ? BC.packageCover(W.pkg.items.length ? W.pkg : { hue: W.pkg.hue, items: W.items }) : ""}
      <div class="studio-head"><h1>${esc(name)}</h1>${W.pkg.discountPercent ? `<div class="ri-sub">−${W.pkg.discountPercent} % auf online gebuchte Leistungen</div>` : ""}</div>
      <p class="muted" style="margin-top:10px">${esc(W.pkg.description)}</p>
      <nav class="wizard-steps" aria-label="Schritte">${STEPS.map((s, i) => {
        const n = i + 1;
        const cls = n < W.step ? "done" : n === W.step ? "current" : "";
        return `<button class="${cls}" data-act="wiz-goto" data-step="${n}" ${n > W.maxStep ? "disabled" : ""} ${n === W.step ? 'aria-current="step"' : ""}><div class="bar"></div><span class="lbl">${n}. ${s}</span></button>`;
      }).join("")}</nav>
      ${body}
      <div class="wiz-footer">${W.step > 1 ? `<button class="btn" data-act="wiz-back">← Zurück</button>` : `<a class="btn" href="#/s/${citySlug}/pakete">Abbrechen</a>`}${next}</div>`
    };
  };

  // ---------- Aktionen
  const A = BC.actions, C = BC.changes;
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  A["wiz-next"] = () => {
    const err = validate(W.step);
    if (err) return BC.toast(err);
    W.step++; W.maxStep = Math.max(W.maxStep, W.step);
    if (W.step === 2) W.open = W.items.findIndex((i) => i.included && !i.studioId);
    BC.render(); scrollTop();
  };
  A["wiz-back"] = () => { W.step--; BC.render(); scrollTop(); };
  A["wiz-goto"] = (el) => {
    const n = Number(el.dataset.step);
    if (n > W.maxStep) return;
    for (let s = 1; s < n; s++) { const err = validate(s); if (err) { W.step = s; BC.render(); return BC.toast(err); } }
    W.step = n; BC.render(); scrollTop();
  };
  A["wiz-open"] = (el) => { W.open = Number(el.dataset.i); BC.render(); };
  A["wiz-pick"] = (el) => {
    const i = Number(el.dataset.i), it = W.items[i];
    if (it.studioId !== el.dataset.studio) {
      it.studioId = el.dataset.studio;
      it.serviceId = BC.matchService(it.studioId, it.categorySlug, it.serviceHint).id;
      it.slotId = null; it.start = null; it.times = ["", "", ""]; it.wishDate = "";
    }
    W.open = W.items.findIndex((x) => x.included && !x.studioId);
    BC.render();
  };
  A["wiz-slot"] = (el) => { const it = W.items[Number(el.dataset.i)]; it.slotId = el.dataset.slot; it.start = Number(el.dataset.start); BC.render(); };
  C["wiz-include"] = (el) => { W.items[Number(el.dataset.i)].included = el.checked; };
  C["wiz-cat"] = (el) => {
    const cat = el.dataset.cat;
    if (el.checked) W.items.push(newItem({ id: "c-" + cat, categorySlug: cat, label: BC.category(cat).name }));
    else W.items = W.items.filter((i) => i.categorySlug !== cat);
  };
  BC.inputs["wiz-name"] = (el) => { W.customName = el.value.trim(); };
  C["wiz-only-online"] = (el) => { W.onlyOnline = el.checked; W.open = W.open == null ? -1 : W.open; BC.render(); };
  C["wiz-sort"] = (el) => { W.sort = el.value; BC.render(); };
  C["wiz-service"] = (el) => { const it = W.items[Number(el.dataset.i)]; it.serviceId = el.value; };
  C["wiz-time"] = (el) => { W.items[Number(el.dataset.i)].times[Number(el.dataset.j)] = el.value; BC.render(); };
  BC.onWishDate = (i, val) => { if (W && W.items[i]) W.items[i].wishDate = val; };

  A["wiz-save"] = () => {
    for (let s = 1; s <= 3; s++) { const err = validate(s); if (err) { W.step = s; BC.render(); return BC.toast(err); } }
    const S = BC.S();
    const now = Date.now();
    const up = {
      id: BC.uid(), packageSlug: W.pkg.slug, name: W.custom && W.customName ? W.customName : W.pkg.name,
      icon: W.pkg.icon, hue: W.pkg.hue, citySlug: W.citySlug, createdAt: now, discountPercent: W.pkg.discountPercent, items: []
    };
    included().forEach((it) => {
      const st = studioOf(it);
      const item = { label: it.label, categorySlug: it.categorySlug, studioId: st.id, serviceId: it.serviceId, mode: st.bookingMode, wishDate: it.wishDate, manualDate: "", note: "" };
      if (st.bookingMode === "online") {
        const b = { id: BC.uid(), studioId: st.id, serviceId: it.serviceId, type: "online", status: "confirmed", start: it.start, createdAt: now, userPackageId: up.id };
        S.bookings.push(b); S.bookedSlots.push(it.slotId);
        Object.assign(item, { status: "booked", start: it.start, bookingId: b.id });
      } else if (st.bookingMode === "request") {
        const times = it.times.filter(Boolean).map(BC.parseLocal);
        const b = { id: BC.uid(), studioId: st.id, serviceId: it.serviceId, type: "request", status: "pending", requestedTimes: times, createdAt: now, userPackageId: up.id };
        S.bookings.push(b);
        Object.assign(item, { status: "requested", requestedTimes: times, bookingId: b.id });
      } else {
        item.status = "manual_open";
      }
      up.items.push(item);
    });
    S.userPackages.unshift(up);
    BC.save();
    W = null;
    BC.toast("Paket gespeichert. Hier ist deine Checkliste.");
    BC.go(`#/konto/pakete/${up.id}`);
  };
})();
