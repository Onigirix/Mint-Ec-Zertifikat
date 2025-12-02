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
            // Get app data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Get resource directory (for migration from old location)
            let resource_dir = app.path().resource_dir().ok();

            // Setup database with correct paths
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
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
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
    use tauri_plugin_prevent_default::Flags;

    // start the builder with the common flags
    let mut builder = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS | Flags::RELOAD));

    #[cfg(target_os = "windows")]
    {
        builder = builder.platform(PlatformOptions {
            general_autofill: false,
            password_autosave: false,
        });
    }

    builder.build()
}

#[cfg(not(debug_assertions))]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;

    let mut builder = tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS));

    #[cfg(target_os = "windows")]
    {
        builder = builder.platform(PlatformOptions {
            general_autofill: false,
            password_autosave: false,
        });
    }

    builder.build()
}
