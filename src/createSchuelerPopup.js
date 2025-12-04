const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { Webview } = window.__TAURI__.webview;

window.addEventListener("DOMContentLoaded", () => {
	const createSchülerButton = document.querySelector("#create-student");
	const startButton = document.querySelector("#startButton");
	const addStudentButton = document.querySelector("#add-student");

	if (createSchülerButton) {
		createSchülerButton.addEventListener("click", openStudentPopup);
	}
	if (addStudentButton) {
		addStudentButton.addEventListener("click", openStudentPopup);
	}
	if (startButton) {
		startButton.addEventListener("click", openStudentPopup);
	}
});

async function openStudentPopup() {
	//This can create multiple webviews if you click the button multiple times while the app is frozen, but that shouldn't be a problem with only async functions and commands
	const studentPopupWebview = new WebviewWindow("studentPopup", {
		hiddenTitle: true,
		title: "Neuen Schüler erstellen",
		height: 560,
		minimizable: false,
		url: "schueler-popup.html",
	});
	studentPopupWebview.once("tauri://created", () => {});
	studentPopupWebview.once("tauri://error", async (e) => {
		if (e.payload === "a webview with label `studentPopup` already exists") {
			const studentPopupWindow = await Webview.getByLabel("studentPopup");
			await studentPopupWindow.setFocus();
		}
	});
}
