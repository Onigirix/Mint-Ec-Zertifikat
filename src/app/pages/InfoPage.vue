<script setup lang="ts">
import { ref } from 'vue';
import { BookOpen, ExternalLink, Heart, Info, RefreshCw, Sparkles, Users } from 'lucide-vue-next';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';
import { notify } from '../store';
const checking=ref(false);const showManual=ref(false);
async function checkUpdates(){checking.value=true;try{const update=await check();if(!update){notify('Du verwendest die aktuelle Version.','info');return;}if(await ask(`Update auf ${update.version} ist verfügbar.\n\n${update.body??''}\n\nJetzt herunterladen und installieren?`,{title:'Neues Update',kind:'info',okLabel:'Updaten',cancelLabel:'Später'})){await update.downloadAndInstall();await relaunch();}}catch(e){notify(`Update konnte nicht geprüft werden: ${String(e)}`,'error');}finally{checking.value=false;}}
</script>

<template>
 <div class="info-grid"><section class="panel about-card"><span class="about-mark"><Sparkles :size="26"/></span><p class="eyebrow">MINT-EC ZERTIFIKAT</p><h2>Besondere MINT-Leistungen sichtbar machen.</h2><p>Mint-EC unterstützt Schulen bei der Erfassung und Zertifizierung besonderer Leistungen in Mathematik, Informatik, Naturwissenschaften und Technik. Schülerdaten bleiben lokal auf diesem Gerät gespeichert.</p><div class="about-details"><div><span>Frontend</span><b>David Gallas & Viola Kraut</b></div><div><span>Backend</span><b>Arved Lieker</b></div><div><span>Version</span><b>Mint-EC Desktop</b></div></div><div class="about-actions"><button class="button primary" @click="showManual=!showManual"><BookOpen :size="16"/>{{showManual?'Handbuch schließen':'Handbuch öffnen'}}</button><button class="button secondary" :disabled="checking" @click="checkUpdates"><RefreshCw :size="16" :class="{spin:checking}"/>{{checking?'Wird geprüft…':'Nach Updates suchen'}}</button></div></section><section class="panel help-card"><span class="help-mark"><Info :size="18"/></span><h2>So funktioniert es</h2><ol><li>Schüler:in auswählen oder neu anlegen.</li><li>Noten, Arbeit und MINT-Aktivitäten ergänzen.</li><li>Das Zertifikat im PDF-Bereich erstellen.</li></ol><p class="beta-note"><Heart :size="15"/>Dies ist eine Beta-Version. Feedback: <a href="mailto:mintec.feedback@gmail.com">mintec.feedback@gmail.com</a></p></section></div>
 <section v-if="showManual" class="panel manual-panel"><header class="panel-heading"><div><h2><BookOpen :size="19"/>Handbuch</h2><p>Die mitgelieferte Bedienungsanleitung.</p></div><a class="text-button" href="/assets/Manual.pdf" target="_blank" rel="noreferrer">In neuem Tab öffnen <ExternalLink :size="15"/></a></header><iframe title="Mint-EC Handbuch" src="/assets/Manual.pdf" class="manual-frame"></iframe></section>
 <div class="contributors-card"><Users :size="18"/><span>Mit Dank an alle, die dieses Projekt möglich machen.</span><b>Mint-EC</b></div>
</template>
