<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, Award, BookOpen, CheckCircle2, FileBadge, GraduationCap, ListChecks, Users } from 'lucide-vue-next';
import { rows } from '../db';
import { selectedStudent, students } from '../store';
import type { School } from '../types';
const router = useRouter();
const school = ref<School | null>(null);
const activities = ref(0);
const levels = ref<{ name: string; level: string }[]>([]);
const greeting = computed(() => {
  const hour = new Date().getHours();
  return hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
});
watch(() => selectedStudent.value?.student_id, async id => {
  school.value = null;
  activities.value = 0;
  if (!id) return;
  const [schools, acts] = await Promise.all([
    rows<School>('SELECT * FROM schools WHERE school_id=$1', [selectedStudent.value?.school_id]),
    rows<{ total: number }>('SELECT COUNT(*) AS total FROM student_additional_mint_activities WHERE student_id=$1', [id]),
  ]);
  school.value = schools[0] ?? null;
  activities.value = Number(acts[0]?.total ?? 0);
}, { immediate: true });
const shortcuts = [
  { to: '/students', label: 'Schüler:innen verwalten', description: 'Personen, Jahrgänge und Schulen', icon: Users, tint: 'blue' },
  { to: '/competence', label: 'Noten eintragen', description: 'Fachliche Kompetenz ergänzen', icon: GraduationCap, tint: 'violet' },
  { to: '/activities', label: 'MINT-Aktivitäten', description: 'Wettbewerbe und Leistungen', icon: ListChecks, tint: 'green' },
  { to: '/export', label: 'Zertifikat erstellen', description: 'PDF prüfen und speichern', icon: FileBadge, tint: 'amber' },
];
</script>

<template>
  <section class="welcome-card"><div class="welcome-copy"><span class="welcome-kicker"><span class="status-dot"></span>Dein Zertifikatsarbeitsplatz</span><h2>{{ greeting }}<template v-if="selectedStudent">, {{ selectedStudent.name.split(' ')[0] }}</template> 👋</h2><p>Alle MINT-EC-Daten an einem Ort – übersichtlich, sicher und bereit fürs Zertifikat.</p><div class="welcome-actions"><button class="button white" @click="router.push(selectedStudent ? '/export' : '/students')">{{ selectedStudent ? 'Weiterarbeiten' : 'Schüler:innen auswählen' }}<ArrowRight :size="16"/></button><span v-if="selectedStudent" class="welcome-school">{{ school?.school_name ?? selectedStudent.school_name ?? 'Schule zugeordnet' }} · Abitur {{ selectedStudent.graduation_year ?? '—' }}</span></div></div><div class="welcome-art"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-certificate"><Award :size="38"/><span>MINT<br/>CERTIFICATE</span><i></i></div><div class="art-sparkle sparkle-one">✦</div><div class="art-sparkle sparkle-two">✧</div></div></section>
  <div class="stat-grid"><article class="stat-card"><span class="stat-icon blue"><Users :size="19"/></span><div><p>Schüler:innen</p><b>{{ students.length }}</b><small>in der Datenbank</small></div></article><article class="stat-card"><span class="stat-icon green"><CheckCircle2 :size="19"/></span><div><p>Ausgewählt</p><b class="stat-current">{{ selectedStudent?.name ?? '—' }}</b><small>{{ selectedStudent ? `Abijahrgang ${selectedStudent.graduation_year ?? 'offen'}` : 'Wähle eine Person zum Starten' }}</small></div></article><article class="stat-card"><span class="stat-icon amber"><ListChecks :size="19"/></span><div><p>Erfasste Aktivitäten</p><b>{{ selectedStudent ? activities : '—' }}</b><small>{{ selectedStudent ? 'für den ausgewählten Schüler' : 'Schüler:in auswählen' }}</small></div></article></div>
  <div class="section-heading"><div><h2>Schnellzugriff</h2><p>Direkt zum nächsten Arbeitsschritt</p></div><button class="text-button" @click="router.push('/students')">Alle Schüler:innen <ArrowRight :size="15"/></button></div>
  <div class="shortcut-grid"><button v-for="item in shortcuts" :key="item.to" class="shortcut-card" @click="router.push(item.to)"><span class="stat-icon" :class="item.tint"><component :is="item.icon" :size="19"/></span><span class="shortcut-copy"><b>{{ item.label }}</b><small>{{ item.description }}</small></span><ArrowRight :size="17" class="shortcut-arrow"/></button></div>
  <div class="dashboard-note"><BookOpen :size="17"/><span><b>Neu hier?</b> Beginne mit der Schüler:innenliste und fülle anschließend die Zertifikatsbereiche aus.</span><button class="text-button" @click="router.push('/info')">Handbuch öffnen <ArrowRight :size="14"/></button></div>
</template>
