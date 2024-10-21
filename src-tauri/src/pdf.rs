use pdf_forms::Form;
use rfd::AsyncFileDialog;

#[tauri::command]
pub async fn generate_pdf() {
    let spawn_file_dialog = async {
        let path = AsyncFileDialog::new()
            .add_filter("PDF Dokument", &["pdf"])
            .set_file_name("") //TODO
            .set_directory("/")
            .save_file()
            .await;
        if path.is_none() {
            return None;
        }
        path
    };

    let prepare_pdf = async {
        let mut form = Form::load("resources/template_v3_M.pdf").unwrap(); // M and L exist (M is font size 12 and L is font size 10 on the second page)
        let results = vec![
            form.set_text(0, String::from("Field 0")),
            form.set_text(1, String::from("Field 1")),
            form.set_text(2, String::from("Field 2")),
            form.set_text(3, String::from("Field 3")),
            form.set_text(4, String::from("Field 4")),
            form.set_text(5, String::from("Field 5")),
            form.set_text(6, String::from("Field 6")),
            form.set_text(7, String::from("Field 7")),
            form.set_text(8, String::from("Field 8")),
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
    form.save(path.unwrap().path()).unwrap();
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
//text_7 = fachwissenshaftliches arbeiten
//text_9 = zusätzliche Mint Aktivität
