const invoke = window.__TAURI__.core.invoke;
const notyf = new window.Notyf({
	position: { x: "right", y: "top" },
	duration: 4500,
});


document.getElementById("generatePdf").addEventListener("click", async () => {

	if (window.studentState.studentId !== 0) {
		try {
			const generated = await invoke("generate_pdf");
			if (generated) notyf.success("PDF wurde erfolgreich gespeichert.");
		} catch (error) {
			notyf.error(`PDF-Generierung fehlgeschlagen: ${String(error)}`);
		}
	}
});
