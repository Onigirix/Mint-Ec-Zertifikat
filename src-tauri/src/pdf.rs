use std::result;

use crate::{db, AppState};
use chrono::format;
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

        let (field_7_text, fachwissenschaftliches_level) =
            fachwissenschaftliches_arbeiten_text(student_id, student_name.clone()).await;

        let (field_9_text, zusätzliche_mint_aktivität_level) =
            zusätzliche_mint_aktivität_text(student_id, student_name.clone()).await;

        let average_level: f32 = (fachliche_kompetenz_level
            + fachwissenschaftliches_level
            + zusätzliche_mint_aktivität_level) as f32
            / 3.0 as f32;

        let field_2_text = match average_level {
            x if x < 1.0 => String::from(
                "Die Durchschnittsnote liegt unter 1.0, bitte pr\u{00fc}fen sie Ihre Eingabe.",
            ),
            x if x < 1.5 => String::from("Mit Erfolg"),
            x if x < 2.5 => String::from("Mit besonderem Erfolg"),
            _ => String::from("Mit Auszeichnung"),
        };

        let results = vec![
            form.set_text(0, format!("geboren am {}", birthday.format("%d.%m.%Y"))),
            form.set_text(1, format!("{}", settings[0])),
            form.set_text(2, field_2_text),
            form.set_text(3, format!("{} \n\n{}", settings[2], settings[4])),
            form.set_text(4, format!("{}\n\n{}", settings[3], settings[5])),
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
            form.set_text(6, field_6_text),
            form.set_text(7, field_7_text),
            form.set_text(8, student_name.clone()),
            form.set_text(9, field_9_text),
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
        let path_string = String::from(path.clone().unwrap().path().to_str().unwrap());
        let pos = path_string.rfind("\\").unwrap();
        db::change_default_file_path(String::from(&path_string[..pos])).await;
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
                    grade_averages[i - 1] =
                        grade_averages[i - 1] + (grades[(i - 1) * 4 + j] as f32);
                }
                grade_averages[i - 1] = grade_averages[i - 1] / 4.0;
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
                0 => String::from(format!(
                        "{} hat zwei F\u{00e4}cher auf erh\u{00f6}htem Niveau absolviert:\n{}\n{}\nDie Durchschnittsnote beträgt {} Punkte.",
                        student_name, subjects[0], subjects[1], best_average
                    )),
                1 => String::from(format!(
                    "{} hat die F\u{00e4}cher {} und {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[1], subjects[2], best_average)),
                2 => String::from(format!(
                    "{} hat die F\u{00e4}cher {} und {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[1], subjects[3], best_average)),
                3 => String::from(format!(
                    "{} hat {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} und {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[2], subjects[3], best_average)),
                4 => String::from(format!(
                    "{} hat {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} und {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[1], subjects[2], subjects[3], best_average)),
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

async fn fachwissenschaftliches_arbeiten_text(
    student_id: i32,
    student_name: String,
) -> (String, i32) {
    let (type_of_paper, topics, grade) = db::get_fachwissenschaftliches_arbeiten(student_id).await;
    let result_string = match type_of_paper {
        0 => String::from("Kein Eintrag im Beiech Fachwissenschaftliches Arbeiten"),
        1 => String::from(format!(
            "{} hat eine Facharbeit geschrieben. \nThema: {} \n{}\nDie Facharbeite wurde mit {} Punkten bewertet.",
            student_name, topics[0], topics[1], grade
        )),
        2 => String::from(format!("{} hat das wissenschaftspropädeutische Fach {} belegt. \nEs wurden {} Punkte erreicht.", student_name, topics[0], grade)),
        3 => String::from(format!("{} hat eine besondere Lernleistung erbracht. \nThema: {} \n{} \nDie besondere Lernleistung wurde mit {} Punkten bewertet.", student_name, topics[0], topics[1], grade)),
        4 => String::from(format!("{} hat an Jugend Forscht mit dem Projekt \"{}\" teilgenommen. \n{} \n{}", student_name, topics[0], topics[1], topics[2])),
        5 => String::from(format!("{} hat an dem {} Wettbewerb teilgenommen. \n{} \n{}", student_name, topics[0], topics[1], topics[2])),
        _ => String::from("Error code 420"),
    };
    return match grade {
        x if x < 9 => (
            String::from("Die Notenpunkte liegen unter 9, bitte prüfen sie Ihre Eingabe."),
            0,
        ),
        x if x < 11 => (result_string + "\nDies Entspricht der Stufe 1", 1),
        x if x < 13 => (result_string + "\nDies Entspricht der Stufe 2", 2),
        _ => (result_string + "\nDies Entspricht der Stufe 3", 3),
    };
}

async fn zusätzliche_mint_aktivität_text(student_id: i32, student_name: String) -> (String, i32) {
    let sek_1_competitions = db::get_sek1_competitions(student_id).await;
    let sek_2_competitions = db::get_sek2_competitions(student_id).await;

    let mut sek_1_points = 0;
    let mut sek_2_points = 0;
    let mut niveau_in_sek_2 = 0; //Adding two for a niveau 3 in Sek II so I only need one variable
    let mut sek_1_text = String::from("Sek I: \n");
    for competition in sek_1_competitions {
        sek_1_text.push_str(&format!("     {}: {}\n", competition.0, competition.1));
        match competition.2 {
            1 => sek_1_points += 5,
            2 => sek_1_points += 10,
            3 => sek_1_points += 15,
            _ => sek_1_points += 0,
        }
    }
    sek_1_text.push_str("\n");
    let mut sek_2_text = String::from("Sek II: \n");
    for competition in sek_2_competitions {
        sek_2_text.push_str(&format!("     {}: {}\n", competition.0, competition.1));
        match competition.2 {
            1 => {
                sek_2_points += 5;
                niveau_in_sek_2 += 0;
            }
            2 => {
                sek_2_points += 10;
                niveau_in_sek_2 += 1;
            }
            3 => {
                sek_2_points += 15;
                niveau_in_sek_2 += 2;
            }
            _ => sek_2_points += 0,
        }
    }

    if ((sek_1_points + sek_2_points) >= 80) && (niveau_in_sek_2 >= 2) && sek_2_points >= 40 {
        (sek_1_text + &sek_2_text, 3)
    } else if (sek_1_points + sek_2_points) >= 60 && (niveau_in_sek_2 >= 1) && sek_2_points >= 30 {
        (sek_1_text + &sek_2_text, 2)
    } else if (sek_1_points + sek_2_points) >= 40 && sek_2_points >= 20 {
        (sek_1_text + &sek_2_text, 1)
    } else {
        (
            String::from("Die Angegebenen Wettbewerbe reichen nicht für Stufe 1"),
            0,
        )
    }
}
