/* =========================================================
   Community: Kanäle pro Stadt, Chat, Fragen-Threads,
   Reaktionen, Melden/Blockieren, @Studio-Erwähnungen
   ========================================================= */
(function () {
  "use strict";
  const BC = window.BC;
  const esc = BC.esc;
  const P = BC.pages;
  const CFG = BC.cfg;
  const EMOJIS = ["❤️", "👍", "🔥"];

  // Text sicher darstellen + @studio-slug als Link
  BC.renderText = (text, citySlug, plain) =>
    esc(text).replace(/@([a-z0-9-]+)/g, (m, slug) => {
      const st = BC.studio(citySlug, slug);
      if (!st) return m;
      return plain ? `<span class="mention">@${esc(st.name)}</span>` : `<a class="mention" href="#/s/${citySlug}/studio/${slug}">@${esc(st.name)}</a>`;
    }).replace(/\n/g, "<br>");
  const mentionsOf = (text, citySlug) => [...new Set((text.match(/@([a-z0-9-]+)/g) || []).map((m) => m.slice(1)))].map((s) => BC.studio(citySlug, s)).filter(Boolean);
  const miniStudio = (st) => `<a class="mini-studio" href="#/s/${st.citySlug}/studio/${st.slug}">${BC.ph(st.hue, BC.studioIcon(st))}<span style="min-width:0"><strong class="small">${esc(st.name)}</strong><br><span class="xs muted">${esc(st.district)} · ★ ${BC.ratingOf(st).rating.toFixed(1).replace(".", ",")}</span></span><span style="margin-left:auto">${BC.modeBadge(st.bookingMode)}</span></a>`;

  const repliesOf = (id) => BC.allMessages().filter((m) => m.parentId === id).sort((a, b) => a.date - b.date);
  const bestOf = (q) => BC.S().bestAnswers[q.id] || q.bestAnswerId || null;
  const count = (m, e) => (m.reactions[e] || 0) + ((BC.S().myReactions[m.id] || []).includes(e) ? 1 : 0);
  const isMine = (m) => m.mine;

  function messageHtml(m, citySlug, ch, opts) {
    opts = opts || {};
    const S = BC.S();
    const reported = S.reports.includes(m.id);
    const replies = !m.parentId ? repliesOf(m.id) : [];
    const mine = S.myReactions[m.id] || [];
    const studios = mentionsOf(m.text, citySlug);
    return `<div class="msg ${reported ? "reported" : ""}" id="m-${m.id}">
      ${BC.avatar(m.author)}
      <div class="msg-body">
        <div class="msg-head"><strong>${esc(m.author)}</strong>${m.badge ? `<span class="tag ${m.badge === "Local Expert" ? "tag-gold" : ""}">${esc(m.badge === "Local Expert" ? "Local Expert " + BC.city(citySlug).name : m.badge)}</span>` : ""}
          <span class="xs muted">${BC.ago(m.date)}</span>${m.isQuestion ? `<span class="q-badge">❓ Frage</span>` : ""}</div>
        ${reported ? `<p class="small muted msg-text">Diese Nachricht wurde gemeldet und wird geprüft.</p>` : `
        <div class="msg-text">${BC.renderText(m.text, citySlug)}</div>
        ${m.image ? `<img class="msg-img" src="${esc(m.image)}" alt="Bild von ${esc(m.author)}" loading="lazy">` : ""}
        ${studios.map(miniStudio).join("")}`}
        <div class="msg-actions">
          ${EMOJIS.map((e) => `<button class="react" data-act="react" data-id="${m.id}" data-emoji="${e}" aria-pressed="${mine.includes(e)}" aria-label="${e} reagieren">${e} ${count(m, e) || ""}</button>`).join("")}
          ${!m.parentId && !opts.inThread ? `<a class="link-btn" href="#/s/${citySlug}/community/${ch.slug}/t/${m.id}">💬 ${replies.length ? `${replies.length} ${replies.length === 1 ? "Antwort" : "Antworten"}` : "Antworten"}</a>` : ""}
          ${opts.canMarkBest ? `<button class="link-btn" data-act="best" data-q="${opts.q}" data-id="${m.id}">${opts.isBest ? "★ Beste Antwort entfernen" : "☆ Als beste Antwort markieren"}</button>` : ""}
          ${!isMine(m) && !reported ? `<button class="link-btn" data-act="report" data-id="${m.id}">⚑ Melden</button><button class="link-btn" data-act="block" data-author="${esc(m.author)}">🚫 Blockieren</button>` : ""}
          ${isMine(m) ? `<button class="link-btn" data-act="msg-del" data-id="${m.id}">🗑️ Löschen</button>` : ""}
        </div>
      </div></div>`;
  }

  function composer(citySlug, ch, parentId) {
    const studios = BC.studios(citySlug);
    return `<form class="composer" data-submit="chat-send" data-channel="${ch.id}" data-city="${citySlug}" ${parentId ? `data-parent="${parentId}"` : ""}>
      <label class="sr-only" for="chat-text">Nachricht</label>
      <textarea id="chat-text" name="text" required maxlength="1000" placeholder="${parentId ? "Deine Antwort …" : `Schreib etwas in #${esc(ch.name)} …`}"></textarea>
      <div class="composer-tools">
        <select data-change="mention" aria-label="Studio erwähnen"><option value="">＠ Studio erwähnen …</option>${studios.map((s) => `<option value="${s.slug}">${esc(s.name)}</option>`).join("")}</select>
        <input name="image" type="url" placeholder="🖼️ Bild-Link (optional, https://…)" pattern="https://.*">
        <div class="row" style="justify-content:space-between">
          ${parentId ? "" : `<label class="check small"><input type="checkbox" name="question"> <span>Als Frage</span></label>`}
          <button class="btn btn-primary btn-sm" type="submit">Senden</button>
        </div>
      </div></form>`;
  }

  // ---------- Kanalübersicht + Suche
  P.community = (citySlug) => {
    const city = BC.city(citySlug);
    const chans = BC.channels(citySlug);
    const all = BC.allMessages();
    return {
      title: `Community ${city.name} – ${CFG.appName}`,
      html: `${BC.pageHead("Community", { eyebrow: esc(city.name) })}
      <p class="muted">Frag nach Empfehlungen, teile deine Erfahrungen und hilf anderen Frauen in ${esc(city.name)}. <a href="#/regeln">Regeln</a></p>
      <label class="sr-only" for="c-search">Fragen und Nachrichten durchsuchen</label>
      <input id="c-search" type="search" placeholder="🔎 Fragen & Empfehlungen durchsuchen, z. B. „Balayage“" data-input="community-search" data-city="${citySlug}" style="margin:6px 0 14px">
      <div id="search-results"></div>
      <div class="card channel-list" style="padding:0">${chans.map((ch) => {
        const msgs = all.filter((m) => m.channelId === ch.id);
        const last = msgs.sort((a, b) => b.date - a.date)[0];
        return `<a href="#/s/${citySlug}/community/${ch.slug}"><span class="ic" aria-hidden="true">${ch.icon}</span>
          <span style="min-width:0;flex:1"><strong>#${esc(ch.name)}</strong> <span class="xs muted">· ${msgs.length} Beiträge</span><br>
          <span class="small muted" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${last ? `${esc(last.author)}: ${BC.renderText(last.text, citySlug, true)}` : esc(ch.description)}</span></span>
          ${last ? `<span class="xs muted">${BC.ago(last.date)}</span>` : ""}</a>`;
      }).join("")}</div>`
    };
  };
  BC.inputs["community-search"] = (el) => {
    const citySlug = el.dataset.city;
    const q = el.value.trim().toLowerCase();
    const box = document.getElementById("search-results");
    if (q.length < 2) { box.innerHTML = ""; return; }
    const hits = BC.allMessages().filter((m) => m.channelId.startsWith(`ch-${citySlug}-`) && BC.renderText(m.text, citySlug, true).replace(/<[^>]+>/g, "").toLowerCase().includes(q)).slice(0, 12);
    box.innerHTML = `<div class="card" style="margin-bottom:14px"><h3>${hits.length} Treffer</h3>${hits.map((m) => {
      const ch = BC.data.channels.find((c) => c.id === m.channelId);
      const root = m.parentId || m.id;
      return `<a class="msg" style="color:inherit;text-decoration:none" href="#/s/${citySlug}/community/${ch.slug}/t/${root}">${BC.avatar(m.author)}<div class="msg-body"><div class="msg-head"><strong>${esc(m.author)}</strong><span class="xs muted">#${esc(ch.name)} · ${BC.ago(m.date)}</span>${m.isQuestion ? `<span class="q-badge">Frage</span>` : ""}</div><div class="msg-text small">${BC.renderText(m.text, citySlug, true)}</div></div></a>`;
    }).join("") || `<p class="muted small">Nichts gefunden – stell deine Frage doch in #empfehlungen-gesucht!</p>`}</div>`;
  };

  // ---------- Kanal
  P.channel = (citySlug, chSlug) => {
    const city = BC.city(citySlug);
    const ch = BC.channel(citySlug, chSlug);
    if (!ch) return P.notFound();
    const msgs = BC.allMessages().filter((m) => m.channelId === ch.id && !m.parentId).sort((a, b) => a.date - b.date);
    return {
      title: `#${ch.name} – Community ${city.name}`,
      html: `${BC.navBar("#" + esc(ch.name), `#/s/${citySlug}/community`)}
      <div class="chips" style="margin-bottom:12px">${BC.channels(citySlug).map((c) => `<a class="chip ${c.id === ch.id ? "active" : ""}" href="#/s/${citySlug}/community/${c.slug}">${c.icon} ${esc(c.name)}</a>`).join("")}</div>
      <p class="footnote" style="margin:0 4px 12px">${esc(ch.description)}</p>
      <div class="card">${msgs.length ? msgs.map((m) => messageHtml(m, citySlug, ch)).join("") : `<p class="muted">Noch keine Beiträge – schreib den ersten! 💬</p>`}</div>
      ${composer(citySlug, ch)}`
    };
  };

  // ---------- Thread
  P.thread = (citySlug, chSlug, id) => {
    const ch = BC.channel(citySlug, chSlug);
    const q = BC.message(id);
    if (!ch || !q) return P.notFound();
    const best = bestOf(q);
    const replies = repliesOf(q.id);
    const bestMsg = replies.find((r) => r.id === best);
    const ordered = bestMsg ? [bestMsg].concat(replies.filter((r) => r.id !== best)) : replies;
    return {
      title: `${q.isQuestion ? "Frage" : "Beitrag"} von ${q.author} – #${ch.name}`,
      html: `${BC.navBar(q.isQuestion ? "Frage" : "Beitrag", `#/s/${citySlug}/community/${ch.slug}`)}
      <div class="card">${messageHtml(q, citySlug, ch, { inThread: true })}</div>
      <h2 class="section" style="margin-bottom:10px">${replies.length} ${replies.length === 1 ? "Antwort" : "Antworten"}</h2>
      ${q.isQuestion ? `<p class="xs muted">Bei Fragen kann die hilfreichste Antwort markiert werden – sie erscheint dann ganz oben.</p>` : ""}
      <div class="card">${ordered.length ? ordered.map((r) => {
        const isBest = r.id === best;
        const html = messageHtml(r, citySlug, ch, { inThread: true, canMarkBest: q.isQuestion, q: q.id, isBest });
        return isBest ? `<div class="best"><div class="best-label">★ Beste Antwort</div>${html}</div>` : html;
      }).join("") : `<p class="muted">Noch keine Antworten. Hilf mit! 💕</p>`}</div>
      ${composer(citySlug, ch, q.id)}`
    };
  };

  // ---------- Aktionen
  BC.changes.mention = (el) => {
    if (!el.value) return;
    const ta = el.closest("form").elements.text;
    ta.value = (ta.value ? ta.value.replace(/\s*$/, " ") : "") + "@" + el.value + " ";
    el.value = ""; ta.focus();
  };
  BC.submits["chat-send"] = (form) => {
    const text = form.elements.text.value.trim();
    if (!text) return;
    const img = form.elements.image.value.trim();
    if (img && !/^https:\/\//i.test(img)) return BC.toast("Bitte einen Bild-Link mit https:// angeben.");
    const parentId = form.dataset.parent || null;
    BC.S().messages.push({
      id: "u-" + BC.uid(), channelId: form.dataset.channel, author: CFG.demoUser.firstName, badge: "Neu", mine: true,
      text, image: img || null, isQuestion: !parentId && !!(form.elements.question && form.elements.question.checked),
      parentId, date: Date.now(), reactions: {}
    });
    BC.save(); BC.render();
    BC.toast(parentId ? "Antwort gesendet 💬" : "Nachricht gesendet 💬");
    setTimeout(() => { const v = document.getElementById("chat-text"); if (v) v.scrollIntoView({ block: "end", behavior: "smooth" }); }, 30);
  };
  BC.actions.react = (el) => {
    const S = BC.S(); const id = el.dataset.id, e = el.dataset.emoji;
    const mine = S.myReactions[id] || [];
    S.myReactions[id] = mine.includes(e) ? mine.filter((x) => x !== e) : mine.concat(e);
    BC.save(); BC.render();
  };
  BC.actions.report = async (el) => {
    if (!(await BC.confirm("Diese Nachricht melden? Unser Team prüft sie."))) return;
    BC.S().reports.push(el.dataset.id); BC.save(); BC.toast("Danke! Die Nachricht wurde gemeldet."); BC.render();
  };
  BC.actions.block = async (el) => {
    const a = el.dataset.author;
    if (!(await BC.confirm(`${a} blockieren? Du siehst dann keine Nachrichten mehr von ihr.`))) return;
    BC.S().blocked.push(a); BC.save(); BC.toast(`${a} wurde blockiert.`); BC.render();
  };
  BC.actions["msg-del"] = async (el) => {
    if (!(await BC.confirm("Deine Nachricht löschen?"))) return;
    const S = BC.S(); S.messages = S.messages.filter((m) => m.id !== el.dataset.id && m.parentId !== el.dataset.id); BC.save(); BC.render();
  };
  BC.actions.best = (el) => {
    const S = BC.S(); const q = el.dataset.q;
    const current = bestOf(BC.message(q));
    S.bestAnswers[q] = current === el.dataset.id ? "none" : el.dataset.id;
    BC.save(); BC.render();
  };
})();
