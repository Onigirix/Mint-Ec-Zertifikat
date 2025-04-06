const { WebviewWindow } = window.__TAURI__.webviewWindow;

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