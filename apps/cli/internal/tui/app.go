package tui

import (
	"context"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/lipgloss"

	"github.com/joshferrara/the-pull/apps/cli/internal/api"
	"github.com/joshferrara/the-pull/apps/cli/internal/cache"
	"github.com/joshferrara/the-pull/apps/cli/internal/store"
)

type View int

const (
	ViewToday View = iota
	ViewSaved
	ViewHelp
	ViewSearch
)

type SearchHit struct {
	BriefDate string
	Item      api.BriefItem
}

type Model struct {
	client      *api.Client
	db          *store.DB
	brief       *api.Brief
	view        View
	cursor      int
	width       int
	height      int
	loading     bool
	status      string
	detail      viewport.Model
	saved       []store.SavedItem
	renderer    *glamour.TermRenderer
	searchQuery string
	searchHits  []SearchHit
}

type fetchResultMsg struct {
	brief *api.Brief
	err   error
}

type savedRefreshMsg struct {
	items []store.SavedItem
}

func New(client *api.Client, db *store.DB, initialView View) Model {
	renderer, _ := glamour.NewTermRenderer(
		glamour.WithStandardStyle("dark"),
		glamour.WithWordWrap(80),
	)
	return Model{
		client:   client,
		db:       db,
		view:     initialView,
		loading:  true,
		renderer: renderer,
		detail:   viewport.New(80, 20),
	}
}

type drainTick struct{}

func scheduleDrain() tea.Cmd {
	return tea.Tick(30*time.Second, func(t time.Time) tea.Msg { return drainTick{} })
}

func (m Model) Init() tea.Cmd {
	// Emit a launch event by queuing it — drainer will flush it.
	_ = m.db.QueueEvent(api.EventPayload{Type: "tui_launch", Channel: "tui"})
	return tea.Batch(
		m.fetchToday(),
		m.loadSaved(),
		m.drainEvents(),
		scheduleDrain(),
	)
}

