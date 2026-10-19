# Veröffentlichen & bekannt machen – SlimClick

Von oben nach unten abhaken. Alles ist kostenlos. Texte zum Kopieren: **[STORE-TEXTE.md](STORE-TEXTE.md)**.

> ⚠️ **Alter:** Viele Seiten verlangen ein Mindestalter (meist 13, manche 16 oder 18). Vor dem Anmelden in den
> Nutzungsbedingungen nachsehen. Wo 18 verlangt wird (z. B. Microsoft Store mit Ausweis), nur gemeinsam mit deinen Eltern.

---

## Teil A – Online stellen (einmalig, ca. 20 Minuten)

### ☐ A1. GitHub Desktop einrichten
1. `desktop.github.com` öffnen → **Download** → installieren.
2. Starten → **Sign in to GitHub.com** → mit dem **slimbitapps**-Konto anmelden.

### ☐ A2. SlimClick hochladen (legt das Repository automatisch an)
1. Den Ordner **SlimClick** aus dem Finder ins GitHub-Desktop-Fenster ziehen (oder **File → Add Local Repository**).
2. Oben rechts **Publish repository** klicken.
3. Name: **`SlimClick`** – genau so geschrieben (groß S, groß C). Die Adresse der Download-Seite unterscheidet Groß-/Kleinschreibung.
4. Haken bei **„Keep this code private“ entfernen** (öffentlich = unbegrenzt kostenlose Builds).
5. Bei **Organization** `slimbitapps` wählen (falls angeboten) → **Publish Repository**.

### ☐ A3. Download-Seite einschalten
1. Auf github.com: **slimbitapps/SlimClick → Settings → Pages**.
2. **Source: „GitHub Actions“** auswählen. (Speichern ist nicht nötig.)
3. **Actions → „Download-Seite“ → Run workflow → Run workflow** klicken.
4. Nach 1–2 Minuten: **https://slimbitapps.github.io/SlimClick/** öffnen.

### ☐ A4. Installer abwarten
1. **Actions → „Installer bauen“** – läuft beim Hochladen automatisch (ca. 15 Minuten).
2. Danach rechts **Releases → SlimClick 1.0.0** mit 4 Dateien:
   `SlimClick-Setup.exe`, `SlimClick-Windows-portable.zip`, `SlimClick-Mac.dmg`, `SlimClick-Mac-Intel.dmg`.
3. **→ Claude Bescheid sagen**, ich prüfe, dass alles dran ist und alle Links funktionieren.

### ☐ A5. Startseite aktualisieren
1. Den Ordner **site** (Startseite) in GitHub Desktop ziehen → oben **Push origin**.
2. Nach 1–2 Minuten auf **https://slimbitapps.github.io** nachsehen: Die SlimClick-Karte ist da.

### ☐ A6. GitHub-Beschreibung (wichtig für Google & KIs)
Repository **SlimClick** → rechts bei **About** auf das ⚙️ Zahnrad:
- **Description:** `Free presentation remote for Windows & Mac – use your phone as a clicker via QR code, no app install. Laser pointer, slide preview, timer. Works with PowerPoint, Keynote, Google Slides, PDF.`
- **Website:** `https://slimbitapps.github.io/SlimClick/`
- **Topics:** `presentation-remote powerpoint keynote google-slides clicker laser-pointer remote-control electron windows macos freeware`
- **Save changes**

### ☐ A7. Suchmaschinen Bescheid geben
Die Startseite ist dort schon angemeldet (von SlimSort)? Dann nur die Sitemap neu einreichen:
1. **Google Search Console** (`search.google.com/search-console`) → Property `https://slimbitapps.github.io/` → **Sitemaps** →
   `sitemap.xml` → **Senden**. Dann oben in die Suchleiste `https://slimbitapps.github.io/SlimClick/` → **Indexierung beantragen**.
