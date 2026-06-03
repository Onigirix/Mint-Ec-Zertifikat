/**
 * Shared database connection module.
 * This module provides a single shared database connection across all JavaScript files,
 * preventing multiple connections from being created.
 */

const invoke = window.__TAURI__.core.invoke;
const Database = window.__TAURI__.sql;

let dbInstance = null;
let dbPath = null;

/**
 * Returns the shared database connection.
 * Creates a new connection on first call, reuses the existing one on subsequent calls.
 * @returns {Promise<Database>} The shared database instance
 */
export async function getDb() {
    if (!dbInstance) {
        // Load the connection URL verbatim from Rust (single source of truth for the
        // `sqlite:` scheme + path). Do NOT build `sqlite://${path}` here: on Windows the
        // resulting `sqlite://C:\...` breaks tauri-plugin-sql's path_mapper and points the
        // frontend at a different file than the sqlx backend / PDF generator use.
        const dbUrl = await invoke("get_database_url");
        dbInstance = await Database.load(dbUrl);
    }
    return dbInstance;
}

/**
 * Returns the database path.
 * @returns {Promise<string>} The database path
 */
export async function getDbPath() {
    if (!dbPath) {
        dbPath = await invoke("get_database_path");
    }
    return dbPath;
}

/**
 * Resets the database connection (useful for testing or reconnection scenarios).
 */
export function resetDbConnection() {
    dbInstance = null;
    dbPath = null;
}
