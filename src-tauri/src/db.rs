use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};

const DATABASE: &str = "resources/db.sqlite";

#[tokio::main]
pub async fn setup_db() {
    if !Sqlite::database_exists(DATABASE).await.unwrap_or(false) {
        let _result = Sqlite::create_database(DATABASE)
            .await
            .map_err(|e| eprintln!("Error creating database: {}", e));
    }

    create_students_table().await;
    create_grades_table().await;
    create_additional_mint_activities_table().await;
    create_additional_mint_activities_levels_table().await;
    create_student_additional_mint_activites_table().await;
}

async fn create_students_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birthday TEXT,
        certificate TEXT
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating students table: {}", e));
}

async fn create_grades_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY,
        subject_1 TEXT,
        grade_1_1 INT,
        grade_1_2 INT,
        grade_1_3 INT,
        grade_1_4 INT,
        grade_1_avg REAL,
        subject_2 TEXT,
        highered_subject BOOL,
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
        subject_5 TEXT,
        grade_5_1 INT,
        grade_5_2 INT,
        grade_5_3 INT,
        grade_5_4 INT,
        grade_5_avg REAL,
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating grades table: {}", e));
}

async fn create_additional_mint_activities_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS additional_mint_activities (
        additional_mint_activity_id INTEGER PRIMARY KEY,
        name TEXT,
        description TEXT
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating additional_mint_activities table: {}", e));
}

async fn create_additional_mint_activities_levels_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS additional_mint_activities_levels (
        additional_mint_activity_level_id INTEGER PRIMARY KEY
        additional_mint_activity_id INTEGER UNIQUE NOT NULL,
        level_one TEXT,
        level_two TEXT,
        level_three TEXT
        );",
    )
    .execute(&db)
    .await
    .map_err(|e| {
        eprintln!(
            "Error creating additional_mint_activities_levels table: {}",
            e
        )
    });
}

async fn create_student_additional_mint_activites_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let _result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS student_additional_mint_activities (
            student_id INTEGER,
            additional_mint_activity_id INTEGER,
            level INT,
            PRIMARY KEY (student_id, additional_mint_activity_id),
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