// drainEvents pulls queued events from SQLite and POSTs them to /api/v1/events.
// On success the rows are removed. Failures keep the rows for the next tick.
func (m *Model) drainEvents() tea.Cmd {
	client := m.client
	db := m.db
	return func() tea.Msg {
		if client.Token == "" {
			return drainTick{}
		}
		events, ids, err := db.DrainEvents()
		if err != nil || len(events) == 0 {
			return drainTick{}
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := client.SendEvents(ctx, events); err != nil {
			return drainTick{}
		}
		_ = db.DeleteEventsByIDs(ids)
		return drainTick{}
	}
}

func (m *Model) fetchToday() tea.Cmd {
	return func() tea.Msg {
		// Try cache first
		if b, fresh, _ := cache.LoadToday(); b != nil && fresh {
			return fetchResultMsg{brief: b}
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		b, err := m.client.Today(ctx)
		if err != nil {
			// Fall back to whatever cache we have
			if cached, _, _ := cache.LoadToday(); cached != nil {
				return fetchResultMsg{brief: cached}
			}
			return fetchResultMsg{err: err}
		}
		_ = cache.SaveBrief(b, true)
		return fetchResultMsg{brief: b}
	}
}

func (m *Model) loadSaved() tea.Cmd {
	return func() tea.Msg {
		items, _ := m.db.ListSaved()
		return savedRefreshMsg{items: items}
	}
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		m.detail.Width = max(40, msg.Width-listWidth(m.width)-2)
		m.detail.Height = max(5, msg.Height-4)
		m.renderDetail()
		return m, nil
	case fetchResultMsg:
		m.loading = false
		if msg.err != nil {
			m.status = "Offline · " + msg.err.Error()
		} else {
			m.brief = msg.brief
			m.cursor = 0
			m.renderDetail()
		}
		return m, nil
	case savedRefreshMsg:
		m.saved = msg.items
		return m, nil
	case drainTick:
		// Schedule next drain plus run the current one.
		return m, tea.Batch(scheduleDrain(), m.drainEvents())
	case tea.KeyMsg:
		return m.handleKey(msg)
	}
	var cmd tea.Cmd
	m.detail, cmd = m.detail.Update(msg)
	return m, cmd
}

func (m Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if m.view == ViewHelp {
		m.view = ViewToday
		return m, nil
	}
	// Search mode handles its own keys (text input + navigation).
	if m.view == ViewSearch {
		return m.handleSearchKey(msg)
	}
	switch msg.String() {
	case "q", "esc", "ctrl+c":
		return m, tea.Quit
	case "?":
		m.view = ViewHelp
		return m, nil
	case "/":
		m.view = ViewSearch
		m.searchQuery = ""
		m.cursor = 0
		m.recomputeSearch()
		m.renderDetail()
		return m, nil
	case "1":
		m.view = ViewToday
		m.cursor = 0
		m.renderDetail()
		return m, nil
	case "2", "tab":
		m.view = ViewSaved
		m.cursor = 0
		m.renderDetail()
		return m, m.loadSaved()
	case "j", "down":
		if m.view == ViewToday && m.brief != nil && m.cursor < len(m.brief.Items)-1 {
			m.cursor++
		} else if m.view == ViewSaved && m.cursor < len(m.saved)-1 {
			m.cursor++
		}
		m.renderDetail()
		return m, nil
	case "k", "up":
		if m.cursor > 0 {
			m.cursor--
		}
		m.renderDetail()
		return m, nil
	case "g":
		m.cursor = 0
		m.renderDetail()
		return m, nil
	case "G":
		if m.view == ViewToday && m.brief != nil {
			m.cursor = len(m.brief.Items) - 1
		} else if m.view == ViewSaved {
			m.cursor = max(0, len(m.saved)-1)
		}
		m.renderDetail()
		return m, nil
	case "enter":
		if it := m.activeItem(); it != nil && len(it.Links) > 0 {
			_ = openInBrowser(it.Links[0].URL)
			m.recordEvent("item_link_click", it.ID)
		}
		return m, nil
	case "s", "b":
		if it := m.activeItem(); it != nil {
			date := m.activeBriefDate()
			saved, err := m.db.ToggleSave(*it, date)
			if err == nil && saved {
				m.status = "saved " + it.Title
				m.recordEvent("item_save", it.ID)
			}
			return m, m.loadSaved()
		}
	case "w":
		if m.brief != nil {
			return m, m.openWebView()
		}
	case "r":
		m.loading = true
		m.status = "refreshing…"
		return m, m.fetchToday()
	}
	if len(msg.String()) == 1 {
		// number 1-9: open link by index
		if n := msg.String(); n >= "1" && n <= "9" {
			idx := int(n[0] - '1')
			if it := m.activeItem(); it != nil && idx < len(it.Links) {
				_ = openInBrowser(it.Links[idx].URL)
				m.recordEvent("item_link_click", it.ID)
			}
		}
	}
	return m, nil
}

func (m Model) handleSearchKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	s := msg.String()
	switch s {
	case "esc", "ctrl+c":
		m.view = ViewToday
		m.cursor = 0
		m.searchQuery = ""
		m.searchHits = nil
		m.renderDetail()
		return m, nil
	case "enter":
		if it := m.activeItem(); it != nil && len(it.Links) > 0 {
			_ = openInBrowser(it.Links[0].URL)
			m.recordEvent("item_link_click", it.ID)
		}
		return m, nil
	case "down", "ctrl+j":
		if m.cursor < len(m.searchHits)-1 {
			m.cursor++
		}
		m.renderDetail()
		return m, nil
	case "up", "ctrl+k":
		if m.cursor > 0 {
			m.cursor--
		}
		m.renderDetail()
		return m, nil
	case "backspace":
		if len(m.searchQuery) > 0 {
			m.searchQuery = m.searchQuery[:len(m.searchQuery)-1]
			m.cursor = 0
			m.recomputeSearch()
			m.renderDetail()
		}
		return m, nil
	}
	if len(s) == 1 {
		m.searchQuery += s
		m.cursor = 0
		m.recomputeSearch()
		m.renderDetail()
	}
	return m, nil
}

