package cmd

import (
	"context"
	"fmt"
	"time"

	"github.com/joshferrara/the-pull/apps/cli/internal/api"
	"github.com/joshferrara/the-pull/apps/cli/internal/auth"
	"github.com/joshferrara/the-pull/apps/cli/internal/config"
	"github.com/spf13/cobra"
)

func newWhoamiCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "whoami",
		Short: "Show authenticated email",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			token, err := auth.LoadToken()
			if err != nil || token == "" {
				return fmt.Errorf("not logged in")
			}
			client := api.New(cfg.BaseURL, token, "pull/"+versionStr)
			ctx, cancel := context.WithTimeout(cmd.Context(), 15*time.Second)
			defer cancel()
			me, err := client.Me(ctx)
			if err != nil {
				return err
			}
			fmt.Println(me.Email)
			return nil
		},
	}
}
