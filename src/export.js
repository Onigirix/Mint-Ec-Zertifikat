const invoke = window.__TAURI__.core.invoke;


document.getElementById("generatePdf").addEventListener("click", async () => {

	if (window.studentState.studentId !== 0) {
		await invoke("generate_pdf");
	}
});
