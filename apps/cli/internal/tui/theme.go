package tui

import "github.com/charmbracelet/lipgloss"

// Catppuccin Mocha — kept in parity with apps/web/app/globals.css.
var (
	Base      = lipgloss.Color("#1e1e2e")
	Mantle    = lipgloss.Color("#181825")
	Crust     = lipgloss.Color("#11111b")
	Surface0  = lipgloss.Color("#313244")
	Surface1  = lipgloss.Color("#45475a")
	Surface2  = lipgloss.Color("#585b70")
	Overlay0  = lipgloss.Color("#6c7086")
	Overlay1  = lipgloss.Color("#7f849c")
	Overlay2  = lipgloss.Color("#9399b2")
	Subtext1  = lipgloss.Color("#bac2de")
	Subtext0  = lipgloss.Color("#a6adc8")
	Text      = lipgloss.Color("#cdd6f4")
	Lavender  = lipgloss.Color("#b4befe")
	Blue      = lipgloss.Color("#89b4fa")
	Sapphire  = lipgloss.Color("#74c7ec")
	Sky       = lipgloss.Color("#89dceb")
	Teal      = lipgloss.Color("#94e2d5")
	Green     = lipgloss.Color("#a6e3a1")
	Yellow    = lipgloss.Color("#f9e2af")
	Peach     = lipgloss.Color("#fab387")
	Maroon    = lipgloss.Color("#eba0ac")
	Red       = lipgloss.Color("#f38ba8")
	Mauve     = lipgloss.Color("#cba6f7")
	Pink      = lipgloss.Color("#f5c2e7")
	Flamingo  = lipgloss.Color("#f2cdcd")
	Rosewater = lipgloss.Color("#f5e0dc")
)

var (
	StyleHeader = lipgloss.NewStyle().
			Foreground(Mauve).
			Bold(true).
			Padding(0, 1)
	StyleSubheader = lipgloss.NewStyle().
			Foreground(Overlay1).
			Padding(0, 1)
	StyleListItem = lipgloss.NewStyle().
			Foreground(Text).
			Padding(0, 1)
	StyleListItemActive = lipgloss.NewStyle().
				Foreground(Crust).
				Background(Mauve).
				Bold(true).
				Padding(0, 1)
	StyleCategory = lipgloss.NewStyle().
			Foreground(Subtext0).
			Background(Surface0).
			Padding(0, 1).
			MarginRight(1)
	StyleImportance = map[string]lipgloss.Style{
		"high":   lipgloss.NewStyle().Foreground(Peach).Bold(true),
		"medium": lipgloss.NewStyle().Foreground(Yellow),
		"low":    lipgloss.NewStyle().Foreground(Overlay1),
	}
	StyleDetailTitle = lipgloss.NewStyle().Foreground(Text).Bold(true).MarginBottom(1)
	StyleDetailMeta  = lipgloss.NewStyle().Foreground(Overlay1).MarginBottom(1)
	StyleStatus      = lipgloss.NewStyle().Foreground(Overlay0).Padding(0, 1)
	StyleHelp        = lipgloss.NewStyle().Foreground(Overlay1)
	StyleBorderLeft  = lipgloss.NewStyle().BorderStyle(lipgloss.NormalBorder()).BorderRight(true).BorderForeground(Surface1)
)
