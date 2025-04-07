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

        let (field_6_text, fachliche_kompetenz_level) =
            fachliche_kompetenz_text(student_id, student_name.clone()).await;

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

async fn fachliche_kompetenz_text(student_id: i32, student_name: String) -> (String, i32) {
    let get_grades_return = db::get_grades(student_id).await;
    match get_grades_return {
        Ok((subjects, grades)) => {
            let mut grade_averages: [f32; 4] = [0.0; 4];
            for i in 1..=4 {
                for j in 0..4 {
                    grade_averages[i] = grade_averages[i] + (grades[j + 4 * i] as f32);
                }
                grade_averages[i - 1] = grade_averages[i - 1] / 4.0
            }

            let comb0 = (grade_averages[0] + grade_averages[1]) / 2.0;
            let comb1 = (grade_averages[0] + grade_averages[1] + grade_averages[2]) / 3.0;
            let comb2 = (grade_averages[0] + grade_averages[1] + grade_averages[3]) / 3.0;
            let comb3 = (grade_averages[0] + grade_averages[2] + grade_averages[3]) / 3.0;
            let comb4 = (grade_averages[1] + grade_averages[2] + grade_averages[3]) / 3.0;

            let mut best_average = comb0;
            let mut best_combination = 0;

            if (comb1 > comb0) {
                best_average = comb1;
                best_combination = 1;
            }

            if comb2 > best_average {
                best_average = comb2;
                best_combination = 2;
            }
            if comb3 > best_average {
                best_average = comb3;
                best_combination = 3;
            }
            if comb4 > best_average {
                best_average = comb4;
                best_combination = 4;
            }

            let level = match best_average {
                x if x < 9.0 => 0,
                x if x < 11.0 => 1,
                x if x > 13.0 => 2,
                _ => 3,
            };

            let result = match best_combination {
                0 => String::from("{.?}"),
                1 => String::from(""),
                2 => String::from(""),
                3 => String::from(""),
                4 => String::from(""),
                _ => String::from("Errorcode: 69"),
            };

            (result, level)
        }
        Err(e) => {
            eprintln!("Error fetching students grades: {}", e);
            (
                String::from(format!("Error while fetching the grades: {}", e)),
                0,
            )
        }
    }
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
