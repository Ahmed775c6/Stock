use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use std::fs;
use tokio::sync::Mutex;
use tokio::task;
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;
use std::error::Error;
// src-tauri/src/commands.rs
use tauri::Manager;
use serde_json::Value;

use std::path::PathBuf;

// Add these commands to your existing commands.rs file

#[derive(Debug, Serialize, Deserialize)]
pub struct Expense {
    pub id: i32,
    pub product_name: String,
    pub cost_price: f64,
    pub quantity: i32,
    pub total_cost: f64,
    pub date: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpensesInvoiceData {
    pub period: String,
    pub expenses: Vec<Expense>,
    pub total_cost: f64,
}



#[tauri::command]
async fn get_expenses_by_year(
    state: tauri::State<'_, AppState>,
    year: i32,
) -> Result<ExpensesInvoiceData, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        // This query calculates expenses based on initial purchases and any manual quantity updates
        let mut stmt = db.prepare(
           "WITH product_changes AS (
                SELECT 
                    p.id,
                    p.name as product_name,
                    p.cost_price,
                    -- Calculate initial purchase quantity + any manual increases
                    (COALESCE((
                        SELECT SUM(s.quantity) 
                        FROM sales s 
                        WHERE s.product_name = p.name
                    ), 0) + p.quantity) as total_purchased_quantity,
                    p.created_at,
                    p.created_at as date
                FROM products p
                WHERE strftime('%Y', p.created_at) = ?1
            )
            SELECT 
                id,
                product_name,
                cost_price,
                total_purchased_quantity as quantity,
                (cost_price * total_purchased_quantity) as total_cost,
                date,
                created_at
            FROM product_changes
            ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;

        let expense_iter = stmt.query_map(params![format!("{:04}", year)], |row| {
            Ok(Expense {
                id: row.get(0)?,
                product_name: row.get(1)?,
                cost_price: row.get(2)?,
                quantity: row.get(3)?,
                total_cost: row.get(4)?,
                date: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut expenses = Vec::new();
        let mut total_cost = 0.0;

        for expense in expense_iter {
            let expense = expense.map_err(|e| e.to_string())?;
            total_cost += expense.total_cost;
            expenses.push(expense);
        }

        Ok(ExpensesInvoiceData {
            period: year.to_string(),
            expenses,
            total_cost,
        })
    })
}


#[tauri::command]
async fn get_expenses_by_month(
    state: tauri::State<'_, AppState>,
    year: i32,
    month: i32,
) -> Result<ExpensesInvoiceData, String> {
    println!("get_expenses_by_month called with year: {}, month: {}", year, month);
    
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let month_pattern = format!("{:04}-{:02}", year, month);
        println!("Month pattern: {}", month_pattern);
        
        let mut stmt = db.prepare(
           "WITH product_changes AS (
                SELECT 
                    p.id,
                    p.name as product_name,
                    p.cost_price,
                    -- For products created this month: use initial quantity + sales
                    CASE 
                        WHEN strftime('%Y-%m', p.created_at) = ?1 THEN 
                            p.quantity + COALESCE((
                                SELECT SUM(s.quantity) 
                                FROM sales s 
                                WHERE s.product_name = p.name
                                AND strftime('%Y-%m', s.created_at) = ?1
                            ), 0)
                        -- For products created earlier: only count sales from this month
                        ELSE COALESCE((
                            SELECT SUM(s.quantity) 
                            FROM sales s 
                            WHERE s.product_name = p.name
                            AND strftime('%Y-%m', s.created_at) = ?1
                        ), 0)
                    END as monthly_quantity,
                    p.created_at,
                    p.created_at as date
                FROM products p
                WHERE strftime('%Y-%m', p.created_at) = ?1 
                   OR EXISTS (
                       SELECT 1 FROM sales s 
                       WHERE s.product_name = p.name 
                       AND strftime('%Y-%m', s.created_at) = ?1
                   )
            )
            SELECT 
                id,
                product_name,
                cost_price,
                monthly_quantity as quantity,
                (cost_price * monthly_quantity) as total_cost,
                date,
                created_at
            FROM product_changes
            WHERE monthly_quantity > 0
            ORDER BY created_at DESC"
        ).map_err(|e| {
            println!("Error preparing statement: {}", e);
            e.to_string()
        })?;

        println!("Statement prepared successfully");

        // Change here: pass only one parameter instead of multiple copies
        let expense_iter = stmt.query_map(params![month_pattern], |row| {
            Ok(Expense {
                id: row.get(0)?,
                product_name: row.get(1)?,
                cost_price: row.get(2)?,
                quantity: row.get(3)?,
                total_cost: row.get(4)?,
                date: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).map_err(|e| {
            println!("Error querying: {}", e);
            e.to_string()
        })?;

        // ... rest of the function remains the same
        println!("Query executed successfully");

        let mut expenses = Vec::new();
        let mut total_cost = 0.0;

        for expense in expense_iter {
            let expense = expense.map_err(|e| {
                println!("Error mapping row: {}", e);
                e.to_string()
            })?;
            total_cost += expense.total_cost;
            expenses.push(expense);
        }

        println!("Found {} expenses for month {}", expenses.len(), month_pattern);

        let month_names = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];

        Ok(ExpensesInvoiceData {
            period: format!("{} {}", month_names[month as usize - 1], year),
            expenses,
            total_cost,
        })
    })
}
#[tauri::command]
async fn get_expenses_by_day(
    state: tauri::State<'_, AppState>,
    date: String,
) -> Result<ExpensesInvoiceData, String> {
    println!("get_expenses_by_day called with date: {}", date);
    
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let mut stmt = db.prepare(
           "WITH product_changes AS (
                SELECT 
                    p.id,
                    p.name as product_name,
                    p.cost_price,
                    -- For products created today: use initial quantity + sales
                    CASE 
                        WHEN date(p.created_at) = ?1 THEN 
                            p.quantity + COALESCE((
                                SELECT SUM(s.quantity) 
                                FROM sales s 
                                WHERE s.product_name = p.name
                                AND date(s.created_at) = ?1
                            ), 0)
                        -- For products created earlier: only count sales from today
                        ELSE COALESCE((
                            SELECT SUM(s.quantity) 
                            FROM sales s 
                            WHERE s.product_name = p.name
                            AND date(s.created_at) = ?1
                        ), 0)
                    END as daily_quantity,
                    p.created_at,
                    p.created_at as date
                FROM products p
                WHERE date(p.created_at) = ?1 
                   OR EXISTS (
                       SELECT 1 FROM sales s 
                       WHERE s.product_name = p.name 
                       AND date(s.created_at) = ?1
                   )
            )
            SELECT 
                id,
                product_name,
                cost_price,
                daily_quantity as quantity,
                (cost_price * daily_quantity) as total_cost,
                date,
                created_at
            FROM product_changes
            WHERE daily_quantity > 0
            ORDER BY created_at DESC"
        ).map_err(|e| {
            println!("Error preparing statement: {}", e);
            e.to_string()
        })?;