2. **Bing Webmaster Tools** (`bing.com/webmasters`) → Website → **Sitemaps** → **Sitemap einreichen** → `https://slimbitapps.github.io/sitemap.xml`.
   Bing ist die Suche hinter **ChatGPT** – dieser Schritt ist der wichtigste für KI-Empfehlungen.
3. Noch nicht angemeldet? Siehe SlimSort `docs/PLAN.md`, Abschnitt C7.

---

## Teil B – Kostenlos eintragen (Reihenfolge nach Nutzen)

| # | Wo | Für wen | Aufwand |
|---|---|---|---|
| B1 | AlternativeTo | international, Leute suchen gezielt Alternativen | 10 Min. |
| B2 | heise Download, CHIP, Computerbild, Netzwelt | Deutschland, viele Besucher | je 10 Min. |
| B3 | Softpedia, Uptodown, MajorGeeks | international | je 10 Min. |
| B4 | Reddit | Schüler, Studenten, Lehrer, App-Fans | je 5 Min. |
| B5 | Deutsche Foren | Lehrer, Technik-Fans | je 5 Min. |
| B6 | SourceForge (spiegelt GitHub automatisch) | zusätzliche Downloads | 10 Min. |
| B7 | Product Hunt | Tech-Szene (Mindestalter prüfen!) | 30 Min. |

### ☐ B1. AlternativeTo
1. `alternativeto.net` → **Sign up** (Konto mit SlimBitApps@gmail.com).
2. Oben **+ Add app** → Name `SlimClick`, Website `https://slimbitapps.github.io/SlimClick/`.
3. Beschreibung: **Short description** (Englisch) aus STORE-TEXTE.md. Plattformen: Windows, Mac. Lizenz: **Free**.
4. Logo: `brand/logo-square.png` · Screenshots: `marketing/screenshots/en-1-hero.png`, `en-3-laser.png`, `en-5-timer.png`.
5. Bei **„Alternative to“** eintragen: *PowerPoint Remote*, *Unified Remote*, *Logitech Spotlight*, *Keynote Remote*, *Remote for Slides*, *Clikr*.
6. Tags: `presentation-remote`, `clicker`, `laser-pointer`, `powerpoint`.

### ☐ B2. Deutsche Download-Portale
Bei Google suchen: `<Portal> Software einreichen` (z. B. „heise download software einreichen“). Formular so ausfüllen:
- Name, Version 1.0.0, **Kurzbeschreibung** + **Beschreibung** (Deutsch) aus STORE-TEXTE.md
- Download-Link: **`https://slimbitapps.github.io/SlimClick/`**
- Lizenz Freeware · Windows 10/11, macOS 12+ · Screenshots `de-1-hero.png`, `de-3-laser.png`, `de-6-hotspot.png`
- ⚠️ **Nein** sagen zu „Download-Manager“, „Installer-Wrapper“ oder Werbung im Installer.

### ☐ B3. Englische Portale
Gleich wie B2 mit den englischen Texten: **Softpedia** („Submit program“), **Uptodown** („Upload app“), **MajorGeeks** („Submit“).

### ☐ B4. Reddit
Vorher **Regeln der Gruppe lesen** (rechte Spalte). Pro Gruppe **ein** Beitrag, nicht alles am selben Tag.
Bild dazu: `en-1-hero.png` (bzw. `de-1-hero.png`).

| Gruppe | Hinweis |
|---|---|
| r/macapps | App-Vorstellungen erlaubt, Titel mit „[Free]“ beginnen |
| r/software | allgemeine Programm-Vorstellungen |
| r/SideProject | eigene Projekte ausdrücklich erwünscht |
| r/edtech | Lehrer & Bildung – Fokus „Schul-WLAN, ohne App“ |
| r/powerpoint | nur wenn Eigenwerbung erlaubt ist (Regeln!) |
| r/de_EDV | auf Deutsch |

