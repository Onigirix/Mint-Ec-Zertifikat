import Database from '@tauri-apps/plugin-sql';
import { invoke } from '@tauri-apps/api/core';

let instance: Promise<Database> | undefined;
export function db(): Promise<Database> {
  return (instance ??= invoke<string>('get_database_url').then(url => Database.load(url)));
}
export async function rows<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  return (await db()).select<T[]>(sql, args);
}
export async function run(sql: string, args: unknown[] = []) {
  return (await db()).execute(sql, args);
}
export const invokeNative = invoke;
