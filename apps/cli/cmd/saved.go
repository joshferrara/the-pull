package cmd

import "github.com/spf13/cobra"

func newSavedCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "saved",
		Short: "TUI view of saved items",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runTUIWithView(cmd, "saved")
		},
	}
}
