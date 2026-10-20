# Prompt für jede neue SlimBit-App

So geht's: **Teil 1** kopieren, unten deine App-Idee anhängen, abschicken.
Wenn die Testversion passt: **„Go“** schreiben. Für die Videos später **Teil 2** schicken.

---

## Teil 1 – Neue App (Idee unten anhängen)

```
ÜBER MICH & MEINE MARKE (gilt für alles in diesem Chat)
- Ich bin Anfänger-Entwickler aus Deutschland und unter 18. Erkläre alles kurz und einfach auf Deutsch,
  aber das Ergebnis soll professionell sein. Mach so viel wie möglich selbst und sag mir nur genau,
  welche wenigen Handgriffe ich machen muss (Schritt für Schritt, mit Klickpfad).
- Wegen meines Alters: keine Dienste ab 18, nichts, was Geld kostet, keine Verträge, keine Ausweise.
  Wenn so etwas nötig wäre, sag es und schlag eine kostenlose Alternative vor (oder: mit meinen Eltern klären).
- Meine Marke: "SlimBit Apps". Kleine, schlanke, kostenlose Desktop-Apps für Windows & Mac.
  E-Mail: SlimBitApps@gmail.com. Impressum/Datenschutz nur mit E-Mail (keine Adresse, kein Name).
  Startseite: https://slimbitapps.github.io (Repo slimbitapps/slimbitapps.github.io, Apps in index.html → Liste APPS).
- Vorlage für ALLES ist slimbitapps/SlimClick (neuer als SlimSort): Aufbau (Electron + React + TypeScript + Vite),
  Design, Logo-Schema, "Über"-Bereich mit Link zur Startseite, GitHub Actions (build.yml + pages.yml),
  Download-Seite in website/, Tests + E2E-Test mit Screenshots, Mehrsprachigkeit, Einfach-/Expertenmodus,
  Einführung beim ersten Start, scripts/setup-tools.sh, scripts/test-build.sh, scripts/publish.sh, scripts/video/.
  Lies dort zuerst README.md, docs/PLAN.md, docs/VEROEFFENTLICHEN.md und .github/workflows/.
- App-Sprachen Englisch und Deutsch (gern mehr), Code-Kommentare auf Deutsch, App-Name auf Englisch.
- Meine Fotos/Dateien niemals committen oder veröffentlichen.

ARBEITSWEISE (damit es flüssig läuft)
- Arbeite im festen Ordner ~/SlimBit/<AppName> (nicht im Sitzungsordner). Startseite liegt in ~/SlimBit/slimbitapps.github.io.
- Werkzeuge liegen dauerhaft in ~/SlimBit-Tools (sonst: bash scripts/setup-tools.sh aus SlimClick).
- Frag höchstens 3 kurze Fragen, nur wenn wirklich etwas Wichtiges fehlt. Sonst gleich loslegen.
- Committe regelmäßig. Auf GitHub kommt erst etwas, wenn ich "Go" schreibe.

PHASE 1 – BAUEN UND TESTEN
1. Prüfe kurz, welche ähnlichen Tools es gibt und was wir besser machen. Schlag einen Namen vor, falls meiner nicht passt.
2. Kurzer Plan (Version 1.0 und später), dann die App komplett bauen: Code, Tests, Logo im SlimBit-Stil, README.
   Denk selbst über weitere sinnvolle Funktionen nach und bau sie ein.
3. Teste selbst so viel wie möglich (Unit-Tests, E2E-Test, Screenshots der laufenden App) und schick mir Screenshots.
4. Stell mir die App zum Testen bereit: bash scripts/test-build.sh (Mac-DMG + Windows-ZIP) und öffne den Ordner im Finder.
   Sag mir genau, was ich auf Mac und Windows ausprobieren soll.

PHASE 2 – WENN ICH "GO" SCHREIBE: VERÖFFENTLICHEN, GENAU WIE BEI SLIMCLICK
1. Version 1.0.0, alles auf GitHub mit bash scripts/publish.sh: Repo slimbitapps/<AppName> anlegen, hochladen,
   GitHub Pages einschalten, Release über GitHub Actions bauen lassen und prüfen, dass alle Dateien dran sind.
   Builds nur bei echten Code-Änderungen, nicht bei Doku/Videos/Bildern.
2. Download-Seite (website/ → https://slimbitapps.github.io/<AppName>/, Groß-/Kleinschreibung beachten, Weiterleitung
   für die kleingeschriebene Adresse) mit Anleitung, FAQ und SEO (Meta-Tags, JSON-LD SoftwareApplication + FAQPage,
   sitemap, robots, llms.txt), damit Google, ChatGPT und Gemini die App finden und empfehlen.
3. App auf der Startseite eintragen (Liste APPS, Logo, sitemap.xml, llms.txt) und hochladen.
4. In der App unter "Über" der Link zur Startseite.
5. Store-/Portal-Texte (kurz, lang, Stichwörter) auf Deutsch und Englisch + 8–16 beschriftete Screenshots.
6. Kurzer Plan, wo ich die App kostenlos eintragen kann (Portale, Reddit, Foren) mit fertigen Texten.
   Alles, was ich selbst klicken muss, als Checkliste mit Klickpfad.
Gib mir am Ende eine Liste der fertigen Links und Dateien.

MEINE APP-IDEE:
```

