package cmd

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"github.com/joshferrara/the-pull/apps/cli/internal/api"
	"github.com/joshferrara/the-pull/apps/cli/internal/auth"
	"github.com/joshferrara/the-pull/apps/cli/internal/config"
	"github.com/spf13/cobra"
)

var (
	loginToken string
	loginEmail string
)

func newLoginCmd() *cobra.Command {
	c := &cobra.Command{
		Use:   "login",
		Short: "Sign in via email magic link",
		RunE:  runLogin,
	}
	c.Flags().StringVar(&loginToken, "token", "",
		"Skip the browser flow and store a token directly")
	c.Flags().StringVar(&loginEmail, "email", "",
		"Email to register (skips prompt)")
	return c
}

func runLogin(cmd *cobra.Command, args []string) error {
	if loginToken != "" {
		if err := auth.SaveToken(loginToken); err != nil {
			return err
		}
		fmt.Println("Token saved.")
		return nil
	}

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	email := loginEmail
	if email == "" {
		fmt.Print("Email: ")
		if _, err := fmt.Scanln(&email); err != nil {
			return err
		}
	}
	if email == "" {
		return errors.New("email required")
	}

	// Spin up a localhost listener to receive the token.
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port
	callback := fmt.Sprintf("http://127.0.0.1:%d/callback", port)

	tokenCh := make(chan string, 1)
	errCh := make(chan error, 1)
	srv := &http.Server{
		ReadHeaderTimeout: 5 * time.Second,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
				return
			}
			defer r.Body.Close()
			body, err := io.ReadAll(io.LimitReader(r.Body, 4096))
			if err != nil {
				errCh <- err
				http.Error(w, "read failed", http.StatusBadRequest)
				return
			}
			var payload struct {
				Token string `json:"token"`
			}
			if err := json.Unmarshal(body, &payload); err != nil || payload.Token == "" {
				errCh <- errors.New("invalid callback payload")
				http.Error(w, "bad payload", http.StatusBadRequest)
				return
			}
			tokenCh <- payload.Token
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"ok":true}`))
		}),
	}
	go func() { _ = srv.Serve(listener) }()

	// Trigger the magic-link send — the server bakes our loopback callback
	// into the verify URL it emails to the user, so clicking the link in the
	// email is the only step left for them.
	ctx, cancel := context.WithTimeout(cmd.Context(), 15*time.Second)
	defer cancel()
	client := api.New(cfg.BaseURL, "", "pull/"+versionStr)
	if err := client.Register(ctx, email, callback); err != nil {
		return fmt.Errorf("register: %w", err)
	}

	fmt.Println("Magic link sent to", email)
	fmt.Println("Click the link in your inbox to finish signing in.")
	fmt.Println("(If you bounce to a logged-in browser instead of this CLI,")
	fmt.Println(" your `pull` is from before this flow shipped — reinstall and retry.)")

	select {
	case token := <-tokenCh:
		_ = srv.Shutdown(context.Background())
		if err := auth.SaveToken(token); err != nil {
			return err
		}
		fmt.Println("Logged in.")
		return nil
	case err := <-errCh:
		_ = srv.Shutdown(context.Background())
		return err
	case <-time.After(15 * time.Minute):
		_ = srv.Shutdown(context.Background())
		return errors.New("timed out waiting for verification")
	}
}

