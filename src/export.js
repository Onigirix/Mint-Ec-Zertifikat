const invoke = window.__TAURI__.core.invoke;

document.addEventListener("studentChanged", async (e) => {
	if (e.detail.studentId !== 0) {
		await invoke("generate_pdf");
	}
});
