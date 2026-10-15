use crate::{db, pdf_lib::Form, AppState};
use chrono::Datelike;
use rfd::AsyncFileDialog;
use std::collections::BTreeMap;
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
pub async fn generate_pdf(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
) -> Result<bool, String> {
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

        // Parallelize all database calls for better performance
        let (
            settings,
            bday_str,
            (field_6_text, fachliche_kompetenz_level),
            (field_7_text, fachwissenschaftliches_level),
            (field_9_text, zusätzliche_mint_aktivität_level),
        ) = tokio::join!(
            db::get_school_settings_for_student(student_id),
            db::get_student_birthday(student_id),
            fachliche_kompetenz_text(student_id, &student_name),
            fachwissenschaftliches_arbeiten_text(student_id, &student_name),
            zusätzliche_mint_aktivität_text(student_id, &student_name),
        );

        let settings = match settings {
            Ok(settings) => settings,
            Err(error) => return Err(error),
        };

        let birthday = match chrono::NaiveDate::parse_from_str(bday_str.as_str(), "%Y-%m-%d") {
            Ok(d) => d,
            Err(e) => {
                return Err(format!("Failed to parse student birthday: {}", e));
            }
        };

        // Check if any Anforderungsfeld has level 0
        let anforderungsfelder = [
            (fachliche_kompetenz_level, "Fachliche Kompetenz"),
            (
                fachwissenschaftliches_level,
                "Fachwissenschaftliches Arbeiten",
            ),
            (zusätzliche_mint_aktivität_level, "Zusätzliche Aktivitäten"),
        ];

        if anforderungsfelder
            .iter()
            .any(|(level, _)| *level < 0 || *level > 3)
        {
            return Err(String::from(
                "Ungültige Zertifikatsstufe: Jede Anforderungsfeldstufe muss zwischen 0 und 3 liegen.",
            ));
        }

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
            result.map_err(|error| format!("Failed to fill PDF fields: {:?}", error))?;
        }
        form.set_need_appearances(true)
            .map_err(|error| format!("Failed to prepare PDF form fields: {:?}", error))?;
        Ok(form)
    };

    let (path, form_result) = tokio::join!(spawn_file_dialog, prepare_pdf);

    if path.is_none() {
        return match form_result {
            Ok(_) => Ok(false),
            Err(error) => Err(error),
        };
    }

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
            Err(e) => return Err(e),
        }
        return Ok(true);
    }

    Ok(false)
}

