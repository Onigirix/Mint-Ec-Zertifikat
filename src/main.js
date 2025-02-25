const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", () => {
  const openNavButton = document.querySelector("#openNav");
  const closeNavButton = document.querySelector("#closeNav");
  const savePdfButton = document.querySelector("#save-pdf");
  const mainContent = document.querySelector("#main");

  openNavButton.addEventListener("click", openNav);
  closeNavButton.addEventListener("click", closeNav);
  mainContent.addEventListener("click", closeNav);
  // savePdfButton.addEventListener("click", generatePdf);

  const closePopupButton = document.getElementById("closePopup");

  // Event-Listener für den Schließen-Button
  if (closePopupButton) {
    closePopupButton.addEventListener("click", () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.close(); // Schließt das aktuelle Webview-Fenster in Tauri
    });
  }
});

async function generatePdf() {
  try {
    await invoke("generate_pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}

function openNav() {
  document.getElementById("sidenav").style.width = "30vw";
  document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
  document.getElementById("sidenav").style.width = "0";
  document.body.style.backgroundColor = "white";
}
