// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

const PLEX_TOKEN_ACCOUNT: &str = "plex_token";

fn plex_service_name(app: &tauri::AppHandle) -> String {
    app.config()
        .identifier
        .clone()
}

#[tauri::command]
fn plex_token_get(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let service = plex_service_name(&app);
    let entry = keyring::Entry::new(&service, PLEX_TOKEN_ACCOUNT).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(pw) => Ok(Some(pw)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn plex_token_set(app: tauri::AppHandle, token: String) -> Result<(), String> {
    let service = plex_service_name(&app);
    let entry = keyring::Entry::new(&service, PLEX_TOKEN_ACCOUNT).map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn plex_token_delete(app: tauri::AppHandle) -> Result<(), String> {
    let service = plex_service_name(&app);
    let entry = keyring::Entry::new(&service, PLEX_TOKEN_ACCOUNT).map_err(|e| e.to_string())?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn pms_identity_xml(server_url: String, token: String) -> Result<String, String> {
    let url = format!("{}/:/identity", server_url.trim_end_matches('/'));

    let res = reqwest::Client::new()
        .get(&url)
        .header("Accept", "application/xml")
        .header("X-Plex-Token", token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("HTTP {} from Plex server", status));
    }

    Ok(body)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            plex_token_get,
            plex_token_set,
            plex_token_delete,
            pms_identity_xml
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
