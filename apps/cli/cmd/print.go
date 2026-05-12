package cmd

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/joshferrara/the-pull/apps/cli/internal/api"
	"github.com/joshferrara/the-pull/apps/cli/internal/auth"
	"github.com/joshferrara/the-pull/apps/cli/internal/cache"
	"github.com/joshferrara/the-pull/apps/cli/internal/config"
	"github.com/joshferrara/the-pull/apps/cli/internal/render"
	"github.com/spf13/cobra"
)

var (
	printJSON bool
	printDate string
)

func newPrintCmd() *cobra.Command {
	c := &cobra.Command{
		Use:   "print",
		Short: "Print today's brief to stdout as markdown",
		RunE:  runPrint,
	}
	c.Flags().BoolVar(&printJSON, "json", false, "Emit JSON instead of markdown")
	c.Flags().StringVar(&printDate, "date", "", "Print a specific YYYY-MM-DD brief")
	return c
}

func runPrint(cmd *cobra.Command, args []string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	token, _ := auth.LoadToken()
	client := api.New(cfg.BaseURL, token, "pull/"+versionStr)

	ctx, cancel := context.WithTimeout(cmd.Context(), 30*time.Second)
	defer cancel()
	if ctx.Err() != nil {
		ctx = context.Background()
	}

	var brief *api.Brief
	if printDate != "" {
		brief, err = client.ByDate(ctx, printDate)
	} else {
		// Try cache first
		if b, fresh, _ := cache.LoadToday(); b != nil && fresh {
			brief = b
		}
		if brief == nil {
			brief, err = client.Today(ctx)
			if err == nil && brief != nil {
				_ = cache.SaveBrief(brief, true)
			} else if b, _, _ := cache.LoadToday(); b != nil {
				// Offline fallback
				brief = b
				err = nil
			}
		}
	}
	if err != nil {
		if errors.Is(err, api.ErrUnauthorized) {
			fmt.Fprintln(os.Stderr, "Unauthorized. Run `pull login`.")
		}
		return err
	}
	if brief == nil {
		return fmt.Errorf("no brief available")
	}

	if printJSON {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(brief)
	}
	fmt.Print(render.Markdown(brief))
	return nil
}
