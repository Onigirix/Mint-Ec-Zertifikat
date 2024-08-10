const { WebviewWindow } = window.__TAURI__.webviewWindow;

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  const createSchülerButton = document.querySelector("#createSchüler");

  createSchülerButton.addEventListener("click", createSchülerPopup);
});

function createSchülerPopup() {
  const schülerPopupWebview = new WebviewWindow("schuelerPopup", {
    hiddenTitle: true,
    minimizable: false,
    title: "Schüler hinzufügen",
    url: "schueler-popup.html"
  });
  schülerPopupWebview.once("tauri://created", function () {
    console.log("webview created");
  });
  schülerPopupWebview.once("tauri://error", function (e) {
    console.log("webview error", e);
  });
}
