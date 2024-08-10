pub mod db;
use std::sync::Mutex;
use tauri::{Builder, Manager, WebviewWindowBuilder};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/*#[tauri::command] //FIXME: Find the WindowUrl class
async fn openAddSchülerPopup(handle: tauri::AppHandle) {
    let schüler_popup = WebviewWindowBuilder::new(&handle, "add-schüler", "add-schüler.html")
        .build()
        .unwrap();
}*/

#[derive(Default)]
struct AppState {
    first_name: String,
    last_name: String,
    full_name: String,
}

pub fn run() {
    db::setup_db();
    Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
