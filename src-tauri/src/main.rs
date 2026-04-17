#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Clone)]
struct SeedProject {
    id: &'static str,
    name: &'static str,
    client: &'static str,
    stack: &'static [&'static str],
    priority: &'static str,
    status: &'static str,
    summary: &'static str,
    milestone: &'static str,
}

#[derive(Clone)]
struct SeedTask {
    id: &'static str,
    title: &'static str,
    done: bool,
    project_id: &'static str,
    urgency: &'static str,
}

#[derive(Clone)]
struct SeedAgent {
    id: &'static str,
    name: &'static str,
    role: &'static str,
    status: &'static str,
    current_task: &'static str,
    project_id: &'static str,
    runtime: &'static str,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectWithProgress {
    id: String,
    name: String,
    client: String,
    stack: Vec<String>,
    priority: String,
    progress: i64,
    status: String,
    summary: String,
    milestone: String,
    archived_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TaskItem {
    id: String,
    title: String,
    done: bool,
    project_id: String,
    urgency: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LocalAgent {
    id: String,
    name: String,
    role: String,
    status: String,
    current_task: String,
    project_id: String,
    runtime: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UserSnapshot {
    developer: String,
    sprint: String,
    focus_score: i64,
    completed_this_week: i64,
    active_projects: i64,
    next_deadline: String,
    completion_rate: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectInput {
    name: String,
    client: String,
    stack: Vec<String>,
    priority: String,
    status: String,
    summary: String,
    milestone: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateProjectInput {
    name: Option<String>,
    client: Option<String>,
    stack: Option<Vec<String>>,
    priority: Option<String>,
    status: Option<String>,
    summary: Option<String>,
    milestone: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateTaskInput {
    title: String,
    project_id: String,
    urgency: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateTaskInput {
    title: Option<String>,
    done: Option<bool>,
    project_id: Option<String>,
    urgency: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateAgentInput {
    role: Option<String>,
    status: Option<String>,
    current_task: Option<String>,
    project_id: Option<String>,
    runtime: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateAgentInput {
    name: String,
    role: String,
    status: String,
    current_task: String,
    project_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateUserSnapshotInput {
    developer: Option<String>,
    sprint: Option<String>,
    focus_score: Option<i64>,
    next_deadline: Option<String>,
}

#[derive(Clone)]
struct ProjectRecord {
    name: String,
    client: String,
    stack: String,
    priority: String,
    status: String,
    summary: String,
    milestone: String,
    archived_at: Option<String>,
}

fn ensure_project_archive_column(connection: &Connection) -> Result<(), String> {
    let mut statement = connection
        .prepare("PRAGMA table_info(projects)")
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?;
    let columns = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    if !columns.iter().any(|column| column == "archived_at") {
        connection
            .execute("ALTER TABLE projects ADD COLUMN archived_at TEXT", [])
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[derive(Clone)]
struct UserSnapshotRecord {
    developer: String,
    sprint: String,
    focus_score: i64,
    next_deadline: String,
}

fn configure_linux_graphics_runtime() {
    #[cfg(target_os = "linux")]
    {
        if env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }

        if env::var_os("LIBGL_KOPPER_DISABLE").is_none() {
            env::set_var("LIBGL_KOPPER_DISABLE", "true");
        }

        if env::var("MISSION_CONTROL_SOFTWARE_RENDERING")
            .map(|value| value == "1")
            .unwrap_or(false)
        {
            env::set_var("LIBGL_ALWAYS_SOFTWARE", "1");

            if env::var_os("GSK_RENDERER").is_none() {
                env::set_var("GSK_RENDERER", "cairo");
            }
        }
    }
}

fn now_string() -> String {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs().to_string(),
        Err(_) => "0".to_string(),
    }
}

fn parse_stack(serialized: &str) -> Vec<String> {
    serde_json::from_str(serialized).unwrap_or_default()
}

fn serialize_stack(stack: &[String]) -> Result<String, String> {
    serde_json::to_string(stack).map_err(|error| error.to_string())
}

fn seed_projects() -> Vec<SeedProject> {
    vec![
        SeedProject {
            id: "studio",
            name: "Studio Pulse",
            client: "Internal",
            stack: &["React", "Vite", "TypeScript"],
            priority: "high",
            status: "in-progress",
            summary: "Dashboard produit avec orchestration locale des agents de build.",
            milestone: "UI freeze jeudi 18:00",
        },
        SeedProject {
            id: "commerce",
            name: "Commerce Edge",
            client: "Northwind",
            stack: &["Next.js", "Stripe", "Postgres"],
            priority: "medium",
            status: "review",
            summary: "Corrections checkout et reprise des métriques de conversion.",
            milestone: "QA paiement demain matin",
        },
        SeedProject {
            id: "infra",
            name: "Infra Watch",
            client: "Ops team",
            stack: &["Node", "Grafana", "Docker"],
            priority: "high",
            status: "blocked",
            summary: "Visibilité sur les agents locaux et relance des workers bloqués.",
            milestone: "Dépendance logs système",
        },
    ]
}

fn seed_tasks() -> Vec<SeedTask> {
    vec![
        SeedTask {
            id: "t1",
            title: "Finaliser la navigation dashboard",
            done: true,
            project_id: "studio",
            urgency: "today",
        },
        SeedTask {
            id: "t2",
            title: "Intégrer les menus statut et priorité",
            done: true,
            project_id: "studio",
            urgency: "today",
        },
        SeedTask {
            id: "t3",
            title: "Valider la modal de création projet",
            done: false,
            project_id: "studio",
            urgency: "week",
        },
        SeedTask {
            id: "t4",
            title: "Relire le flux checkout avec QA",
            done: true,
            project_id: "commerce",
            urgency: "week",
        },
        SeedTask {
            id: "t5",
            title: "Corriger les retours de review sur le checkout",
            done: false,
            project_id: "commerce",
            urgency: "today",
        },
        SeedTask {
            id: "t6",
            title: "Débloquer la collecte des logs agents",
            done: false,
            project_id: "infra",
            urgency: "today",
        },
        SeedTask {
            id: "t7",
            title: "Mapper les erreurs runtime des workers",
            done: false,
            project_id: "infra",
            urgency: "week",
        },
        SeedTask {
            id: "t8",
            title: "Préparer le patch de supervision locale",
            done: true,
            project_id: "infra",
            urgency: "week",
        },
    ]
}

fn seed_agents() -> Vec<SeedAgent> {
    vec![
        SeedAgent {
            id: "a1",
            name: "openclaw",
            role: "Code worker",
            status: "active",
            current_task: "Intègre la TDL au board Studio Pulse",
            project_id: "studio",
            runtime: "01h 24",
        },
        SeedAgent {
            id: "a2",
            name: "watchtower",
            role: "Observability",
            status: "blocked",
            current_task: "Attend les logs Docker de Infra Watch",
            project_id: "infra",
            runtime: "00h 48",
        },
        SeedAgent {
            id: "a3",
            name: "mercury",
            role: "Release helper",
            status: "idle",
            current_task: "Prêt pour la prochaine preview e-commerce",
            project_id: "commerce",
            runtime: "00h 12",
        },
    ]
}

fn app_data_dir() -> Result<PathBuf, String> {
    if let Ok(xdg_data_home) = env::var("XDG_DATA_HOME") {
        return Ok(PathBuf::from(xdg_data_home).join("mission-control"));
    }

    if let Ok(home) = env::var("HOME") {
        return Ok(PathBuf::from(home).join(".local/share/mission-control"));
    }

    Err("HOME or XDG_DATA_HOME is required".to_string())
}

fn desktop_db_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("mission-control.sqlite"))
}

fn legacy_db_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../server/data/mission-control.sqlite")
}

fn open_connection() -> Result<Connection, String> {
    let db_path = desktop_db_path()?;
    let parent = db_path
        .parent()
        .ok_or_else(|| "Invalid desktop database path".to_string())?;

    fs::create_dir_all(parent).map_err(|error| error.to_string())?;

    if !db_path.exists() {
        let legacy = legacy_db_path();
        if legacy.exists() {
            fs::copy(legacy, &db_path).map_err(|error| error.to_string())?;
        }
    }

    let connection = Connection::open(&db_path).map_err(|error| error.to_string())?;
    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| error.to_string())?;
    init_database(&connection)?;
    Ok(connection)
}

fn init_database(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS projects (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              client TEXT NOT NULL,
              stack TEXT NOT NULL,
              priority TEXT NOT NULL,
              status TEXT NOT NULL,
              summary TEXT NOT NULL,
              milestone TEXT NOT NULL,
              archived_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              done INTEGER NOT NULL DEFAULT 0,
              project_id TEXT NOT NULL,
              urgency TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS agents (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              role TEXT NOT NULL,
              status TEXT NOT NULL,
              current_task TEXT NOT NULL,
              project_id TEXT NOT NULL,
              runtime TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS user_snapshot (
              id TEXT PRIMARY KEY,
              developer TEXT NOT NULL,
              sprint TEXT NOT NULL,
              focus_score INTEGER NOT NULL,
              next_deadline TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            ",
        )
        .map_err(|error| error.to_string())?;

    ensure_project_archive_column(connection)?;

    let project_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if project_count > 0 {
        return Ok(());
    }

    let timestamp = now_string();

    for project in seed_projects() {
        connection
            .execute(
                "INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, archived_at, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    project.id,
                    project.name,
                    project.client,
                    serde_json::to_string(project.stack).map_err(|error| error.to_string())?,
                    project.priority,
                    project.status,
                    project.summary,
                    project.milestone,
                    Option::<String>::None,
                    timestamp,
                    timestamp
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    for task in seed_tasks() {
        connection
            .execute(
                "INSERT INTO tasks (id, title, done, project_id, urgency, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    task.id,
                    task.title,
                    if task.done { 1 } else { 0 },
                    task.project_id,
                    task.urgency,
                    timestamp,
                    timestamp
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    for agent in seed_agents() {
        connection
            .execute(
                "INSERT INTO agents (id, name, role, status, current_task, project_id, runtime, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    agent.id,
                    agent.name,
                    agent.role,
                    agent.status,
                    agent.current_task,
                    agent.project_id,
                    agent.runtime,
                    timestamp
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    connection
        .execute(
            "INSERT INTO user_snapshot (id, developer, sprint, focus_score, next_deadline, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                Uuid::new_v4().to_string(),
                "Developer",
                "Current Sprint",
                76,
                "Upcoming milestone",
                timestamp
            ],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn get_project_record(
    connection: &Connection,
    project_id: &str,
) -> Result<Option<ProjectRecord>, String> {
    connection
        .query_row(
            "SELECT name, client, stack, priority, status, summary, milestone, archived_at FROM projects WHERE id = ?1",
            [project_id],
            |row| {
                Ok(ProjectRecord {
                    name: row.get(0)?,
                    client: row.get(1)?,
                    stack: row.get(2)?,
                    priority: row.get(3)?,
                    status: row.get(4)?,
                    summary: row.get(5)?,
                    milestone: row.get(6)?,
                    archived_at: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())
}

fn list_tasks(connection: &Connection, project_id: Option<&str>) -> Result<Vec<TaskItem>, String> {
    let sql = if project_id.is_some() {
        "SELECT id, title, done, project_id, urgency FROM tasks WHERE project_id = ?1 ORDER BY created_at ASC"
    } else {
        "SELECT id, title, done, project_id, urgency FROM tasks ORDER BY created_at ASC"
    };

    let mut statement = connection.prepare(sql).map_err(|error| error.to_string())?;
    let mapper = |row: &rusqlite::Row<'_>| {
        Ok(TaskItem {
            id: row.get(0)?,
            title: row.get(1)?,
            done: row.get::<_, i64>(2)? == 1,
            project_id: row.get(3)?,
            urgency: row.get(4)?,
        })
    };

    let rows = if let Some(project_id) = project_id {
        statement
            .query_map([project_id], mapper)
            .map_err(|error| error.to_string())?
    } else {
        statement
            .query_map([], mapper)
            .map_err(|error| error.to_string())?
    };

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn get_task_record(connection: &Connection, task_id: &str) -> Result<Option<TaskItem>, String> {
    connection
        .query_row(
            "SELECT id, title, done, project_id, urgency FROM tasks WHERE id = ?1",
            [task_id],
            |row| {
                Ok(TaskItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    done: row.get::<_, i64>(2)? == 1,
                    project_id: row.get(3)?,
                    urgency: row.get(4)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())
}

fn list_agents(connection: &Connection) -> Result<Vec<LocalAgent>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, name, role, status, current_task, project_id, runtime FROM agents ORDER BY name ASC",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok(LocalAgent {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                status: row.get(3)?,
                current_task: row.get(4)?,
                project_id: row.get(5)?,
                runtime: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn get_agent_record(connection: &Connection, agent_id: &str) -> Result<Option<LocalAgent>, String> {
    connection
        .query_row(
            "SELECT id, name, role, status, current_task, project_id, runtime FROM agents WHERE id = ?1",
            [agent_id],
            |row| {
                Ok(LocalAgent {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    role: row.get(2)?,
                    status: row.get(3)?,
                    current_task: row.get(4)?,
                    project_id: row.get(5)?,
                    runtime: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())
}

fn get_user_snapshot_record(connection: &Connection) -> Result<Option<UserSnapshotRecord>, String> {
    connection
        .query_row(
            "SELECT developer, sprint, focus_score, next_deadline FROM user_snapshot LIMIT 1",
            [],
            |row| {
                Ok(UserSnapshotRecord {
                    developer: row.get(0)?,
                    sprint: row.get(1)?,
                    focus_score: row.get(2)?,
                    next_deadline: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())
}

fn get_completion_rate(connection: &Connection) -> Result<i64, String> {
    let mut statement = connection
        .prepare("SELECT id FROM projects WHERE archived_at IS NULL")
        .map_err(|error| error.to_string())?;
    let active_project_ids = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?
        .collect::<Result<HashSet<_>, _>>()
        .map_err(|error| error.to_string())?;

    let tasks = list_tasks(connection, None)?
        .into_iter()
        .filter(|task| active_project_ids.contains(&task.project_id))
        .collect::<Vec<_>>();
    if tasks.is_empty() {
        return Ok(0);
    }

    let done_count = tasks.iter().filter(|task| task.done).count() as f64;
    let total_count = tasks.len() as f64;
    Ok(((done_count / total_count) * 100.0).round() as i64)
}

fn get_project_progress(project_id: &str, tasks: &[TaskItem]) -> i64 {
    let related_tasks: Vec<&TaskItem> = tasks
        .iter()
        .filter(|task| task.project_id == project_id)
        .collect();
    if related_tasks.is_empty() {
        return 0;
    }

    let done_count = related_tasks.iter().filter(|task| task.done).count() as f64;
    ((done_count / related_tasks.len() as f64) * 100.0).round() as i64
}

fn sync_project_status(connection: &Connection, project_id: &str) -> Result<(), String> {
    let current = get_project_record(connection, project_id)?
        .ok_or_else(|| "Project not found".to_string())?;
    let tasks = list_tasks(connection, Some(project_id))?;

    if tasks.is_empty() {
        return Ok(());
    }

    let all_done = tasks.iter().all(|task| task.done);
    let current_status = current.status;
    let mut next_status = current_status.clone();

    if all_done && next_status != "done" {
        next_status = "done".to_string();
    } else if !all_done && next_status == "done" {
        next_status = "in-progress".to_string();
    }

    if next_status != current_status {
        connection
            .execute(
                "UPDATE projects SET status = ?1, updated_at = ?2 WHERE id = ?3",
                params![next_status, now_string(), project_id],
            )
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn get_projects_view(connection: &Connection) -> Result<Vec<ProjectWithProgress>, String> {
    get_projects_view_by_archive_state(connection, false)
}

fn get_archived_projects_view(connection: &Connection) -> Result<Vec<ProjectWithProgress>, String> {
    get_projects_view_by_archive_state(connection, true)
}

fn get_projects_view_by_archive_state(
    connection: &Connection,
    archived: bool,
) -> Result<Vec<ProjectWithProgress>, String> {
    let tasks = list_tasks(connection, None)?;
    let query = if archived {
        "SELECT id, name, client, stack, priority, status, summary, milestone, archived_at
         FROM projects
         WHERE archived_at IS NOT NULL
         ORDER BY archived_at DESC, created_at DESC"
    } else {
        "SELECT id, name, client, stack, priority, status, summary, milestone, archived_at
         FROM projects
         WHERE archived_at IS NULL
         ORDER BY created_at ASC"
    };
    let mut statement = connection
        .prepare(query)
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let status: String = row.get(5)?;
            let progress = get_project_progress(&id, &tasks);
            Ok(ProjectWithProgress {
                id,
                name: row.get(1)?,
                client: row.get(2)?,
                stack: parse_stack(&row.get::<_, String>(3)?),
                priority: row.get(4)?,
                progress,
                status,
                summary: row.get(6)?,
                milestone: row.get(7)?,
                archived_at: row.get(8)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn get_project_view(
    connection: &Connection,
    project_id: &str,
) -> Result<ProjectWithProgress, String> {
    get_projects_view(connection)?
        .into_iter()
        .find(|project| project.id == project_id)
        .ok_or_else(|| "Project not found".to_string())
}

fn get_user_snapshot_view(connection: &Connection) -> Result<UserSnapshot, String> {
    let record =
        get_user_snapshot_record(connection)?.ok_or_else(|| "Snapshot not found".to_string())?;
    let completion_rate = get_completion_rate(connection)?;
    let active_projects = get_projects_view(connection)?.len() as i64;

    Ok(UserSnapshot {
        developer: record.developer,
        sprint: record.sprint,
        focus_score: record.focus_score,
        completed_this_week: ((completion_rate as f64 / 100.0) * 12.0).round() as i64,
        active_projects,
        next_deadline: record.next_deadline,
        completion_rate,
    })
}

#[tauri::command]
fn get_projects() -> Result<Vec<ProjectWithProgress>, String> {
    let connection = open_connection()?;
    get_projects_view(&connection)
}

#[tauri::command]
fn get_archived_projects() -> Result<Vec<ProjectWithProgress>, String> {
    let connection = open_connection()?;
    get_archived_projects_view(&connection)
}

#[tauri::command]
fn create_project(input: CreateProjectInput) -> Result<ProjectWithProgress, String> {
    let connection = open_connection()?;
    let timestamp = now_string();
    let project_id = Uuid::new_v4().to_string();
    let name = input.name.trim().chars().take(20).collect::<String>();
    let summary = input.summary.trim().chars().take(96).collect::<String>();

    connection
        .execute(
            "INSERT INTO projects (id, name, client, stack, priority, status, summary, milestone, archived_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                project_id,
                name,
                if input.client.trim().is_empty() { "Projet personnel".to_string() } else { input.client.trim().to_string() },
                serialize_stack(&input.stack)?,
                input.priority,
                input.status,
                if summary.is_empty() { "Aucun résumé pour le moment.".to_string() } else { summary },
                if input.milestone.trim().is_empty() { "Sans échéance définie".to_string() } else { input.milestone.trim().to_string() },
                Option::<String>::None,
                timestamp,
                timestamp
            ],
        )
        .map_err(|error| error.to_string())?;

    get_project_view(&connection, &project_id)
}

#[tauri::command]
fn update_project(
    project_id: String,
    changes: UpdateProjectInput,
) -> Result<ProjectWithProgress, String> {
    let connection = open_connection()?;
    let current = get_project_record(&connection, &project_id)?
        .ok_or_else(|| "Project not found".to_string())?;
    let timestamp = now_string();
    let next_stack = changes.stack.unwrap_or_else(|| parse_stack(&current.stack));
    let next_name = changes
        .name
        .map(|value| value.trim().chars().take(20).collect::<String>())
        .unwrap_or(current.name);
    let next_client = changes
        .client
        .map(|value| {
            if value.trim().is_empty() {
                "Projet personnel".to_string()
            } else {
                value.trim().to_string()
            }
        })
        .unwrap_or(current.client);
    let next_summary = changes
        .summary
        .map(|value| {
            let summary = value.trim().chars().take(96).collect::<String>();
            if summary.is_empty() {
                "Aucun résumé pour le moment.".to_string()
            } else {
                summary
            }
        })
        .unwrap_or(current.summary);
    let next_milestone = changes
        .milestone
        .map(|value| {
            if value.trim().is_empty() {
                "Sans échéance définie".to_string()
            } else {
                value.trim().to_string()
            }
        })
        .unwrap_or(current.milestone);

    connection
        .execute(
            "UPDATE projects
             SET name = ?1, client = ?2, stack = ?3, priority = ?4, status = ?5, summary = ?6, milestone = ?7, archived_at = ?8, updated_at = ?9
             WHERE id = ?10",
            params![
                next_name,
                next_client,
                serialize_stack(&next_stack)?,
                changes.priority.unwrap_or(current.priority),
                changes.status.unwrap_or(current.status),
                next_summary,
                next_milestone,
                current.archived_at,
                timestamp,
                project_id
            ],
        )
        .map_err(|error| error.to_string())?;

    get_project_view(&connection, &project_id)
}

#[tauri::command]
fn delete_project(project_id: String) -> Result<(), String> {
    let connection = open_connection()?;

    connection
        .execute("DELETE FROM projects WHERE id = ?1", [project_id])
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn archive_projects(project_ids: Vec<String>) -> Result<(), String> {
    let connection = open_connection()?;
    let unique_project_ids = project_ids
        .into_iter()
        .collect::<HashSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();

    if unique_project_ids.is_empty() {
        return Err("No projects selected for archive".to_string());
    }

    for project_id in &unique_project_ids {
        let project = get_project_record(&connection, project_id)?
            .ok_or_else(|| "Project not found".to_string())?;
        if project.archived_at.is_some() || project.status != "done" {
            return Err("Only done projects can be archived".to_string());
        }
    }

    let timestamp = now_string();
    for project_id in &unique_project_ids {
        connection
            .execute(
                "UPDATE projects
                 SET archived_at = ?1, updated_at = ?2
                 WHERE id = ?3",
                params![timestamp, timestamp, project_id],
            )
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_tasks(project_id: Option<String>) -> Result<Vec<TaskItem>, String> {
    let connection = open_connection()?;
    list_tasks(&connection, project_id.as_deref())
}

#[tauri::command]
fn create_task(input: CreateTaskInput) -> Result<TaskItem, String> {
    let connection = open_connection()?;
    if get_project_record(&connection, &input.project_id)?.is_none() {
        return Err("Project not found".to_string());
    }

    let task_id = Uuid::new_v4().to_string();
    let timestamp = now_string();
    connection
        .execute(
            "INSERT INTO tasks (id, title, done, project_id, urgency, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                task_id,
                input.title,
                0,
                input.project_id,
                input.urgency.unwrap_or_else(|| "today".to_string()),
                timestamp,
                timestamp
            ],
        )
        .map_err(|error| error.to_string())?;

    sync_project_status(&connection, &input.project_id)?;
    get_task_record(&connection, &task_id)?.ok_or_else(|| "Task not found".to_string())
}

#[tauri::command]
fn update_task(task_id: String, changes: UpdateTaskInput) -> Result<TaskItem, String> {
    let connection = open_connection()?;
    let current =
        get_task_record(&connection, &task_id)?.ok_or_else(|| "Task not found".to_string())?;
    let next_project_id = changes
        .project_id
        .unwrap_or_else(|| current.project_id.clone());

    if get_project_record(&connection, &next_project_id)?.is_none() {
        return Err("Project not found".to_string());
    }

    connection
        .execute(
            "UPDATE tasks
             SET title = ?1, done = ?2, project_id = ?3, urgency = ?4, updated_at = ?5
             WHERE id = ?6",
            params![
                changes.title.unwrap_or(current.title),
                if changes.done.unwrap_or(current.done) {
                    1
                } else {
                    0
                },
                next_project_id,
                changes.urgency.unwrap_or(current.urgency),
                now_string(),
                task_id
            ],
        )
        .map_err(|error| error.to_string())?;

    sync_project_status(&connection, &next_project_id)?;
    get_task_record(&connection, &task_id)?.ok_or_else(|| "Task not found".to_string())
}

#[tauri::command]
fn delete_task(task_id: String) -> Result<(), String> {
    let connection = open_connection()?;
    let current =
        get_task_record(&connection, &task_id)?.ok_or_else(|| "Task not found".to_string())?;

    connection
        .execute("DELETE FROM tasks WHERE id = ?1", [task_id])
        .map_err(|error| error.to_string())?;

    sync_project_status(&connection, &current.project_id)?;
    Ok(())
}

#[tauri::command]
fn get_agents() -> Result<Vec<LocalAgent>, String> {
    let connection = open_connection()?;
    list_agents(&connection)
}

#[tauri::command]
fn create_agent(input: CreateAgentInput) -> Result<LocalAgent, String> {
    let connection = open_connection()?;
    if get_project_record(&connection, &input.project_id)?.is_none() {
        return Err("Project not found".to_string());
    }

    let agent_id = Uuid::new_v4().to_string();
    connection
        .execute(
            "INSERT INTO agents (id, name, role, status, current_task, project_id, runtime, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                agent_id,
                if input.name.trim().is_empty() { "Nouvel agent".to_string() } else { input.name.trim().to_string() },
                if input.role.trim().is_empty() { "Worker local".to_string() } else { input.role.trim().to_string() },
                input.status,
                if input.current_task.trim().is_empty() { "Aucune tâche définie".to_string() } else { input.current_task.trim().to_string() },
                input.project_id,
                "local",
                now_string()
            ],
        )
        .map_err(|error| error.to_string())?;

    get_agent_record(&connection, &agent_id)?.ok_or_else(|| "Agent not found".to_string())
}

#[tauri::command]
fn update_agent(agent_id: String, changes: UpdateAgentInput) -> Result<LocalAgent, String> {
    let connection = open_connection()?;
    let current =
        get_agent_record(&connection, &agent_id)?.ok_or_else(|| "Agent not found".to_string())?;
    let next_project_id = changes
        .project_id
        .unwrap_or_else(|| current.project_id.clone());

    if get_project_record(&connection, &next_project_id)?.is_none() {
        return Err("Project not found".to_string());
    }

    connection
        .execute(
            "UPDATE agents
             SET role = ?1, status = ?2, current_task = ?3, project_id = ?4, runtime = ?5, updated_at = ?6
             WHERE id = ?7",
            params![
                changes.role.unwrap_or(current.role),
                changes.status.unwrap_or(current.status),
                changes.current_task.unwrap_or(current.current_task),
                next_project_id,
                changes.runtime.unwrap_or(current.runtime),
                now_string(),
                agent_id
            ],
        )
        .map_err(|error| error.to_string())?;

    get_agent_record(&connection, &agent_id)?.ok_or_else(|| "Agent not found".to_string())
}

#[tauri::command]
fn get_user_snapshot() -> Result<UserSnapshot, String> {
    let connection = open_connection()?;
    get_user_snapshot_view(&connection)
}

#[tauri::command]
fn update_user_snapshot(changes: UpdateUserSnapshotInput) -> Result<UserSnapshot, String> {
    let connection = open_connection()?;
    let current =
        get_user_snapshot_record(&connection)?.ok_or_else(|| "Snapshot not found".to_string())?;

    connection
        .execute(
            "UPDATE user_snapshot
             SET developer = ?1, sprint = ?2, focus_score = ?3, next_deadline = ?4, updated_at = ?5",
            params![
                changes.developer.unwrap_or(current.developer),
                changes.sprint.unwrap_or(current.sprint),
                changes.focus_score.unwrap_or(current.focus_score),
                changes.next_deadline.unwrap_or(current.next_deadline),
                now_string()
            ],
        )
        .map_err(|error| error.to_string())?;

    get_user_snapshot_view(&connection)
}

fn main() {
    configure_linux_graphics_runtime();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_projects,
            get_archived_projects,
            create_project,
            update_project,
            delete_project,
            archive_projects,
            get_tasks,
            create_task,
            update_task,
            delete_task,
            get_agents,
            create_agent,
            update_agent,
            get_user_snapshot,
            update_user_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mission Control Desktop");
}
