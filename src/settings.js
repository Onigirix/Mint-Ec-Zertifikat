import { getDb } from './db-connection.js';

const invoke = window.__TAURI__.core.invoke;
const { ask } = window.__TAURI__.dialog;
const db = await getDb();
const schoolTabs = document.getElementById('schoolTabs');
const schoolNameField = document.getElementById('schoolName');
const schoolLocationField = document.getElementById('schoolLocation');
const outputPathField = document.getElementById('outputPath');
const selectFolderButton = document.getElementById('folderSelectButton');
const schoolFunctionary1Field = document.getElementById('namePos1');
const schoolFunctionary2Field = document.getElementById('namePos2');
const schoolFunctionary1PositionField = document.getElementById('pos1');
const schoolFunctionary2PositionField = document.getElementById('pos2');

let schools = [];
let selectedSchoolId = null;
const schoolFields = [schoolNameField, schoolLocationField, schoolFunctionary1Field,
  schoolFunctionary2Field, schoolFunctionary1PositionField, schoolFunctionary2PositionField];

async function loadSchools(selectId = selectedSchoolId) {
  schools = await db.select('SELECT * FROM schools ORDER BY school_id');
  if (!schools.length) throw new Error('Keine Schule in der Datenbank gefunden.');
  selectedSchoolId = schools.some(school => school.school_id === selectId) ? selectId : schools[0].school_id;
  renderSchoolTabs();
  loadSchoolFields();
}

function renderSchoolTabs() {
  schoolTabs.replaceChildren();
  for (const school of schools) {
    const wrapper = document.createElement('div');
    wrapper.className = `tab-button-wrapper${school.school_id === selectedSchoolId ? ' active' : ''}`;
    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'tablinks';
    select.textContent = school.school_name;
    select.title = school.school_name;
    select.addEventListener('click', async () => {
      await saveSchoolFields();
      selectedSchoolId = school.school_id;
      renderSchoolTabs();
      loadSchoolFields();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'close_tablinks';
    remove.title = 'Schule löschen';
    remove.textContent = '×';
    remove.disabled = schools.length < 2;
    remove.addEventListener('click', () => deleteSchool(school));
    wrapper.append(select, remove);
    schoolTabs.append(wrapper);
  }
}

function loadSchoolFields() {
  const school = schools.find(item => item.school_id === selectedSchoolId);
  if (!school) return;
  schoolNameField.value = school.school_name ?? '';
  schoolLocationField.value = school.school_location ?? '';
  schoolFunctionary1Field.value = school.school_functionary_1 ?? '';
  schoolFunctionary2Field.value = school.school_functionary_2 ?? '';
  schoolFunctionary1PositionField.value = school.school_functionary_1_position ?? '';
  schoolFunctionary2PositionField.value = school.school_functionary_2_position ?? '';
}

async function saveSchoolFields() {
  if (selectedSchoolId === null) return;
  const name = schoolNameField.value.trim();
  if (!name) {
    schoolNameField.focus();
    throw new Error('Der Schulname darf nicht leer sein.');
  }
  await db.execute(
    `UPDATE schools SET school_name = $1, school_location = $2,
      school_functionary_1 = $3, school_functionary_2 = $4,
      school_functionary_1_position = $5, school_functionary_2_position = $6
     WHERE school_id = $7`,
    [name, schoolLocationField.value, schoolFunctionary1Field.value,
      schoolFunctionary2Field.value, schoolFunctionary1PositionField.value,
      schoolFunctionary2PositionField.value, selectedSchoolId]
  );
  const school = schools.find(item => item.school_id === selectedSchoolId);
  if (school) {
    Object.assign(school, {
      school_name: name,
      school_location: schoolLocationField.value,
      school_functionary_1: schoolFunctionary1Field.value,
      school_functionary_2: schoolFunctionary2Field.value,
      school_functionary_1_position: schoolFunctionary1PositionField.value,
      school_functionary_2_position: schoolFunctionary2PositionField.value,
    });
    if (Number(selectedSchoolId) === 1) await syncLegacySettings(school);
  }
  renderSchoolTabs();
}

async function syncLegacySettings(school) {
  await db.execute(
    `UPDATE settings SET school_name = $1, school_location = $2,
      school_functionary_1 = $3, school_functionary_2 = $4,
      school_functionary_1_position = $5, school_functionary_2_position = $6
     WHERE id = 1`,
    [school.school_name, school.school_location, school.school_functionary_1,
      school.school_functionary_2, school.school_functionary_1_position,
      school.school_functionary_2_position]
  );
}

schoolFields.forEach(field => field.addEventListener('blur', () => {
  saveSchoolFields().catch(error => alert(error.message));
}));
document.getElementById('settingsForm').addEventListener('submit', event => event.preventDefault());
schoolFields.forEach(field => field.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveSchoolFields().catch(error => alert(error.message));
  }
}));
schoolNameField.addEventListener('input', () => {
  const school = schools.find(item => item.school_id === selectedSchoolId);
  if (school) school.school_name = schoolNameField.value.trim() || 'Neue Schule';
  renderSchoolTabs();
});

const newSchoolDialog = document.getElementById('newSchoolDialog');
const newSchoolForm = document.getElementById('newSchoolForm');
document.getElementById('addSchoolButton').addEventListener('click', () => {
  newSchoolForm.reset();
  newSchoolDialog.showModal();
  document.getElementById('newSchoolName').focus();
});
document.getElementById('cancelNewSchool').addEventListener('click', () => newSchoolDialog.close());
newSchoolForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('newSchoolName').value.trim();
  if (!name) return;
  await saveSchoolFields();
  const result = await db.execute('INSERT INTO schools (school_name) VALUES ($1)', [name]);
  newSchoolDialog.close();
  await loadSchools(result.lastInsertId);
});

async function deleteSchool(school) {
  const [countRow] = await db.select('SELECT COUNT(*) AS count FROM students WHERE school_id = $1', [school.school_id]);
  const count = Number(countRow.count);
  const remaining = schools.filter(item => item.school_id !== school.school_id);
  const destination = remaining[0];
  const warning = count
    ? `${count} Schüler sind dieser Schule zugeordnet und werden ${destination.school_name} zugeordnet. `
    : '';
  const confirmed = await ask(`${warning}Möchten Sie ${school.school_name} wirklich löschen?`, {
    title: 'Schule löschen',
    kind: 'warning',
  });
  if (!confirmed) return;
  await db.execute('UPDATE students SET school_id = $1 WHERE school_id = $2', [destination.school_id, school.school_id]);
  await db.execute('DELETE FROM schools WHERE school_id = $1', [school.school_id]);
  if (Number(school.school_id) === 1) await syncLegacySettings(destination);
  await loadSchools(destination.school_id);
}

const outputPath = await db.select('SELECT default_file_path FROM settings WHERE id = 1');
outputPathField.value = outputPath[0]?.default_file_path ?? '/';
outputPathField.addEventListener('blur', async () => {
  await db.execute('UPDATE settings SET default_file_path = $1 WHERE id = 1', [outputPathField.value]);
});
selectFolderButton.addEventListener('click', async () => {
  const folderPath = await invoke('folder_select');
  if (folderPath) {
    outputPathField.value = folderPath;
    await db.execute('UPDATE settings SET default_file_path = $1 WHERE id = 1', [folderPath]);
  }
});
await loadSchools();
