package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/musefolio/backend/internal/auth"
	"github.com/musefolio/backend/internal/config"
	"github.com/musefolio/backend/internal/database"
	"github.com/musefolio/backend/internal/portfolio"
	"github.com/musefolio/backend/internal/user"
)

func main() {
	// Initialize logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load configuration", "error", err)
		os.Exit(1)
	}

	// Initialize MongoDB
	db, err := database.New(&cfg.MongoDB)
	if err != nil {
		logger.Error("failed to connect to MongoDB", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := db.Close(context.Background()); err != nil {
			logger.Error("failed to close MongoDB connection", "error", err)
		}
	}()

	// Create indexes
	if err := db.EnsureIndexes(context.Background()); err != nil {
		logger.Error("failed to create indexes", "error", err)
		os.Exit(1)
	}

	// Initialize repositories
	userRepo := user.NewRepository(db)
	portfolioRepo := portfolio.NewRepository(db)

	// Initialize services
	userService := user.NewService(userRepo, cfg.Auth.JWTSecret)
	portfolioService := portfolio.NewService(portfolioRepo, "/media") // Media path for file storage

	// Initialize handlers
	userHandler := user.NewHandler(userService)
	portfolioHandler := portfolio.NewHandler(portfolioService)
	authHandler := auth.NewHandler(userService, cfg.Auth.JWTSecret, cfg.Auth.TokenExpiry)

	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// Debug middleware to log all requests
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			logger.Info("request received",
				"method", r.Method,
				"path", r.URL.Path,
				"query", r.URL.RawQuery,
			)
			next.ServeHTTP(w, r)
		})
	})

	// Simple CORS middleware that handles OPTIONS preflight requests
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Define allowed origins
			allowedOrigins := []string{
				"http://localhost:3000",
				"http://localhost:3001",
				"http://localhost:3002",
				"http://localhost:8080",
				"https://musefolio.com",
				"https://www.musefolio.com",
				"https://app.musefolio.com",
			}

			// Check if origin is allowed
			originAllowed := false
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					originAllowed = true
					break
				}
			}

			// If origin is in our allowlist, set it specifically for better security
			// Otherwise use * for development convenience
			if origin != "" && originAllowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin") // Important when using specific origins
			} else if origin == "" {
				// When no origin header is present (like for direct browser navigation)
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else {
				// For any other origin in development mode, allow it
				// In production, you might want to restrict this
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				logger.Info("non-standard origin requested CORS access", "origin", origin)
			}

			// Enhanced CORS headers for better browser compatibility
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization, X-CSRF-Token, X-Requested-With")

			// CRITICAL: Always allow credentials for cookie-based auth
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			// Set max age to reduce preflight requests frequency (5 minutes)
			w.Header().Set("Access-Control-Max-Age", "300")

			// Handle OPTIONS preflight requests directly
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Routes
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// HEAD handler for health
	r.Head("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// API health endpoint
	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"OK","version":"1.0.0"}`))
	})

	// HEAD handler for API health
	r.Head("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Alternative health check at the root
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"API OK","version":"1.0.0"}`))
		})

		// Auth routes
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/logout", authHandler.Logout)
		r.Get("/auth/check", authHandler.CheckAuth)

		// Public routes
		r.Post("/users", userHandler.Create)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(auth.Middleware(cfg.Auth.JWTSecret))
			// User routes
			r.Get("/users", userHandler.List)
			r.Get("/users/{id}", userHandler.GetByID)
			r.Put("/users/{id}", userHandler.Update)
			r.Delete("/users/{id}", userHandler.Delete)

			// Add ME endpoint for current user operations
			r.Get("/users/me", userHandler.GetCurrentUser)
			r.Put("/users/me", userHandler.UpdateCurrentUser)

			// Portfolio routes
			portfolioHandler.RegisterRoutes(r)
		})
	})

	// Print all registered routes
	walkFunc := func(method string, route string, handler http.Handler, middlewares ...func(http.Handler) http.Handler) error {
		logger.Info("route registered", "method", method, "route", route)
		return nil
	}
	if err := chi.Walk(r, walkFunc); err != nil {
		logger.Error("failed to walk routes", "error", err)
	}

	// Initialize server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      r,
		ReadTimeout:  time.Second * 15,
		WriteTimeout: time.Second * 15,
		IdleTimeout:  time.Second * 60,
	}

	// Channel to listen for errors coming from the listener.
	serverErrors := make(chan error, 1)

	// Start the server
	go func() {
		logger.Info("starting server", "port", cfg.Server.Port)
		serverErrors <- server.ListenAndServe()
	}()

	// Channel to listen for an interrupt or terminate signal from the OS.
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Blocking main and waiting for shutdown.
	select {
	case err := <-serverErrors:
		logger.Error("server error", "error", err)
		os.Exit(1)

	case sig := <-shutdown:
		logger.Info("shutdown started", "signal", sig)
		defer logger.Info("shutdown complete", "signal", sig)

		// Give outstanding requests a deadline for completion.
		ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
		defer cancel()

		// Asking listener to shut down and shed load.
		if err := server.Shutdown(ctx); err != nil {
			logger.Error("graceful shutdown failed", "error", err)
			if err := server.Close(); err != nil {
				logger.Error("forcing server to close", "error", err)
			}
		}
	}
}
