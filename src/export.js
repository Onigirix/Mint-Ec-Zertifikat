const invoke = window.__TAURI__.core.invoke;
window.addSchool = function s(event) {
Conseole.log("Snackbar called");

  // Get the snackbar DIV
  var x = document.getElementById("snackbar");

  // Add the "show" class to DIV
  x.className = "show";

  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}


document.getElementById("generatePdf").addEventListener("click", async () => {

	if (window.studentState.studentId !== 0) {
		await invoke("generate_pdf");
	}
});

