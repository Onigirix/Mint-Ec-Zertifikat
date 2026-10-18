<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  Building2,
  Check,
  FolderOpen,
  Moon,
  Plus,
  Sun,
  Trash2,
} from "lucide-vue-next";
import { rows, run } from "../db";
import {
  applyTheme,
  notify,
  refreshStudents,
  selectStudent,
  selectedStudent,
  students,
  theme,
} from "../store";
import type { School } from "../types";
const schools = ref<School[]>([]);
const activeId = ref(0);
const model = ref<Partial<School>>({});
const output = ref("");
const dirty = ref(false);
const addDialog = ref(false);
const newSchoolName = ref("");
async function loadSchools(preferred = activeId.value) {
  schools.value = await rows<School>(
    "SELECT * FROM schools ORDER BY school_id",
  );
  activeId.value = schools.value.some((s) => s.school_id === preferred)
    ? preferred
    : (schools.value[0]?.school_id ?? 0);
  const selected = schools.value.find((s) => s.school_id === activeId.value);
  model.value = selected ? { ...selected } : {};
  dirty.value = false;
}
onMounted(async () => {
  await loadSchools();
  const [s] = await rows<{ default_file_path: string }>(
    "SELECT default_file_path FROM settings WHERE id=1",
  );
  output.value = s?.default_file_path ?? "";
});
watch(activeId, () => {
  const s = schools.value.find((x) => x.school_id === activeId.value);
  if (s) model.value = { ...s };
  dirty.value = false;
});
function field(key: keyof School, value: string) {
  (model.value as Record<string, unknown>)[key] = value;
  dirty.value = true;
}
async function refreshStudentContext() {
  const id = selectedStudent.value?.student_id;
  if (!id) return;
  await refreshStudents();
  const latest = students.value.find((s) => s.student_id === id);
  if (latest) await selectStudent(latest);
}
async function saveSchool() {
  if (!activeId.value) return;
  if (!String(model.value.school_name ?? "").trim()) {
    notify("Der Schulname darf nicht leer sein.", "error");
    return;
  }
  await run(
    `UPDATE schools SET school_name=$1,school_location=$2,school_functionary_1=$3,school_functionary_2=$4,school_functionary_1_position=$5,school_functionary_2_position=$6 WHERE school_id=$7`,
    [
      String(model.value.school_name).trim(),
      model.value.school_location ?? "",
      model.value.school_functionary_1 ?? "",
      model.value.school_functionary_2 ?? "",
      model.value.school_functionary_1_position ?? "",
      model.value.school_functionary_2_position ?? "",
      activeId.value,
    ],
  );
  if (activeId.value === 1)
    await run(
      `UPDATE settings SET school_name=$1,school_location=$2,school_functionary_1=$3,school_functionary_2=$4,school_functionary_1_position=$5,school_functionary_2_position=$6 WHERE id=1`,
      [
        model.value.school_name,
        model.value.school_location ?? "",
        model.value.school_functionary_1 ?? "",
        model.value.school_functionary_2 ?? "",
        model.value.school_functionary_1_position ?? "",
        model.value.school_functionary_2_position ?? "",
      ],
    );
  await loadSchools(activeId.value);
  await refreshStudentContext();
  notify("Schuldaten gespeichert.");
}
async function addSchool() {
  newSchoolName.value = "";
  addDialog.value = true;
}
async function saveNewSchool() {
  const name = newSchoolName.value.trim();
  if (!name) return;
  const result = await run("INSERT INTO schools (school_name) VALUES ($1)", [
    name,
  ]);
  await loadSchools(result.lastInsertId);
  addDialog.value = false;
  notify("Schule hinzugefügt.");
}
async function deleteSchool() {
  const current = schools.value.find((s) => s.school_id === activeId.value);
  if (!current || schools.value.length < 2) return;
  const remaining = schools.value.filter((s) => s.school_id !== activeId.value);
  const destination = remaining[0]!;
  const [counts] = await rows<{ count: number }>(
    "SELECT COUNT(*) AS count FROM students WHERE school_id=$1",
    [activeId.value],
  );
  const count = Number(counts?.count ?? 0);
  const warning = count
    ? `${count} Schüler*innen werden der Schule „${destination.school_name}“ zugeordnet. `
    : "";
  if (
    !(await ask(`${warning}„${current.school_name}“ wirklich löschen?`, {
      title: "Schule löschen",
      kind: "warning",
    }))
  )
    return;
  await run("UPDATE students SET school_id=$1 WHERE school_id=$2", [
    destination.school_id,
    activeId.value,
  ]);
  await run("DELETE FROM schools WHERE school_id=$1", [activeId.value]);
  if (activeId.value === 1)
    await run(
      `UPDATE settings SET school_name=$1,school_location=$2,school_functionary_1=$3,school_functionary_2=$4,school_functionary_1_position=$5,school_functionary_2_position=$6 WHERE id=1`,
      [
        destination.school_name,
        destination.school_location,
        destination.school_functionary_1,
        destination.school_functionary_2,
        destination.school_functionary_1_position,
        destination.school_functionary_2_position,
      ],
    );
  await loadSchools(destination.school_id);
  await refreshStudentContext();
  notify("Schule gelöscht; Schüler*innen wurden neu zugeordnet.");
}
async function addTheme() {
  applyTheme();
  await run("UPDATE settings SET theme_preference=$1 WHERE id=1", [
    theme.value,
  ]);
  notify("Darstellung aktualisiert.");
}
async function pickFolder() {
  try {
    const path = await invoke<string>("folder_select");
    output.value = path;
    await run("UPDATE settings SET default_file_path=$1 WHERE id=1", [path]);
    notify("Speicherordner gespeichert.");
  } catch (e) {
    if (String(e).includes("No folder selected")) return;
    notify(String(e), "error");
  }
}
async function savePath() {
  await run("UPDATE settings SET default_file_path=$1 WHERE id=1", [
    output.value,
  ]);
  notify("Speicherort gespeichert.");
}
</script>

