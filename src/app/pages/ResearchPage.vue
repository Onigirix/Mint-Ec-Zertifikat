<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { rows, run } from "../db";
import { notify, selectedStudent } from "../store";
import { FileText, Save } from "lucide-vue-next";
const types = [
  { value: 1, label: "Facharbeit" },
  { value: 2, label: "Wissenschaftspropädeutisches Fach" },
  { value: 3, label: "Besondere Lernleistung" },
  { value: 4, label: "Jugend forscht Projekt" },
  { value: 5, label: "Anderer Wettbewerb" },
];
const model = reactive({
  type: 0,
  topic: "",
  description: "",
  grade: "",
  competition: "",
});
const busy = ref(false);
const changed = ref(false);
const isContest = computed(() => model.type === 4 || model.type === 5);
const awardLevel = computed(() =>
  Number(model.grade) >= 15
    ? 3
    : Number(model.grade) >= 12
      ? 2
      : Number(model.grade) >= 10
        ? 1
        : 0,
);
async function load() {
  const id = selectedStudent.value?.student_id;
  if (!id) {
    Object.assign(model, {
      type: 0,
      topic: "",
      description: "",
      grade: "",
      competition: "",
    });
    return;
  }
  busy.value = true;
  try {
    const [row] = await rows<Record<string, unknown>>(
      "SELECT type_of_paper,topic_of_paper,description_of_paper,grade_of_paper,level_of_competition FROM students WHERE student_id=$1",
      [id],
    );
    Object.assign(model, {
      type: Number(row?.type_of_paper ?? 0),
      topic: String(row?.topic_of_paper ?? ""),
      description: String(row?.description_of_paper ?? ""),
      grade: String(row?.grade_of_paper ?? ""),
      competition: String(row?.level_of_competition ?? ""),
    });
    changed.value = false;
  } finally {
    busy.value = false;
  }
}
watch(() => selectedStudent.value?.student_id, load, { immediate: true });
async function save() {
  const id = selectedStudent.value?.student_id;
  if (!id) return;
  if (!model.type) {
    notify("Bitte wähle einen Typ der Arbeit aus.", "error");
    return;
  }
  if (!model.topic.trim()) {
    notify("Bitte trage ein Thema oder einen Wettbewerb ein.", "error");
    return;
  }
  if (
    !isContest.value &&
    model.grade !== "" &&
    (!Number.isInteger(Number(model.grade)) ||
      Number(model.grade) < 0 ||
      Number(model.grade) > 15)
  ) {
    notify("Die Note muss zwischen 0 und 15 liegen.", "error");
    return;
  }
  try {
    await run(
      "UPDATE students SET type_of_paper=$1,topic_of_paper=$2,description_of_paper=$3,grade_of_paper=$4,level_of_competition=$5 WHERE student_id=$6",
      [
        model.type,
        model.topic.trim(),
        model.description,
        model.grade === "" ? null : Number(model.grade),
        model.competition,
        id,
      ],
    );
    changed.value = false;
    notify("Fachwissenschaftliches Arbeiten gespeichert.");
  } catch (e) {
    notify(String(e), "error");
  }
}
</script>

<template>
  <div v-if="!selectedStudent" class="notice-card">
    <span class="notice-icon"><FileText :size="20" /></span>
    <div>
      <b>Wähle zuerst eine:n Schüler*in</b>
      <p>Die Angaben zur Arbeit werden der ausgewählten Person zugeordnet.</p>
    </div>
    <button class="button primary" @click="$router.push('/students')">
      Schüler*innen öffnen
    </button>
  </div>
  <template v-else>
    <div class="summary-strip">
      <div>
        <span class="summary-label">AUSGEWÄHLTE PERSON</span
        ><b>{{ selectedStudent.name }}</b>
      </div>
      <div>
        <span class="summary-label">ABITURJAHRGANG</span
        ><b>{{ selectedStudent.graduation_year || "—" }}</b>
      </div>
      <div class="summary-result">
        <span class="summary-label">ANFORDERUNGSFELD II</span
        ><b>{{
          isContest
            ? `Stufe ${awardLevel || "—"}`
            : model.grade
              ? `${model.grade} Punkte`
              : "Noch offen"
        }}</b>
      </div>
    </div>
    <section class="panel form-panel">
      <header class="panel-heading">
        <div>
          <h2>Angaben zur wissenschaftlichen Arbeit</h2>
          <p>
            Wähle die passende Arbeitsart – die erforderlichen Felder werden
            ergänzt.
          </p>
        </div>
      </header>
      <div class="form-grid research-grid">
        <label class="span-2"
          >Typ der Arbeit<select
            v-model.number="model.type"
            :disabled="busy"
            @change="changed = true"
          >
            <option :value="0">Bitte wählen…</option>
            <option v-for="t in types" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select></label
        ><label class="span-2"
          >{{
            model.type === 2
              ? "Fach"
              : model.type === 5
                ? "Wettbewerb"
                : "Thema"
          }}<input
            v-model="model.topic"
            :disabled="!model.type || busy"
            required
            :placeholder="
              model.type === 5 ? 'Wettbewerbsname' : 'Titel der Arbeit'
            "
            @input="changed = true" /></label
        ><label class="span-2"
          >Beschreibung<textarea
            v-model="model.description"
            rows="5"
            :disabled="!model.type || busy"
            placeholder="Kurze Beschreibung der Arbeit oder des Projekts…"
            @input="changed = true"
          />
        </label>
        <label v-if="!isContest" class="grade-field"
          >Note <span class="optional">0–15 Punkte</span
          ><input
            v-model="model.grade"
            type="number"
            min="0"
            max="15"
            step="1"
            :disabled="!model.type || busy"
            placeholder="Noch nicht bewertet"
            @input="changed = true"
        /></label>
        <template v-else
          ><label
            >Erreichte Leistungsstufe<select
              v-model="model.grade"
              :disabled="busy"
              @change="changed = true"
            >
              <option value="">Bitte wählen…</option>
              <option value="10">
                Teilnahme am Regionalwettbewerb (10 Punkte)
              </option>
              <option value="12">
                Preisträger*in im Regionalwettbewerb (12 Punkte)
              </option>
              <option value="15">
                Teilnahme am Landes- oder Bundeswettbewerb (15 Punkte)
              </option>
            </select></label
          ><label
            >Ergebnis / Wettbewerbsebene<input
              v-model="model.competition"
              :disabled="busy"
              placeholder="z. B. Landeswettbewerb"
              @input="changed = true" /></label
        ></template>
        <div class="span-2 form-footer">
          <span v-if="changed" class="unsaved-note"
            >Nicht gespeicherte Änderungen</span
          ><span v-else class="autosave"
            ><span class="status-dot"></span>Gespeichert</span
          ><button
            class="button primary"
            :disabled="busy || !changed"
            @click="save"
          >
            <Save :size="16" />Änderungen speichern
          </button>
        </div>
      </div>
    </section>
  </template>
</template>
