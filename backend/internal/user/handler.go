package user

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/musefolio/backend/internal/auth"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Handler handles HTTP requests for users
type Handler struct {
	service *Service
}

// NewHandler creates a new user handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// Register registers user routes
func (h *Handler) Register(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		// Public routes
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(auth.Middleware(h.service.GetJWTSecret()))
			r.Post("/me/avatar", h.UploadAvatar)
			r.Put("/profile", h.UpdateProfile)
			r.Put("/profile/social", h.UpdateSocialLinks)
		})
	})
}

// Create handles user creation
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input CreateUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.service.Create(r.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		case errors.Is(err, ErrUsernameTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

// GetByID handles getting a user by ID
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Update handles updating a user
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	var input UpdateUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.service.Update(r.Context(), id, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrEmailTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		case errors.Is(err, ErrUsernameTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Delete handles deleting a user
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// List handles listing users
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.ParseInt(r.URL.Query().Get("page"), 10, 64)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.ParseInt(r.URL.Query().Get("limit"), 10, 64)
	if limit < 1 {
		limit = 10
	}

	users, err := h.service.List(r.Context(), page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// UpdateProfile handles updating user profile information
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)

	var input struct {
		Name       string `json:"name"`
		Profession string `json:"profession"`
		Bio        string `json:"bio"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	update := UpdateUserInput{
		Name:       &input.Name,
		Profession: &input.Profession,
		Bio:        &input.Bio,
	}

	user, err := h.service.Update(r.Context(), userID, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UploadAvatar handles user avatar upload
func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	if !isValidImageType(header.Header.Get("Content-Type")) {
		http.Error(w, "Invalid file type", http.StatusBadRequest)
		return
	}

	// Ensure media directory exists
	mediaDir := "./media/avatars"
	if err := os.MkdirAll(mediaDir, 0755); err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s%s", userID.Hex(), filepath.Ext(header.Filename))
	avatarURL := fmt.Sprintf("/media/avatars/%s", filename)

	// Save file
	dst, err := os.Create(filepath.Join(mediaDir, filename))
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Update user avatar URL
	update := UpdateUserInput{
		Avatar: &avatarURL,
	}

	user, err := h.service.Update(r.Context(), userID, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UpdateSocialLinks handles updating user social media links
func (h *Handler) UpdateSocialLinks(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)

	var input struct {
		LinkedIn  string `json:"linkedin"`
		GitHub    string `json:"github"`
		Twitter   string `json:"twitter"`
		Instagram string `json:"instagram"`
		Website   string `json:"website"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update social links in user model
	update := UpdateUserInput{
		SocialLinks: &SocialLinks{
			LinkedIn:  input.LinkedIn,
			GitHub:    input.GitHub,
			Twitter:   input.Twitter,
			Instagram: input.Instagram,
			Website:   input.Website,
		},
	}

	user, err := h.service.Update(r.Context(), userID, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetCurrentUser handles retrieving the currently authenticated user
func (h *Handler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)

	// Get user by ID
	user, err := h.service.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return user
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UpdateCurrentUser handles updating the currently authenticated user
func (h *Handler) UpdateCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)

	// Parse request body
	var input struct {
		Name        string       `json:"name"`
		Email       string       `json:"email"`
		Profession  string       `json:"profession"`
		Bio         string       `json:"bio"`
		Username    string       `json:"username"`
		Avatar      string       `json:"avatar"`
		SocialLinks *SocialLinks `json:"socialLinks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received update request for user %s: %+v", userID.Hex(), input)

	// Create update input
	update := UpdateUserInput{}

	// Only update fields that were provided in the request
	if input.Name != "" {
		update.Name = &input.Name
	}
	if input.Email != "" {
		update.Email = &input.Email
	}
	if input.Profession != "" {
		update.Profession = &input.Profession
	}
	if input.Bio != "" {
		update.Bio = &input.Bio
	}
	if input.Username != "" {
		update.Username = &input.Username
	}
	if input.Avatar != "" {
		update.Avatar = &input.Avatar
	}
	if input.SocialLinks != nil {
		update.SocialLinks = input.SocialLinks
	}

	// Update user
	user, err := h.service.Update(r.Context(), userID, update)
	if err != nil {
		log.Printf("Error updating user %s: %v", userID.Hex(), err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("User %s updated successfully", userID.Hex())

	// Return updated user
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func isValidImageType(contentType string) bool {
	return contentType == "image/jpeg" ||
		contentType == "image/png" ||
		contentType == "image/gif" ||
		contentType == "image/webp"
}
