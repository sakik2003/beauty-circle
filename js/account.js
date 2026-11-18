/* =========================================================
   Konto: Übersicht, Meine Pakete (Checkliste), Buchungen,
   Merkliste, Beauty-Erinnerungen
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  const P = BC.pages;
  const CFG = BC.cfg;
  const DAY = 86400000;

  const isDone = (i) => i.status === "booked" || i.status === "manual_done";
  BC.pkgProgress = (up) => ({ done: up.items.filter(isDone).length, total: up.items.length });
  const progressBar = (up) => { const p = BC.pkgProgress(up); return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.done}" aria-label="Fortschritt"><div style="width:${(p.done / p.total) * 100}%"></div></div><p class="xs muted" style="margin:6px 0 0">${p.done} von ${p.total} erledigt</p>`; };

  // Anfragen werden nach X Sekunden vom "Studio" bestätigt (Simulation)
  BC.processPending = () => {
    const S = BC.S();
    let changed = false;
    S.bookings.forEach((b) => {
      if (b.type === "request" && b.status === "pending" && Date.now() - b.createdAt >= CFG.requestConfirmSeconds * 1000) {
        b.status = "confirmed"; b.start = b.requestedTimes[0]; changed = true;
        S.userPackages.forEach((up) => up.items.forEach((it) => { if (it.bookingId === b.id) { it.status = "booked"; it.start = b.start; } }));
        BC.toast(`${BC.studioById(b.studioId).name} hat deine Anfrage bestätigt: ${BC.fmtDateTime(b.start)}`);
      }
    });
    if (changed) BC.save();
    return changed;
  };

  const nav = (active) => `<div class="chips" style="margin-bottom:16px">${[
    ["konto", "Übersicht", "#/konto"], ["pakete", "Meine Pakete", "#/konto/pakete"], ["buchungen", "Buchungen", "#/konto/buchungen"], ["merkliste", "Merkliste", "#/konto/merkliste"]
  ].map(([k, t, h]) => `<a class="chip ${active === k ? "active" : ""}" href="${h}" ${active === k ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</div>`;

  // ---------- Übersicht
  P.account = () => {
    const S = BC.S();
    const openManual = S.userPackages.reduce((n, up) => n + up.items.filter((i) => i.status === "manual_open").length, 0);
    const upcoming = S.bookings.filter((b) => b.status === "confirmed" && b.start > Date.now()).length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      title: `Mein Konto – ${CFG.appName}`,
      html: `${BC.pageHead("Konto")}
      <div class="group">
        <div class="row-item">${BC.avatar(CFG.demoUser.firstName)}<span class="ri-body"><strong>${esc(CFG.demoUser.firstName)}</strong><span class="ri-sub">Demo-Konto · ${esc(BC.city(BC.currentCity()).name)}</span></span></div>
      </div>
      ${openManual ? `<a class="callout section" style="margin:16px 0 0" href="#/konto/pakete"><strong>${openManual} ${openManual === 1 ? "Termin" : "Termine"} noch selbst vereinbaren</strong><span>Zur Checkliste in „Meine Pakete“</span></a>` : ""}
      <div class="group section">
        <a class="row-item" href="#/konto/pakete"><span class="ri-icon" style="--tint:var(--pink-strong)">${BC.icon("bag", 18)}</span><span class="ri-body"><strong>Meine Pakete</strong></span><span class="ri-value">${S.userPackages.length}</span>${BC.chev()}</a>
        <a class="row-item" href="#/konto/buchungen"><span class="ri-icon" style="--tint:var(--sky-strong)">${BC.icon("calendar", 18)}</span><span class="ri-body"><strong>Buchungen</strong></span><span class="ri-value">${upcoming}</span>${BC.chev()}</a>
        <a class="row-item" href="#/konto/merkliste"><span class="ri-icon" style="--tint:var(--yellow-strong)">${BC.icon("heart", 18)}</span><span class="ri-body"><strong>Merkliste</strong></span><span class="ri-value">${S.favorites.length}</span>${BC.chev()}</a>
      </div>

      <section class="section card">
        <h2>Beauty-Erinnerungen</h2>
        <p class="small muted">Lass dich erinnern, wenn es wieder Zeit ist – z. B. Wimpern auffüllen alle 3 Wochen.</p>
        ${S.reminders.length ? `<div class="stack" style="margin-bottom:14px">${S.reminders.map((r) => {
          const next = BC.parseLocal(r.lastDate + "T12:00") + r.interval * DAY;
          const due = next <= today.getTime() + DAY;
          return `<div class="spread" style="border-bottom:1px solid var(--border);padding-bottom:10px"><div><strong>${esc(r.label)}</strong><div class="xs muted">alle ${r.interval} Tage · nächster Termin: ${BC.fmtDate(next)}</div></div>
            <div class="row">${due ? `<span class="tag">Jetzt fällig</span>` : ""}<button class="btn btn-sm" data-act="rem-done" data-id="${r.id}">Erledigt</button><button class="btn btn-sm btn-ghost" data-act="rem-del" data-id="${r.id}" aria-label="Erinnerung löschen">Löschen</button></div></div>`;
        }).join("")}</div>` : ""}
        <form class="filters" data-submit="reminder" style="align-items:end">
          <label class="field"><span class="xs">Was?</span><input name="label" required maxlength="40" placeholder="Wimpern auffüllen"></label>
          <label class="field"><span class="xs">Alle … Tage</span><input name="interval" type="number" min="1" max="365" value="21" required></label>
          <label class="field"><span class="xs">Zuletzt gemacht</span><input name="lastDate" type="date" value="${BC.ymd(Date.now())}" required></label>
          <button class="btn btn-primary" type="submit">+ Hinzufügen</button>
        </form>
      </section>

      <section class="section card">
        <h2>Einstellungen</h2>
        <div class="stack">
          <div><div class="small muted" style="margin-bottom:8px">Darstellung</div>
            <div class="chips" role="group" aria-label="Darstellung">${[["system", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(([v, t]) => {
              const on = (S.theme || "system") === v;
              return `<button class="chip ${on ? "active" : ""}" aria-pressed="${on}" data-act="theme" data-theme="${v}">${t}</button>`;
            }).join("")}</div></div>
          <a href="#/regeln">Community-Regeln</a>
          <a href="#/datenschutz">Datenschutz</a>
          <div><button class="btn" data-act="reset-all" style="color:var(--danger)">Alle Daten löschen</button>
          <p class="xs muted" style="margin-top:6px">Entfernt Pakete, Buchungen, Merkliste, Nachrichten und Bewertungen aus diesem Browser.</p></div>
        </div>
      </section>`
    };
  };
  BC.submits.reminder = (form) => {
    BC.S().reminders.push({ id: BC.uid(), label: form.elements.label.value.trim(), interval: Number(form.elements.interval.value), lastDate: form.elements.lastDate.value });
    BC.save(); BC.toast("Erinnerung gespeichert"); BC.render();
  };
  BC.actions["rem-done"] = (el) => { const r = BC.S().reminders.find((x) => x.id === el.dataset.id); r.lastDate = BC.ymd(Date.now()); BC.save(); BC.toast("Super! Nächste Erinnerung ist gesetzt."); BC.render(); };
  BC.actions["rem-del"] = (el) => { const S = BC.S(); S.reminders = S.reminders.filter((x) => x.id !== el.dataset.id); BC.save(); BC.render(); };
  BC.actions["reset-all"] = async () => {
    if (!(await BC.confirm("Wirklich alle deine Daten in diesem Browser löschen? Das kann nicht rückgängig gemacht werden."))) return;
    BC.resetAll(); BC.toast("Alle Daten gelöscht."); BC.go("#/");
  };

  // ---------- Meine Pakete
  P.myPackages = () => {
    const S = BC.S();
    return {
      title: `Meine Pakete – ${CFG.appName}`,
      html: `${BC.navBar("Meine Pakete", "#/konto")}
      ${S.userPackages.length ? `<div class="grid grid-2">${S.userPackages.map((up) => {
        const open = up.items.filter((i) => i.status === "manual_open").length;
        return `<a class="card card-link" href="#/konto/pakete/${up.id}"><div class="row" style="gap:12px;margin-bottom:10px"><div style="width:52px">${BC.ph(up.hue, up.icon)}</div>
          <div><h3 style="margin:0">${esc(up.name)}</h3><span class="xs muted">${esc(BC.city(up.citySlug).name)} · erstellt ${BC.ago(up.createdAt)}</span></div></div>
          ${progressBar(up)}${open ? `<p class="small" style="margin:8px 0 0;color:var(--man)">${open} noch selbst vereinbaren</p>` : ""}</a>`;
      }).join("")}</div>` : BC.empty("🎀", "Noch keine Pakete – entdecke unsere Pakete!", `<a class="btn btn-primary" href="#/s/${BC.currentCity()}/pakete">Pakete ansehen</a>`)}`
    };
  };

  // ---------- Paket-Detail mit Checkliste
  P.myPackage = (id) => {
    const S = BC.S();
    const up = S.userPackages.find((p) => p.id === id);
    if (!up) return P.notFound();
    const p = BC.pkgProgress(up);
    const overdue = up.items.some((i) => i.status === "manual_open") && Date.now() - up.createdAt > CFG.manualReminderHours * 3600000;
    const row = (it, idx) => {
      const st = BC.studioById(it.studioId), v = BC.service(it.serviceId);
      const head = `<div class="spread"><div class="title"><strong>${esc(it.label)}</strong> · <a href="#/s/${st.citySlug}/studio/${st.slug}">${esc(st.name)}</a><div class="xs muted">${esc(v.name)} · ${BC.euro(v.price)}</div></div>${BC.modeBadge(st.bookingMode)}</div>`;
      if (it.status === "booked") return `<div class="card check-item">${head}<p class="small" style="margin:0;color:var(--ok)"><strong>Gebucht: ${BC.fmtDateTime(it.start)}</strong></p></div>`;
      if (it.status === "requested") return `<div class="card check-item">${head}<p class="small" style="margin:0;color:var(--req)"><strong>Angefragt</strong> – wartet auf Bestätigung des Studios</p><p class="xs muted" style="margin:0">Wunschtermine: ${it.requestedTimes.map(BC.fmtDateTime).join(" / ")}</p></div>`;
      const done = it.status === "manual_done";
      return `<div class="card check-item ${done ? "done" : ""}">
        ${head}
        <label class="check"><input type="checkbox" data-change="pkg-done" data-pkg="${up.id}" data-i="${idx}" ${done ? "checked" : ""}><span><strong>Termin vereinbart</strong></span></label>
        <div class="grid grid-3">
          <label class="field"><span class="xs">Vereinbarter Termin</span><input type="datetime-local" step="900" value="${esc(it.manualDate)}" data-change="pkg-date" data-pkg="${up.id}" data-i="${idx}"></label>
          <label class="field"><span class="xs">Notiz</span><input value="${esc(it.note)}" maxlength="120" placeholder="z. B. mit Aylin gesprochen" data-change="pkg-note" data-pkg="${up.id}" data-i="${idx}"></label>
        </div>
        ${done ? "" : BC.contactCard(st, { key: `pkg-${up.id}-${idx}`, service: v.name, wishDate: it.wishDate, collapsed: false })}
      </div>`;
    };
    const order = { manual_open: 0, requested: 1, manual_done: 2, booked: 3 };
    const items = up.items.map((it, idx) => ({ it, idx })).sort((a, b) => order[a.it.status] - order[b.it.status]);
    return {
      title: `${up.name} – Meine Pakete`,
      html: `${BC.navBar(esc(up.name), "#/konto/pakete")}
      <div class="studio-head" style="padding-top:4px"><h1>${esc(up.name)}</h1><div class="ri-sub">${esc(BC.city(up.citySlug).name)} · erstellt am ${BC.fmtDate(up.createdAt)}</div></div>
      <div class="card section">${progressBar(up)}${p.done === p.total ? `<p style="margin:10px 0 0"><strong>Alles erledigt. Viel Spaß bei deinen Terminen!</strong></p>` : ""}</div>
      ${overdue ? `<div class="notice notice-manual" role="alert" style="margin-bottom:14px"><span class="ic">${BC.icon("clock", 20)}</span><div><strong>Erinnerung:</strong> Du hast seit mehr als ${CFG.manualReminderHours} Stunden noch Termine offen, die du selbst vereinbaren musst.</div></div>` : ""}
      <div class="stack">${items.map(({ it, idx }) => row(it, idx)).join("")}</div>
      <div class="row section">
        <button class="btn btn-ghost btn-sm" data-act="pkg-ff" data-pkg="${up.id}" title="Nur für die Demo">Demo: ${CFG.manualReminderHours} Std. vorspulen</button>
        <button class="btn btn-ghost btn-sm" data-act="pkg-del" data-pkg="${up.id}" style="color:var(--danger)">Paket löschen</button>
      </div>`
    };
  };
  const findItem = (el) => BC.S().userPackages.find((p) => p.id === el.dataset.pkg).items[Number(el.dataset.i)];
  BC.changes["pkg-done"] = (el) => {
    const it = findItem(el);
    it.status = el.checked ? "manual_done" : "manual_open";
    BC.save();
    if (el.checked) BC.toast("Abgehakt");
    BC.render();
  };
  BC.changes["pkg-date"] = (el) => {
    const it = findItem(el);
    it.manualDate = el.value;
    if (el.value && it.status === "manual_open") { it.status = "manual_done"; BC.toast("Termin eingetragen und abgehakt"); }
    BC.save(); BC.render();
  };
  BC.changes["pkg-note"] = (el) => { findItem(el).note = el.value; BC.save(); };
  BC.actions["pkg-ff"] = (el) => { const up = BC.S().userPackages.find((p) => p.id === el.dataset.pkg); up.createdAt -= (CFG.manualReminderHours + 1) * 3600000; BC.save(); BC.render(); };
  BC.actions["pkg-del"] = async (el) => {
    if (!(await BC.confirm("Paket wirklich löschen? Gebuchte Termine bleiben unter „Buchungen“ erhalten."))) return;
    const S = BC.S(); S.userPackages = S.userPackages.filter((p) => p.id !== el.dataset.pkg); BC.save(); BC.go("#/konto/pakete");
  };

  // ---------- Buchungen
  P.bookings = () => {
    const S = BC.S();
    const list = S.bookings.slice().sort((a, b) => (b.start || b.createdAt) - (a.start || a.createdAt));
    const STATUS = { confirmed: ["Bestätigt", "var(--ok)"], pending: ["Angefragt", "var(--req)"], cancelled: ["Storniert", "var(--muted)"] };
    return {
      title: `Meine Buchungen – ${CFG.appName}`,
      html: `${BC.navBar("Meine Buchungen", "#/konto")}
      ${list.length ? `<div class="stack">${list.map((b) => {
        const st = BC.studioById(b.studioId), v = BC.service(b.serviceId), s = STATUS[b.status];
        return `<div class="card"><div class="spread"><div><strong><a href="#/s/${st.citySlug}/studio/${st.slug}">${esc(st.name)}</a></strong><div class="small muted">${esc(v.name)} · ${BC.euro(v.price)}</div></div><strong style="color:${s[1]}">${s[0]}</strong></div>
          <p class="small" style="margin:8px 0 0">${b.status === "pending" ? `Wunschtermine: ${b.requestedTimes.map(BC.fmtDateTime).join(" / ")}` : b.start ? BC.fmtDateTime(b.start) : ""}</p>
          ${b.status !== "cancelled" && (b.start || 0) > Date.now() || b.status === "pending" ? `<button class="btn btn-ghost btn-sm" data-act="booking-cancel" data-id="${b.id}" style="margin-top:6px">Stornieren</button>` : ""}</div>`;
      }).join("")}</div>` : BC.empty("📅", "Noch keine Buchungen.", `<a class="btn btn-primary" href="#/s/${BC.currentCity()}">Studios entdecken</a>`)}
      <p class="xs muted section">Manuell vereinbarte Termine findest du in der Checkliste unter „Meine Pakete“.</p>`
    };
  };
  BC.actions["booking-cancel"] = async (el) => {
    if (!(await BC.confirm("Termin wirklich stornieren?"))) return;
    const S = BC.S();
    const b = S.bookings.find((x) => x.id === el.dataset.id);
    b.status = "cancelled";
    S.bookedSlots = S.bookedSlots.filter((id) => id !== `${b.studioId}@${b.start}`);
    S.userPackages.forEach((up) => up.items.forEach((it) => { if (it.bookingId === b.id) it.status = "manual_open"; }));
    BC.save(); BC.toast("Termin storniert."); BC.render();
  };

  // ---------- Merkliste
  P.favorites = () => {
    const favs = BC.S().favorites.map(BC.studioById).filter(Boolean);
    return {
      title: `Merkliste – ${CFG.appName}`,
      html: `${BC.navBar("Merkliste", "#/konto")}
      ${favs.length ? `${BC.studioList(favs)}` : BC.empty("🤍", "Noch nichts gemerkt. Tippe auf das Herz bei einem Studio.", `<a class="btn btn-primary" href="#/s/${BC.currentCity()}">Studios entdecken</a>`)}`
    };
  };
})();
