package render

import (
	"fmt"
	"strings"

	"github.com/joshferrara/the-pull/apps/cli/internal/api"
)

// Markdown returns a plain markdown rendering of a brief. Mirrors
// @the-pull/shared/markdown/index.ts.
func Markdown(b *api.Brief) string {
	var s strings.Builder
	fmt.Fprintf(&s, "# The Pull — Edition #%d\n_%s · %d items_\n\n",
		b.Edition, b.Date, len(b.Items))
	if b.EditorNote != "" {
		for _, line := range strings.Split(b.EditorNote, "\n") {
			fmt.Fprintf(&s, "> %s\n", line)
		}
		s.WriteString("\n")
	}
	for i, item := range b.Items {
		fmt.Fprintf(&s, "## %d. %s\n\n", i+1, item.Title)
		fmt.Fprintf(&s, "**%s** %s", titleCase(item.Category), importanceGlyph(item.Importance))
		if item.ReadingTimeSeconds > 0 {
			minutes := (item.ReadingTimeSeconds + 59) / 60
			fmt.Fprintf(&s, "  ·  %d min read", minutes)
		}
		s.WriteString("\n")
		if len(item.Tags) > 0 {
			tags := make([]string, len(item.Tags))
			for i, t := range item.Tags {
				tags[i] = "`" + t + "`"
			}
			fmt.Fprintf(&s, "%s\n", strings.Join(tags, " "))
		}
		s.WriteString("\n")
		if item.Summary != "" {
			s.WriteString(item.Summary)
			s.WriteString("\n\n")
		}
		if item.Commentary != "" {
			for _, line := range strings.Split(item.Commentary, "\n") {
				fmt.Fprintf(&s, "> %s\n", line)
			}
			s.WriteString("\n")
		}
		for idx, l := range item.Links {
			fmt.Fprintf(&s, "%d. [%s](%s) _(%s)_\n", idx+1, l.Label, l.URL, l.Type)
		}
		if item.Source != nil {
			s.WriteString("\n_Source: ")
			if item.Source.Author != "" {
				fmt.Fprintf(&s, "%s · ", item.Source.Author)
			}
			fmt.Fprintf(&s, "[%s](%s)_\n", item.Source.Type, item.Source.URL)
		}
		s.WriteString("\n---\n\n")
	}
	s.WriteString("_Get this in your terminal: `curl -fsSL https://thepull.dev/install | sh`_\n")
	return s.String()
}

func importanceGlyph(i string) string {
	switch i {
	case "high":
		return "★"
	case "medium":
		return "•"
	default:
		return "·"
	}
}

func titleCase(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}
