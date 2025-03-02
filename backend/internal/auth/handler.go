package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// UserService defines the interface for user-related operations
type UserService interface {
	ValidateCredentials(ctx context.Context, email, password string) (*User, error)
}

// User represents the user data needed for authentication
type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// Handler handles auth-related HTTP requests
type Handler struct {
	userService UserService
	jwtSecret   string
	tokenExpiry time.Duration
}

// NewHandler creates a new auth handler
func NewHandler(userService UserService, jwtSecret string, tokenExpiry time.Duration) *Handler {
	return &Handler{
		userService: userService,
		jwtSecret:   jwtSecret,
		tokenExpiry: tokenExpiry,
	}
}

// LoginInput represents the login request body
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// Login handles user login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	// Set headers first
	w.Header().Set("Content-Type", "application/json")

	// Read and parse request body
	var input LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate input
	if input.Email == "" || input.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email and password are required"})
		return
	}

	// Validate credentials
	user, err := h.userService.ValidateCredentials(r.Context(), input.Email, input.Password)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(h.tokenExpiry).Unix(),
	})

	// Sign token
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Set the JWT token in an HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,          // Set to true in production with HTTPS
		MaxAge:   3600 * 24 * 30, // 30 days
		SameSite: http.SameSiteLaxMode,
	})

	// Return response with user data (but don't include token in JSON)
	response := LoginResponse{
		Token: tokenString, // Still include for backward compatibility
		User:  user,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Add a check-auth endpoint
func (h *Handler) CheckAuth(w http.ResponseWriter, r *http.Request) {
	// Get the cookie
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Validate the token
	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Token is valid, return success
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
	})
}

// Add a logout endpoint
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Clear the auth cookie by setting its max age to -1
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Logged out successfully",
	})
}
