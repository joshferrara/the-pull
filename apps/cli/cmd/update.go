package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

func newUpdateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "update",
		Short: "Check for updates",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Updates are managed by your package manager:")
			fmt.Println("  Homebrew:  brew upgrade pull")
			fmt.Println("  Scoop:     scoop update pull")
			fmt.Println("  Direct:    curl -fsSL https://thepull.dev/install | sh")
			return nil
		},
	}
}
