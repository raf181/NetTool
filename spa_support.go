// Package main provides SPA (Single Page Application) support for the NetTool React frontend.
// This file contains middleware and configuration for serving the React build.
package main

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// SPAConfig contains configuration for serving the SPA
type SPAConfig struct {
	// FrontendDir is the directory containing the built React app
	FrontendDir string
	// IndexFile is the name of the index file (usually "index.html")
	IndexFile string
}

// DefaultSPAConfig returns the default SPA configuration
func DefaultSPAConfig() SPAConfig {
	return SPAConfig{
		FrontendDir: "frontend/dist",
		IndexFile:   "index.html",
	}
}

// ServeSPA configures routes for serving a Single Page Application
// This should be called after all API routes are registered
func ServeSPA(r *gin.Engine, config SPAConfig) {
	// Check if the frontend build exists
	if _, err := os.Stat(config.FrontendDir); os.IsNotExist(err) {
		// Frontend not built, skip SPA routes
		return
	}

	// Serve static assets from the frontend build
	r.Static("/assets", filepath.Join(config.FrontendDir, "assets"))

	// Serve other static files (favicon, etc.)
	r.StaticFile("/favicon.svg", filepath.Join(config.FrontendDir, "favicon.svg"))
	r.StaticFile("/favicon.ico", filepath.Join(config.FrontendDir, "favicon.ico"))

	// NoRoute handler for SPA - serves index.html for all unmatched routes
	// This allows React Router to handle client-side routing
	r.NoRoute(func(c *gin.Context) {
		// Don't serve index.html for API routes or WebSocket
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/ws") || strings.HasPrefix(path, "/static") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}

		// Serve the index.html for all other routes
		indexPath := filepath.Join(config.FrontendDir, config.IndexFile)
		c.File(indexPath)
	})
}

// IsSPAEnabled checks if the SPA frontend is available
func IsSPAEnabled() bool {
	config := DefaultSPAConfig()
	indexPath := filepath.Join(config.FrontendDir, config.IndexFile)
	_, err := os.Stat(indexPath)
	return err == nil
}
