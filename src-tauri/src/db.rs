use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};
use std::array;

const DATABASE: &str = "resources/db.sqlite";

//TODO: Change to fetch_one instead of fetch_all

#[tokio::main]
pub async fn setup_db() {
    if !Sqlite::database_exists(DATABASE).await.unwrap_or(false) {
        let _result = Sqlite::create_database(DATABASE)
            .await
            .map_err(|e| eprintln!("Error creating database: {}", e));
    }

    create_settings_table().await;
    create_students_table().await;
    create_additional_mint_activities_table().await;
    create_student_additional_mint_activites_table().await;
}

async fn create_settings_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    // Create the settings table with default values
    let _creation_result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            school_name TEXT DEFAULT 'an der Musterschule',
            school_location TEXT DEFAULT 'Musterstadt',
            school_functionary_1 TEXT DEFAULT 'Max Mustermann',
            school_functionary_2 TEXT DEFAULT 'Erika Musterfrau',
            school_functionary_1_position TEXT DEFAULT 'MINT-Koordinator',
            school_functionary_2_position TEXT DEFAULT 'Schulleiter',
            default_file_path TEXT DEFAULT '/'
        );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating settings table: {}", e));

    // Insert the default row if it doesn't exist
    let _insert_result = sqlx::query("INSERT OR IGNORE INTO settings (id) VALUES (1);")
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error inserting default settings: {}", e));
}

pub async fn change_school_name(school_name: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query("UPDATE settings SET school_name = ? WHERE id = 1;")
        .bind(school_name)
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error changing school name: {}", e));
}

pub async fn change_school_location(school_location: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query("UPDATE settings SET school_location = ? WHERE id = 1;")
        .bind(school_location)
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error changing school location: {}", e));
}

pub async fn change_school_functionary_1(school_functionary_1: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query("UPDATE settings SET school_functionary_1 = ? WHERE id = 1;")
        .bind(school_functionary_1)
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error changing school functionary 1: {}", e));
}

pub async fn change_school_functionary_2(school_functionary_2: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query("UPDATE settings SET school_functionary_2 = ? WHERE id = 1;")
        .bind(school_functionary_2)
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error changing school functionary 2: {}", e));
}

pub async fn change_school_functionary_1_position(school_functionary_1_position: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result =
        sqlx::query("UPDATE settings SET school_functionary_1_position = ? WHERE id = 1;")
            .bind(school_functionary_1_position)
            .execute(&db)
            .await
            .map_err(|e| eprintln!("Error changing school functionary 1 position: {}", e));
}

pub async fn change_school_functionary_2_position(school_functionary_2_position: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result =
        sqlx::query("UPDATE settings SET school_functionary_2_position = ? WHERE id = 1;")
            .bind(school_functionary_2_position)
            .execute(&db)
            .await
            .map_err(|e| eprintln!("Error changing school functionary 2 position: {}", e));
}

pub async fn change_default_file_path(new_default_file_path: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query("UPDATE settings SET default_file_path = ? WHERE id = 1;")
        .bind(new_default_file_path)
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error changing default file path: {}", e));
}

pub async fn get_school_name() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_name FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_name: String = row.get(0);
            school_name
        }
        Err(e) => {
            eprintln!("Error fetching school name: {}", e);
            String::from("Error")
        }
    }
}

pub async fn get_school_location() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_location FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_location: String = row.get(0);
            school_location
        }
        Err(e) => {
            eprintln!("Error fetching school location: {}", e);
            String::from("Error")
        }
    }
}

pub async fn get_school_functionary_1() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_functionary_1 FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_functionary_1: String = row.get(0);
            school_functionary_1
        }
        Err(e) => {
            eprintln!("Error fetching the 1st school functionary: {}", e);
            String::from("Error")
        }
    }
}

pub async fn get_school_functionary_2() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_functionary_2 FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_name: String = row.get(0);
            school_name
        }
        Err(e) => {
            eprintln!("Error fetching the 2nd school functionary: {}", e);
            String::from("Error")
        }
    }
}

pub async fn get_school_functionary_1_position() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_functionary_1_position FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_name: String = row.get(0);
            school_name
        }
        Err(e) => {
            eprintln!(
                "Error fetching the position of the 1st school functionary: {}",
                e
            );
            String::from("Error")
        }
    }
}

pub async fn get_school_functionary_2_position() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_functionary_2_position FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let school_functionary_2_position: String = row.get(0);
            school_functionary_2_position
        }
        Err(e) => {
            eprintln!(
                "Error fetching the position of the 2nd school functionary: {}",
                e
            );
            String::from("Error")
        }
    }
}

pub async fn get_default_file_path() -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT default_file_path FROM settings WHERE id = 1;")
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let default_file_path: String = row.get(0);
            default_file_path
        }
        Err(e) => {
            eprintln!(
                "Error fetching the position of the default file path: {}",
                e
            );
            String::from("Error")
        }
    }
}

