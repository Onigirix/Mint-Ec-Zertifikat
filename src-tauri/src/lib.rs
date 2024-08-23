pub mod db;
pub mod pdf;
use std::sync::Mutex;
use tauri::{Builder, Manager};

#[derive(Default)]
struct AppState {
    first_name: String,
    last_name: String,
    student_id: i32,
}

pub fn run() {
    db::setup_db();
    Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![pdf::generate_pdf])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
