const invoke = window.__TAURI__.core.invoke;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
window.studentState = {
  studentId: 0,
  studentName: "",
};
var [studentIdOnLoad, studentNameOnLoad] = await invoke("get_state");
select_student(studentIdOnLoad, studentNameOnLoad);

const openNavButton = document.querySelector("#openNav");
const closeNavButton = document.querySelector("#closeNav");
const mainContent = document.querySelector("#main");
const searchBox = document.getElementById("student-search");
const list = document.getElementById("suggestions");

if (searchBox != null) {
  searchBox.value = studentNameOnLoad;
}
openNavButton.addEventListener("click", openNav);
closeNavButton.addEventListener("click", closeNav);
mainContent.addEventListener("click", () => {
  searchBoxBlurred();
  closeNav();
});
searchBox.addEventListener("click", async (e) => {
  e.stopPropagation();
  e.preventDefault();

  if (searchBox.value.trim() === window.studentState.studentName) {
    searchBox.value = "";
  }
});
searchBox.addEventListener("keydown", async (e) => searchBoxInputted(e));

const closePopupButton = document.getElementById("closePopup");

// Event-Listener für den Schließen-Button
if (closePopupButton) {
  closePopupButton.addEventListener("click", () => {
    const currentWindow = window.__TAURI__.window.getCurrent();
    currentWindow.close(); // Schließt das aktuelle Webview-Fenster in Tauri
  });
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
  document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
  document.getElementById("sidenav").style.width = "0";
  document.body.style.backgroundColor = "white";
}

async function searchBoxInputted(e) {
  const startTime = performance.now();

  if (/^[a-zA-Z]$/.test(e.key) || e.key === "Backspace" || e.key === "Delete") {
    const suggestionResults = await db.select(
      "SELECT * FROM students WHERE name like $1",
      [`%${searchBox.value}%`]
    );
    list.innerHTML = "";
    for (let i = 0; i < suggestionResults.length; i++) {
      let item = document.createElement("li");
      item.textContent = suggestionResults[i].name;
      item.dataset.id = suggestionResults[i].student_id;
      item.addEventListener("click", () => {
        searchBox.value = item.textContent;
        select_student(parseInt(item.dataset.id), item.textContent);
        list.style.display = "none";
      });
      list.appendChild(item);
    }
    if (list.childNodes.length == 0) {
      list.style.display = "none";
    } else {
      list.style.display = "block";
    }
  } else if (e.key === "Enter") {
    const firstResult = list.firstElementChild;
    if (firstResult != null) {
      list.style.display = "none";
      searchBox.value = firstResult.textContent;

      select_student(parseInt(firstResult.dataset.id), firstResult.textContent);
    } else {
      alert("Kein Schüler gefunden");
    }
  } else {
    if (searchBox.value == "" || searchBox.value == null) {
      document.getElementById("suggestions").style.display = "none";
    }
  }

  const endTime = performance.now();
  console.log(`searchBoxInputted execution time: ${endTime - startTime}ms`);
}

function searchBoxBlurred() {
  setTimeout(function () {
    if (
      searchBox.value.trim() == "" ||
      searchBox.value.trim() == window.studentState.studentName
    ) {
      searchBox.value = window.studentState.studentName;
    } else {
      searchBox.value = "";
      select_student(0, "");
    }
    list.style.display = "none";
  }, 20);
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
}

// Fixes reload on click into student_search
document.addEventListener(
  "submit",
  (e) => {
    e.preventDefault();
  },
  true
);

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
    }
  },
  true
);
