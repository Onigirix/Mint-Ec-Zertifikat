pub mod db;
pub mod dialog;
pub mod pdf;
pub mod pdf_lib;
pub mod pdf_utils;
pub mod state;
use tauri::{Builder, Manager};
use tauri_plugin_prevent_default;
use tokio::sync::Mutex;

#[cfg(target_os = "windows")]
use tauri_plugin_prevent_default::PlatformOptions;

#[derive(Default)]
pub struct AppState {
    student_name: String,
    student_id: i32,
}

#[tauri::command]
fn get_database_path() -> String {
    db::get_database_path().to_string()
}

pub fn run() {
    Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            let resource_dir = app.path().resource_dir().ok();

            db::setup_db(app_data_dir, resource_dir);

            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(prevent_default())
        .invoke_handler(tauri::generate_handler![
            pdf::generate_pdf,
            state::get_state,
            state::set_state,
            state::get_student_id,
            dialog::folder_select,
            get_database_path
        ])
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { .. } => {
                if window.label() == "main-window" {
                    window.app_handle().exit(0);
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(debug_assertions)]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::debug()
}

#[cfg(not(debug_assertions))]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;

    let mut builder = tauri_plugin_prevent_default::Builder::new().with_flags(Flags::all());

    #[cfg(target_os = "windows")]
    {
        use tauri_plugin_prevent_default::PlatformOptions;
        builder = tauri_plugin_prevent_default::Builder::new().platform(
            PlatformOptions::new()
                .general_autofill(false)
                .password_autosave(false)
                .browser_accelerator_keys(false)
                .default_context_menus(false)
                .default_script_dialogs(false),
        );
    }

    builder.build()
}
