package cmd

import (
	"fmt"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/auth"
	"github.com/spf13/cobra"
)

func newLogoutCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "logout",
		Short: "Clear stored token",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := auth.DeleteToken(); err != nil {
				return err
			}
			fmt.Println("Logged out.")
			return nil
		},
	}
}