#[doc = "- `0`: School Name
- `1`: School Location
- `2`: School Functionary 1
- `3`: School Functionary 2
- `4`: School Functionary 1 Position
- `5`: School Functionary 2 Position"]
pub async fn get_all_settings() -> [String; 6] {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT school_name, school_location, school_functionary_1, school_functionary_2, school_functionary_1_position, school_functionary_2_position FROM settings WHERE id = 1;").fetch_one(&db).await;

    match result {
        Ok(row) => array::from_fn(|i| row.get(i)),
        Err(e) => {
            eprintln!("Error fetching all settings: {}", e);
            array::from_fn(|_i| String::from("Error"))
        }
    }
}
///Returns all six settings
/// - `0`: Setting A
/// - `1`: Setting B
/// - `2`: Setting C
/// - `3`: Setting D
/// - `4`: Setting E
/// - `5`: Setting F

async fn create_students_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        birthday TEXT,
        graduation_year INT,
        subject_1 TEXT,
        grade_1_1 INT,
        grade_1_2 INT,
        grade_1_3 INT,
        grade_1_4 INT,
        grade_1_avg REAL,
        subject_2 TEXT,
        grade_2_1 INT,
        grade_2_2 INT,
        grade_2_3 INT,
        grade_2_4 INT,
        grade_2_avg REAL,
        subject_3 TEXT,
        grade_3_1 INT,
        grade_3_2 INT,
        grade_3_3 INT,
        grade_3_4 INT,
        grade_3_avg REAL,
        subject_4 TEXT,
        grade_4_1 INT,
        grade_4_2 INT,
        grade_4_3 INT,
        grade_4_4 INT,
        grade_4_avg REAL,
        type_of_paper INT DEFAUlT 0 NOT NULL,
        topic_of_paper TEXT,
        description_of_paper TEXT,
        grade_of_paper INT,
        level_of_competition TEXT
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating students table: {}", e));
}

pub async fn add_student(first_name: String, last_name: String, birthday: String) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "INSERT INTO students(first_name, last_name, birthday, certificate) VALUES
        (?, ?, ?, ?);",
    )
    .bind(first_name)
    .bind(last_name)
    .bind(birthday)
    .bind("none")
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error adding student: {}", e));
}

pub async fn get_student_birthday(student_id: i32) -> String {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT birthday FROM students WHERE student_id = ?;")
        .bind(student_id)
        .fetch_all(&db)
        .await;

    match result {
        Ok(mut rows) => {
            let row = rows.pop().unwrap();
            let school_name: String = row.get(0);
            school_name
        }
        Err(e) => {
            eprintln!("Error fetching the birthday: {}", e);
            String::from("Error")
        }
    }
}

async fn create_additional_mint_activities_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS additional_mint_activities (
        additional_mint_activity_id INTEGER PRIMARY KEY,
        name TEXT,
        description TEXT,
        level_one TEXT,
        level_two TEXT,
        level_three TEXT,
        sek INTEGER
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating additional_mint_activities table: {}", e));
}

async fn create_student_additional_mint_activites_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS student_additional_mint_activities (
            student_additional_mint_activities_id INTEGER PRIMARY KEY,
            student_id INTEGER,
            additional_mint_activity_id INTEGER,
            level INT,
            FOREIGN KEY (student_id) REFERENCES students(student_id),
            FOREIGN KEY (additional_mint_activity_id) REFERENCES additional_mint_activities(additional_mint_activity_id)
            );"
        )//Remove the Primary Key line, if you want to allow a student to have the same additional mint activity multiple times
        .execute(&db)
        .await
        .map_err(|e| eprintln!("Error creating student_additional_mint_activities table: {}", e));
}

pub async fn add_additional_mint_activity_to_student(
    student_id: i32,
    additional_mint_activity_id: i32,
    level: i32,
) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "INSERT INTO student_additional_mint_activities(student_id, additional_mint_activity_id, level) VALUES
        (?, ?, ?);"
    )
    .bind(&student_id)
    .bind(&additional_mint_activity_id)
    .bind(&level)
    .execute(&db)
    .await
    .map_err(|e|eprintln!("Error adding additional MINT activity to student: {}", e));
}

pub async fn print_fachwissenschaftliches_arbeiten() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT fachwissenschaftliches_arbeiten FROM schüler WHERE id = 1;")
        .fetch_all(&db)
        .await;

    match result {
        Ok(mut rows) => {
            let row = rows.pop().unwrap();
            let fachwissenschaftliches_arbeiten: String = row.get(0);
            println!(
                "fachwissenschaftliches_arbeiten: {}",
                fachwissenschaftliches_arbeiten
            );
        }
        Err(e) => eprintln!("Error fetching fachwissenschaftliches_arbeiten: {}", e),
    }
}

pub async fn get_grades(student_id: i32) -> Result<([String; 4], [i32; 16]), String> {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "SELECT subject_1, subject_2, subject_3, subject_4, grade_1_1, grade_1_2, grade_1_3, grade_1_4, grade_2_1, grade_2_2, grade_2_3, grade_2_4, grade_3_1, grade_3_2,
grade_3_3, grade_3_4, grade_4_1, grade_4_2, grade_4_3, grade_4_4 FROM students WHERE student_id = ?;",
    )
    .bind(student_id)
    .fetch_one(&db)
    .await;

    match result {
        Ok(row) => {
            let subjects: [String; 4] = [row.get(0), row.get(1), row.get(2), row.get(3)];
            let grades: [i32; 16] = array::from_fn(|i| row.get(i + 4));
            Ok((subjects, grades))
        }
        Err(e) => {
            eprintln!("Error fetching all settings: {}", e);
            Err(e.to_string())
        }
    }
}
