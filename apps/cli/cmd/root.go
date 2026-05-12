package cmd

import (
	"os"

	"github.com/mattn/go-isatty"
	"github.com/spf13/cobra"
)

var (
	versionStr = "dev"
	commitStr  = "none"
	dateStr    = "unknown"
)

func SetVersion(v, c, d string) {
	versionStr, commitStr, dateStr = v, c, d
}

var rootCmd = &cobra.Command{
	Use:           "pull",
	Short:         "The Pull — daily AI brief in your terminal",
	SilenceUsage:  true,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Default behavior: TUI if interactive, markdown if piped.
		if isatty.IsTerminal(os.Stdout.Fd()) {
			return runTUI(cmd, args)
		}
		return runPrint(cmd, []string{})
	},
}

// Execute runs the CLI.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.AddCommand(
		newTUICmd(),
		newPrintCmd(),
		newLoginCmd(),
		newLogoutCmd(),
		newWhoamiCmd(),
		newSearchCmd(),
		newSavedCmd(),
		newConfigCmd(),
		newVersionCmd(),
		newUpdateCmd(),
	)
}
