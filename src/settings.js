import { getDb } from './db-connection.js';

const invoke = window.__TAURI__.core.invoke;

let db = null;
const dbReady = getDb().then(instance => { db = instance; });

const schoolNameField = document.getElementById("schoolName");
const schoolLocationField = document.getElementById("schoolLocation");
const outputPathField = document.getElementById("outputPath");
const selectFolderButton = document.getElementById("folderSelectButton");
const schoolFunctionary1Field = document.getElementById("namePos1");
const schoolFunctionary2Field = document.getElementById("namePos2");
const schoolFunctionary1PositionField = document.getElementById("pos1");
const schoolFunctionary2PositionField = document.getElementById("pos2");

async function init() {
	await dbReady;
	const [settings] = await db.select("SELECT * FROM settings WHERE id=1");

	schoolNameField.value = settings.school_name;
	schoolLocationField.value = settings.school_location;
	outputPathField.value = settings.default_file_path;
	schoolFunctionary1Field.value = settings.school_functionary_1;
	schoolFunctionary2Field.value = settings.school_functionary_2;
	schoolFunctionary1PositionField.value =
		settings.school_functionary_1_position;
	schoolFunctionary2PositionField.value =
		settings.school_functionary_2_position;
}

schoolNameField.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_name = $1 WHERE id = 1",
				[schoolNameField.value],
			);
			schoolNameField.style.border = "1px solid rgb(204, 204, 204)";
			schoolNameField.style.backgroundColor = "white";
		} else {
			schoolNameField.style.border = "1px solid red";
			schoolNameField.style.backgroundColor = "rgb(255, 150, 150)";
		}
	},
	false,
);

schoolLocationField.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_location = $1 WHERE id = 1",
				[schoolLocationField.value],
			);
			schoolLocationField.style.border = "1px solid rgb(204, 204, 204)";
			schoolLocationField.style.backgroundColor = "white";
		} else {
			schoolLocationField.style.border = "1px solid red";
			schoolLocationField.style.backgroundColor = "rgb(255, 150, 150)";
		}
	},
	false,
);

outputPathField.addEventListener("keydown", async (e) => {
	await dbReady;
	if (e.keyCode === 13 || e.keyCode === 9) {
		//Enter or Tab
		const res1 = await db.execute(
			"UPDATE settings SET default_file_path = $1 WHERE id = 1",
			[outputPathField.value],
		);
		outputPathField.style.border = "1px solid rgb(204, 204, 204)";
		outputPathField.style.backgroundColor = "white";
	} else {
		outputPathField.style.border = "1px solid red";
		outputPathField.style.backgroundColor = "rgb(255, 150, 150)";
	}
});

schoolFunctionary1Field.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_functionary_1 = $1 WHERE id = 1",
				[schoolFunctionary1Field.value],
			);
			schoolFunctionary1Field.style.border = "1px solid rgb(204, 204, 204)";
			schoolFunctionary1Field.style.backgroundColor = "white";
		} else {
			schoolFunctionary1Field.style.border = "1px solid red";
			schoolFunctionary1Field.style.backgroundColor = "rgb(255, 150, 150)";
		}
	},
	false,
);

schoolFunctionary2Field.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_functionary_2 = $1 WHERE id = 1",
				[schoolFunctionary2Field.value],
			);
			schoolFunctionary2Field.style.border = "1px solid rgb(204, 204, 204)";
			schoolFunctionary2Field.style.backgroundColor = "white";
		} else {
			schoolFunctionary2Field.style.border = "1px solid red";
			schoolFunctionary2Field.style.backgroundColor = "rgb(255, 150, 150)";
		}
	},
	false,
);

schoolFunctionary1PositionField.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_functionary_1_position = $1 WHERE id = 1",
				[schoolFunctionary1PositionField.value],
			);
			schoolFunctionary1PositionField.style.border =
				"1px solid rgb(204, 204, 204)";
			schoolFunctionary1PositionField.style.backgroundColor = "white";
		} else {
			schoolFunctionary1PositionField.style.border = "1px solid red";
			schoolFunctionary1PositionField.style.backgroundColor =
				"rgb(255, 150, 150)";
		}
	},
	false,
);

schoolFunctionary2PositionField.addEventListener(
	"keydown",
	async (e) => {
		await dbReady;
		if (e.keyCode === 13 || e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				"UPDATE settings SET school_functionary_2_position = $1 WHERE id = 1",
				[schoolFunctionary2PositionField.value],
			);
			schoolFunctionary2PositionField.style.border =
				"1px solid rgb(204, 204, 204)";
			schoolFunctionary2PositionField.style.backgroundColor = "white";
		} else {
			schoolFunctionary2PositionField.style.border = "1px solid red";
			schoolFunctionary2PositionField.style.backgroundColor =
				"rgb(255, 150, 150)";
		}
	},
	false,
);

selectFolderButton.addEventListener("click", async () => {
	try {
		await dbReady;
		const folderPath = await invoke("folder_select");
		await db.execute(
			"UPDATE settings SET default_file_path = $1 WHERE id = 1",
			[folderPath],
		);
		init();
	} catch (error) {}
});

