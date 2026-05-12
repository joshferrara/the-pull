package cmd

import (
	"fmt"
	"strings"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/cache"
	"github.com/spf13/cobra"
)

func newSearchCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "search <query>",
		Short: "Search local archive",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			q := strings.ToLower(strings.Join(args, " "))
			dates, err := cache.ListCached()
			if err != nil {
				return err
			}
			if len(dates) == 0 {
				fmt.Println("No cached briefs to search.")
				return nil
			}
			found := 0
			for _, d := range dates {
				b, err := cache.LoadByDate(d)
				if err != nil || b == nil {
					continue
				}
				for _, item := range b.Items {
					hay := strings.ToLower(
						item.Title + " " + item.Summary + " " + strings.Join(item.Tags, " "),
					)
					if strings.Contains(hay, q) {
						fmt.Printf("%s · %s\n  %s\n", b.Date, item.Title, summarize(item.Summary))
						found++
					}
				}
			}
			if found == 0 {
				fmt.Println("No matches.")
			}
			return nil
		},
	}
}

func summarize(s string) string {
	if len(s) > 120 {
		return s[:117] + "…"
	}
	return s
}