---

## Teil 2 – Videos

```
Jetzt die Videos, mit möglichst wenig Handgriffen für mich. Vorlage: scripts/video/ und docs/VIDEO-PIPELINE.md aus
slimbitapps/SlimClick (Szenen-Engine, Bausteine, voice.py, align.py, render-all.sh, finish.sh, thumbnails.cjs, package.py).

1. Sag mir, ob du Inhalte von mir brauchst (z. B. Fotos als ZIP). Wenn du Beispielinhalte selbst bauen kannst, brauchst du nichts.
2. Schreib ALLE Sprechtexte – Intro (ca. 90 s) und 3 Shorts (je 25–35 s, ein Gedanke pro Short, Hook in der ersten
   Sekunde, Prinzip als saubere Animation, am Ende echte App + Logo + "Link in profile") – zusammen in EINEM Text
   (python3 scripts/video/voice.py text). Zwischen den Videos steht "Next video.". Englisch, fließende Sätze, keine
   Aufzählungen, Absätze durch Leerzeilen = Szenen. Gib mir den ganzen Text in einem einzigen Kasten zum Kopieren.
   Bau vorher noch KEIN Video.
3. Ich lasse den Text in Clipchamp sprechen (Stimme Andrew, wie bei SlimSort), exportiere EINE Audiodatei und schicke
   sie dir (auch als ZIP). Schneide sie selbst in die einzelnen Videos (voice.py split) und prüfe mit words.py: richtiger
   Text? Absatzgrenzen? Dann baue die Videos und leg alle Ereignisse auf die gesprochenen Wörter.
4. Jedes Video: Lautheit normalisiert, Effekte leise unter der Stimme, Untertitel im Bild, Thumbnail 0,5 s als
   Deckblatt am Anfang (ich darf auf YouTube noch keine Bilder hochladen). Prüfe selbst den Sync (Spracherkennung +
   Standbilder), bevor du mir etwas schickst.
5. Schick mir am Ende EIN ZIP (python3 scripts/video/package.py) in der festen Ordnerstruktur:
   je Video ein Ordner mit MP4 + Titelbild (Intro + englische SRT), Bilder/ für YouTube, TikTok und Instagram
   (Cover, Feed-Posts, Quadrat, Story, Profilbild, Banner, Logo, Screenshots) und Texte-zum-Kopieren.txt mit Titel,
   Beschreibung mit Download-Link, Tags, Hashtags, Kapiteln, angepinntem Kommentar, TikTok- und Instagram-Texten
   und dem besten Zeitpunkt zum Posten. Nur Englisch, keine Übersetzungen.
Zielgruppe der Videos: junge Leute (Schüler, Studenten). Meine Dateien nie committen.
```
