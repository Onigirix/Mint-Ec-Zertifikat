// Popup.js
const { getCurrent } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");

window.addEventListener("DOMContentLoaded", () => {
  const closePopupButton = document.getElementById("closePopup");

  if (closePopupButton) {
    closePopupButton.addEventListener("click", () => {
      const currentWindow = getCurrent(); // Hole das aktuelle Fenster
      currentWindow.close(); // Schließe das Popup
    });
  }
});

document
  .getElementById("schuelerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await db.execute("INSERT INTO students (name, birthday) VALUES ($1, $2)", [
      e.target.vorname.value + " " + e.target.nachname.value,
      e.target.geburtsdatum.value,
    ]);

    e.target.reset();
  });
