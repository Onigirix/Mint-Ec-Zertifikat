const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { ask, message } = window.__TAURI__.dialog;
const { check } = window.__TAURI__.updater;
const { relaunch } = window.__TAURI__.process;

document.getElementById("manual").addEventListener("click", (event) => {
  const handbookWebview = new WebviewWindow("handbook", {
    hiddenTitle: true,
    title: "Handbuch",
    minimizable: true,
    url: "assets/Manual.pdf",
  });
  handbookWebview.once("tauri://created", () => {});
  handbookWebview.once("tauri://error", async (e) => {
    if (e.payload === "a webview with label `handbook` already exists") {
      const handbookWindow = await Webview.getByLabel("handbook");
      await handbookWindow.setFocus();
    }
  });
});

await message(
  "Dies ist eine Betaversion. Es kann zu Fehlern kommen.\nDas Problem der nicht funktionierenden Umlaute bei der Ausgabe des PDFs ist uns bekannt und wird in den nächsten Versionen behoben. Da jedes PDF Programm bearbeitbare Felder anders anzeigt, ist es leider nicht möglich ein im Nachhinein bearbeitbares PDF zu erstellen, in dem die Namen der Schulleiter und MINT-Koordinatioren immer auf gleicher Höhe wie die Vorstandsvorsitzende von Mint-EC ist. Sie sind so angeordnet, dass dies in Adobe Acrobat passt.\nDie Datenbankstruktur wird sich im Laufe der Zeit ändern. Bei jeder Änderung werden wir eine Automatische Migration der Datenbank durchführen. Dadurch werden jetzt eingegebene Daten auch in zukünftigen Versionen erhalten bleiben.\nWir bitten um Ihr Verständnis!",
  { title: "Mint-EC", kind: "information" }
);

await message(
  "Wenn Sie einen Fehler finden sollten, drücken Sie bitte Strg + Shift + I und machen Sie mit der Windowstaste + Shift + S einen Screenshot von der/den Fehlermeldung(en), die im neu geöffneten Fenster unten in rot erscheinen. Fügen Sie diesen dann mittels Strg + V in eine E-Mail an mintec.feedback@gmail.com ein.",
  { title: "Mint-EC", kind: "information" }
);
try {
  await checkForAppUpdates();
} catch (error) {
  console.error("Error checking for updates:", error);
}
async function checkForAppUpdates() {
  const update = await check();
  if (update === null) {
    return;
  } else if (update?.available) {
    const yes = await ask(
      `Update auf ${update.version} ist verfügbar!\n\nNeue Features: ${update.body}`,
      {
        title: "Neues Update",
        kind: "info",
        okLabel: "Updaten",
        cancelLabel: "Abbrechen",
      }
    );
    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}
