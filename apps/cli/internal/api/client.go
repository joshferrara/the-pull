package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client
	UserAgent  string
}

func New(baseURL, token, ua string) *Client {
	return &Client{
		BaseURL:   baseURL,
		Token:     token,
		UserAgent: ua,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Common errors
var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrRateLimited  = errors.New("rate limited")
	ErrNotFound     = errors.New("not found")
)

func (c *Client) request(ctx context.Context, method, path string, body any) (*http.Response, error) {
	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		rdr = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, rdr)
	if err != nil {
		return nil, err
	}
	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}
	if rdr != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.UserAgent != "" {
		req.Header.Set("User-Agent", c.UserAgent)
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	switch resp.StatusCode {
	case http.StatusUnauthorized:
		resp.Body.Close()
		return nil, ErrUnauthorized
	case http.StatusTooManyRequests:
		resp.Body.Close()
		return nil, ErrRateLimited
	case http.StatusNotFound:
		resp.Body.Close()
		return nil, ErrNotFound
	}
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("api error %d: %s", resp.StatusCode, string(body))
	}
	return resp, nil
}

func (c *Client) Today(ctx context.Context) (*Brief, error) {
	resp, err := c.request(ctx, http.MethodGet, "/api/v1/today.json", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var b Brief
	if err := json.NewDecoder(resp.Body).Decode(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (c *Client) ByDate(ctx context.Context, date string) (*Brief, error) {
	resp, err := c.request(ctx, http.MethodGet, "/api/v1/briefs/"+date+".json", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var b Brief
	if err := json.NewDecoder(resp.Body).Decode(&b); err != nil {
		return nil, err
	}
	return &b, nil
}

func (c *Client) Me(ctx context.Context) (*AuthMeResponse, error) {
	resp, err := c.request(ctx, http.MethodGet, "/api/v1/auth/me", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var me AuthMeResponse
	if err := json.NewDecoder(resp.Body).Decode(&me); err != nil {
		return nil, err
	}
	return &me, nil
}

func (c *Client) Register(ctx context.Context, email string) error {
	resp, err := c.request(ctx, http.MethodPost, "/api/v1/auth/register",
		map[string]string{"email": email, "source": "cli"})
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}

func (c *Client) SignWebURL(ctx context.Context, briefDate string) (string, error) {
	resp, err := c.request(ctx, http.MethodPost, "/api/v1/auth/sign-web-url",
		map[string]string{"brief_date": briefDate})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var sr SignWebURLResponse
	if err := json.NewDecoder(resp.Body).Decode(&sr); err != nil {
		return "", err
	}
	return sr.Token, nil
}

func (c *Client) SendEvents(ctx context.Context, events []EventPayload) error {
	if len(events) == 0 {
		return nil
	}
	resp, err := c.request(ctx, http.MethodPost, "/api/v1/events", events)
	if err != nil {
		return err
	}
	resp.Body.Close()
	return nil
}
