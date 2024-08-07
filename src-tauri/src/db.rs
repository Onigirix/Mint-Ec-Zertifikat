use std::result;

use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};

const DATABASE: &str = "resources/db.sqlite";

#[tokio::main]
pub async fn setup_db() {
    if !Sqlite::database_exists(DATABASE).await.unwrap_or(false) {
        println!("Creating database {}", DATABASE);
        match Sqlite::create_database(DATABASE).await {
            Ok(_) => println!("Database created"),
            Err(e) => eprintln!("Error creating database: {}", e),
        }
    } else {
        println!("Database {} already exists", DATABASE);
    }

    let db = SqlitePool::connect(DATABASE).await.unwrap();

    let result = sqlx::query(
        "CREATE TABLE IF NOT EXISTS schüler (
        id INTEGER PRIMARY KEY,
        vorname TEXT NOT NULL,
        nachname TEXT NOT NULL,
        geburtsdatum TEXT NOT NULL,
        zertifikat TEXT NOT NULL,
        fachliche_kompetenz_id INTEGER NOT NULL,
        fachwissenschaftliches_arbeiten_id INTEGER NOT NULL,
        zusätzlich_id INTEGER NOT NULL
    );",
    )
    .execute(&db)
    .await;

    match result {
        Ok(_) => println!("Result of creating schüler table: Success"),
        Err(e) => eprintln!("Error creating schüler table: {}", e),
    }
}
