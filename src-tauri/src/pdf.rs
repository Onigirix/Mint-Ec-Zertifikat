use crate::{db, AppState};
use chrono::Datelike;
use chrono::NaiveDate;
use pdf_forms::Form;
use rfd::AsyncFileDialog;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn generate_pdf(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state = state.lock().await;
    let student_name = state.student_name.clone();
    let student_id = state.student_id;

    let spawn_file_dialog = async {
        let file_handle = AsyncFileDialog::new()
            .add_filter("PDF Dokument", &["pdf"])
            .set_file_name(format!("Mint-EC Zertifikat {}", student_name))
            .set_directory(db::get_default_file_path().await)
            .save_file()
            .await;
        if file_handle.is_none() {
            return None;
        }
        file_handle
    };

    let prepare_pdf = async {
        let mut form = Form::load("resources/template_v3_M.pdf").unwrap(); // M and L exist (M is font size 12 and L is font size 10 on the second page)
        let current_date = chrono::Utc::now();
        let settings = db::get_all_settings().await;
        let birthday = chrono::NaiveDate::parse_from_str(
            db::get_student_birthday(student_id).await.as_str(),
            "%Y-%m-%d",
        )
        .unwrap();
        let results = vec![
            form.set_text(0, format!("geboren am {}", birthday.format("%d.%m.%Y"))),
            form.set_text(1, format!("an der {}", settings[0])),
            form.set_text(2, String::from("Field 2")),
            form.set_text(3, format!("{} \n \n{}", settings[2], settings[4])),
            form.set_text(4, format!("{}\n \n{}", settings[3], settings[5])),
            form.set_text(
                5,
                format!(
                    "{} den {:02}.{:02}.{}",
                    settings[1],
                    current_date.day(),
                    current_date.month(),
                    current_date.year()
                ),
            ),
            form.set_text(6, String::from("Field 6")),
            form.set_text(7, String::from("Field 7")),
            form.set_text(8, student_name.clone()),
            form.set_text(9, String::from("Field 9")),
        ];

        for result in results {
            if let Err(e) = result {
                eprintln!("Error while filling the PDF: {}", e);
            }
        }
        form
    };

    let (path, mut form) = tokio::join!(spawn_file_dialog, prepare_pdf);
    if path.is_some() {
        db::change_default_file_path(String::from(path.clone().unwrap().path().to_str().unwrap()))
            .await;
        form.save(path.unwrap().path()).unwrap();
    }
    Ok(())
    //TODO: Add a success message (toast notification)
}
//text_8 = Vor und Nachname
//text_0 = Geburtsdatum
//text_1 = Schule
//text_2 = Gesamteinstufung
//text_3 = Funktionär 1
//text_4 = Funktionär 2
//text_5 = Ort und Datum
//text_6 = fachliche Kompetenz
//text_7 = fachwissenschaftliches arbeiten
//text_9 = zusätzliche Mint Aktivität
