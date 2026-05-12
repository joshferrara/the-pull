package store

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/api"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/config"
	_ "modernc.org/sqlite"
)

type DB struct {
	conn *sql.DB
}

func Open() (*DB, error) {
	dir, err := config.DataDir()
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	path := filepath.Join(dir, "data.db")
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	if err := migrate(conn); err != nil {
		conn.Close()
		return nil, err
	}
	return &DB{conn: conn}, nil
}

func (d *DB) Close() error { return d.conn.Close() }

func migrate(conn *sql.DB) error {
	_, err := conn.Exec(`
CREATE TABLE IF NOT EXISTS saved_items (
  item_id TEXT PRIMARY KEY,
  brief_date TEXT NOT NULL,
  title TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  cached_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS read_state (
  item_id TEXT PRIMARY KEY,
  brief_date TEXT NOT NULL,
  read_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pending_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_json TEXT NOT NULL,
  queued_at INTEGER NOT NULL
);`)
	return err
}

func (d *DB) ToggleSave(item api.BriefItem, briefDate string) (saved bool, err error) {
	var exists int
	if err = d.conn.QueryRow(`SELECT 1 FROM saved_items WHERE item_id = ?`, item.ID).
		Scan(&exists); err == nil {
		_, err = d.conn.Exec(`DELETE FROM saved_items WHERE item_id = ?`, item.ID)
		return false, err
	}
	if err == sql.ErrNoRows {
		raw, err := json.Marshal(item)
		if err != nil {
			return false, err
		}
		_, err = d.conn.Exec(`INSERT INTO saved_items (item_id, brief_date, title, saved_at, cached_json)
			VALUES (?, ?, ?, ?, ?)`,
			item.ID, briefDate, item.Title, time.Now().Unix(), string(raw))
		return true, err
	}
	return false, err
}

func (d *DB) IsSaved(itemID string) (bool, error) {
	var x int
	err := d.conn.QueryRow(`SELECT 1 FROM saved_items WHERE item_id = ?`, itemID).Scan(&x)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

type SavedItem struct {
	BriefDate string
	Item      api.BriefItem
	SavedAt   time.Time
}

func (d *DB) ListSaved() ([]SavedItem, error) {
	rows, err := d.conn.Query(
		`SELECT brief_date, cached_json, saved_at FROM saved_items ORDER BY saved_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SavedItem
	for rows.Next() {
		var briefDate, raw string
		var savedAt int64
		if err := rows.Scan(&briefDate, &raw, &savedAt); err != nil {
			return nil, err
		}
		var item api.BriefItem
		if err := json.Unmarshal([]byte(raw), &item); err != nil {
			return nil, err
		}
		out = append(out, SavedItem{
			BriefDate: briefDate,
			Item:      item,
			SavedAt:   time.Unix(savedAt, 0),
		})
	}
	return out, rows.Err()
}

func (d *DB) MarkRead(itemID, briefDate string) error {
	_, err := d.conn.Exec(`
INSERT OR REPLACE INTO read_state (item_id, brief_date, read_at) VALUES (?, ?, ?)`,
		itemID, briefDate, time.Now().Unix())
	return err
}

func (d *DB) QueueEvent(e api.EventPayload) error {
	raw, err := json.Marshal(e)
	if err != nil {
		return err
	}
	_, err = d.conn.Exec(
		`INSERT INTO pending_events (event_json, queued_at) VALUES (?, ?)`,
		string(raw), time.Now().Unix(),
	)
	return err
}

func (d *DB) DrainEvents() ([]api.EventPayload, []int64, error) {
	rows, err := d.conn.Query(`SELECT id, event_json FROM pending_events`)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	var events []api.EventPayload
	var ids []int64
	for rows.Next() {
		var id int64
		var raw string
		if err := rows.Scan(&id, &raw); err != nil {
			return nil, nil, err
		}
		var e api.EventPayload
		if err := json.Unmarshal([]byte(raw), &e); err != nil {
			continue
		}
		events = append(events, e)
		ids = append(ids, id)
	}
	return events, ids, rows.Err()
}

func (d *DB) DeleteEventsByIDs(ids []int64) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	for _, id := range ids {
		if _, err := tx.Exec(`DELETE FROM pending_events WHERE id = ?`, id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
