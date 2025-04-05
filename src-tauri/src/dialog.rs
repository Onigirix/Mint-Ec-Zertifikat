use crate::db;
use rfd::AsyncFileDialog;

#[tauri::command]
pub async fn folder_select() -> Result<String, String> {
    let file_handle = AsyncFileDialog::new()
        .set_directory(db::get_default_file_path().await)
        .pick_folder()
        .await;
    if file_handle.is_none() {
        return Err("No folder selected".to_string());
    }
    let path = file_handle.unwrap().path().display().to_string();
    Ok(path)
}
