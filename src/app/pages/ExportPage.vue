<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { FileBadge, LoaderCircle } from "lucide-vue-next";
import { rows } from "../db";
import { notify, selectedStudent } from "../store";
import type { School } from "../types";
const school = ref<School | null>(null);
const activityCount = ref(0);
const gradeCount = ref(0);
const generating = ref(false);
const requirementPreview = ref<
  { name: string; level: number; missing: string }[]
>([]);
const initial = computed(
  () =>
    selectedStudent.value?.name
      .split(" ")
      .map((v) => v[0])
      .slice(0, 2)
      .join("") ?? "–",
);
watch(
  () => selectedStudent.value?.student_id,
  async (id) => {
    school.value = null;
    activityCount.value = 0;
    gradeCount.value = 0;
    requirementPreview.value = [];
    if (!id) return;
    const [s, a, g, achievements] = await Promise.all([
      rows<School>("SELECT * FROM schools WHERE school_id=$1", [
        selectedStudent.value?.school_id,
      ]),
      rows<{ total: number }>(
        "SELECT COUNT(*) AS total FROM student_additional_mint_activities WHERE student_id=$1",
        [id],
      ),
      rows<Record<string, unknown>>(
        "SELECT * FROM students WHERE student_id=$1",
        [id],
      ),
      rows<{ sek: number; level: number }>(
        "SELECT a.sek, s.level FROM student_additional_mint_activities s JOIN additional_mint_activities a ON a.additional_mint_activity_id=s.additional_mint_activity_id WHERE s.student_id=$1",
        [id],
      ),
    ]);
    school.value = s[0] ?? null;
    activityCount.value = Number(a[0]?.total ?? 0);
    const row = g[0];
    const courseAverages = Array.from({ length: 5 }, (_, i) => {
      const values = Array.from(
        { length: 4 },
        (_, j) => row?.[`grade_${i + 1}_${j + 1}`],
      );
      const entered = values
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map(Number);
      const complete = entered.length === 4 && entered.every(Number.isInteger);
      return {
        average: complete
          ? entered.reduce((sum, value) => sum + value, 0) / 4
          : 0,
        valid: Boolean(
          row?.[`subject_${i + 1}`] &&
          complete &&
          entered.every((value) => value >= 5),
        ),
      };
    });
    const valid = courseAverages.map(
      (course) => course.valid && course.average >= 9,
    );
    gradeCount.value = row
      ? Array.from(
          { length: 5 },
          (_, i) =>
            Array.from(
              { length: 4 },
              (_, j) => row[`grade_${i + 1}_${j + 1}`],
            ).filter((v) => v !== null && v !== undefined && v !== "").length,
        ).reduce((x, y) => x + y, 0)
      : 0;
    const options: number[] = [];
    const lk = [0, 1, 4],
      gk = [2, 3];
    for (let i = 0; i < lk.length; i++) {
      for (let j = i + 1; j < lk.length; j++)
        if (valid[lk[i]] && valid[lk[j]])
          options.push(
            (courseAverages[lk[i]].average + courseAverages[lk[j]].average) / 2,
          );
      if (valid[lk[i]] && gk.every((index) => valid[index]))
        options.push(
          (courseAverages[lk[i]].average +
            courseAverages[gk[0]].average +
            courseAverages[gk[1]].average) /
            3,
        );
    }
    const bestCompetenceAverage = options.length ? Math.max(...options) : 0;
    const competenceLevel =
      bestCompetenceAverage < 9
        ? 0
        : bestCompetenceAverage < 11
          ? 1
          : bestCompetenceAverage < 13
            ? 2
            : 3;
    const researchGrade = Number(row?.grade_of_paper ?? 0);
    const researchLevel =
      Number(row?.type_of_paper ?? 0) === 0
        ? 0
        : researchGrade < 9
          ? 0
          : researchGrade < 11
            ? 1
            : researchGrade < 13
              ? 2
              : 3;
    const sek1Points = achievements
      .filter((item) => item.sek === 1)
      .reduce((sum, item) => sum + item.level * 5, 0);
    const sek2 = achievements.filter((item) => item.sek === 2);
    const sek2Points = sek2.reduce((sum, item) => sum + item.level * 5, 0);
    const sek2Advanced = sek2.reduce(
      (sum, item) => sum + (item.level === 2 ? 1 : item.level === 3 ? 2 : 0),
      0,
    );
    const activityLevel =
      sek1Points + sek2Points >= 80 && sek2Advanced >= 2 && sek2Points >= 40
        ? 3
        : sek1Points + sek2Points >= 60 && sek2Advanced >= 1 && sek2Points >= 30
          ? 2
          : sek1Points + sek2Points >= 40 && sek2Points >= 20
            ? 1
            : 0;
    requirementPreview.value = [
      {
        name: "Fachliche Kompetenz",
        level: competenceLevel,
        missing:
          competenceLevel >= 3
            ? "Keine höhere Stufe vorgesehen."
            : `Für Stufe ${competenceLevel + 1}: gültige Kurse mit vollständigen Halbjahresnoten und mindestens ${competenceLevel === 0 ? "9" : competenceLevel === 1 ? "11" : "13"} Punkten Durchschnitt erfassen.`,
      },
      {
        name: "Fachwissenschaftliches Arbeiten",
        level: researchLevel,
        missing:
          researchLevel >= 3
            ? "Keine höhere Stufe vorgesehen."
            : `Für Stufe ${researchLevel + 1}: eine gültige Arbeit mit mindestens ${researchLevel === 0 ? "9" : researchLevel === 1 ? "11" : "13"} Punkten bewerten.`,
      },
      {
        name: "Zusätzliche MINT-Aktivitäten",
        level: activityLevel,
        missing:
          activityLevel >= 3
            ? "Keine höhere Stufe vorgesehen."
            : `Für Stufe ${activityLevel + 1}: weitere Wettbewerbe und erreichte Stufen erfassen (mindestens ${activityLevel === 0 ? "40" : "60"} Gesamtpunkte).`,
      },
    ];
  },
  { immediate: true },
);
async function generate() {
  if (!selectedStudent.value) return;
  generating.value = true;
  try {
    const result = await invoke<boolean>("generate_pdf");
    if (result) notify("Das Zertifikat wurde erfolgreich als PDF gespeichert.");
  } catch (e) {
    notify(`PDF-Generierung fehlgeschlagen: ${String(e)}`, "error");
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <div v-if="!selectedStudent" class="notice-card">
    <span class="notice-icon">
      <FileBadge :size="20" />
    </span>
    <div>
      <b>Wähle zuerst eine:n Schüler*in</b>
      <p>
        Das Zertifikat wird mit den Daten und der Schule dieser Person erstellt.
      </p>
    </div>
    <button class="button primary" @click="$router.push('/students')">
      Schüler*innen öffnen
    </button>
  </div>
  <template v-else>
    <div class="export-layout">
      <section class="panel certificate-preview">
        <header class="panel-heading">
          <div>
            <h2>Zertifikatsstufen</h2>
            <p>Die aktuell erreichte Stufe in jedem Anforderungsfeld.</p>
          </div>
        </header>
        <div class="level-boxes">
          <div
            v-for="item in requirementPreview"
            :key="item.name"
            class="level-box"
          >
            <span>{{ item.name }}</span
            ><b>Stufe {{ item.level }}</b>
          </div>
        </div>
      </section>
      <aside class="export-aside">
        <button
          class="button primary export-button"
          :disabled="generating"
          @click="generate"
        >
          <LoaderCircle v-if="generating" class="spin" :size="17" />
          <FileBadge v-else :size="17" />{{
            generating ? "PDF wird erstellt…" : "PDF erstellen"
          }}
        </button>
      </aside>
    </div>
  </template>
</template>