<template>
  <section class="panel settings-panel">
    <header class="panel-heading">
      <div>
        <h2><Building2 :size="19" />Schulprofile</h2>
        <p>
          Schulen und Unterzeichnende verwalten. Schüler*innen behalten ihre
          jeweilige Zuordnung.
        </p>
      </div>
      <button class="button primary compact-button" @click="addSchool">
        <Plus :size="16" />Schule hinzufügen
      </button>
    </header>
    <div class="school-tabs">
      <button
        v-for="school in schools"
        :key="school.school_id"
        :class="{ active: activeId === school.school_id }"
        @click="activeId = school.school_id"
      >
        {{ school.school_name }}</button
      ><button
        class="icon-button danger-icon"
        :disabled="schools.length < 2"
        title="Ausgewählte Schule löschen"
        @click="deleteSchool"
      >
        <Trash2 :size="16" />
      </button>
    </div>
    <div class="form-grid settings-grid">
      <label class="span-2"
        >Schulname<input
          :value="model.school_name ?? ''"
          @input="
            field('school_name', ($event.target as HTMLInputElement).value)
          " /></label
      ><label class="span-2"
        >Ort<input
          :value="model.school_location ?? ''"
          @input="
            field('school_location', ($event.target as HTMLInputElement).value)
          "
      /></label>
      <div class="settings-divider span-2">
        <b>Unterzeichnende</b
        ><small>Namen und Positionen erscheinen im Zertifikat.</small>
      </div>
      <label
        >Name 1<input
          :value="model.school_functionary_1 ?? ''"
          @input="
            field(
              'school_functionary_1',
              ($event.target as HTMLInputElement).value,
            )
          " /></label
      ><label
        >Position 1<input
          :value="model.school_functionary_1_position ?? ''"
          @input="
            field(
              'school_functionary_1_position',
              ($event.target as HTMLInputElement).value,
            )
          " /></label
      ><label
        >Name 2<input
          :value="model.school_functionary_2 ?? ''"
          @input="
            field(
              'school_functionary_2',
              ($event.target as HTMLInputElement).value,
            )
          " /></label
      ><label
        >Position 2<input
          :value="model.school_functionary_2 ?? ''"
          @input="
            field(
              'school_functionary_2',
              ($event.target as HTMLInputElement).value,
            )
          "
      /></label>
      <footer class="settings-footer span-2">
        <span v-if="dirty" class="unsaved-note"
          >Nicht gespeicherte Änderungen</span
        ><span v-else class="autosave"><Check :size="14" />Gespeichert</span
        ><button class="button primary" :disabled="!dirty" @click="saveSchool">
          <Check :size="16" />Schule speichern
        </button>
      </footer>
    </div>
  </section>
  <div class="settings-columns">
    <section class="panel settings-card">
      <header class="panel-heading">
        <div>
          <h2><FolderOpen :size="19" />PDF Speicherort</h2>
          <p>Vorgeschlagener Ordner beim Speichern.</p>
        </div>
      </header>
      <label class="settings-path"
        >Ordnerpfad
        <div class="path-picker">
          <input v-model="output" @blur="savePath" /><button
            class="button secondary"
            @click="pickFolder"
          >
            <FolderOpen :size="16" />Durchsuchen
          </button>
        </div></label
      >
    </section>
    <section class="panel settings-card">
      <header class="panel-heading">
        <div>
          <h2><Sun :size="19" />Darstellung</h2>
          <p>Wähle das Farbschema für Mint-EC.</p>
        </div>
      </header>
      <div class="theme-choices">
        <button
          v-for="choice in [
            { id: 'light', name: 'Hell', icon: Sun },
            { id: 'dark', name: 'Dunkel', icon: Moon },
            { id: 'system', name: 'System', icon: Building2 },
          ]"
          :key="choice.id"
          class="theme-option"
          :class="{ active: theme === choice.id }"
          @click="
            theme = choice.id;
            addTheme();
          "
        >
          <component :is="choice.icon" :size="17" /><span>{{
            choice.name
          }}</span
          ><Check v-if="theme === choice.id" class="theme-check" :size="15" />
        </button>
      </div>
    </section>
  </div>
  <div v-if="addDialog" class="modal-backdrop" @click.self="addDialog = false">
    <section class="modal-card" role="dialog" aria-modal="true">
      <header class="modal-header">
        <div>
          <p class="eyebrow">SCHULPROFILE</p>
          <h2>Schule hinzufügen</h2>
        </div>
      </header>
      <form class="form-grid" @submit.prevent="saveNewSchool">
        <label class="span-2"
          >Schulname<input v-model="newSchoolName" autofocus required
        /></label>
        <footer class="modal-actions span-2">
          <button
            type="button"
            class="button secondary"
            @click="addDialog = false"
          >
            Abbrechen</button
          ><button class="button primary">Hinzufügen</button>
        </footer>
      </form>
    </section>
  </div>
</template>