func (m *Model) recomputeSearch() {
	q := strings.ToLower(strings.TrimSpace(m.searchQuery))
	if q == "" {
		m.searchHits = nil
		return
	}
	dates, _ := cache.ListCached()
	hits := make([]SearchHit, 0, 32)
	for _, d := range dates {
		b, err := cache.LoadByDate(d)
		if err != nil || b == nil {
			continue
		}
		for _, item := range b.Items {
			hay := strings.ToLower(item.Title + " " + item.Summary + " " + strings.Join(item.Tags, " "))
			if strings.Contains(hay, q) {
				hits = append(hits, SearchHit{BriefDate: b.Date, Item: item})
				if len(hits) >= 100 {
					break
				}
			}
		}
		if len(hits) >= 100 {
			break
		}
	}
	m.searchHits = hits
}

func (m *Model) recordEvent(typ, itemID string) {
	if m.client.Token == "" {
		return
	}
	// Spec 6.5 step 5: queue events to SQLite so they survive offline,
	// then let the background drainer flush them in batches.
	_ = m.db.QueueEvent(api.EventPayload{
		Type:      typ,
		BriefDate: m.activeBriefDate(),
		ItemID:    itemID,
		Channel:   "tui",
	})
}

func (m *Model) openWebView() tea.Cmd {
	briefDate := m.activeBriefDate()
	client := m.client
	return func() tea.Msg {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		token, err := client.SignWebURL(ctx, briefDate)
		if err != nil {
			return nil
		}
		_ = openInBrowser(client.BaseURL + "/brief/" + briefDate + "?t=" + token)
		return nil
	}
}

func (m Model) View() string {
	if m.view == ViewHelp {
		return m.renderHelp()
	}
	if m.loading {
		return StyleHeader.Render("Loading…")
	}
	if m.brief == nil && m.view == ViewToday {
		return StyleSubheader.Render(m.status)
	}
	header := m.renderHeader()
	left := m.renderList()
	right := m.detail.View()
	row := lipgloss.JoinHorizontal(
		lipgloss.Top,
		lipgloss.NewStyle().Width(listWidth(m.width)).Render(left),
		StyleBorderLeft.Render(""),
		right,
	)
	footer := m.renderFooter()
	return lipgloss.JoinVertical(lipgloss.Left, header, row, footer)
}

func (m Model) renderHeader() string {
	if m.view == ViewSearch {
		return StyleHeader.Render(
			fmt.Sprintf("Search: /%s_  (%d hits)", m.searchQuery, len(m.searchHits)),
		)
	}
	if m.view == ViewSaved {
		return StyleHeader.Render(fmt.Sprintf("Saved · %d items", len(m.saved)))
	}
	if m.brief == nil {
		return StyleHeader.Render("The Pull")
	}
	mins := m.brief.Stats.TotalReadingTimeSeconds / 60
	return StyleHeader.Render(fmt.Sprintf(
		"The Pull — Edition #%d — %s — %d items — %d min read",
		m.brief.Edition, m.brief.Date, len(m.brief.Items), mins))
}

func (m Model) renderList() string {
	var lines []string
	if m.view == ViewSearch {
		if len(m.searchHits) == 0 {
			if m.searchQuery == "" {
				return StyleListItem.Render("Type to search cached briefs…")
			}
			return StyleListItem.Render("No matches.")
		}
		for i, hit := range m.searchHits {
			label := fmt.Sprintf("%s · %s", hit.BriefDate, truncate(hit.Item.Title, 48))
			if i == m.cursor {
				lines = append(lines, StyleListItemActive.Render(label))
			} else {
				lines = append(lines, StyleListItem.Render(label))
			}
		}
		return strings.Join(lines, "\n")
	}
	if m.view == ViewSaved {
		for i, it := range m.saved {
			label := fmt.Sprintf("%s · %s", it.BriefDate, truncate(it.Item.Title, 50))
			if i == m.cursor {
				lines = append(lines, StyleListItemActive.Render(label))
			} else {
				lines = append(lines, StyleListItem.Render(label))
			}
		}
	} else if m.brief != nil {
		for i, item := range m.brief.Items {
			imp := StyleImportance[item.Importance]
			label := fmt.Sprintf("%02d  %s %s",
				i+1,
				imp.Render(importanceGlyph(item.Importance)),
				truncate(item.Title, 50))
			if i == m.cursor {
				lines = append(lines, StyleListItemActive.Render(label))
			} else {
				lines = append(lines, StyleListItem.Render(label))
			}
		}
	}
	return strings.Join(lines, "\n")
}

