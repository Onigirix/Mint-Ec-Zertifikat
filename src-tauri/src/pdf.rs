use crate::{db, pdf_lib::Form, AppState};
use chrono::Datelike;
use rfd::AsyncFileDialog;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

#[repr(usize)]
#[derive(Clone, Copy)]
enum SettingsIndex {
    SchoolName = 0,
    SchoolLocation = 1,
    SchoolFunctionary1 = 2,
    SchoolFunctionary2 = 3,
    SchoolFunctionary1Position = 4,
    SchoolFunctionary2Position = 5,
}

#[repr(usize)]
#[derive(Clone, Copy)]
enum FormField {
    Birthday = 0,
    SchoolName = 1,
    CertificationLevel = 2,
    Functionary1NameAndPosition = 3,
    Functionary2NameAndPosition = 4,
    LocationAndDate = 5,
    FachlicheKompetenz = 6,
    FachwissenschaftlichesArbeiten = 7,
    StudentName = 8,
    ZusaetzlicheMintAktivitaet = 9,
}

#[tauri::command]
pub async fn generate_pdf(app: AppHandle, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let (student_name, student_id) = {
        let s = state.lock().await;
        (s.student_name.clone(), s.student_id)
    };

    let template_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?
        .join("resources")
        .join("Template_L.pdf");

    let spawn_file_dialog = async {
        let default_dir = db::get_default_file_path().await;

        let file_handle = AsyncFileDialog::new()
            .add_filter("PDF Dokument", &["pdf"])
            .set_file_name(format!("Mint-EC Zertifikat {}", student_name))
            .set_directory(default_dir)
            .save_file()
            .await;

        file_handle
    };

    let prepare_pdf = async {
        let mut form = match Form::load(&template_path) {
            Ok(f) => f,
            Err(e) => {
                return Err(format!("Failed to load PDF template: {:?}", e));
            }
        };
        let current_date = chrono::Utc::now();
        let settings = db::get_all_settings().await;
        let bday_str = db::get_student_birthday(student_id).await;
        let birthday = match chrono::NaiveDate::parse_from_str(bday_str.as_str(), "%Y-%m-%d") {
            Ok(d) => d,
            Err(e) => {
                return Err(format!("Failed to parse student birthday: {}", e));
            }
        };

        let (field_6_text, fachliche_kompetenz_level) =
            fachliche_kompetenz_text(student_id, student_name.clone()).await;

        let (field_7_text, fachwissenschaftliches_level) =
            fachwissenschaftliches_arbeiten_text(student_id, student_name.clone()).await;

        let (field_9_text, zusätzliche_mint_aktivität_level) =
            zusätzliche_mint_aktivität_text(student_id, student_name.clone()).await;

        // Check if any Anforderungsfeld has level 0
        let anforderungsfelder = [
            (fachliche_kompetenz_level, "Fachliche Kompetenz"),
            (
                fachwissenschaftliches_level,
                "Fachwissenschaftliches Arbeiten",
            ),
            (zusätzliche_mint_aktivität_level, "Zusätzliche Aktivitäten"),
        ];

        let mut level_zero_error: Option<String> = None;
        for (index, (level, name)) in anforderungsfelder.iter().enumerate() {
            if *level == 0 {
                let error_msg = format!(
                    "Anforderungsfeld {} ({}) wurde mit Stufe 0 bewertet. Kein Zertifikat kann ausgegeben werden.",
                    index + 1,
                    name
                );
                level_zero_error = Some(error_msg);
                break;
            }
        }

        let average_level: f32 = (fachliche_kompetenz_level
            + fachwissenschaftliches_level
            + zusätzliche_mint_aktivität_level) as f32
            / 3.0 as f32;

        let field_2_text = if let Some(error) = level_zero_error {
            error
        } else {
            match average_level {
                x if x < 1.0 => String::from(
                    "Die Durchschnittsbewertung liegt unter 1.0, bitte prüfen Sie Ihre Eingaben.",
                ),
                x if x < 1.5 => String::from("mit Erfolg"),
                x if x < 2.5 => String::from("mit besonderem Erfolg"),
                _ => String::from("mit Auszeichnung"),
            }
        };
        let results = vec![
            form.set_text(
                FormField::Birthday as usize,
                format!("geboren am {}", birthday.format("%d.%m.%Y")),
            ),
            form.set_text(
                FormField::SchoolName as usize,
                format!("{}", settings[SettingsIndex::SchoolName as usize]),
            ),
            form.set_text(FormField::CertificationLevel as usize, field_2_text),
            form.set_text(
                FormField::Functionary1NameAndPosition as usize,
                format!(
                    "{}\n{}",
                    settings[SettingsIndex::SchoolFunctionary1 as usize],
                    settings[SettingsIndex::SchoolFunctionary1Position as usize]
                ),
            ),
            form.set_text(
                FormField::Functionary2NameAndPosition as usize,
                format!(
                    "{}\n{}",
                    settings[SettingsIndex::SchoolFunctionary2 as usize],
                    settings[SettingsIndex::SchoolFunctionary2Position as usize]
                ),
            ),
            form.set_text(
                FormField::LocationAndDate as usize,
                format!(
                    "{} den {:02}.{:02}.{}",
                    settings[SettingsIndex::SchoolLocation as usize],
                    current_date.day(),
                    current_date.month(),
                    current_date.year()
                ),
            ),
            form.set_text(FormField::FachlicheKompetenz as usize, field_6_text),
            form.set_text(
                FormField::FachwissenschaftlichesArbeiten as usize,
                field_7_text,
            ),
            form.set_text(FormField::StudentName as usize, student_name.clone()),
            form.set_text(FormField::ZusaetzlicheMintAktivitaet as usize, field_9_text),
        ];

        for result in results {
            if let Err(_e) = result {
                // Error while filling the PDF
            }
        }
        let _ = form.set_need_appearances(true);
        Ok(form)
    };

    let (path, form_result) = tokio::join!(spawn_file_dialog, prepare_pdf);

    if path.is_some() {
        let handle = path.unwrap();
        let path_buf = handle.path().to_path_buf();
        let path_string = path_buf.to_string_lossy().to_string();

        let pos = path_string
            .rfind('\\')
            .or_else(|| path_string.rfind('/'))
            .unwrap_or(0);
        let new_default_dir = String::from(&path_string[..pos]);
        db::change_default_file_path(new_default_dir).await;

        match form_result {
            Ok(mut form) => {
                if let Err(e) = form.save(&path_buf) {
                    return Err(format!("Failed to save PDF: {}", e));
                }

                // let file_url = Url::from_file_path(&path_buf)
                //     .map(|u| u.to_string())
                //     .unwrap_or_else(|_| format!("file:///{}", path_string.replace('\\', "/")));
                // log::info!("generate_pdf: opening in browser: {}", file_url);

                // if let Err(e) = webbrowser::open(&file_url) {
                //     log::error!("Failed to open PDF in browser (webbrowser): {}", e);

                //     #[cfg(target_os = "windows")]
                //     {
                //         use std::process::Command;
                //         log::info!("generate_pdf: trying Windows fallback (explorer)...");
                //         if let Err(e2) = Command::new("explorer").arg(&file_url).spawn() {
                //             log::error!("Fallback via explorer failed: {}", e2);
                //             log::info!("generate_pdf: trying Windows fallback (cmd start)...");
                //             let _ = Command::new("cmd")
                //                 .args(["/C", "start", "", &file_url])
                //                 .spawn()
                //                 .map_err(|e3| {
                //                     log::error!("Fallback via cmd start failed: {}", e3);
                //                 });
                //         }
                //     }
                // } else {
                //     log::info!("generate_pdf: opened PDF in browser via webbrowser");
                // }
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    Ok(())
    //TODO: Add a success message (toast notification)
}

async fn fachliche_kompetenz_text(student_id: i32, student_name: String) -> (String, i32) {
    let get_grades_return = db::get_grades(student_id).await;
    match get_grades_return {
        Ok((subjects, grades)) => {
            let has_any_failing_grade = grades
                .iter()
                .enumerate()
                .any(|(i, &grade)| subjects[i / 4] != "..." && grade < 5);

            let mut level = 0;
            let mut best_average = 0.0;
            let mut best_combination = 0;
            if !has_any_failing_grade {
                let mut grade_averages: [f32; 4] = [0.0; 4];
                for i in 0..=3 {
                    for j in 0..4 {
                        grade_averages[i] = grade_averages[i] + (grades[i * 4 + j] as f32);
                    }
                    grade_averages[i] = grade_averages[i] / 4.0;
                }
                let comb0 = (grade_averages[0] + grade_averages[1]) / 2.0;
                let comb1 = (grade_averages[0] + grade_averages[1] + grade_averages[2]) / 3.0;
                let comb2 = (grade_averages[0] + grade_averages[1] + grade_averages[3]) / 3.0;
                let comb3 = (grade_averages[0] + grade_averages[2] + grade_averages[3]) / 3.0;
                let comb4 = (grade_averages[1] + grade_averages[2] + grade_averages[3]) / 3.0;

                best_average = comb0;

                if comb1 > best_average {
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

                level = match best_average {
                    x if x < 9.0 => 0,
                    x if x < 11.0 => 1,
                    x if x > 13.0 => 2,
                    _ => 3,
                };
            }

            // best_average auf 2 Nachkommastellen runden und als zweistellige Zahl mit führender Null darstellen
            let best_average_str = format!("{:04.1}", best_average);

            let result = match best_combination {
                0 => format!(
                        "{} hat zwei F\u{00e4}cher auf erh\u{00f6}htem Niveau absolviert:\n{}\n{}\nDie Durchschnittsnote beträgt {} Punkte.",
                        student_name, subjects[0], subjects[1], best_average_str
                    ),
                1 => format!(
                    "{} hat die F\u{00e4}cher {} und {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[1], subjects[2], best_average_str),
                2 => format!(
                    "{} hat die F\u{00e4}cher {} und {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[1], subjects[3], best_average_str),
                3 => format!(
                    "{} hat {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} und {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[0], subjects[2], subjects[3], best_average_str),
                4 => format!(
                    "{} hat {} auf erh\u{00f6}htem Niveau absolviert. Zus\u{00e4}tzlich wurde noch {} und {} belegt. \nDie Durchschnittsnote beträgt {} Punkte.",
                    student_name, subjects[1], subjects[2], subjects[3], best_average_str),
                _ => String::from("Errorcode: 69"),
            };

            (result, level)
        }
        Err(e) => (
            String::from(format!("Error while fetching the grades: {}", e)),
            0,
        ),
    }
}

async fn fachwissenschaftliches_arbeiten_text(
    student_id: i32,
    student_name: String,
) -> (String, i32) {
    let (type_of_paper, topics, grade) = db::get_fachwissenschaftliches_arbeiten(student_id).await;
    // Format grade as two digits with leading zero if needed
    let grade_str = format!("{:02}", grade);
    let result_string = match type_of_paper {
        0 => String::from("Kein Eintrag im Beiech Fachwissenschaftliches Arbeiten"),
        1 => String::from(format!(
            "{} hat eine Facharbeit geschrieben. \nThema: {} \n{}\nDie Facharbeite wurde mit {} Punkten bewertet.",
            student_name, topics[0], topics[1], grade_str
        )),
        2 => String::from(format!("{} hat das wissenschaftspropädeutische Fach {} belegt. \nEs wurden {} Punkte erreicht.", student_name, topics[0], grade_str)),
        3 => String::from(format!("{} hat eine besondere Lernleistung erbracht. \nThema: {} \n{} \nDie besondere Lernleistung wurde mit {} Punkten bewertet.", student_name, topics[0], topics[1], grade_str)),
        4 => String::from(format!("{} hat an Jugend Forscht mit dem Projekt \"{}\" teilgenommen. \n{} \n{} \n{}", student_name, topics[0], topics[1], grade_str, topics[2])),
        5 => String::from(format!("{} hat an dem {} Wettbewerb teilgenommen. \n{} \n{}", student_name, topics[0], topics[1], topics[2])),
        _ => String::from("Error code 420"),
    };
    return match grade {
        x if x < 9 => (
            String::from("Die Notenpunkte liegen unter 09, bitte prüfen sie Ihre Eingabe."),
            0,
        ),
        x if x < 11 => (result_string, 1),
        x if x < 13 => (result_string, 2),
        _ => (result_string, 3),
    };
}

async fn zusätzliche_mint_aktivität_text(
    student_id: i32,
    _student_name: String,
) -> (String, i32) {
    let sek_1_competitions = db::get_sek1_competitions(student_id).await;
    let sek_2_competitions = db::get_sek2_competitions(student_id).await;

    let mut sek_1_points = 0;
    let mut sek_2_points = 0;
    let mut niveau_in_sek_2 = 0; //Adding two for a niveau 3 in Sek II so I only need one variable
    let mut sek_1_text = String::from("Sekundarstufe I: \n");
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
    let mut sek_2_text = String::from("Sekundarstufe II: \n");
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

//FONT is Calibri Bold
