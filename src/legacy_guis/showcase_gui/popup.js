// Popup.js
const { getCurrent } = window.__TAURI__.window;

window.addEventListener("DOMContentLoaded", () => {
  const closePopupButton = document.getElementById("closePopup");

  if (closePopupButton) {
    closePopupButton.addEventListener("click", () => {
      const currentWindow = getCurrent(); // Hole das aktuelle Fenster
      currentWindow.close();  // Schließe das Popup
    });
  }
});
