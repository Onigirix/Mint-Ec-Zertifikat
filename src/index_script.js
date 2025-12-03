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
  "Dies ist eine Betaversion. Es kann zu Fehlern kommen.\nWenn etwas nicht funktioniert oder Sie Verbesserungsvorschläge haben, schreiben Sie bitte eine E-Mail an mintec.feedback@gmail.com.",
  { title: "Mint-EC", kind: "information" }
);

try {
  await checkForAppUpdates();
} catch (error) {

}
async function checkForAppUpdates() {
  const update = await check();
  if (update === null) {
    return;
  } else if (update?.available) {
    const yes = await ask(
      `Update auf ${update.version} ist verfügbar!\n\nRelease Notes: ${update.body}`,
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
