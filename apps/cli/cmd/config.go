package cmd

import (
	"fmt"
	"strconv"

	"github.com/josh-ferrara/the-pull/apps/cli/internal/config"
	"github.com/spf13/cobra"
)

func newConfigCmd() *cobra.Command {
	c := &cobra.Command{
		Use:   "config",
		Short: "Manage local config",
	}
	c.AddCommand(
		&cobra.Command{
			Use:   "get <key>",
			Short: "Print a config value",
			Args:  cobra.ExactArgs(1),
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, err := config.Load()
				if err != nil {
					return err
				}
				switch args[0] {
				case "base_url":
					fmt.Println(cfg.BaseURL)
				case "timezone":
					fmt.Println(cfg.Timezone)
				case "default_view":
					fmt.Println(cfg.DefaultView)
				case "no_color":
					fmt.Println(cfg.NoColor)
				default:
					return fmt.Errorf("unknown key: %s", args[0])
				}
				return nil
			},
		},
		&cobra.Command{
			Use:   "set <key> <value>",
			Short: "Set a config value",
			Args:  cobra.ExactArgs(2),
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, err := config.Load()
				if err != nil {
					return err
				}
				switch args[0] {
				case "base_url":
					cfg.BaseURL = args[1]
				case "timezone":
					cfg.Timezone = args[1]
				case "default_view":
					cfg.DefaultView = args[1]
				case "no_color":
					b, err := strconv.ParseBool(args[1])
					if err != nil {
						return err
					}
					cfg.NoColor = b
				default:
					return fmt.Errorf("unknown key: %s", args[0])
				}
				return config.Save(cfg)
			},
		},
	)
	return c
}
