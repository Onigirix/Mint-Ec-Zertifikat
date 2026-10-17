<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { ask } from '@tauri-apps/plugin-dialog';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ChevronRight, FileBadge, FileText, GraduationCap, ListChecks, Search, Settings, Users, X } from 'lucide-vue-next';
import { notify, refreshStudents, selectStudent, selectedStudent, students, toast } from './store';
import type { Student, School } from './types';
import { rows, run } from './db';

const route = useRoute();
const router = useRouter();
const title = computed(() => String(route.meta.title ?? 'MINT-EC'));
const subtitle = computed(() => String(route.meta.subtitle ?? ''));
const nav = [
  { to: '/students', text: 'Schüler*innen', icon: Users },
  { to: '/competence', text: 'Fachliche Kompetenz', icon: GraduationCap },
  { to: '/research', text: 'Fachwissenschaftliches Arbeiten', icon: FileText },
  { to: '/activities', text: 'Zusätzliche MINT-Aktivitäten', icon: ListChecks },
  { to: '/export', text: 'PDF erstellen', icon: FileBadge },
];
const query = ref('');
const searchFocused = ref(false);
const suggestions = computed(() => searchFocused.value && query.value.trim() ? students.value.filter(s => s.name.toLocaleLowerCase('de').includes(query.value.toLocaleLowerCase('de'))).slice(0, 7) : []);
const showCreate = ref(false);
const schools = ref<School[]>([]);
const studentForm = ref({ first: '', last: '', birthday: '', year: new Date().getFullYear() + 2, school_id: 1 });
const busy = ref(false);
const openCreate = () => { showCreate.value = true; };
onMounted(() => window.addEventListener('open-create-student', openCreate));
onUnmounted(() => window.removeEventListener('open-create-student', openCreate));
watch(selectedStudent, value => query.value = value?.name ?? '', { immediate: true });
onMounted(async () => {
  schools.value = await rows<School>('SELECT school_id, school_name FROM schools ORDER BY school_id');
  try {
    const update = await check();
    if (update && await ask(`Update auf ${update.version} ist verfügbar.\n\n${update.body ?? ''}\n\nJetzt herunterladen und installieren?`, { title: 'Neues Update', kind: 'info', okLabel: 'Updaten', cancelLabel: 'Später' })) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) { console.error('Update-Prüfung fehlgeschlagen:', error); }
});
async function choose(student: Student) {
  await selectStudent(student);
  query.value = student.name;
  searchFocused.value = false;
  (document.activeElement as HTMLElement | null)?.blur();
}
function finishSearch() {
  searchFocused.value = false;
  query.value = selectedStudent.value?.name ?? '';
}
async function selectFirstSuggestion() {
  const firstSuggestion = suggestions.value[0];
  if (!firstSuggestion) return;
  await choose(firstSuggestion);
  (document.activeElement as HTMLElement | null)?.blur();
}
async function createStudent() {
  if (!studentForm.value.first.trim() || !studentForm.value.last.trim()) return;
  if (studentForm.value.year < 2000 || studentForm.value.year > 2100) {
    if (!await ask(`Der Abiturjahrgang ${studentForm.value.year} liegt außerhalb des üblichen Bereichs (2000–2100). Trotzdem speichern?`, { title: 'Jahrgang prüfen', kind: 'warning' })) return;
  }
  if (studentForm.value.birthday) {
    const age = Math.floor((Date.now() - new Date(studentForm.value.birthday).getTime()) / (365.25 * 86400000));
    if (age < 0 || age > 25) {
      if (!await ask(`Das Alter (${age} Jahre) liegt außerhalb des üblichen Bereichs (0–25). Trotzdem speichern?`, { title: 'Geburtsdatum prüfen', kind: 'warning' })) return;
    }
  }
  busy.value = true;
  try {
    const name = `${studentForm.value.first.trim()} ${studentForm.value.last.trim()}`;
    const result = await run('INSERT INTO students (name, birthday, graduation_year, school_id) VALUES ($1, $2, $3, $4)', [name, studentForm.value.birthday || null, studentForm.value.year, studentForm.value.school_id]);
    await refreshStudents();
    const student = students.value.find(s => s.student_id === result.lastInsertId);
    if (student) await choose(student);
    showCreate.value = false;
    studentForm.value = { first: '', last: '', birthday: '', year: new Date().getFullYear() + 2, school_id: schools.value[0]?.school_id ?? 1 };
  } catch (e) { notify(String(e), 'error'); }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="app-frame">
    <aside class="sidebar">
      <button class="brand" @click="router.push('/')"><img class="brand-logo" src="/mint-ec-logo.png" alt="MINT-EC Logo" /><span><b>MINT-EC</b></span></button>
      <nav class="nav-list" aria-label="Hauptnavigation">
        <RouterLink v-for="item in [...nav, { to: '/settings', text: 'Einstellungen', icon: Settings }]" :key="item.to" :to="item.to" class="nav-link"><component :is="item.icon" :size="18" :stroke-width="1.8"/><span>{{ item.text }}</span></RouterLink>
      </nav>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div class="breadcrumbs"><span>Mint-EC</span><ChevronRight :size="15"/><b>{{ title }}</b></div>
        <div class="top-actions">
          <div class="student-picker">
            <Search :size="17"/><input v-model="query" aria-label="Schüler auswählen" placeholder="Schüler*in auswählen…" @focus="searchFocused = true; query = ''" @blur="finishSearch" @keydown.enter.prevent="selectFirstSuggestion" @keydown.esc="finishSearch" />
            <button class="icon-button add-mini" title="Schüler*in hinzufügen" @click="showCreate = true">+</button>
            <div v-if="suggestions.length" class="suggestion-menu">
              <button v-for="student in suggestions" :key="student.student_id" @mousedown.prevent="choose(student)"><span><b>{{ student.name }}</b><small>Abitur {{ student.graduation_year || '—' }}</small></span></button>
            </div>
          </div>
        </div>
      </header>
      <main class="page-wrap">
        <div class="page-heading"><div><p class="eyebrow">MINT-EC ZERTIFIKAT</p><h1>{{ title }}</h1><p class="subtitle">{{ subtitle }}</p></div></div>
        <RouterView />
      </main>
    </section>
    <Transition name="toast"><div v-if="toast" class="toast-message" :class="toast.type"><span>{{ toast.type === 'error' ? '!' : '✓' }}</span>{{ toast.message }}</div></Transition>
    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-student-title"><header class="modal-header"><div><p class="eyebrow">SCHÜLERDATEN</p><h2 id="new-student-title">Schüler*in hinzufügen</h2></div><button class="icon-button" aria-label="Schließen" @click="showCreate = false"><X :size="18"/></button></header><form class="form-grid" @submit.prevent="createStudent"><label>Vorname<input v-model.trim="studentForm.first" required autofocus/></label><label>Nachname<input v-model.trim="studentForm.last" required/></label><label>Geburtsdatum<input v-model="studentForm.birthday" type="date" required/></label><label>Abiturjahrgang<input v-model.number="studentForm.year" type="number" min="1900" max="2200" required/></label><label class="span-2">Schule<select v-model.number="studentForm.school_id" required><option v-for="school in schools" :key="school.school_id" :value="school.school_id">{{ school.school_name }}</option></select></label><footer class="modal-actions span-2"><button type="button" class="button secondary" @click="showCreate = false">Abbrechen</button><button class="button primary" :disabled="busy">{{ busy ? 'Wird gespeichert…' : 'Schüler*in erstellen' }}</button></footer></form></section></div>
  </div>
</template>