        println!("Statement prepared successfully");

        let expense_iter = stmt.query_map(params![date], |row| {
            Ok(Expense {
                id: row.get(0)?,
                product_name: row.get(1)?,
                cost_price: row.get(2)?,
                quantity: row.get(3)?,
                total_cost: row.get(4)?,
                date: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).map_err(|e| {
            println!("Error querying: {}", e);
            e.to_string()
        })?;

        println!("Query executed successfully");

        let mut expenses = Vec::new();
        let mut total_cost = 0.0;

        for expense in expense_iter {
            let expense = expense.map_err(|e| {
                println!("Error mapping row: {}", e);
                e.to_string()
            })?;
            total_cost += expense.total_cost;
            expenses.push(expense);
        }

        println!("Found {} expenses for date {}", expenses.len(), date);

        Ok(ExpensesInvoiceData {
            period: date,
            expenses,
            total_cost,
        })
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceItem {
    pub id: i32,
    pub client_name: String,
    pub status: String,
    pub product_name: String,
    pub product_image: Option<String>,
    pub quantity: i32,
    pub price: f64,
    pub total_amount: f64,
    pub date: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientInvoiceData {
    pub client_name: String,
    pub period: String,
    pub items: Vec<InvoiceItem>,
    pub total: f64,
    pub credit_total: f64,
    pub paid_total: f64,
}

#[tauri::command]
async fn get_client_invoices_by_year(
    state: tauri::State<'_, AppState>,
    year: i32,
) -> Result<ClientInvoiceData, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let mut stmt = db.prepare(
            "SELECT id, client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at 
             FROM sales 
             WHERE strftime('%Y', date) = ?1 
             ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;
        
        let sale_iter = stmt.query_map(params![format!("{:04}", year)], |row| {
            Ok(InvoiceItem {
                id: row.get(0)?,
                client_name: row.get(1)?,
                status: row.get(2)?,
                product_name: row.get(3)?,
                product_image: row.get(4)?,
                quantity: row.get(5)?,
                price: row.get(6)?,
                total_amount: row.get(7)?,
                date: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| e.to_string())?;
        
        let mut items = Vec::new();
        let mut total = 0.0;
        let mut credit_total = 0.0;
        let mut paid_total = 0.0;
        let mut client_name = String::new();

        for item in sale_iter {
            let item = item.map_err(|e| e.to_string())?;
            if client_name.is_empty() {
                client_name = item.client_name.clone();
            }
            
            total += item.total_amount;
            
            if item.status == "Crédit" {
                credit_total += item.total_amount;
            } else {
                paid_total += item.total_amount;
            }
            
            items.push(item);
        }

        Ok(ClientInvoiceData {
            client_name,
            period: year.to_string(),
            items,
            total,
            credit_total,
            paid_total,
        })
    })
}

#[tauri::command]
async fn get_client_invoices_by_month(
    state: tauri::State<'_, AppState>,
    year: i32,
    month: i32,
) -> Result<ClientInvoiceData, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let month_str = format!("{:04}-{:02}", year, month);
        let mut stmt = db.prepare(
            "SELECT id, client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at 
             FROM sales 
             WHERE strftime('%Y-%m', date) = ?1 
             ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;
        
        let sale_iter = stmt.query_map(params![month_str], |row| {
            Ok(InvoiceItem {
                id: row.get(0)?,
                client_name: row.get(1)?,
                status: row.get(2)?,
                product_name: row.get(3)?,
                product_image: row.get(4)?,
                quantity: row.get(5)?,
                price: row.get(6)?,
                total_amount: row.get(7)?,
                date: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| e.to_string())?;
        
        let mut items = Vec::new();
        let mut total = 0.0;
        let mut credit_total = 0.0;
        let mut paid_total = 0.0;
        let mut client_name = String::new();

        for item in sale_iter {
            let item = item.map_err(|e| e.to_string())?;
            if client_name.is_empty() {
                client_name = item.client_name.clone();
            }
            
            total += item.total_amount;
            
            if item.status == "Crédit" {
                credit_total += item.total_amount;
            } else {
                paid_total += item.total_amount;
            }
            
            items.push(item);
        }

        Ok(ClientInvoiceData {
            client_name,
            period: format!("{:04}-{:02}", year, month),
            items,
            total,
            credit_total,
            paid_total,
        })
    })
}

#[tauri::command]
async fn get_client_invoices(
    state: tauri::State<'_, AppState>,
    client_name: String,
    year: Option<i32>,
    month: Option<i32>,
    date: Option<String>,
) -> Result<ClientInvoiceData, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let mut query = "
            SELECT id, client_name, status, product_name, product_image, 
                   quantity, price, total_amount, date, created_at, updated_at 
            FROM sales 
            WHERE client_name = ?1
        ".to_string();
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(client_name.clone())];
        let mut param_count = 2;
        
        // Use references to avoid moving the values
        if let Some(ref year_val) = year {
            query.push_str(&format!(" AND strftime('%Y', date) = ?{}", param_count));
            params.push(Box::new(format!("{:04}", year_val)));
            param_count += 1;
        }
        
        if let Some(ref month_val) = month {
            query.push_str(&format!(" AND strftime('%m', date) = ?{}", param_count));
            params.push(Box::new(format!("{:02}", month_val)));
            param_count += 1;
        }
        
        if let Some(ref date_val) = date {
            query.push_str(&format!(" AND date = ?{}", param_count));
            params.push(Box::new(date_val.clone()));
            //param_count += 1;
        }
        
        query.push_str(" ORDER BY created_at DESC");
        
        let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;
        
        let sale_iter = stmt.query_map(rusqlite::params_from_iter(params), |row| {
            Ok(InvoiceItem {
                id: row.get(0)?,
                client_name: row.get(1)?,
                status: row.get(2)?,
                product_name: row.get(3)?,
                product_image: row.get(4)?,
                quantity: row.get(5)?,
                price: row.get(6)?,
                total_amount: row.get(7)?,
                date: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| e.to_string())?;
        
        let mut items = Vec::new();
        let mut total = 0.0;
        let mut credit_total = 0.0;
        let mut paid_total = 0.0;

        for item in sale_iter {
            let item = item.map_err(|e| e.to_string())?;
            
            total += item.total_amount;
            
            if item.status == "Crédit" {
                credit_total += item.total_amount;
            } else {
                paid_total += item.total_amount;
            }
            
            items.push(item);
        }

        // Determine period string - now we can use the original values since we used references
        let period = if let Some(year) = year {
            if let Some(month) = month {
                format!("{:04}-{:02}", year, month)
            } else {
                year.to_string()
            }
        } else if let Some(date) = date {
            date.clone() // Clone here since we need to move it
        } else {
            "all".to_string()
        };

        Ok(ClientInvoiceData {
            client_name,
            period,
            items,
            total,
            credit_total,
            paid_total,
        })
    })
}


#[tauri::command]
fn get_system_theme(app_handle: tauri::AppHandle) -> String {
    let config_path = get_config_path(&app_handle);
    
    if let Ok(contents) = fs::read_to_string(&config_path) {
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&contents) {
            if let Some(theme) = config.get("theme").and_then(|v| v.as_str()) {
                return theme.to_string();
            }
        }
    }
    
    "system".to_string()
}

#[tauri::command]
fn set_theme_preference(theme: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let config_path = get_config_path(&app_handle);
    let mut config: serde_json::Value = if config_path.exists() {
        let contents = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse config: {}", e))?
    } else {
        serde_json::json!({})
    };
    
    config["theme"] = Value::String(theme.clone());
    
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    
    fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap())
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

fn get_config_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle.path().app_config_dir().unwrap();
    app_dir.join("config.json")
}
#[derive(Debug, Serialize, Deserialize)]
struct Product {
    id: Option<i32>,
    name: String,
    price: f64,
    quantity: i32,
    #[serde(rename = "costPrice")]
    cost_price: f64,
    brand: String,
    material: String,
    image: Option<String>,
    created_at: Option<String>,
    updated_at: Option<String>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct Metric {
    pub title: String,
    pub value: String,
 
    pub icon: String,
    pub color: String,
}


#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i32,
    username: String,
    password: String,
}
#[derive(Debug, Serialize, Deserialize)]
struct Order {
    client_name: String,
    status: String,
    product_name: String,
    date: String,
    quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthSession {
    token: String,
    expires_at: String,
}

struct AppState {
    db: Mutex<Connection>,
}
// Add to your existing structs
#[derive(Debug, Serialize, Deserialize)]
pub struct Sale {
    id: i32,
    client_name: String,
    status: String,
    product_name: String,
    product_image: Option<String>,
    quantity: i32,
    price: f64,
    total_amount: f64,
    date: String,
    created_at: String,
    updated_at: String,
}
#[tauri::command]
async fn change_password(
    state: tauri::State<'_, AppState>,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    let mut db_lock = state.db.lock().await;
    let db = &mut *db_lock;

    task::block_in_place(|| {
        // Get the current user (assuming there's only one admin user for now)
        let user: User = db.query_row(
            "SELECT id, username, password FROM users WHERE username = 'ahmed'",
            [],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    password: row.get(2)?,
                })
            }
        ).map_err(|e| format!("Failed to fetch user: {}", e))?;

        // Verify current password
        match password_utils::verify_password(&user.password, &current_password) {
            Ok(true) => {
                // Current password is correct
                if new_password.len() < 8 {
                    return Err("Password must be at least 8 characters".to_string());
                }

                // Hash the new password
                let hashed_new_password = password_utils::hash_password(&new_password)
                    .map_err(|e| format!("Failed to hash new password: {}", e))?;

                // Update the password in database
                db.execute(
                    "UPDATE users SET password = ?1 WHERE id = ?2",
                    params![hashed_new_password, user.id],
                ).map_err(|e| format!("Failed to update password: {}", e))?;

                Ok(())
            }
            Ok(false) => Err("Current password is incorrect".to_string()),
            Err(e) => Err(format!("Password verification failed: {}", e)),
        }
    })
}
// Add this command to fetch sales
#[tauri::command]
async fn get_sales(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Sale>, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        let mut stmt = db.prepare(
            "SELECT id, client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at 
             FROM sales ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;
        
        let sale_iter = stmt.query_map([], |row| {
            Ok(Sale {
                id: row.get(0)?,
                client_name: row.get(1)?,
                status: row.get(2)?,
                product_name: row.get(3)?,
                product_image: row.get(4)?,
                quantity: row.get(5)?,
                price: row.get(6)?,
                total_amount: row.get(7)?,
                date: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|e| e.to_string())?;
        
        let mut sales = Vec::new();
        for sale in sale_iter {
            sales.push(sale.map_err(|e| e.to_string())?);
        }
        
        Ok(sales)
    })
}

// Add this command to update a sale
#[tauri::command]
async fn update_sale(
    state: tauri::State<'_, AppState>,
    id: i32,
    client_name: String,
    status: String,
    product_name: String,
    date: String,
    quantity: i32,
) -> Result<(), String> {
    let mut db_lock = state.db.lock().await;
    let db = &mut *db_lock;

    task::block_in_place(|| {
        // First get the original sale to check product changes
        let original_sale: Sale = db.query_row(
            "SELECT id, client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at 
             FROM sales WHERE id = ?1",
            params![id],
            |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    client_name: row.get(1)?,
                    status: row.get(2)?,
                    product_name: row.get(3)?,
                    product_image: row.get(4)?,
                    quantity: row.get(5)?,
                    price: row.get(6)?,
                    total_amount: row.get(7)?,
                    date: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            }
        ).map_err(|e| e.to_string())?;

        // If product changed, we need to get the new product details
        let (price, product_image) = if original_sale.product_name != product_name {
            let product: Product = db.query_row(
                "SELECT price, image FROM products WHERE name = ?1",
                params![product_name],
                |row| {
                    Ok(Product {
                        id: None,
                        name: product_name.clone(),
                        price: row.get(0)?,
                        quantity: 0, // Not needed
                        cost_price: 0.0, // Not needed
                        brand: String::new(), // Not needed
                        material: String::new(), // Not needed
                        image: row.get(1)?,
                        created_at: None,
                        updated_at: None,
                    })
                }
            ).map_err(|e| e.to_string())?;
            
            (product.price, product.image)
        } else {
            (original_sale.price, original_sale.product_image)
        };

        let total_amount = price * quantity as f64;
        let now = Utc::now().to_rfc3339();

        // Update the sale
        db.execute(
            "UPDATE sales SET client_name = ?1, status = ?2, product_name = ?3, 
             product_image = ?4, quantity = ?5, price = ?6, total_amount = ?7, 
             date = ?8, updated_at = ?9 WHERE id = ?10",
            params![
                client_name,
                status,
                product_name,
                product_image,
                quantity,
                price,
                total_amount,
                date,
                now,
                id,
            ],
        ).map_err(|e| e.to_string())?;

        // If product or quantity changed, update product inventory
        if original_sale.product_name != product_name || original_sale.quantity != quantity {
            // First return the original quantity to the original product
            if original_sale.product_name != product_name {
                db.execute(
                    "UPDATE products SET quantity = quantity + ?1 WHERE name = ?2",
                    params![original_sale.quantity, original_sale.product_name],
                ).map_err(|e| e.to_string())?;
            }
            
            // Then subtract the new quantity from the new product
            db.execute(
                "UPDATE products SET quantity = quantity - ?1 WHERE name = ?2",
                params![quantity, product_name],
            ).map_err(|e| e.to_string())?;
        } else if original_sale.quantity != quantity {
            // Only quantity changed for the same product
            let quantity_diff = original_sale.quantity - quantity;
            db.execute(
                "UPDATE products SET quantity = quantity + ?1 WHERE name = ?2",
                params![quantity_diff, product_name],
            ).map_err(|e| e.to_string())?;
        }

        Ok(())
    })
}

// Add this command to delete a sale
#[tauri::command]
async fn delete_sale(
    state: tauri::State<'_, AppState>,
    id: i32,
) -> Result<(), String> {
    let mut db_lock = state.db.lock().await;
    let db = &mut *db_lock;

    task::block_in_place(|| {
        // First get the sale to return the quantity to the product
        let sale: Sale = db.query_row(
            "SELECT product_name, quantity FROM sales WHERE id = ?1",
            params![id],
            |row| {
                Ok(Sale {
                    id: 0,
                    client_name: String::new(),
                    status: String::new(),
                    product_name: row.get(0)?,
                    product_image: None,
                    quantity: row.get(1)?,
                    price: 0.0,
                    total_amount: 0.0,
                    date: String::new(),
                    created_at: String::new(),
                    updated_at: String::new(),
                })
            }
        ).map_err(|e| e.to_string())?;

        // Return the quantity to the product
        db.execute(
            "UPDATE products SET quantity = quantity + ?1 WHERE name = ?2",
            params![sale.quantity, sale.product_name],
        ).map_err(|e| e.to_string())?;

        // Delete the sale
        db.execute(
            "DELETE FROM sales WHERE id = ?1",
            params![id],
        ).map_err(|e| e.to_string())?;

        Ok(())
    })
}
mod password_utils {
    use super::*;

    pub fn hash_password(password: &str) -> Result<String, Box<dyn Error + Send + Sync>> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        Ok(argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| Box::new(e) as Box<dyn Error + Send + Sync>)?
            .to_string())
    }

    pub fn verify_password(
        stored_hash: &str,
        attempted_password: &str,
    ) -> Result<bool, Box<dyn Error + Send + Sync>> {
        let parsed_hash = PasswordHash::new(stored_hash)
            .map_err(|e| Box::new(e) as Box<dyn Error + Send + Sync>)?;
        Ok(Argon2::default()
            .verify_password(attempted_password.as_bytes(), &parsed_hash)
            .is_ok())
    }
}

fn clear_session() -> std::io::Result<()> {
    if std::path::Path::new("session.json").exists() {
        fs::remove_file("session.json")?;
    }
    Ok(())
}

#[tauri::command]
async fn logout() -> Result<(), String> {
    clear_session().map_err(|e| e.to_string())
}

fn load_session() -> Option<AuthSession> {
    match fs::read_to_string("session.json") {
        Ok(contents) => serde_json::from_str(&contents).ok(),
        Err(_) => None,
    }
}

#[tauri::command]
async fn check_session() -> bool {
    if let Some(session) = load_session() {
        if let Ok(expires_at) = session.expires_at.parse::<chrono::DateTime<chrono::Utc>>() {
            let now = chrono::Utc::now();
            return now < expires_at;
        }
    }
    false
}

fn is_users_table_empty(conn: &Connection) -> Result<bool, rusqlite::Error> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users",
        [],
        |row| row.get(0),
    )?;
    println!("User count in table: {}", count);
    Ok(count == 0)
}

