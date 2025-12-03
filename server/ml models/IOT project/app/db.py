from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any

from .config import DB_PATH


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS faces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            embedding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS food_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            image_path TEXT NOT NULL,
            results_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        """
    )
    conn.commit()
    conn.close()


def get_or_create_user(name: str) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE name = ?", (name,))
    row = cur.fetchone()
    if row:
        user_id = row[0]
    else:
        cur.execute("INSERT INTO users(name) VALUES (?)", (name,))
        user_id = cur.lastrowid
        conn.commit()
    conn.close()
    return user_id


def save_face(user_id: int, image_path: str, embedding: list[float]) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO faces(user_id, image_path, embedding) VALUES (?, ?, ?)",
        (user_id, image_path, json.dumps(embedding)),
    )
    face_id = cur.lastrowid
    conn.commit()
    conn.close()
    return face_id


def get_all_faces() -> list[dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT faces.id, users.id, users.name, faces.image_path, faces.embedding FROM faces JOIN users ON users.id = faces.user_id"
    )
    rows = cur.fetchall()
    conn.close()
    out = []
    for fid, uid, name, path, emb in rows:
        out.append({
            "face_id": fid,
            "user_id": uid,
            "name": name,
            "image_path": path,
            "embedding": json.loads(emb),
        })
    return out


def save_food_scan(user_id: Optional[int], image_path: str, results: dict) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO food_scans(user_id, image_path, results_json) VALUES (?, ?, ?)",
        (user_id, image_path, json.dumps(results)),
    )
    scan_id = cur.lastrowid
    conn.commit()
    conn.close()
    return scan_id
