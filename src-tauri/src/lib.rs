pub mod db;
pub mod pdf;
use tauri::{Builder, Manager};
use tokio::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    student_name: String,
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
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(prevent_default())
        .invoke_handler(tauri::generate_handler![
            pdf::generate_pdf,
            db::add_student,
            //change settings
            db::change_school_name,
            db::change_school_location,
            db::change_school_functionary_1,
            db::change_school_functionary_2,
            db::change_school_functionary_1_position,
            db::change_school_functionary_2_position,
            //read settings
            db::get_school_name,
            db::get_school_location,
            db::get_school_functionary_1,
            db::get_school_functionary_2,
            db::get_school_functionary_1_position,
            db::get_school_functionary_2_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(debug_assertions)]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    use tauri_plugin_prevent_default::Flags;

    tauri_plugin_prevent_default::Builder::new()
        .with_flags(Flags::all().difference(Flags::DEV_TOOLS | Flags::RELOAD))
        .general_autofill(false)
        .password_autosave(false)
        .build()
}

#[cfg(not(debug_assertions))]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::Builder::new()
        // Whether general form information should be saved and autofilled.
        // Defaults to `true`.
        .general_autofill(false)
        // Whether password information should be autosaved.
        // Defaults to `false`.
        .password_autosave(false)
        .build()
}
