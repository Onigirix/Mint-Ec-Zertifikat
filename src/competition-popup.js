const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;

const sekCheckboxes = document.querySelectorAll(".sek-checkbox");

document
  .getElementById("competitionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const checkedSekCheckboxes = [...sekCheckboxes].filter(
      (checkbox) => checkbox.checked
    );
    for (const sekCheckbox of checkedSekCheckboxes) {
      await db.execute(
        "INSERT INTO additional_mint_activities (name, level_one, level_two, level_three, sek) VALUES ($1, $2, $3, $4, $5)",
        [
          e.target.competitionName.value,
          e.target.firstLevel.value,
          e.target.secondLevel.value,
          e.target.thirdLevel.value,
          sekCheckbox.value
        ]
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