fn generate_session_token() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    format!("{:x}", rng.gen::<u128>())
}

fn save_session(session: &AuthSession) -> std::io::Result<()> {
    let session_json = serde_json::to_string(session)?;
    fs::write("session.json", session_json)
}

#[tauri::command]
async fn authenticate(
    state: tauri::State<'_, AppState>,
    username: String,
    password: String,
) -> Result<AuthSession, String> {
    println!("Authentication attempt for: {}", username);
    
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    let user_result = task::block_in_place(|| {
        match db.query_row(
            "SELECT id, username, password FROM users WHERE username = ?1",
            params![username],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    password: row.get(2)?,
                })
            }
        ) {
            Ok(user) => Ok(Some(user)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }).map_err(|e| e.to_string())?;

   match user_result {
        Some(user) => {
            println!("User found: {:?}", user);
            match password_utils::verify_password(&user.password, &password) {
                Ok(true) => {
                    let session = AuthSession {
                        token: generate_session_token(),
                         expires_at: (chrono::Utc::now() + chrono::Duration::days(30)).to_rfc3339(),
                    };
                    save_session(&session).map_err(|e| e.to_string())?;
                    Ok(session)
                }
                Ok(false) => Err("Invalid password".to_string()),
                Err(e) => Err(format!("Password verification failed: {}", e)),
            }
        },
        None => {
            println!("User not found");
            Err("Authentication failed - user not found".to_string())
        }
    }
}

