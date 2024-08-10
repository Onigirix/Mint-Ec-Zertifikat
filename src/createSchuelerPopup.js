import { Window } from "/api/window";
import { Webview } from "/api/webview";

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");
  const createSchülerButton = document.querySelector("#createSchüler");

  createSchülerButton.addEventListener("click", createSchülerPopup);
});

function createSchülerPopup() {
  const schülerPopupWindow = new Window("schülerPopup");
  const schülerPopupWebview = new Webview(schülerPopupWindow, "schülerPopup", {
    url: "schülerPopup.html",
  });
  schülerPopupWebview.once("tauri://created", function () {
    console.log("webview created");
  });
  schülerPopupWebview.once("tauri://error", function (e) {
    console.log("webview error", e);
  });
}
