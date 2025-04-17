const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;
const { getCurrentWindow } = window.__TAURI__.window;
const competitionId = new URLSearchParams(window.location.search).get("id");
const nameField = document.getElementById("competitionName");
const levelOneField = document.getElementById("firstLevel");
const levelTwoField = document.getElementById("secondLevel");
const levelThreeField = document.getElementById("thirdLevel");


async function init(){
  const [competition] = await db.select("SELECT name, level_one, level_two, level_three FROM additional_mint_activities WHERE additional_mint_activity_id = $1", [competitionId])
  nameField.value = competition.name;
  levelOneField.value = competition.level_one;
  levelTwoField.value = competition.level_two;
  levelThreeField.value = competition.level_three;
}

document
  .getElementById("competitionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await db.execute(
      "UPDATE additional_mint_activities SET name = $1,  level_one = $2, level_two = $3, level_three =$4 WHERE additional_mint_activity_id = $5",
      [
        e.target.competitionName.value,
        e.target.firstLevel.value,
        e.target.secondLevel.value,
        e.target.thirdLevel.value,
        competitionId
      ]
    );

    await emit("competitions-changed", {});
    const currentWindow = getCurrentWindow();
    currentWindow.close();
  });

await init();