func (m *Model) renderDetail() {
	if m.renderer == nil {
		return
	}
	it := m.activeItem()
	if it == nil {
		m.detail.SetContent("")
		return
	}
	var sb strings.Builder
	fmt.Fprintf(&sb, "# %s\n\n", it.Title)
	fmt.Fprintf(&sb, "**%s** · %s · %d min read\n\n",
		titleCase(it.Category), it.Importance,
		max(1, (it.ReadingTimeSeconds+59)/60))
	if it.Summary != "" {
		sb.WriteString(it.Summary)
		sb.WriteString("\n\n")
	}
	if it.Commentary != "" {
		for _, line := range strings.Split(it.Commentary, "\n") {
			sb.WriteString("> ")
			sb.WriteString(line)
			sb.WriteString("\n")
		}
		sb.WriteString("\n")
	}
	for i, l := range it.Links {
		fmt.Fprintf(&sb, "%d. [%s](%s) _(%s)_\n", i+1, l.Label, l.URL, l.Type)
	}
	out, err := m.renderer.Render(sb.String())
	if err != nil {
		out = sb.String()
	}
	m.detail.SetContent(out)
}

func (m Model) renderFooter() string {
	keys := []string{
		"j/k navigate",
		"enter link",
		"s save",
		"w web",
		"1 today",
		"2 saved",
		"/ search",
		"r refresh",
		"? help",
		"q quit",
	}
	footer := StyleHelp.Render(strings.Join(keys, " · "))
	if m.status != "" {
		footer = lipgloss.JoinVertical(lipgloss.Left, footer, StyleStatus.Render(m.status))
	}
	return footer
}

func (m Model) renderHelp() string {
	lines := []string{
		StyleHeader.Render("Help"),
		StyleHelp.Render("Navigation"),
		"  j/k or ↓↑  Move",
		"  g / G      Top / bottom",
		"  tab / 2    Saved view",
		"  1          Today view",
		"  /          Search cached briefs",
		"  r          Refresh from server",
		"",
		StyleHelp.Render("Actions"),
		"  enter      Open primary link",
		"  1-9        Open link by index",
		"  s or b     Save/unsave item",
		"  w          Open today's brief in browser (signed URL)",
		"",
		StyleHelp.Render("Misc"),
		"  ?          Toggle help",
		"  q / esc    Quit",
	}
	return strings.Join(lines, "\n")
}

func (m Model) activeItem() *api.BriefItem {
	if m.view == ViewSearch {
		if m.cursor < 0 || m.cursor >= len(m.searchHits) {
			return nil
		}
		it := m.searchHits[m.cursor].Item
		return &it
	}
	if m.view == ViewSaved {
		if m.cursor < 0 || m.cursor >= len(m.saved) {
			return nil
		}
		it := m.saved[m.cursor].Item
		return &it
	}
	if m.brief == nil || m.cursor < 0 || m.cursor >= len(m.brief.Items) {
		return nil
	}
	return &m.brief.Items[m.cursor]
}

func (m Model) activeBriefDate() string {
	if m.view == ViewSearch {
		if m.cursor >= 0 && m.cursor < len(m.searchHits) {
			return m.searchHits[m.cursor].BriefDate
		}
		return ""
	}
	if m.view == ViewSaved {
		if m.cursor >= 0 && m.cursor < len(m.saved) {
			return m.saved[m.cursor].BriefDate
		}
		return ""
	}
	if m.brief != nil {
		return m.brief.Date
	}
	return ""
}

func listWidth(total int) int {
	if total <= 0 {
		return 30
	}
	w := total * 35 / 100
	if w < 30 {
		w = 30
	}
	if w > 60 {
		w = 60
	}
	return w
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-1] + "…"
}

func titleCase(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
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

func openInBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	return cmd.Start()
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
