use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};
use std::array;

const DATABASE: &str = "resources/db.sqlite";

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
    create_student_additional_mint_activities_table().await;
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
            default_file_path TEXT DEFAULT '/',
            competition_search_box INTEGER DEFAULT 0
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
        .fetch_one(&db)
        .await;

    match result {
        Ok(row) => {
            let birthday: String = row.get(0);
            birthday
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

async fn create_student_additional_mint_activities_table() {
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

#[doc = "
    - first i32: Type of Paper
    - `0`: Topic of Paper
    - `1`: Description of Paper
    - `2`: Level of Competition
    - second i32: Grade of Paper"]
pub async fn get_fachwissenschaftliches_arbeiten(student_id: i32) -> (i32, [String; 3], i32) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result =
        sqlx::query("SELECT type_of_paper, topic_of_paper, description_of_paper, grade_of_paper, level_of_competition FROM students WHERE student_id = ?;")
            .bind(student_id)
            .fetch_one(&db).await;

    match result {
        Ok(row) => (row.get(0), [row.get(1), row.get(2), row.get(4)], row.get(3)),
        Err(e) => {
            eprintln!("Error fetching fachwissenschaftliches_arbeiten: {}", e);
            (0, array::from_fn(|_i| String::from("Error")), 0)
        }
    }
}

pub async fn get_grades(student_id: i32) -> Result<([String; 4], [i32; 16]), String> {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "SELECT
            COALESCE(subject_1, '...'),
            COALESCE(subject_2, '...'),
            COALESCE(subject_3, '...'),
            COALESCE(subject_4, '...'),
            COALESCE(grade_1_1, 0),
            COALESCE(grade_1_2, 0),
            COALESCE(grade_1_3, 0),
            COALESCE(grade_1_4, 0),
            COALESCE(grade_2_1, 0),
            COALESCE(grade_2_2, 0),
            COALESCE(grade_2_3, 0),
            COALESCE(grade_2_4, 0),
            COALESCE(grade_3_1, 0),
            COALESCE(grade_3_2, 0),
            COALESCE(grade_3_3, 0),
            COALESCE(grade_3_4, 0),
            COALESCE(grade_4_1, 0),
            COALESCE(grade_4_2, 0),
            COALESCE(grade_4_3, 0),
            COALESCE(grade_4_4, 0)
         FROM students WHERE student_id = ?;",
    )
    .bind(student_id)
    .fetch_one(&db)
    .await;

    match result {
        Ok(row) => {
            let subjects: [String; 4] = [row.get(0), row.get(1), row.get(2), row.get(3)];
            let grades: [i32; 16] = std::array::from_fn(|i| row.get(i + 4));
            Ok((subjects, grades))
        }
        Err(e) => {
            eprintln!("Error fetching grades: {}", e);
            Err(e.to_string())
        }
    }
}

pub async fn get_sek1_competitions(student_id: i32) -> Vec<(String, String, i32)> {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT additional_mint_activities.name, student_additional_mint_activities.level AS level, CASE student_additional_mint_activities.level WHEN 1 THEN additional_mint_activities.level_one WHEN 2 THEN additional_mint_activities.level_two WHEN 3 THEN additional_mint_activities.level_three END FROM additional_mint_activities JOIN student_additional_mint_activities ON additional_mint_activities.additional_mint_activity_id = student_additional_mint_activities.additional_mint_activity_id WHERE student_additional_mint_activities.student_id = ? AND additional_mint_activities.sek = 1;")
        .bind(student_id)
        .fetch_all(&db)
        .await;

    match result {
        Ok(rows) => {
            let mut competitions = Vec::new();
            for row in rows {
                let name: String = row.get(0);
                let level: i32 = row.get(1);
                let level_description: String = row.get(2);
                competitions.push((name, level_description, level));
            }
            competitions
        }
        Err(e) => {
            eprintln!("Error fetching sek1 competitions: {}", e);
            vec![]
        }
    }
}

pub async fn get_sek2_competitions(student_id: i32) -> Vec<(String, String, i32)> {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query("SELECT additional_mint_activities.name, student_additional_mint_activities.level AS level, CASE student_additional_mint_activities.level WHEN 1 THEN additional_mint_activities.level_one WHEN 2 THEN additional_mint_activities.level_two WHEN 3 THEN additional_mint_activities.level_three END FROM additional_mint_activities JOIN student_additional_mint_activities ON additional_mint_activities.additional_mint_activity_id = student_additional_mint_activities.additional_mint_activity_id WHERE student_additional_mint_activities.student_id = ? AND additional_mint_activities.sek = 2;")
        .bind(student_id)
        .fetch_all(&db)
        .await;

    match result {
        Ok(rows) => {
            let mut competitions = Vec::new();
            for row in rows {
                let name: String = row.get(0);
                let level: i32 = row.get(1);
                let level_description: String = row.get(2);
                competitions.push((name, level_description, level));
            }
            competitions
        }
        Err(e) => {
            eprintln!("Error fetching sek1 competitions: {}", e);
            vec![]
        }
    }
}
