import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import DashboardPage from './pages/DashboardPage.vue';
import StudentsPage from './pages/StudentsPage.vue';
import CompetencePage from './pages/CompetencePage.vue';
import ResearchPage from './pages/ResearchPage.vue';
import ActivitiesPage from './pages/ActivitiesPage.vue';
import ExportPage from './pages/ExportPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import InfoPage from './pages/InfoPage.vue';
import { initialize, notify } from './store';
import './style.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardPage, meta: { title: 'Übersicht', subtitle: 'Alles für den nächsten MINT-EC-Abschluss.' } },
    { path: '/students', component: StudentsPage, meta: { title: 'Schüler:innen', subtitle: 'Verwalte Schüler:innen und Abijahrgänge.' } },
    { path: '/competence', component: CompetencePage, meta: { title: 'Fachliche Kompetenz', subtitle: 'Erfasse Kurse und Leistungen für das Zertifikat.' } },
    { path: '/research', component: ResearchPage, meta: { title: 'Fachwissenschaftliches Arbeiten', subtitle: 'Dokumentiere Facharbeiten und Wettbewerbsbeiträge.' } },
    { path: '/activities', component: ActivitiesPage, meta: { title: 'MINT-Aktivitäten', subtitle: 'Verwalte Aktivitäten und erreichte Niveaus.' } },
    { path: '/export', component: ExportPage, meta: { title: 'PDF erstellen', subtitle: 'Prüfe den ausgewählten Schüler und erstelle das Zertifikat.' } },
    { path: '/settings', component: SettingsPage, meta: { title: 'Einstellungen', subtitle: 'Schulen, Unterschriften, Speicherort und Darstellung.' } },
    { path: '/info', component: InfoPage, meta: { title: 'Handbuch & Info', subtitle: 'Hilfe zum MINT-EC Zertifikat-Generator.' } },
  ],
});

initialize().then(() => {
  const app = createApp(App);
  app.config.errorHandler = error => {
    console.error('Mint-EC frontend error:', error);
    notify(error instanceof Error ? error.message : String(error), 'error');
  };
  app.use(router).mount('#app');
}).catch(error => {
  console.error('Mint-EC could not initialize:', error);
  const root = document.querySelector('#app');
  if (root) root.innerHTML = '<main class="startup-error"><h1>Mint-EC konnte nicht gestartet werden</h1><p>Die lokale Datenbank oder ihre Einstellungen konnten nicht geladen werden.</p></main>';
});
