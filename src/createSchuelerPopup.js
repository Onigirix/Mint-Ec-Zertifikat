const { WebviewWindow } = window.__TAURI__.webviewWindow;

window.addEventListener("DOMContentLoaded", () => {
  const createSchülerButton = document.querySelector("#create-student");
  const startButton = document.querySelector("#startButton");


  createSchülerButton.addEventListener("click", openStudentPopup);
  startButton.addEventListener("click", openStudentPopup);

  
});

async function openStudentPopup() {
  //This can create multiple webviews if you click the button multiple times while the app is frozen, but that shouldn't be a problem with only async functions and commands
  const studentPopupWebview = new WebviewWindow("studentPopup", {
    hiddenTitle: true,
    minimizable: false,
    url: "schueler-popup.html",
  });
  studentPopupWebview.once("tauri:// created", function () {
    console.log("webview created");
  });
  studentPopupWebview.once("tauri://error", function (e) {
    if (e.payload != "a webview with label `studentPopup` already exists") {
      console.log("webview error", e);
      return;
    }
    console.log("webview already exists");
    const studentPopupWindow = WebviewWindow.getByLabel("studentPopup");
    console.log(studentPopupWindow);
    studentPopupWindow.setFocus();
  });
}