// Product-related commands
#[tauri::command]
async fn add_product(
    state: tauri::State<'_, AppState>,
    product: Product,
) -> Result<i64, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    task::block_in_place(|| {
        let now = Utc::now().to_rfc3339();
        db.execute(
            "INSERT INTO products (name, price, quantity, cost_price, brand, material, image, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                product.name,
                product.price,
                product.quantity,
                product.cost_price,
                product.brand,
                product.material,
                product.image,
                now,
                now,
            ],
        ).map_err(|e| e.to_string())?;
        
        Ok(db.last_insert_rowid())
    })
}

#[tauri::command]
async fn get_products(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Product>, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    task::block_in_place(|| {
        let mut stmt = db.prepare(
            "SELECT id, name, price, quantity, cost_price, brand, material, image, created_at, updated_at 
             FROM products ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;
        
        let product_iter = stmt.query_map([], |row| {
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                quantity: row.get(3)?,
                cost_price: row.get(4)?,
                brand: row.get(5)?,
                material: row.get(6)?,
                image: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        }).map_err(|e| e.to_string())?;
        
        let mut products = Vec::new();
        for product in product_iter {
            products.push(product.map_err(|e| e.to_string())?);
        }
        
        Ok(products)
    })
}

#[tauri::command]
async fn delete_product(
    state: tauri::State<'_, AppState>,
    id: i32,
) -> Result<(), String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    task::block_in_place(|| {
        db.execute(
            "DELETE FROM products WHERE id = ?1",
            params![id],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    })
}
// Remove this duplicate function:
#[tauri::command]
async fn get_metrics101(state: tauri::State<'_, AppState>) -> Result<Vec<Metric>, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        fn format_number(num: f64) -> String {
            let num_str = format!("{:.0}", num);
            let mut result = String::new();
            let chars: Vec<char> = num_str.chars().collect();
            let len = chars.len();
            
            for (i, c) in chars.into_iter().enumerate() {
                if (len - i) % 3 == 0 && i != 0 {
                    result.push(' ');
                }
                result.push(c);
            }
            result
        }

        let products_count: i64 = db.query_row(
            "SELECT COUNT(*) FROM products",
            [],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;

        let gains: f64 = db.query_row(
            "SELECT COALESCE(SUM(total_amount), 0) FROM sales",
            [],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;

        // Corrected expenses calculation
        // 1. Cost of current inventory
        let current_inventory_cost: f64 = db.query_row(
            "SELECT COALESCE(SUM(cost_price * quantity), 0) FROM products",
            [],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;

        // 2. Cost of all sold products
        let sold_products_cost: f64 = db.query_row(
            "SELECT COALESCE(SUM(s.quantity * p.cost_price), 0)
             FROM sales s
             JOIN products p ON s.product_name = p.name",
            [],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;

        // 3. Total expenses = cost of current inventory + cost of sold products
        let expenses = current_inventory_cost + sold_products_cost;

        let benefits = gains - expenses;

        let metrics = vec![
            Metric {
                title: " Gains Total".to_string(),
                value: format!("{} TND", format_number(gains)),
             
                icon: "💰".to_string(),
                color: "bg-green-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200".to_string(),
            },
            Metric {
                title: "Produits Total".to_string(),
                value: format_number(products_count as f64),
            
                icon: "📦".to_string(),
                color: "bg-blue-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200".to_string(),
            },
            Metric {
                title: "Dépenses Total".to_string(),
                value: format!("{} TND", format_number(expenses)),
            
                icon: "💸".to_string(),
                color: "bg-red-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200".to_string(),
            },
            Metric {
                title: "Bénéfice Total".to_string(),
                value: format!("{} TND", format_number(benefits)),
              
                icon: "📈".to_string(),
                color: "bg-purple-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200".to_string(),
            },
        ];

        Ok(metrics)
    })
}


#[tauri::command]
async fn update_product(
    state: tauri::State<'_, AppState>,
    id: i32,
    product: Product,
) -> Result<(), String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    task::block_in_place(|| {
        let now = Utc::now().to_rfc3339();
        db.execute(
            "UPDATE products SET name = ?1, price = ?2, quantity = ?3, cost_price = ?4, 
             brand = ?5, material = ?6, image = ?7, updated_at = ?8 WHERE id = ?9",
            params![
                product.name,
                product.price,
                product.quantity,
                product.cost_price,
                product.brand,
                product.material,
                product.image,
                now,
                id,
            ],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    })
}
#[tauri::command]
async fn get_product(
    state: tauri::State<'_, AppState>,
    id: i32,
) -> Result<Product, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;
    
    task::block_in_place(|| {
        db.query_row(
            "SELECT id, name, price, quantity, cost_price, brand, material, image, created_at, updated_at 
             FROM products WHERE id = ?1",
            params![id],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    price: row.get(2)?,
                    quantity: row.get(3)?,
                    cost_price: row.get(4)?,
                    brand: row.get(5)?,
                    material: row.get(6)?,
                    image: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            }
        ).map_err(|e| e.to_string())
    })
}
#[tauri::command]
async fn save_order(
    state: tauri::State<'_, AppState>,
    order: Order,
) -> Result<i64, String> {
    let mut db_lock = state.db.lock().await;
    let db = &mut *db_lock;

    task::block_in_place(|| {
        println!("Starting order save for client: {}, product: {}", order.client_name, order.product_name);
        
        let tx = db.transaction().map_err(|e| {
            println!("Transaction creation failed: {}", e);
            e.to_string()
        })?;

        // Get product details
        let product_result: Result<Product, rusqlite::Error> = tx.query_row(
            "SELECT id, name, price, quantity, cost_price, brand, material, image 
             FROM products WHERE name = ?1",
            params![order.product_name],
            |row| {
                Ok(Product {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    price: row.get(2)?,
                    quantity: row.get(3)?,
                    cost_price: row.get(4)?,
                    brand: row.get(5)?,
                    material: row.get(6)?,
                    image: row.get(7)?,
                    created_at: None,
                    updated_at: None,
                })
            }
        );

        let product = match product_result {
            Ok(p) => {
                println!("Product found: {} (ID: {}), Quantity: {}", p.name, p.id.unwrap_or(-1), p.quantity);
                p
            },
            Err(e) => {
                println!("Product lookup failed for '{}': {}", order.product_name, e);
                return Err(format!("Product '{}' not found: {}", order.product_name, e));
            }
        };

        // Check sufficient quantity
        if product.quantity < order.quantity {
            println!("Insufficient quantity: Available {}, Requested {}", product.quantity, order.quantity);
            return Err(format!("Insufficient product quantity. Available: {}, Requested: {}", product.quantity, order.quantity));
        }

        // Calculate total amount
        let total_amount = product.price * order.quantity as f64;
        println!("Total amount calculated: {}", total_amount);

        // Insert into sales
        let now = Utc::now().to_rfc3339();
        let insert_result = tx.execute(
            "INSERT INTO sales (client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                order.client_name,
                order.status,
                order.product_name,
                product.image,
                order.quantity,
                product.price,
                total_amount,
                order.date,
                now,
                now,
            ],
        );

        match insert_result {
            Ok(rows_affected) => {
                println!("Sales insert successful, rows affected: {}", rows_affected);
            },
            Err(e) => {
                println!("Sales insert failed: {}", e);
                return Err(format!("Failed to insert sale: {}", e));
            }
        }

        // Get the last inserted row ID
        let sales_id = tx.last_insert_rowid();
        println!("Last insert ID: {}", sales_id);

        // Update product quantity
        let update_result = tx.execute(
            "UPDATE products SET quantity = quantity - ?1 WHERE id = ?2",
            params![order.quantity, product.id.unwrap()],
        );

        match update_result {
            Ok(rows_affected) => {
                println!("Product quantity updated, rows affected: {}", rows_affected);
            },
            Err(e) => {
                println!("Product update failed: {}", e);
                return Err(format!("Failed to update product quantity: {}", e));
            }
        }

        // Commit transaction
        match tx.commit() {
            Ok(_) => {
                println!("Transaction committed successfully");
                Ok(sales_id)
            },
            Err(e) => {
                println!("Transaction commit failed: {}", e);
                Err(format!("Transaction failed: {}", e))
            }
        }
    })
}


