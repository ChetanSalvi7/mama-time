# MAMA TIME – Checkliste für Sentinators Gym

Dieses Dokument ist für die Projektverantwortlichen bei Sentinators Gym. Die technische Dokumentation für das Entwicklerteam befindet sich in `README_FIRST_EN.md` und im Ordner `docs/`.

## Vor dem Livegang zwingend erledigen

1. **Produktionsdomain festlegen** und HTTPS aktivieren.
2. Im Projektstamm `npm ci` ausführen.
3. Die Produktionskonfiguration erstellen:

   ```bash
   npm run setup -- --production=1 \
     --base-url=https://IHRE-DOMAIN.CH \
     --admin-email=IHRE-ADMIN-EMAIL \
     --whatsapp=41XXXXXXXXX
   ```

4. Das ausgegebene Admin-Passwort sofort in einem Passwortmanager speichern.
5. In `.env` die SMTP-Daten und die Empfängeradresse für neue Anfragen ergänzen, sofern E-Mail-Benachrichtigungen gewünscht sind.
6. Impressum und Datenschutzerklärung in `frontend/src/pages/LegalPage.jsx` durch juristisch freigegebene Inhalte ersetzen.
7. Die finale WhatsApp-Nummer im internationalen Format ohne Pluszeichen oder Leerzeichen kontrollieren.
8. `npm run build`, `npm run doctor`, `npm test` und `npm start` ausführen.
9. Auf der Staging-Seite mindestens eine Einzelanfrage und eine Besties-Anfrage absenden.
10. Im Backoffice kontrollieren: Anfrage, Statusänderung, Notiz, Rückrufdatum, CSV-Export und JSON-Backup.
11. Nach Abschluss der Tests die technische Kampagnenbegrenzung aktivieren.
12. Vor dem Start am **20. Juli 2026** ein vollständiges Daten- und Serverbackup erstellen.

## Festgelegtes Angebot

- Einzelangebot: **CHF 550.– pro Mama**, Membercard inklusive.
- Besties-Angebot: **CHF 990.– für zwei Mamas**, zwei Membercards inklusive.
- Ersparnis: **CHF 110.– insgesamt**, entsprechend **10 % pro Mama**.
- Effektiver Preis im Duo: **CHF 495.– pro Mama**.
- Aktionszeitraum: **20. Juli 2026 bis 20. August 2026**.
- Daytime-Zeiten als Ausgangswert: **Montag bis Freitag, 08:00–16:30 Uhr**.

## Wichtiger technischer Hinweis

Die mitgelieferte JSON-Datenspeicherung ist für **einen Node-Prozess** und eine zeitlich begrenzte Kampagne ausgelegt. PM2 darf deshalb nur mit `instances: 1` betrieben werden. Für mehrere Serverinstanzen oder eine dauerhafte CRM-Plattform ist die dokumentierte Migration auf PostgreSQL vorzunehmen.

## Daten, die nicht im ZIP enthalten sind

- keine echten Kunden- oder Testanfragen;
- keine `.env`-Datei;
- keine produktiven Passwörter oder Secrets;
- keine SMTP-Zugangsdaten;
- keine verbindlichen juristischen Texte;
- kein `node_modules`-Ordner.

Die Abhängigkeiten werden reproduzierbar über `npm ci` aus der mitgelieferten `package-lock.json` installiert. Der fertige React-Produktionsbuild unter `frontend/dist/` ist bereits enthalten.
