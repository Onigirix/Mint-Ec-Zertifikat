import { getDb } from './db-connection.js';

try {
  const db = await getDb();
  const rows = await db.select('SELECT theme_preference FROM settings WHERE id = 1');
  const preference = rows[0]?.theme_preference ?? 'system';
  document.body.dataset.theme = preference;
  document.documentElement.style.colorScheme = preference === 'system' ? 'light dark' : preference;
} catch (error) {
  console.error('Could not load theme preference:', error);
}