**Vorlage (Englisch):**
```
[Free] I built an app that turns your phone into a presentation remote – no app on the phone

I'm a student and kept forgetting my clicker, so I built SlimClick. The laptop app (Windows & Mac) shows a QR code, you scan it with your phone camera, and a web page opens that controls your slides – PowerPoint, Keynote, Google Slides, PDF, anything that reacts to arrow keys.

Extras: live slide preview on the phone, a laser pointer (touch the preview, the dot appears on the projector), spotlight, go to slide, black screen and a timer whose screen flashes before time is up.

School Wi-Fi often blocks devices from seeing each other – the app detects that and walks you through using your phone's hotspot instead. Pairing is secure (one-time key in the QR code, signed commands), so classmates can't take over.

Free, no ads, no account, no cloud: https://slimbitapps.github.io/SlimClick/
I'd love feedback – what would you add?
```

**Vorlage (Deutsch, für r/de_EDV):**
```
[Kostenlos] Ich habe eine App gebaut, die dein Handy zur Präsentations-Fernbedienung macht – ohne App aufs Handy

Ich bin Schüler und hatte nie einen Presenter dabei, also habe ich SlimClick gebaut. Die Laptop-App (Windows & Mac) zeigt einen QR-Code, den scannst du mit der Handy-Kamera, und eine Webseite öffnet sich, die deine Folien steuert – PowerPoint, Keynote, Google Slides, PDF.

Dazu: Folienvorschau am Handy, Laserpointer (auf die Vorschau tippen, der Punkt erscheint am Beamer), Spotlight, Gehe zu Folie, schwarzer Bildschirm und ein Timer, der vor dem Ende kurz aufblinkt.

Im Schul-WLAN klappt es per Handy-Hotspot, die App erklärt das Schritt für Schritt. Die Kopplung ist sicher (Einmal-Code, signierte Befehle) – Mitschüler können nicht mitsteuern.

Kostenlos, ohne Werbung, ohne Konto: https://slimbitapps.github.io/SlimClick/
Feedback ist sehr willkommen!
```

### ☐ B5. Deutsche Foren
Immer im Bereich „Software“ / „Programmvorstellungen“, Text wie die deutsche Reddit-Vorlage:
- **ComputerBase-Forum** → Software → Programmvorstellungen
- **Dr. Windows** → Software
- **MacUser.de** → Software
- **Deskmodder** → Software-Tipps

### ☐ B6. SourceForge
1. `sourceforge.net` → **Create** → **Import project from GitHub** → `slimbitapps/SlimClick`.
2. SourceForge übernimmt neue Releases dann automatisch.

### ☐ B7. Product Hunt (erst Mindestalter prüfen)
- **Tagline:** `Your phone as a presentation remote – scan a QR code, no app`
- **Beschreibung:** die englische Short description · Bilder: `en-1-hero.png` bis `en-5-timer.png`
- **Erster Kommentar:** die englische Reddit-Vorlage
- Am besten an einem Dienstag oder Mittwoch veröffentlichen.

---

## Teil C – Schule & YouTube (optional)

- ☐ **Lehrkräfte fragen:** Einer Lehrerin / einem Lehrer die App zeigen – Lehrer sind die beste Werbung (sie halten täglich Präsentationen).
- ☐ **YouTube-Short (30 Sek.):** „Kein Presenter? Nimm dein Handy.“ – Handy filmen, wie du scannst und „Weiter“ tippst. Beschreibung: Ein-Satz-Beschreibung + Link.
- ☐ **Später:** Microsoft Store (wie bei SlimSort verschoben: Ausweis einer volljährigen Person nötig).

---

## Deine nächsten 3 Schritte
1. ☐ A1 + A2: GitHub Desktop → SlimClick veröffentlichen
2. ☐ A3: Pages auf „GitHub Actions“ stellen
3. ☐ Claude Bescheid sagen → ich prüfe Release und Download-Seite
