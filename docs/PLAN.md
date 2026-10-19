# Plan – SlimClick

## Name

**SlimClick** – passt zur Marke (Slim…), „Clicker“ ist das bekannte Wort für Präsentations-Fernbedienungen.
Vor der Veröffentlichung kurz im DPMA-Register (`register.dpma.de`) nach „SlimClick“ für Software suchen.

## Was es schon gibt – und was SlimClick besser macht

| Tool | Wie | Schwäche |
|---|---|---|
| Clikr | Browser-Erweiterung + Handy-Webseite | Nur im Browser (kein PowerPoint/Keynote-Programm), Notizen/Spotlight kosten Geld |
| PowerPoint-/Keynote-Remote | Eigene Apps der Hersteller | Nur für ein Programm, App-Installation, Konto nötig |
| Unified Remote, Remote Mouse | Handy-App + PC-Server | App-Installation, Werbung/Abo, kompliziert |
| PPT Command Executor, kleine GitHub-Projekte | QR-Code + Webseite | Kein Laser, keine Vorschau, keine Sicherheit, kein Installer |
| AhaSlides & Co. | Online-Präsentationsdienste | Nur mit deren Folien, Internet + Konto |

**SlimClick:** keine App, jedes Programm, Laser + Spotlight + Vorschau + Timer kostenlos, echte Sicherheit
(Einmal-Code, signierte Befehle), Hotspot-Hilfe fürs Schul-WLAN, Installer für Windows & Mac.

## Version 1.0 (fertig)

- Weiter/Zurück (große Knöpfe + Wischen), Gehe zu Folie, Schwarz/Weiß, Präsentation starten/beenden
- Laserpointer & Spotlight auf dem Beamer – man tippt einfach auf die Vorschau
- Folienvorschau auf dem Handy (wählbarer Bildschirm)
- Timer: Countdown/Stoppuhr, Vibration bei 5/2/1 Min. und 0, Aufblitzen am iPhone, läuft am Laptop weiter
- Sicherheit: Einmal-Code, abgeleiteter Geräteschlüssel, signierte Befehle, Zustimmung für weitere Geräte, Sperre
- Schul-WLAN: Hotspot-Anleitung, automatischer Hinweis, QR-Code passt sich beim Netzwechsel an
- Testfolien, Laptop wach halten, Handy wach halten, Querformat, Linkshänder, Bluetooth-Tastatur am Tablet
- 5 Sprachen, hell/dunkel, Einfach/Profi, Einführung beim ersten Start, Mac-Erlaubnis-Assistent

## Version 2 – Ideen (nach Wichtigkeit)

1. **Sprechernotizen aus der PowerPoint-Datei:** `.pptx` in die App ziehen → SlimClick liest die Notizen
   (`ppt/notesSlides/*.xml`) und zeigt sie am Handy zur aktuellen Folie. Die Foliennummer zählt SlimClick mit
   (Weiter/Zurück/Gehe zu) – mit „Folie stimmt nicht? Tippen zum Korrigieren“.
   Auch für Keynote (`.key` → als PPTX exportieren) und PDF (Seitenzahl ohne Notizen).
2. **Nächste Folie als Vorschau** (aus der PPTX-Datei gerendert).
3. **Zeichnen auf dem Beamer** (Textmarker mit dem Finger).
4. **Zeitplan pro Folie** („Folie 5 sollte bei Minute 4 dran sein“) mit dezentem Hinweis.
5. **Gyro-Laser** (Handy wie einen Laserpointer schwenken) – braucht HTTPS, daher erst mit eigenem Zertifikat.
6. **Android-App** mit Lautstärketasten als Weiter/Zurück (im Browser technisch nicht möglich).
7. **Mehrere Vortragende** mit Rollen (einer steuert, einer sieht nur Notizen).
