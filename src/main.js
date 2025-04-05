const invoke = window.__TAURI__.core.invoke;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const listen = window.__TAURI__.event.listen;

await listen("student-added", (event) => {
	init(event.payload.new_student_id, event.payload.new_student_name);
});

window.studentState = {
	studentId: 0,
	studentName: "",
};
const [studentIdOnLoad, studentNameOnLoad] = await invoke("get_state");

const openNavButton = document.querySelector("#openNav");
const closeNavButton = document.querySelector("#closeNav");
const mainContent = document.querySelector("#main");
const searchBox = document.getElementById("student-search");
const list = document.getElementById("suggestions");

async function init(new_student_id, new_student_name) {
	select_student(new_student_id, new_student_name);
	if (searchBox != null) {
		searchBox.value = new_student_name;
	}
	openNavButton.addEventListener("click", openNav);
	closeNavButton.addEventListener("click", closeNav);
	mainContent.addEventListener("click", () => {
		searchBoxBlurred();
		closeNav();
	});
	if (searchBox != null) {
		searchBox.addEventListener("click", async (e) => {
			e.stopPropagation();
			e.preventDefault();

			if (searchBox.value.trim() === window.studentState.studentName) {
				searchBox.value = "";
			}
		});
		searchBox.addEventListener("keydown", async (e) => searchBoxInputted(e));
	}
}

async function generatePdf() {
	try {
		await invoke("generate_pdf");
	} catch (error) {
		console.error("Error generating PDF:", error);
		alert("Failed to generate PDF. Please try again.");
	}
}

function openNav() {
	document.getElementById("sidenav").style.width = "30vw";
}

function closeNav() {
	document.getElementById("sidenav").style.width = "0";
}

async function searchBoxInputted(e) {
	if (/^[a-zA-Z]$/.test(e.key) || e.key === "Backspace" || e.key === "Delete") {
		const suggestionResults = await db.select(
			"SELECT * FROM students WHERE name LIKE $1",
			[`%${searchBox.value}%`],
		);
		list.innerHTML = "";
		for (let i = 0; i < suggestionResults.length; i++) {
			const item = document.createElement("li");
			item.textContent = suggestionResults[i].name;
			item.dataset.id = suggestionResults[i].student_id;
			item.addEventListener("click", () => {
				searchBox.value = item.textContent;
				select_student(Number.parseInt(item.dataset.id), item.textContent);
				list.style.display = "none";
			});
			list.appendChild(item);
		}
		if (list.childNodes.length === 0) {
			list.style.display = "none";
		} else {
			list.style.display = "block";
		}
	} else if (e.key === "Enter") {
		const activeItem = list.querySelector("li.active");
		const firstResult = list.firstElementChild;
		if (activeItem) {
			list.style.display = "none";
			searchBox.value = activeItem.textContent;

			select_student(
				Number.parseInt(activeItem.dataset.id),
				activeItem.textContent,
			);
		} else {
			if (firstResult != null) {
				list.style.display = "none";
				searchBox.value = firstResult.textContent;

				select_student(
					Number.parseInt(firstResult.dataset.id),
					firstResult.textContent,
				);
			}
		}
	} else if (e.key === "Tab") {
		e.preventDefault();
		const items = Array.from(list.children);
		if (items.length === 0) return;

		const activeItem = list.querySelector("li.active");
		let nextIndex = 0;

		if (activeItem) {
			const currentIndex = items.indexOf(activeItem);
			activeItem.classList.remove("active");
			nextIndex = (currentIndex + 1) % items.length;
		}

		const nextItem = items[nextIndex];
		nextItem.classList.add("active");

		searchBox.value = nextItem.textContent;
		return;
	} else {
		if (searchBox.value === "" || searchBox.value === null) {
			document.getElementById("suggestions").style.display = "none";
		}
	}
}

function searchBoxBlurred() {
	if (searchBox) {
		setTimeout(() => {
			if (
				searchBox.value.trim() === "" ||
				searchBox.value.trim() === window.studentState.studentName
			) {
				searchBox.value = window.studentState.studentName;
			} else {
				searchBox.value = "";
				select_student(0, "");
			}
			list.style.display = "none";
		}, 20);
	}
}

async function select_student(newStudentId, newStudentName) {
	await invoke("set_state", {
		studentId: newStudentId,
		studentName: newStudentName,
	});
	window.studentState.studentId = newStudentId;
	window.studentState.studentName = newStudentName;
	const event = new CustomEvent("studentChanged", {
		detail: { studentId: newStudentId },
	});
	document.dispatchEvent(event);

	const to_be_disabled = document.querySelector(".disabled-no-student");
	if (to_be_disabled) {
		if (newStudentName === "" && newStudentId === 0) {
			to_be_disabled.setAttribute("disabled", "true");
		} else {
			to_be_disabled.removeAttribute("disabled");
		}
	}
}

document.addEventListener(
	"submit",
	(e) => {
		e.preventDefault();
	},
	true,
);

document.addEventListener(
	"keydown",
	(e) => {
		if (e.key === "Enter" && e.target.tagName === "INPUT") {
			e.preventDefault();
		}
	},
	true,
);

init(studentIdOnLoad, studentNameOnLoad);

export { select_student };
