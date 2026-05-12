package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pelletier/go-toml/v2"
)

const (
	AppName  = "the-pull"
	BinName  = "pull"
	DefaultBaseURL = "https://thepull.dev"
)

// Config is the user-mutable configuration loaded from $XDG_CONFIG_HOME/the-pull/config.toml.
type Config struct {
	BaseURL     string `toml:"base_url"`
	Timezone    string `toml:"timezone"`
	DefaultView string `toml:"default_view"`
	NoColor     bool   `toml:"no_color"`
}

func defaults() Config {
	return Config{
		BaseURL:     DefaultBaseURL,
		DefaultView: "today",
	}
}

func configDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, AppName), nil
}

func ConfigPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.toml"), nil
}

func DataDir() (string, error) {
	// Use XDG_DATA_HOME or fallback to ~/.local/share.
	if d := os.Getenv("XDG_DATA_HOME"); d != "" {
		return filepath.Join(d, AppName), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".local", "share", AppName), nil
}

func Load() (Config, error) {
	cfg := defaults()
	p, err := ConfigPath()
	if err != nil {
		return cfg, err
	}
	data, err := os.ReadFile(p)
	if errors.Is(err, os.ErrNotExist) {
		return cfg, nil
	}
	if err != nil {
		return cfg, err
	}
	if err := toml.Unmarshal(data, &cfg); err != nil {
		return cfg, fmt.Errorf("parse config: %w", err)
	}
	if cfg.BaseURL == "" {
		cfg.BaseURL = DefaultBaseURL
	}
	if cfg.DefaultView == "" {
		cfg.DefaultView = "today"
	}
	return cfg, nil
}

func Save(cfg Config) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	out, err := toml.Marshal(cfg)
	if err != nil {
		return err
	}
	p, err := ConfigPath()
	if err != nil {
		return err
	}
	return os.WriteFile(p, out, 0o600)
}
