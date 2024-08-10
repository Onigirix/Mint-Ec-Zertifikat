use std::fs;

use sqlx::{migrate::MigrateDatabase, Row, Sqlite, SqlitePool};

const DATABASE: &str = "resources/db.sqlite";

#[tokio::main]
pub async fn setup_db() {
    fs::remove_file(DATABASE).unwrap_or_default(); //TODO: remove this line, when finished with development
    if !Sqlite::database_exists(DATABASE).await.unwrap_or(false) {
        let result = Sqlite::create_database(DATABASE)
            .await
            .map_err(|e| eprintln!("Error creating database: {}", e));
    }

    create_schüler_table().await;
    create_fachliche_kompetenz_table().await;
    create_zusätzlich_table().await;

    add_test_value_to_schüler().await;
    add_fachwissenschaftliches_arbeiten("added".to_string(), 1).await;
    print_fachwissenschaftliches_arbeiten().await;
}

async fn create_schüler_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS schüler (
        id INTEGER PRIMARY KEY,
        vorname TEXT NOT NULL,
        nachname TEXT NOT NULL,
        geburtsdatum TEXT,
        zertifikat TEXT,
        fachwissenschaftliches_arbeiten TEXT
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating schüler table: {}", e));
}

async fn create_fachliche_kompetenz_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS fachliche_kompetenz (
        id INTEGER PRIMARY KEY,
        fach_1 TEXT,
        note_1_1 INT,
        note_1_2 INT,
        note_1_3 INT,
        note_1_4 INT,
        note_1_avg REAL,
        fach_2 TEXT,
        erhöhtes_fach BOOL,
        note_2_1 INT,
        note_2_2 INT,
        note_2_3 INT,
        note_2_4 INT,
        note_2_avg REAL,
        fach_3 TEXT,
        note_3_1 INT,
        note_3_2 INT,
        note_3_3 INT,
        note_3_4 INT,
        note_3_avg REAL,
        fach_4 TEXT,
        note_4_1 INT,
        note_4_2 INT,
        note_4_3 INT,
        note_4_4 INT,
        note_4_avg REAL,
        fach_5 TEXT,
        note_5_1 INT,
        note_5_2 INT,
        note_5_3 INT,
        note_5_4 INT,
        note_5_avg REAL,
    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating fachliche_kompetenz table: {}", e));
}

async fn create_zusätzlich_table() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS zusätzlich (
        id INTEGER PRIMARY KEY,

    );",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error creating zusätzlich table: {}", e));
}

pub async fn add_fachwissenschaftliches_arbeiten(data_to_add: String, id: i32) {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "UPDATE schüler
        SET fachwissenschaftliches_arbeiten =
            CASE
                WHEN fachwissenschaftliches_arbeiten IS NULL THEN ?
                ELSE fachwissenschaftliches_arbeiten || ?
            END
        WHERE id = ?;",
    )
    .bind(&data_to_add)
    .bind(&format!("§ {}", data_to_add))
    .bind(id)
    .execute(&db)
    .await
    .map_err(|e| {
        eprintln!(
            "Error adding new thing to fachwissenschaftliches_arbeiten: {}",
            e
        )
    });
}

pub async fn add_test_value_to_schüler() {
    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "INSERT INTO schüler (vorname, nachname, fachwissenschaftliches_arbeiten)
        VALUES ('Max', 'Mustermann', 'test');",
    )
    .execute(&db)
    .await
    .map_err(|e| eprintln!("Error adding test value to schüler: {}", e));
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
