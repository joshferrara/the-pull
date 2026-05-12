package cmd

import (
	"github.com/spf13/cobra"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/api"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/auth"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/config"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/store"
	"github.com/josh-ferrara/the-pull/apps/cli/internal/tui"
)

func newTUICmd() *cobra.Command {
	return &cobra.Command{
		Use:   "tui",
		Short: "Launch the TUI",
		RunE:  runTUI,
	}
}

func runTUI(cmd *cobra.Command, args []string) error {
	return runTUIWithView(cmd, "today")
}

func runTUIWithView(_ *cobra.Command, view string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	token, _ := auth.LoadToken()
	client := api.New(cfg.BaseURL, token, "pull/"+versionStr)

	db, err := store.Open()
	if err != nil {
		return err
	}
	defer db.Close()

	initialView := tui.ViewToday
	if view == "saved" {
		initialView = tui.ViewSaved
	}

	m := tui.New(client, db, initialView)
	p := tea.NewProgram(m, tea.WithAltScreen(), tea.WithMouseCellMotion())
	_, err = p.Run()
	return err
}
