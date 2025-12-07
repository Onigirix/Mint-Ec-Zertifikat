const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { ask, message } = window.__TAURI__.dialog;
const { check } = window.__TAURI__.updater;
const { relaunch } = window.__TAURI__.process;
import { getDb } from './db-connection.js';

const DEFAULT_SETTINGS = {
  school_name: 'an der Musterschule',
  school_location: 'Musterstadt',
  school_functionary_1: 'Max Mustermann',
  school_functionary_2: 'Erika Musterfrau',
  school_functionary_1_position: 'MINT-Koordinator',
  school_functionary_2_position: 'Schulleiter'
};

try {
  await checkForAppUpdates();
} catch (error) {
  console.error("Error checking for updates:", error);
}

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

await checkAndPromptSettings();


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


async function checkAndPromptSettings() {
  try {
    const db = await getDb();
    const results = await db.select("SELECT * FROM settings WHERE id=1");

    if (!results || results.length === 0) {
      const userWantsToEdit = await ask(
        "Die Einstellungen sind noch nicht konfiguriert. Möchten Sie diese jetzt ändern?",
        {
          title: "Einstellungen konfigurieren",
          kind: "info",
          okLabel: "Ja",
          cancelLabel: "Nein",
        }
      );

      if (userWantsToEdit) {
        window.location.href = "settings.html";
      }
      return;
    }

    const settings = results[0];

    const isDefault =
      settings.school_name === DEFAULT_SETTINGS.school_name &&
      settings.school_location === DEFAULT_SETTINGS.school_location &&
      settings.school_functionary_1 === DEFAULT_SETTINGS.school_functionary_1 &&
      settings.school_functionary_2 === DEFAULT_SETTINGS.school_functionary_2 &&
      settings.school_functionary_1_position === DEFAULT_SETTINGS.school_functionary_1_position &&
      settings.school_functionary_2_position === DEFAULT_SETTINGS.school_functionary_2_position;

    if (isDefault) {
      const userWantsToEdit = await ask(
        "Die Einstellungen sind noch nicht konfiguriert. Möchten Sie diese jetzt ändern?",
        {
          title: "Einstellungen konfigurieren",
          kind: "info",
          okLabel: "Ja",
          cancelLabel: "Nein",
        }
      );

      if (userWantsToEdit) {
        // Navigate to settings page
        window.location.href = "settings.html";
      }
    }
  } catch (error) {
    console.error("Error checking settings:", error);
  }
}
