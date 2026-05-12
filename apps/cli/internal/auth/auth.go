package auth

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/joshferrara/the-pull/apps/cli/internal/config"
	"github.com/zalando/go-keyring"
)

const (
	keyringService = "the-pull"
	keyringUser    = "api-token"
)

// SaveToken stores the bearer token in the OS keychain, falling back to a 0600
// file in the user's config directory if the keychain is unavailable.
func SaveToken(token string) error {
	if err := keyring.Set(keyringService, keyringUser, token); err == nil {
		return nil
	}
	return saveTokenFile(token)
}

func LoadToken() (string, error) {
	if t, err := keyring.Get(keyringService, keyringUser); err == nil && t != "" {
		return t, nil
	}
	return loadTokenFile()
}

func DeleteToken() error {
	if err := keyring.Delete(keyringService, keyringUser); err != nil &&
		!errors.Is(err, keyring.ErrNotFound) {
		// keep going; we still want to scrub the file fallback
	}
	p, err := tokenFilePath()
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func tokenFilePath() (string, error) {
	p, err := config.ConfigPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(filepath.Dir(p), "token"), nil
}

func saveTokenFile(token string) error {
	p, err := tokenFilePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	return os.WriteFile(p, []byte(token), 0o600)
}

func loadTokenFile() (string, error) {
	p, err := tokenFilePath()
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