async fn fachliche_kompetenz_text(student_id: i32, student_name: &str) -> (String, i32) {
    let get_grades_return = db::get_grades(student_id).await;
    match get_grades_return {
        Ok((subjects, grades)) => {
            let has_any_failing_grade = (0..5).any(|course| {
                !subjects[course].trim().is_empty()
                    && subjects[course] != "..."
                    && grades[course * 4..course * 4 + 4]
                        .iter()
                        .any(|grade| *grade < 5)
            });

            let mut grade_averages = [0.0_f32; 5];
            let mut course_valid = [false; 5];
            for i in 0..5 {
                let course_grades = &grades[i * 4..i * 4 + 4];
                grade_averages[i] = course_grades.iter().sum::<i32>() as f32 / 4.0;
                course_valid[i] = !subjects[i].trim().is_empty()
                    && subjects[i] != "..."
                    && course_grades.iter().all(|grade| *grade >= 5)
                    && grade_averages[i] >= 9.0;
            }
            let lk_indexes = [0usize, 1, 4];
            let gk_indexes = [2usize, 3];
            let mut candidates: Vec<(f32, Vec<usize>)> = Vec::new();
            for i in 0..lk_indexes.len() {
                for j in (i + 1)..lk_indexes.len() {
                    let pair = vec![lk_indexes[i], lk_indexes[j]];
                    if pair.iter().all(|index| course_valid[*index]) {
                        let average =
                            pair.iter().map(|index| grade_averages[*index]).sum::<f32>() / 2.0;
                        candidates.push((average, pair));
                    }
                }
                let lk = lk_indexes[i];
                if course_valid[lk] && gk_indexes.iter().all(|index| course_valid[*index]) {
                    candidates.push((
                        (grade_averages[lk]
                            + grade_averages[gk_indexes[0]]
                            + grade_averages[gk_indexes[1]])
                            / 3.0,
                        vec![lk, gk_indexes[0], gk_indexes[1]],
                    ));
                }
            }
            if has_any_failing_grade {
                candidates.clear();
            }
            let (best_average, best_combination) = candidates
                .into_iter()
                .max_by(|a, b| a.0.total_cmp(&b.0))
                .unwrap_or((0.0, Vec::new()));
            let level = match best_average {
                x if x < 9.0 => 0,
                x if x < 11.0 => 1,
                x if x < 13.0 => 2,
                _ => 3,
            };

            let best_average_str = format!("{:04.1}", best_average);

            let selected_subjects = best_combination
                .iter()
                .map(|index| subjects[*index].as_str())
                .collect::<Vec<_>>()
                .join(" und ");
            let result = if best_combination.len() == 2 {
                format!("{} hat die Fächer {} auf erhöhtem Niveau absolviert.\nDie Durchschnittsnote beträgt {} Punkte.", student_name, selected_subjects, best_average_str)
            } else if best_combination.len() == 3 {
                let lk = best_combination
                    .iter()
                    .find(|index| [0, 1, 4].contains(*index))
                    .map(|index| subjects[*index].as_str())
                    .unwrap_or("");
                format!("{} hat {} auf erhöhtem Niveau und zwei weitere Fächer belegt: {} und {}.\nDie Durchschnittsnote beträgt {} Punkte.", student_name, lk, subjects[2], subjects[3], best_average_str)
            } else {
                format!(
                    "{} hat keine gültige Fachkombination für die Bewertung.",
                    student_name
                )
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
    student_name: &str,
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
        4 => String::from(format!("{} hat an Jugend Forscht mit dem Projekt \"{}\" teilgenommen. \n{} \n{}", student_name, topics[0], topics[1], topics[2])),
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

async fn zusätzliche_mint_aktivität_text(student_id: i32, _student_name: &str) -> (String, i32) {
    let (sek_1_competitions, sek_2_competitions) = tokio::join!(
        db::get_sek1_competitions(student_id),
        db::get_sek2_competitions(student_id)
    );

    let sek_1_points: i32 = sek_1_competitions.iter().map(|entry| entry.2 * 5).sum();
    let sek_2_points: i32 = sek_2_competitions.iter().map(|entry| entry.2 * 5).sum();
    let niveau_in_sek_2: i32 = sek_2_competitions
        .iter()
        .map(|entry| match entry.2 {
            2 => 1,
            3 => 2,
            _ => 0,
        })
        .sum();
    let mut sek_1_text = String::from("Sekundarstufe I: \n");
    for line in format_competitions(sek_1_competitions) {
        sek_1_text.push_str(&line);
        sek_1_text.push('\n');
    }
    sek_1_text.push_str("\n");
    let mut sek_2_text = String::from("Sekundarstufe II: \n");
    for line in format_competitions(sek_2_competitions) {
        sek_2_text.push_str(&line);
        sek_2_text.push('\n');
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

fn format_competitions(
    competitions: Vec<(String, String, i32, Option<i32>, String)>,
) -> Vec<String> {
    let mut grouped: BTreeMap<String, Vec<(Option<i32>, String)>> = BTreeMap::new();
    for (name, description, level, year, achievement_info) in competitions {
        let achieved = if achievement_info.trim().is_empty() {
            if level == 0 {
                "Keine Punkte".to_string()
            } else {
                format!("Stufe {}: {}", level, description)
            }
        } else {
            achievement_info.trim().to_string()
        };
        grouped.entry(name).or_default().push((year, achieved));
    }
    grouped
        .into_iter()
        .map(|(name, mut entries)| {
            entries.sort_by_key(|entry| entry.0.unwrap_or(i32::MAX));
            let mut lines = vec![name];
            for (year, achieved) in entries {
                let detail = year
                    .map(|year| format!("{}: {}", year, achieved))
                    .unwrap_or(achieved);
                lines.push(format!("    {}", detail));
            }
            lines.join("\n")
        })
        .collect()
}

//FONT is Calibri Bold
