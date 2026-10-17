<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { rows, run } from '../db';
import { notify, selectedStudent } from '../store';
import { GraduationCap, Info } from 'lucide-vue-next';

const courses = [1,2,3,4,5];
const semesters = [1,2,3,4];
const labels = ['Erhöhtes Niveau 1','Erhöhtes Niveau 2','Grundkurs 1','Grundkurs 2','Weiteres Fach'];
const subject = ref<Record<number,string>>({});
const grade = ref<Record<number,Record<number,string>>>({});
const busy = ref(false);
const pendingSaves = new Map<string, Promise<void>>();
const averages = computed(()=>Object.fromEntries(courses.map(c=>{const vals=semesters.map(s=>grade.value[c]?.[s]??'');const entered=vals.filter(v=>v!==''&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=15).map(Number);const valid=vals.every(v=>v!==''&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=15);return[c,{value:entered.length?(entered.reduce((a,b)=>a+b,0)/entered.length):null,complete:valid,failed:entered.some(n=>n<5)}]})));
const certification = computed(()=>{
 const avg=averages.value; const valid=courses.map(c=>Boolean(avg[c]?.complete&&avg[c]?.value!==null&&Number(avg[c]!.value)>=9&&!avg[c]!.failed));
 if(courses.some(c=>subject.value[c]?.trim()&&!valid[c-1]))return {average:'—',level:'—'};
 const lk=[0,1,4],gk=[2,3],opts:number[]=[];
 for(let i=0;i<lk.length;i++){for(let j=i+1;j<lk.length;j++){if(valid[lk[i]]&&valid[lk[j]])opts.push((Number(avg[lk[i]+1]!.value)+Number(avg[lk[j]+1]!.value))/2);}if(valid[lk[i]]&&gk.every(k=>valid[k]))opts.push((Number(avg[lk[i]+1]!.value)+Number(avg[gk[0]+1]!.value)+Number(avg[gk[1]+1]!.value))/3);}
 const best=opts.length?Math.max(...opts):0;return {average:best?best.toFixed(2):'—',level:best>=13?'3':best>=11?'2':best>=9?'1':'—'};
});
async function load() { const id=selectedStudent.value?.student_id; if(!id)return;busy.value=true;try{const [s]=await rows<Record<string,unknown>>('SELECT * FROM students WHERE student_id=$1',[id]);if(!s)return;subject.value=Object.fromEntries(courses.map(c=>[c,String(s[`subject_${c}`]??'')]));grade.value=Object.fromEntries(courses.map(c=>[c,Object.fromEntries(semesters.map(m=>[m,String(s[`grade_${c}_${m}`]??'')]))]));}finally{busy.value=false;} }
watch(()=>selectedStudent.value?.student_id,load,{immediate:true});
function save(column:string,value:string){const id=selectedStudent.value?.student_id;if(!id)return Promise.resolve();const previous=pendingSaves.get(column)??Promise.resolve();const current=previous.catch(()=>{}).then(async()=>{await run(`UPDATE students SET ${column}=$1 WHERE student_id=$2`,[value===''?null:value,id]);});pendingSaves.set(column,current);current.then(()=>{if(pendingSaves.get(column)===current)pendingSaves.delete(column);},()=>{if(pendingSaves.get(column)===current)pendingSaves.delete(column);});return current;}
function gradeInput(c:number,s:number,e:Event){const el=e.target as HTMLInputElement;const v=el.value;if(v!==''&&(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>15)){el.setCustomValidity('Bitte eine ganze Punktzahl von 0 bis 15 eingeben.');el.reportValidity();return;}el.setCustomValidity('');grade.value[c]![s]=v;void save(`grade_${c}_${s}`,v).catch(e=>notify(String(e),'error'));}
function subjectInput(c:number,e:Event){const v=(e.target as HTMLInputElement).value;subject.value[c]=v;void save(`subject_${c}`,v).catch(e=>notify(String(e),'error'));}
</script>

<template>
 <div v-if="!selectedStudent" class="notice-card"><span class="notice-icon"><GraduationCap :size="20"/></span><div><b>Wähle zuerst eine:n Schüler*in</b><p>Die Kurse und Noten werden für die ausgewählte Person erfasst.</p></div><button class="button primary" @click="$router.push('/students')">Schüler*innen öffnen</button></div>
 <template v-else>
  <div class="summary-strip"><div><span class="summary-label">AUSGEWÄHLTE PERSON</span><b>{{selectedStudent.name}}</b></div><div><span class="summary-label">ABITURJAHRGANG</span><b>{{selectedStudent.graduation_year||'—'}}</b></div><div class="summary-result"><span class="summary-label">BESTER GÜLTIGER DURCHSCHNITT</span><b>{{certification.average}} <small>Punkte</small></b></div><div class="level-badge" :class="'level-'+certification.level">Stufe {{certification.level}}</div></div>
  <section class="panel"><header class="panel-heading"><div><h2>Leistungen der vier Halbjahre</h2><p>Noten werden beim Eingeben gespeichert. Ganze Punktzahlen von 0 bis 15.</p></div><span v-if="busy" class="saving-label">Wird geladen…</span><span v-else class="autosave"><span class="status-dot"></span>Automatisch gespeichert</span></header>
   <div class="table-scroll"><table class="data-table grade-table"><thead><tr><th>Kursart</th><th>Fach</th><th>1. Halbjahr</th><th>2. Halbjahr</th><th>3. Halbjahr</th><th>4. Halbjahr</th><th>Durchschnitt</th></tr></thead><tbody><tr v-for="(c,index) in courses" :key="c"><td><span class="course-label">{{labels[index]}}</span></td><td><input class="table-input subject-input" :value="subject[c]" :aria-label="`${labels[index]} Fach`" placeholder="Fachname" :disabled="busy" @input="subjectInput(c,$event)"/></td><td v-for="s in semesters" :key="s"><input class="table-input grade-input" type="number" min="0" max="15" step="1" inputmode="numeric" :value="grade[c]?.[s]" :aria-label="`${labels[index]}, ${s}. Halbjahr`" placeholder="–" :disabled="busy" @input="gradeInput(c,s,$event)"/></td><td><span class="avg-value" :class="{'avg-invalid':!averages[c]?.complete,'avg-fail':averages[c]?.failed}">{{averages[c]?.value===null?'—':averages[c]?.value.toFixed(2)}}</span></td></tr></tbody></table></div>
   <div class="grade-explainer"><Info :size="16"/><span>Ein Kurs ist gültig, wenn alle vier Halbjahre eingetragen sind, der Durchschnitt mindestens 9 Punkte beträgt und kein Halbjahr unter 5 Punkten liegt.</span></div>
  </section>
 </template>
</template>
