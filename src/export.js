const invoke = window.__TAURI__.core.invoke;
const notyfPromise = import("https://cdn.jsdelivr.net/npm/notyf@3.10.0/+esm")
	.then(({ Notyf }) => new Notyf({ position: { x: "right", y: "top" }, duration: 4500 }))
	.catch(error => {
		console.error("Notyf konnte nicht geladen werden:", error);
		return null;
	});


document.getElementById("generatePdf").addEventListener("click", async () => {

	if (window.studentState.studentId !== 0) {
		try {
			const generated = await invoke("generate_pdf");
			if (generated) (await notyfPromise)?.success("PDF wurde erfolgreich gespeichert.");
		} catch (error) {
			(await notyfPromise)?.error(`PDF-Generierung fehlgeschlagen: ${String(error)}`);
		}
	}
});
