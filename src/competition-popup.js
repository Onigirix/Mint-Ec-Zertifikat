import { getDb } from './db-connection.js';

const invoke = window.__TAURI__.core.invoke;

const db = await getDb();
const emit = window.__TAURI__.event.emit;
const { getCurrentWindow } = window.__TAURI__.window;
const sekCheckboxes = document.querySelectorAll(".sek-checkbox");

document
  .getElementById("competitionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = e.target.competitionName.value.trim();
    let levelOne = e.target.firstLevel.value.trim();
    let levelTwo = e.target.secondLevel.value.trim();
    let levelThree = e.target.thirdLevel.value.trim();

    // Falls leer, durch "-" ersetzen
    if (!levelOne) levelOne = "-";
    if (!levelTwo) levelTwo = "-";
    if (!levelThree) levelThree = "-";

    const checkedSekCheckboxes = [...sekCheckboxes].filter(
      (checkbox) => checkbox.checked
    );

    for (const sekCheckbox of checkedSekCheckboxes) {
      await db.execute(
        "INSERT INTO additional_mint_activities (name, level_one, level_two, level_three, sek) VALUES ($1, $2, $3, $4, $5)",
        [name, levelOne, levelTwo, levelThree, sekCheckbox.value]
      );
    }

    await emit("competitions-changed", {});

    if (e.submitter === document.getElementById("fertig")) {
      const currentWindow = getCurrentWindow();
      currentWindow.close();
    } else {
      e.target.reset();
      return;
    }
  });
