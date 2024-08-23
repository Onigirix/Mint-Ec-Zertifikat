use pdf::file::{File, FileOptions};
use pdf::object::*;
use pdf::primitive::PdfString;
use pdf::primitive::Primitive;
use rfd::AsyncFileDialog;
use std::collections::HashMap;
use std::env::args;
//use pdf_forms::Form;

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
        let mut file = FileOptions::cached()
            .open("resources/template_v2_L.pdf")
            .unwrap();
        let mut to_update_field: Option<_> = None;

        if let Some(ref forms) = file.get_root().forms {
            println!("Forms:");
            for field in forms.fields.iter().take(1) {
                print!("  {:?} = ", field.name);
                match field.value {
                    Primitive::String(ref s) => println!("{}", s.to_string_lossy()),
                    Primitive::Integer(i) => println!("{}", i),
                    Primitive::Name(ref s) => println!("{}", s),
                    ref p => println!("{:?}", p),
                }

                if to_update_field.is_none() {
                    to_update_field = Some(field.clone());
                }
            }
        }

        if let Some(to_update_field) = to_update_field {
            println!("\nUpdating field:");
            println!("{:?}\n", to_update_field);

            let text = "Hello World!";
            let new_value: PdfString = PdfString::new(text.into());
            let mut updated_field = (*to_update_field).clone();
            updated_field.value = Primitive::String(new_value);

            let reference = file
                .update(to_update_field.get_ref().get_inner(), updated_field)
                .unwrap();
        }
        return Some(file);
        /*let mut form = Form::load("resources/template_v2_L_2.pdf").unwrap();
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
        ];

        for result in results {
            if let Err(e) = result {
                eprintln!("Error while filling the PDF: {}", e);
            }
        }

        form*/
    };

    let (path, mut file) = tokio::join!(spawn_file_dialog, prepare_pdf);
    if path.is_none() {
        return;
    }
    file.unwrap().save_to(path.unwrap().path()).unwrap();
    //TODO: Add a success message (toast notification)
}
//text_0 = Vor und Nachname
//text_1 = Geburtsdatum
//text_2 = Schule
//text_3 = Gesamteinstufung
//text_4 = Funktionär 1
//text_5 = Funktionär 2
//text_6 = Ort und Datum
//text_7 = fachliche Kompetenz
//text_8 = fachwissenshaftliches arbeiten
//text_9 = zusätzliche Mint Aktivität
//https://pdf-lib.js.org/#examples
