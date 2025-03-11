use crate::AppState;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_state(state: State<'_, Mutex<AppState>>) -> Result<(i32, String), ()> {
    let state = state.lock().await;
    Ok((state.student_id, state.student_name.clone()))
}

#[tauri::command]
pub async fn get_student_id(state: State<'_, Mutex<AppState>>) -> Result<i32, ()> {
    let state = state.lock().await;
    Ok(state.student_id)
}

#[tauri::command]
pub async fn set_state(
    state: State<'_, Mutex<AppState>>,
    student_id: i32,
    student_name: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    state.student_id = student_id;
    state.student_name = student_name;

    Ok(())
}