#[tauri::command]
async fn get_sale_by_id(
    state: tauri::State<'_, AppState>,
    id: i32,
) -> Result<Sale, String> {
    let db_lock = state.db.lock().await;
    let db = &*db_lock;

    task::block_in_place(|| {
        db.query_row(
            "SELECT id, client_name, status, product_name, product_image, 
             quantity, price, total_amount, date, created_at, updated_at 
             FROM sales WHERE id = ?1",
            params![id],
            |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    client_name: row.get(1)?,
                    status: row.get(2)?,
                    product_name: row.get(3)?,
                    product_image: row.get(4)?,
                    quantity: row.get(5)?,
                    price: row.get(6)?,
                    total_amount: row.get(7)?,
                    date: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            }
        ).map_err(|e| e.to_string())
    })
}

fn initialize_database() -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open("app.db")?;
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    // Create users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        ) STRICT",
        [],
    )?;
    
    // Create products table
conn.execute(
    "CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,  -- Added UNIQUE constraint here
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        cost_price REAL NOT NULL,
        brand TEXT NOT NULL,
        material TEXT NOT NULL,
        image TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    ) STRICT",
    [],
)?;
    // Add this to your initialize_database function
conn.execute(
    "CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        status TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total_amount REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    ) STRICT",
    [],
)?;

    if is_users_table_empty(&conn)? {
        println!("Inserting default user");
        let hashed_password = password_utils::hash_password("x")
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(e.into()))?;
        
        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            params!["WaelFarhat2.0@gmail.com", hashed_password],
        )?;
    }
    
    Ok(conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_connection = match initialize_database() {
        Ok(conn) => {
            println!("Database initialized successfully");
            conn
        },
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        
        .manage(AppState {
            db: Mutex::new(db_connection),
        })
        .invoke_handler(tauri::generate_handler![
            authenticate, 
            check_session, 
            logout, 
            add_product, 
            get_products, 
            delete_product, 
            update_product,
            get_product,
            get_metrics101,
            save_order,
             get_sales,      
    update_sale,    
    delete_sale, get_sale_by_id,change_password,
    get_system_theme, set_theme_preference
,   get_client_invoices_by_year,     
    get_client_invoices_by_month,   
    get_client_invoices,  
       get_expenses_by_year,
    get_expenses_by_month,
    get_expenses_by_day,          
        ])
        .setup(|_app| {
            println!("App initialization complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}