schoolNameField.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_name = $1 WHERE id = 1",
		[schoolNameField.value],
	  );
	  schoolNameField.style.border = "1px solid rgb(204, 204, 204)";
	  schoolNameField.style.backgroundColor = "white";
	},
	false,
  );

  schoolLocationField.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_location = $1 WHERE id = 1",
		[schoolLocationField.value],
	  );
	  schoolLocationField.style.border = "1px solid rgb(204, 204, 204)";
	  schoolLocationField.style.backgroundColor = "white";
	},
	false,
  );

  outputPathField.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET default_file_path = $1 WHERE id = 1",
		[outputPathField.value],
	  );
	  outputPathField.style.border = "1px solid rgb(204, 204, 204)";
	  outputPathField.style.backgroundColor = "white";
	},
  );

  schoolFunctionary1Field.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_functionary_1 = $1 WHERE id = 1",
		[schoolFunctionary1Field.value],
	  );
	  schoolFunctionary1Field.style.border = "1px solid rgb(204, 204, 204)";
	  schoolFunctionary1Field.style.backgroundColor = "white";
	},
	false,
  );

  schoolFunctionary2Field.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_functionary_2 = $1 WHERE id = 1",
		[schoolFunctionary2Field.value],
	  );
	  schoolFunctionary2Field.style.border = "1px solid rgb(204, 204, 204)";
	  schoolFunctionary2Field.style.backgroundColor = "white";
	},
	false,
  );

  schoolFunctionary1PositionField.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_functionary_1_position = $1 WHERE id = 1",
		[schoolFunctionary1PositionField.value],
	  );
	  schoolFunctionary1PositionField.style.border =
		"1px solid rgb(204, 204, 204)";
	  schoolFunctionary1PositionField.style.backgroundColor = "white";
	},
	false,
  );

  schoolFunctionary2PositionField.addEventListener(
	"blur",
	async () => {
	  const res1 = await db.execute(
		"UPDATE settings SET school_functionary_2_position = $1 WHERE id = 1",
		[schoolFunctionary2PositionField.value],
	  );
	  schoolFunctionary2PositionField.style.border =
		"1px solid rgb(204, 204, 204)";
	  schoolFunctionary2PositionField.style.backgroundColor = "white";
	},
	false,
  );

/*
Erklärung:
Wenn nur noch eine Schule vorhanden ist soll der lösch button deaktiviert sein. 

Wenn auf den tab_button_wrapper geklickt wird soll der tab aktiv werden und die daten der schule geladen werden.
Wenn auf den lösch button geklickt wird soll die schule gelöscht werden (mit bestätigung).
Wenn auf den + button geklickt wird soll eine neue schule angelegt werden und ein neuer tab_button_wrapper mit trennstrich (vertical_stripe) davor erstellt werden.


*/

window.openSchool = function(event, schoolName) {
	alert("Opend " + schoolName);
}

window.deleteSchool = function(event, schoolName) {
	  event.stopPropagation(); // verhindert weitere Click-Events
	deleteSchool(event, schoolName);
}

window.addSchool = function(event) {
	addTab("Neue Schule", "neue_schule");
}

function addTab(title, schoolName) {
  const tabContainer = document.getElementById("tab");

  // Wrapper div
  const wrapper = document.createElement("div");
  wrapper.className = "tab-button-wrapper";

  // Haupt-Tab-Button
  const mainButton = document.createElement("button");
  mainButton.className = "tablinks";
  mainButton.setAttribute("onclick", `openSchool(event, '${schoolName}')`);
  mainButton.textContent = title;

  // Close-Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "close_tablinks";
  closeBtn.setAttribute("onclick", `deleteSchool(event, '${schoolName}')`);

  const iconSpan = document.createElement("span");
  iconSpan.className = "material-symbols-rounded icon";
  iconSpan.textContent = "delete";

  closeBtn.appendChild(iconSpan);

  wrapper.appendChild(mainButton);
  wrapper.appendChild(closeBtn);

  // Vertical Stripe
  const stripe = document.createElement("div");
  stripe.className = "vertical_stripe";
  stripe.textContent = " |";

  // Oben einfügen (vor dem ersten vorhandenen Element)
  tabContainer.prepend(stripe);
  tabContainer.prepend(wrapper);
}

function deleteSchool(event, schoolName) {
  // Event-Propagation stoppen (falls Buttons verschachtelt sind)
  event.stopPropagation();

  // Der Button > wrapper (tab-button-wrapper)
  const wrapper = event.target.closest(".tab-button-wrapper");

  if (!wrapper) return;

  // Der nächste Nachbar ist die vertical_stripe
  const stripe = wrapper.nextElementSibling;
  if (stripe && stripe.classList.contains("vertical_stripe")) {
    stripe.remove();
  }

  // Jetzt den Wrapper selbst löschen
  wrapper.remove();
}


init();
