package api

// Brief mirrors @the-pull/schema v1. Keep in sync with packages/schema/types.ts.
type Brief struct {
	Version      string      `json:"version"`
	Date         string      `json:"date"`
	Edition      int         `json:"edition"`
	PublishedAt  string      `json:"published_at"`
	Preview      bool        `json:"preview,omitempty"`
	EditorNote   string      `json:"editor_note,omitempty"`
	Items        []BriefItem `json:"items"`
	Stats        BriefStats  `json:"stats"`
}

type BriefStats struct {
	ItemCount               int `json:"item_count"`
	TotalReadingTimeSeconds int `json:"total_reading_time_seconds,omitempty"`
}

type BriefItem struct {
	ID                 string       `json:"id"`
	Title              string       `json:"title"`
	Summary            string       `json:"summary,omitempty"`
	Commentary         string       `json:"commentary,omitempty"`
	Category           string       `json:"category"`
	Tags               []string     `json:"tags,omitempty"`
	Links              []BriefLink  `json:"links,omitempty"`
	Source             *BriefSource `json:"source,omitempty"`
	Importance         string       `json:"importance"`
	ReadingTimeSeconds int          `json:"reading_time_seconds,omitempty"`
}

type BriefLink struct {
	URL   string `json:"url"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type BriefSource struct {
	Type   string `json:"type"`
	URL    string `json:"url"`
	Author string `json:"author,omitempty"`
}

type AuthRegisterResponse struct {
	OK bool `json:"ok"`
}

type AuthMeResponse struct {
	Email  string `json:"email"`
	UserID string `json:"user_id"`
	Status string `json:"status"`
}

type SignWebURLResponse struct {
	Token string `json:"token"`
}

type EventPayload struct {
	Type      string `json:"type"`
	BriefDate string `json:"brief_date,omitempty"`
	ItemID    string `json:"item_id,omitempty"`
	Channel   string `json:"channel"`
}
