/* =========================================================
   Zentrale Einstellungen – hier Name, Städte und Regeln ändern
   ========================================================= */
window.APP_CONFIG = {
  // Arbeitstitel der App – einfach ersetzen, wenn der Name feststeht
  appName: "Beauty Circle",
  tagline: "Die besten Beauty-Adressen deiner Stadt – empfohlen von Frauen für Frauen.",

  // Gespielte Demo-Nutzerin (Phase 1 hat noch kein echtes Login)
  demoUser: { firstName: "Lena" },

  // Städte – Name/Slug ändern oder weitere ergänzen (dann auch Studios in data.js)
  cities: [
    { id: "c1", slug: "berlin", name: "Berlin" },
    { id: "c2", slug: "hamburg", name: "Hamburg" }
  ],

  // Puffer zwischen zwei Terminen (Fahrzeit) in Minuten
  bufferMinutes: 30,
  // Nach so vielen Sekunden "bestätigt" ein Studio eine Anfrage (Simulation)
  requestConfirmSeconds: 10,
  // Nach so vielen Stunden erinnert die App an offene manuelle Buchungen
  manualReminderHours: 48,
  // Fiktive Größe der Community (nur Anzeige)
  communitySize: { berlin: 2480, hamburg: 1630 }
};
