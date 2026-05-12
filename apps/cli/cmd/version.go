package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print version",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Printf("pull %s (commit %s, built %s)\n", versionStr, commitStr, dateStr)
			return nil
		},
	}
}
