package cache

import (
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/api"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/config"
)

const ttl = 5 * time.Minute

func briefsDir() (string, error) {
	d, err := config.DataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(d, "cache", "briefs"), nil
}

// SaveBrief writes a brief to cache as briefs/<date>.json plus the today.json symlink.
func SaveBrief(b *api.Brief, markAsToday bool) error {
	dir, err := briefsDir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	out, err := json.Marshal(b)
	if err != nil {
		return err
	}
	dst := filepath.Join(dir, b.Date+".json")
	if err := os.WriteFile(dst, out, 0o600); err != nil {
		return err
	}
	if markAsToday {
		today := filepath.Join(dir, "today.json")
		_ = os.WriteFile(today, out, 0o600)
	}
	return nil
}

// LoadToday returns the today.json cache and whether it is fresh.
func LoadToday() (*api.Brief, bool, error) {
	dir, err := briefsDir()
	if err != nil {
		return nil, false, err
	}
	p := filepath.Join(dir, "today.json")
	info, err := os.Stat(p)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return nil, false, err
	}
	var b api.Brief
	if err := json.Unmarshal(data, &b); err != nil {
		return nil, false, err
	}
	return &b, time.Since(info.ModTime()) < ttl, nil
}

// LoadBriefByDate returns a cached brief if present.
func LoadByDate(date string) (*api.Brief, error) {
	dir, err := briefsDir()
	if err != nil {
		return nil, err
	}
	p := filepath.Join(dir, date+".json")
	data, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	var b api.Brief
	if err := json.Unmarshal(data, &b); err != nil {
		return nil, err
	}
	return &b, nil
}

// ListCached returns dates of all cached briefs, newest first.
func ListCached() ([]string, error) {
	dir, err := briefsDir()
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(dir)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var out []string
	for _, e := range entries {
		name := e.Name()
		if len(name) == 15 && filepath.Ext(name) == ".json" && name != "today.json" {
			out = append(out, name[:10])
		}
	}
	return out, nil
}
