package main

import (
	"fmt"
	"os"

	"github.com/josh-ferrara/the-pull/apps/cli/cmd"
)

// Set via -ldflags at release time by GoReleaser.
var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	cmd.SetVersion(version, commit, date)
	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
