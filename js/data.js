/* =========================================================
   Beispieldaten (ALLE Studios, Personen und Kontakte sind erfunden)
   Später wird diese Datei durch die Datenbank (Supabase) ersetzt.
   ========================================================= */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG;

  // ---------- Zufall mit festem Startwert (gleiche Daten bei jedem Laden)
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let a = hash(String(seed));
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const slugify = (s) =>
    s.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/é/g, "e").replace(/&/g, "und")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // ---------- Kategorien
  const categories = [
    { id: "k1", slug: "friseur",   name: "Friseur",           icon: "✂️", hue: 22 },
    { id: "k2", slug: "naegel",    name: "Nägel & Maniküre",  icon: "💅", hue: 340 },
    { id: "k3", slug: "pedikuere", name: "Pediküre",          icon: "🦶", hue: 190 },
    { id: "k4", slug: "wimpern",   name: "Wimpern",           icon: "👁️", hue: 280 },
    { id: "k5", slug: "brows",     name: "Augenbrauen",       icon: "✨", hue: 40 },
    { id: "k6", slug: "waxing",    name: "Waxing",            icon: "🌸", hue: 320 },
    { id: "k7", slug: "kosmetik",  name: "Kosmetik",          icon: "🧖‍♀️", hue: 160 },
    { id: "k8", slug: "makeup",    name: "Make-up",           icon: "💄", hue: 0 }
  ];

  // ---------- Leistungs-Vorlagen pro Kategorie: [Name, Preis von, Preis bis, Dauer in Min]
  const SERVICE_TEMPLATES = {
    friseur:   [["Waschen, Schneiden & Föhnen", 45, 75, 60], ["Balayage", 140, 220, 180], ["Hochsteckfrisur", 60, 110, 75], ["Föhnfrisur & Styling", 30, 50, 45]],
    naegel:    [["Maniküre klassisch", 25, 35, 40], ["Gel-Modellage Neuset", 45, 65, 90], ["Gel auffüllen", 35, 50, 75], ["Nail Art (Zusatz)", 10, 20, 30]],
    pedikuere: [["Pediküre klassisch", 35, 45, 50], ["Pediküre mit Shellac", 45, 60, 70], ["Medizinische Fußpflege", 40, 55, 60]],
    wimpern:   [["Wimpernverlängerung 1:1 Neuset", 89, 129, 120], ["Volumen-Wimpern Neuset", 119, 159, 150], ["Wimpern auffüllen", 49, 69, 60], ["Wimpernlifting", 49, 69, 60]],
    brows:     [["Brow Lamination", 45, 60, 45], ["Zupfen & Färben", 20, 30, 30], ["Microblading", 250, 400, 150]],
    waxing:    [["Beine komplett", 40, 55, 45], ["Achseln", 12, 18, 15], ["Brazilian Waxing", 35, 50, 30]],
    kosmetik:  [["Klassische Gesichtsbehandlung", 65, 90, 75], ["Hydrafacial", 120, 160, 60], ["Ausreinigung", 45, 65, 45]],
    makeup:    [["Tages-Make-up", 45, 65, 45], ["Abend-Make-up", 65, 90, 60], ["Braut-Make-up inkl. Probe", 180, 280, 150]]
  };

  // ---------- Bezirke mit ungefähren Koordinaten
  const DISTRICTS = {
    berlin: {
      "Mitte": [52.5200, 13.4050], "Prenzlauer Berg": [52.5390, 13.4240], "Kreuzberg": [52.4990, 13.4030],
      "Neukölln": [52.4810, 13.4350], "Charlottenburg": [52.5160, 13.3040], "Friedrichshain": [52.5150, 13.4540],
      "Schöneberg": [52.4840, 13.3550], "Wedding": [52.5490, 13.3600]
    },
    hamburg: {
      "Eimsbüttel": [53.5750, 9.9530], "Altona": [53.5500, 9.9350], "St. Georg": [53.5550, 10.0110],
      "Winterhude": [53.5950, 10.0050], "Ottensen": [53.5530, 9.9250], "Eppendorf": [53.5900, 9.9850],
      "Barmbek": [53.5850, 10.0400], "HafenCity": [53.5410, 9.9990]
    }
  };
  // Vorwahlen aus dem für Film/Fernsehen reservierten Bereich (fiktiv)
  const PHONE = { berlin: ["030 23125", "493023125"], hamburg: ["040 66969", "494066969"] };

  // ---------- Studios: [Name, Bezirk, Straße, Buchungsart, Kategorien, Sprachen, Preisniveau]
  const STUDIO_DEFS = {
    berlin: [
      ["Haarwerk Mitte", "Mitte", "Torstraße 112", "online", ["friseur", "makeup"], ["Deutsch", "Englisch"], 2],
      ["Salon Rosé", "Charlottenburg", "Kantstraße 48", "request", ["friseur", "makeup"], ["Deutsch", "Russisch"], 3],
      ["Kamm & Kunst", "Wedding", "Müllerstraße 76", "manual", ["friseur", "makeup"], ["Deutsch", "Türkisch", "Arabisch"], 1],
      ["Nailbar Luna", "Prenzlauer Berg", "Kastanienallee 22", "online", ["naegel", "pedikuere"], ["Deutsch", "Englisch", "Vietnamesisch"], 2],
      ["Glanzstück Nails", "Schöneberg", "Akazienstraße 9", "request", ["naegel", "pedikuere"], ["Deutsch", "Polnisch"], 2],
      ["Nagelstudio Amira", "Neukölln", "Sonnenallee 141", "manual", ["naegel", "pedikuere"], ["Deutsch", "Arabisch"], 1],
      ["Lash Loft Berlin", "Friedrichshain", "Boxhagener Straße 31", "online", ["wimpern", "brows"], ["Deutsch", "Englisch"], 3],
      ["Blick & Bogen", "Kreuzberg", "Bergmannstraße 64", "request", ["wimpern", "brows"], ["Deutsch", "Türkisch"], 2],
      ["Wimpernzauber by Selin", "Neukölln", "Karl-Marx-Straße 203", "manual", ["wimpern", "brows"], ["Deutsch", "Türkisch"], 1],
      ["Skin Ritual", "Mitte", "Linienstraße 58", "online", ["kosmetik", "waxing"], ["Deutsch", "Englisch", "Französisch"], 3],
      ["Haut & Seele Kosmetik", "Charlottenburg", "Wilmersdorfer Straße 92", "request", ["kosmetik", "waxing"], ["Deutsch"], 2],
      ["Sugar Studio Neukölln", "Neukölln", "Weserstraße 17", "manual", ["kosmetik", "waxing"], ["Deutsch", "Persisch", "Englisch"], 1],
      ["Lash & Go", "Kreuzberg", "Oranienstraße 180", "online", ["wimpern"], ["Deutsch", "Englisch", "Spanisch"], 1],
      ["Polish Club", "Friedrichshain", "Simon-Dach-Straße 12", "online", ["naegel"], ["Deutsch", "Englisch"], 2],
      ["Cut Collective", "Prenzlauer Berg", "Schönhauser Allee 77", "online", ["friseur"], ["Deutsch", "Englisch"], 2]
    ],
    hamburg: [
      ["Hafenlocken", "HafenCity", "Am Sandtorkai 41", "online", ["friseur", "makeup"], ["Deutsch", "Englisch"], 3],
      ["Studio Blond", "Winterhude", "Mühlenkamp 28", "request", ["friseur", "makeup"], ["Deutsch"], 2],
      ["Salon Meltem", "St. Georg", "Steindamm 53", "manual", ["friseur", "makeup"], ["Deutsch", "Türkisch"], 1],
      ["Nailhouse Ottensen", "Ottensen", "Ottenser Hauptstraße 19", "online", ["naegel", "pedikuere"], ["Deutsch", "Englisch"], 2],
      ["Perlmutt Nails", "Eppendorf", "Eppendorfer Weg 160", "request", ["naegel", "pedikuere"], ["Deutsch", "Vietnamesisch"], 2],
      ["Nagelkunst Jasmin", "Barmbek", "Fuhlsbüttler Straße 88", "manual", ["naegel", "pedikuere"], ["Deutsch", "Persisch"], 1],
      ["Lashes by Elbe", "Altona", "Große Bergstraße 210", "online", ["wimpern", "brows"], ["Deutsch", "Englisch"], 3],
      ["Augenblick Studio", "Eimsbüttel", "Osterstraße 95", "request", ["wimpern", "brows"], ["Deutsch", "Polnisch"], 2],
      ["Brow Bar Leyla", "St. Georg", "Lange Reihe 37", "manual", ["wimpern", "brows"], ["Deutsch", "Arabisch", "Türkisch"], 1],
      ["Glow Room Hamburg", "Eppendorf", "Lehmweg 14", "online", ["kosmetik", "waxing"], ["Deutsch", "Englisch"], 3],
      ["Kosmetik Klara", "Winterhude", "Jarrestraße 46", "request", ["kosmetik", "waxing"], ["Deutsch"], 2],
      ["Wachs & Wellness", "Barmbek", "Hamburger Straße 132", "manual", ["kosmetik", "waxing"], ["Deutsch", "Russisch"], 1],
      ["Lash Lounge Altona", "Altona", "Max-Brauer-Allee 66", "online", ["wimpern"], ["Deutsch", "Englisch"], 2],
      ["Nail Society", "Eimsbüttel", "Schulterblatt 103", "online", ["naegel"], ["Deutsch", "Englisch", "Spanisch"], 2],
      ["Schnittstelle Eppendorf", "Eppendorf", "Eppendorfer Landstraße 71", "online", ["friseur"], ["Deutsch"], 2]
    ]
  };

  const DESCRIPTIONS = {
    friseur: "Moderne Schnitte, natürliche Farben und Styling für besondere Anlässe.",
    naegel: "Gel, Shellac und Nail Art – sauber, hygienisch und mit Liebe zum Detail.",
    pedikuere: "Gepflegte Füße zum Wohlfühlen.",
    wimpern: "Wimpernverlängerung und Lifting für einen wachen, natürlichen Blick.",
    brows: "Perfekt geformte Brauen.",
    waxing: "Schnelles, hygienisches Waxing.",
    kosmetik: "Gesichtsbehandlungen, die deiner Haut guttun.",
    makeup: "Make-up für Alltag, Abend und Hochzeit."
  };

  // ---------- Bewertungs-Vorlagen
  const REVIEW_TEXTS = {
    friseur: ["Endlich jemand, der Locken versteht! Der Schnitt sitzt perfekt.", "Meine Balayage ist super natürlich geworden, tolle Beratung.", "Freundliches Team und faire Preise – ich komme wieder."],
    naegel: ["Die Gelnägel halten seit vier Wochen ohne Abplatzer.", "Sehr sauber gearbeitet, die Nail Art sieht genau aus wie auf dem Foto.", "Total entspannte Atmosphäre und super schnell."],
    pedikuere: ["Sehr gründlich und entspannend – meine Füße fühlen sich an wie neu.", "Shellac hält im Urlaub perfekt, sogar am Strand.", "Endlich eine Pediküre, bei der man sich Zeit nimmt."],
    wimpern: ["Die Volumen-Wimpern sehen mega natürlich aus und halten super.", "Sie hat sich viel Zeit genommen, kein Brennen, kein Ziepen.", "Das Lifting war genau das, was ich wollte!"],
    brows: ["Die Brow Lamination ist der Hammer und hält sechs Wochen.", "Endlich symmetrische Brauen – danke!", "Schnell, präzise und gute Beratung zur Form."],
    waxing: ["Schnell, fast schmerzfrei und sehr hygienisch.", "Brazilian Waxing ohne Stress – sehr professionell.", "Faire Preise und ich musste nicht lange warten."],
    kosmetik: ["Meine Haut strahlt nach dem Hydrafacial, absolute Empfehlung.", "Die Ausreinigung war gründlich, aber sanft.", "Ich habe tolle Tipps für meine Hautpflege bekommen."],
    makeup: ["Mein Braut-Make-up hat den ganzen Tag gehalten!", "Natürlich und trotzdem glamourös – genau mein Stil.", "Hat super zu meinem Kleid gepasst, alle waren begeistert."]
  };
  const GENERIC_REVIEWS = [["Etwas Wartezeit, aber das Ergebnis war es wert.", 4], ["Preis-Leistung top, sehr zu empfehlen.", 5], ["Gutes Ergebnis, Terminfindung war etwas schwierig.", 4]];
  const AUTHORS = ["Aylin", "Sophie", "Mariam", "Jana", "Elif", "Nora", "Hanna", "Leyla", "Katharina", "Zeynep", "Mia", "Fatima", "Laura", "Dilara", "Emma", "Sara", "Anastasia", "Julia"];

  // ---------- Studios, Leistungen, Bewertungen erzeugen
  const studios = [], services = [], reviews = [];
  const DAY = 86400000;
  const now = Date.now();

  Object.keys(STUDIO_DEFS).forEach((citySlug) => {
    STUDIO_DEFS[citySlug].forEach((def, idx) => {
      const [name, district, street, mode, cats, languages, priceLevel] = def;
      const slug = slugify(name);
      const id = `s-${citySlug}-${idx + 1}`;
      const r = rng(id);
      const [lat, lng] = DISTRICTS[citySlug][district];
      const num = String(100 + idx * 37 + (citySlug === "hamburg" ? 300 : 0)).slice(-3);
      const open = r() > 0.5 ? 9 : 10;
      const close = [18, 19, 20][Math.floor(r() * 3)];
      const openingHours = [null, mode === "manual" ? null : [open, close], [open, close], [open, close], [open, close + (r() > 0.5 ? 1 : 0)], [open, close], [10, 16]];
      const reviewCount = 18 + Math.floor(r() * 160);
      const rating = Math.round((4.2 + r() * 0.75) * 10) / 10;

      studios.push({
        id, citySlug, name, slug, district,
        address: `${street}, ${district}`,
        lat: lat + (r() - 0.5) * 0.01, lng: lng + (r() - 0.5) * 0.015,
        phone: `${PHONE[citySlug][0]} ${num}`,
        whatsapp: `${PHONE[citySlug][1]}${num}`,
        email: `hallo@${slug}.example`,
        instagram: slug.replace(/-/g, "."),
        description: `${cats.map((c) => DESCRIPTIONS[c]).join(" ")} Mitten in ${district}.`,
        openingHours, priceLevel, languages, bookingMode: mode,
        categories: cats, rating, reviewCount,
        hue: categories.find((c) => c.slug === cats[0]).hue
      });

      // Leistungen
      cats.forEach((cat) => {
        SERVICE_TEMPLATES[cat].forEach((t, j) => {
          if (j === 3 && r() > 0.6) return; // nicht jedes Studio bietet alles an
          const [sName, min, max, dur] = t;
          const factor = priceLevel === 1 ? 0.15 : priceLevel === 2 ? 0.5 : 0.85;
          const price = Math.round((min + (max - min) * Math.min(1, factor + (r() - 0.5) * 0.2)) / 5) * 5 - 1 + (max < 30 ? 1 : 0);
          services.push({ id: `${id}-v${services.length}`, studioId: id, categorySlug: cat, name: sName, price: Math.max(min - 1, price), durationMin: dur });
        });
      });

      // Bewertungen
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const cat = cats[k % cats.length];
        const useGeneric = k === n - 1 && r() > 0.4;
        const g = GENERIC_REVIEWS[Math.floor(r() * GENERIC_REVIEWS.length)];
        const text = useGeneric ? g[0] : REVIEW_TEXTS[cat][(k + idx) % REVIEW_TEXTS[cat].length];
        reviews.push({
          id: `${id}-r${k}`, studioId: id,
          author: AUTHORS[Math.floor(r() * AUTHORS.length)],
          rating: useGeneric ? g[1] : r() > 0.25 ? 5 : 4,
          text, categorySlug: cat,
          photos: r() > 0.6 ? 2 : 0,
          verified: r() > 0.35,
          date: now - Math.floor(r() * 120 + 2) * DAY
        });
      }
    });
  });

  // ---------- Pakete
  const packages = [
    { id: "p1", slug: "chaya-paket", name: "Chaya Paket", icon: "🌺", hue: 330, discountPercent: 10, popular: true,
      description: "Unser Liebling: frische Wimpern, gepflegte Hände und schöne Füße – alles in einem Paket.",
      items: [
        { id: "p1-1", categorySlug: "wimpern", label: "Wimpernverlängerung", serviceHint: "Neuset" },
        { id: "p1-2", categorySlug: "naegel", label: "Maniküre", serviceHint: "Maniküre" },
        { id: "p1-3", categorySlug: "pedikuere", label: "Pediküre", serviceHint: "Shellac" }
      ] },
    { id: "p2", slug: "braut-paket", name: "Braut-Paket", icon: "👰‍♀️", hue: 40, discountPercent: 15, popular: true,
      description: "Für deinen großen Tag: Frisur, Make-up, Nägel und Wimpern – perfekt aufeinander abgestimmt.",
      items: [
        { id: "p2-1", categorySlug: "friseur", label: "Hochsteckfrisur", serviceHint: "Hochsteck" },
        { id: "p2-2", categorySlug: "makeup", label: "Braut-Make-up", serviceHint: "Braut" },
        { id: "p2-3", categorySlug: "naegel", label: "Nägel", serviceHint: "Gel-Modellage" },
        { id: "p2-4", categorySlug: "wimpern", label: "Wimpernlifting", serviceHint: "Lifting" }
      ] },
    { id: "p3", slug: "hochzeitsgast", name: "Hochzeitsgast", icon: "🥂", hue: 10, discountPercent: 10, popular: true,
      description: "Eingeladen? Mit Styling, Abend-Make-up und frischen Nägeln bist du perfekt vorbereitet.",
      items: [
        { id: "p3-1", categorySlug: "friseur", label: "Föhnfrisur & Styling", serviceHint: "Styling" },
        { id: "p3-2", categorySlug: "makeup", label: "Abend-Make-up", serviceHint: "Abend" },
        { id: "p3-3", categorySlug: "naegel", label: "Maniküre", serviceHint: "Maniküre" }
      ] },
    { id: "p4", slug: "urlaub-ready", name: "Urlaub-Ready", icon: "🏝️", hue: 190, discountPercent: 10,
      description: "Bereit für Sonne und Strand: glatte Haut, schöne Füße und Brauen, die halten.",
      items: [
        { id: "p4-1", categorySlug: "waxing", label: "Waxing Beine", serviceHint: "Beine" },
        { id: "p4-2", categorySlug: "pedikuere", label: "Pediküre mit Shellac", serviceHint: "Shellac" },
        { id: "p4-3", categorySlug: "brows", label: "Brow Lamination", serviceHint: "Lamination" }
      ] },
    { id: "p5", slug: "self-care-sonntag", name: "Self-Care Sonntag", icon: "🕯️", hue: 160, discountPercent: 5,
      description: "Gönn dir eine Auszeit: Gesichtsbehandlung und Maniküre zum Entspannen.",
      items: [
        { id: "p5-1", categorySlug: "kosmetik", label: "Gesichtsbehandlung", serviceHint: "Klassische" },
        { id: "p5-2", categorySlug: "naegel", label: "Maniküre", serviceHint: "Maniküre" }
      ] }
  ];

  // ---------- Community: Kanäle + Beispielnachrichten
  const CHANNEL_DEFS = [
    ["allgemein", "allgemein", "💬", "Alles rund um die Community"],
    ["haare", "haare", "✂️", "Schnitte, Farben, Styling"],
    ["naegel", "nägel", "💅", "Maniküre, Pediküre, Nail Art"],
    ["wimpern-brows", "wimpern-brows", "👁️", "Lashes und Brauen"],
    ["kosmetik", "kosmetik", "🧖‍♀️", "Haut, Waxing, Gesichtsbehandlungen"],
    ["empfehlungen-gesucht", "empfehlungen-gesucht", "🔎", "Du suchst etwas? Frag hier!"]
  ];

  // {friseur} = bestes Studio der Kategorie in der Stadt, {friseur2} = zweites; {city} = Stadtname
  const MSG = {
    allgemein: [
      { a: "Aylin", badge: "Local Expert", t: "Willkommen in der {city}-Community! 💕 Stellt eure Fragen gern in #empfehlungen-gesucht – hier helfen alle gern.", h: 160, re: { "❤️": 24, "🔥": 6 } },
      { a: "Sophie", t: "Hat jemand Tipps für einen entspannten Self-Care-Sonntag in {city}?", q: true, h: 50, re: { "👍": 4 },
        replies: [
          { a: "Elif", badge: "Hilfreich", t: "Gesichtsbehandlung bei @{kosmetik} und danach Maniküre – perfekt!", h: 48, best: true, re: { "❤️": 9 } },
          { a: "Nora", t: "Ich nehme dafür immer das Self-Care-Sonntag-Paket, super praktisch.", h: 40 }
        ] },
      { a: "Mia", t: "Kleine Erinnerung: Bewertungen mit Vorher/Nachher-Fotos helfen anderen total 📸", h: 20, re: { "👍": 11 } },
      { a: "Dilara", badge: "Neu", t: "Hallo zusammen, bin neu hier und gerade nach {city} gezogen 🙈", h: 6, re: { "❤️": 15 } }
    ],
    haare: [
      { a: "Katharina", t: "Wer kann mir jemanden für Balayage empfehlen, der natürlich färbt und nicht zu teuer ist?", q: true, h: 90, re: { "👍": 7 },
        replies: [
          { a: "Hanna", badge: "Local Expert", t: "@{friseur} – war letzten Monat da, total natürlich geworden!", h: 88, best: true, re: { "❤️": 12, "🔥": 3 } },
          { a: "Zeynep", t: "Bei @{friseur3} ist es günstiger, aber man muss anrufen, online buchen geht dort nicht.", h: 70 }
        ] },
      { a: "Laura", t: "Locken-Tipp: Lasst sie trocken schneiden! Bei @{friseur2} kennen sie sich damit super aus.", h: 30, re: { "🔥": 5 } },
      { a: "Fatima", t: "Hochsteckfrisur für eine Hochzeit am Samstag – hat jemand noch kurzfristig einen Termin bekommen?", q: true, h: 12,
        replies: [{ a: "Aylin", badge: "Local Expert", t: "Bei @{friseur} gibt es oft Last-Minute-Termine online.", h: 10 }] }
    ],
    naegel: [
      { a: "Jana", t: "Meine Gelnägel von @{naegel} halten seit 4 Wochen 😍", h: 70, re: { "❤️": 8 } },
      { a: "Leyla", t: "Wo bekommt man in {city} eine gute medizinische Fußpflege?", q: true, h: 40,
        replies: [
          { a: "Mariam", badge: "Hilfreich", t: "@{pedikuere2} ist super gründlich – einfach anfragen, die nehmen sich Zeit.", h: 38, best: true, re: { "👍": 6 } },
          { a: "Sara", t: "Ich war bei @{pedikuere}, da kann man direkt online buchen.", h: 30 }
        ] },
      { a: "Emma", t: "Nail-Art-Trend diesen Winter: Chrome und Burgundy 🍷", h: 8, re: { "🔥": 9 } }
    ],
    "wimpern-brows": [
      { a: "Zeynep", t: "Volumen oder 1:1 für den Alltag? Was tragt ihr?", q: true, h: 100, re: { "👍": 3 },
        replies: [
          { a: "Elif", badge: "Hilfreich", t: "1:1 sieht natürlicher aus. @{wimpern} macht das richtig fein.", h: 96, best: true, re: { "❤️": 7 } },
          { a: "Anastasia", t: "Volumen! Aber lieber leicht, nicht zu dramatisch 😅", h: 90 }
        ] },
      { a: "Hanna", badge: "Local Expert", t: "Brow Lamination bei @{brows2} – hält wirklich 6 Wochen.", h: 26, re: { "🔥": 4 } },
      { a: "Julia", t: "Tipp: Nach dem Auffüllen 24 Stunden kein Wasser an die Wimpern lassen 💧", h: 4 }
    ],
    kosmetik: [
      { a: "Mariam", t: "Hydrafacial bei @{kosmetik} – meine Haut war noch nie so glatt ✨", h: 60, re: { "❤️": 10 } },
      { a: "Sophie", t: "Waxing zum ersten Mal – tut das sehr weh? 🙈", q: true, h: 18,
        replies: [
          { a: "Fatima", t: "Am Anfang ein bisschen, aber bei @{waxing3} sind sie super lieb und schnell.", h: 16, best: true },
          { a: "Nora", t: "Vorher nicht eincremen und lieber nicht kurz vor den Tagen 😉", h: 14, re: { "👍": 5 } }
        ] }
    ],
    "empfehlungen-gesucht": [
      { a: "Nora", t: "Suche Wimpernstylistin, die auch Türkisch spricht – meine Mama möchte mitkommen 💕", q: true, h: 130,
        replies: [{ a: "Dilara", t: "@{wimpern3} – supernett! Termine aber nur per WhatsApp.", h: 128, best: true, re: { "❤️": 6 } }] },
      { a: "Emma", t: "Wer kennt ein gutes Studio für das Chaya Paket? Wimpern, Nägel und Pediküre an einem Tag.", q: true, h: 44,
        replies: [
          { a: "Aylin", badge: "Local Expert", t: "Wimpern bei @{wimpern}, Nägel und Pediküre bei @{naegel} – kannst du alles online buchen.", h: 42, best: true, re: { "🔥": 8 } },
          { a: "Laura", t: "Plant zwischen den Terminen etwas Puffer ein, die Studios liegen in verschiedenen Bezirken!", h: 40 }
        ] },
      { a: "Julia", badge: "Neu", t: "Gibt es ein Make-up-Studio für ein Fotoshooting nächste Woche?", q: true, h: 3,
        replies: [{ a: "Hanna", badge: "Local Expert", t: "@{makeup2} macht auch Shooting-Make-up, frag einfach an.", h: 2 }] }
    ]
  };

  const channels = [], messages = [];
  CFG.cities.forEach((city) => {
    const cityStudios = studios.filter((s) => s.citySlug === city.slug);
    // n: 1 = online buchbares, 2 = Anfrage-, 3 = manuelles Studio der Kategorie
    const byCat = (cat, n) => {
      const mode = ["online", "request", "manual"][(n || 1) - 1];
      const list = cityStudios.filter((s) => s.categories.includes(cat));
      return (list.find((s) => s.bookingMode === mode) || list[0] || {}).slug || "";
    };
    const fill = (t) => t.replace(/\{city\}/g, city.name).replace(/\{([a-z]+)(\d?)\}/g, (_, c, n) => byCat(c, Number(n) || 1));

    CHANNEL_DEFS.forEach(([slug, name, icon, desc]) => {
      const chId = `ch-${city.slug}-${slug}`;
      channels.push({ id: chId, citySlug: city.slug, slug, name, icon, description: desc });
      (MSG[slug] || []).forEach((m, i) => {
        const mid = `${chId}-m${i}`;
        const msg = { id: mid, channelId: chId, author: m.a, badge: m.badge || null, text: fill(m.t), isQuestion: !!m.q, parentId: null, date: now - m.h * 3600000, reactions: m.re || {}, bestAnswerId: null };
        messages.push(msg);
        (m.replies || []).forEach((rep, j) => {
          const rid = `${mid}-r${j}`;
          if (rep.best) msg.bestAnswerId = rid;
          messages.push({ id: rid, channelId: chId, author: rep.a, badge: rep.badge || null, text: fill(rep.t), isQuestion: false, parentId: mid, date: now - rep.h * 3600000, reactions: rep.re || {} });
        });
      });
    });
  });

  window.APP_DATA = { cities: CFG.cities, categories, studios, services, reviews, packages, channels, messages, rng };
})();
