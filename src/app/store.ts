import { computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { rows } from './db';
import type { Student } from './types';

export const students = ref<Student[]>([]);
export const selectedStudent = ref<Student | null>(null);
export const theme = ref('system');
export const toast = ref<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
export const selectedName = computed(() => selectedStudent.value?.name ?? 'Kein Schüler ausgewählt');
let toastTimer: number | undefined;
export function notify(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { message, type };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), 3600);
}
export async function refreshStudents() {
  students.value = await rows<Student>(`SELECT s.student_id, s.name, s.birthday, s.graduation_year, s.school_id, c.school_name
    FROM students s LEFT JOIN schools c ON c.school_id=s.school_id`);
}
export async function selectStudent(student: Student | null) {
  selectedStudent.value = student;
  const id = student?.student_id ?? 0;
  await invoke('set_state', { studentId: id, studentName: student?.name ?? '' });
  if (student) localStorage.setItem('mint-ec-selected-student', String(id));
  else localStorage.removeItem('mint-ec-selected-student');
}
export async function initialize() {
  await refreshStudents();
  const stored = Number(localStorage.getItem('mint-ec-selected-student') || 0);
  const student = students.value.find(item => item.student_id === stored) ?? null;
  await selectStudent(student);
  const result = await rows<{ theme_preference?: string }>('SELECT theme_preference FROM settings WHERE id=1');
  theme.value = result[0]?.theme_preference ?? 'system';
  applyTheme();
}
export function applyTheme() {
  document.documentElement.dataset.theme = theme.value;
  document.documentElement.style.colorScheme = theme.value === 'system' ? 'light dark' : theme.value;
}
