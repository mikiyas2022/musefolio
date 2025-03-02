package portfolio

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/musefolio/backend/internal/auth"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Handler handles HTTP requests for portfolios
type Handler struct {
	service *Service
}

// NewHandler creates a new portfolio handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// RegisterRoutes registers the portfolio routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/portfolios", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.GetByUserID)
		r.Get("/{id}", h.GetByID)
		r.Get("/subdomain/{subdomain}", h.GetBySubdomain)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)

		// Project routes
		r.Post("/{id}/projects", h.AddProject)
		r.Put("/{id}/projects/{projectID}", h.UpdateProject)
		r.Delete("/{id}/projects/{projectID}", h.DeleteProject)

		// Section routes
		r.Post("/{id}/sections", h.AddSection)
		r.Put("/{id}/sections/{sectionID}", h.UpdateSection)
		r.Delete("/{id}/sections/{sectionID}", h.DeleteSection)

		// Media routes
		r.Post("/{id}/projects/{projectID}/media", h.AddMedia)
		r.Delete("/{id}/projects/{projectID}/media/{mediaID}", h.DeleteMedia)
	})
}

// Create handles portfolio creation
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var input CreatePortfolioInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	portfolio, err := h.service.Create(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, ErrSubdomainTaken) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// GetByID handles getting a portfolio by ID
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	portfolio, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrPortfolioNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// GetByUserID handles getting all portfolios for a user
func (h *Handler) GetByUserID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	portfolios, err := h.service.GetByUserID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolios)
}

// GetBySubdomain handles getting a portfolio by subdomain
func (h *Handler) GetBySubdomain(w http.ResponseWriter, r *http.Request) {
	subdomain := chi.URLParam(r, "subdomain")
	if subdomain == "" {
		http.Error(w, "Invalid subdomain", http.StatusBadRequest)
		return
	}

	portfolio, err := h.service.GetBySubdomain(r.Context(), subdomain)
	if err != nil {
		if errors.Is(err, ErrPortfolioNotFound) {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// Update handles updating a portfolio
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	var input UpdatePortfolioInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	portfolio, err := h.service.Update(r.Context(), id, userID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		case errors.Is(err, ErrSubdomainTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolio)
}

// Delete handles deleting a portfolio
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddProject handles adding a project to a portfolio
func (h *Handler) AddProject(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	var input CreateProjectInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	project, err := h.service.AddProject(r.Context(), portfolioID, userID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

// UpdateProject handles updating a project in a portfolio
func (h *Handler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	projectID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "projectID"))
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var input UpdateProjectInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	project, err := h.service.UpdateProject(r.Context(), portfolioID, projectID, userID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrProjectNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

// DeleteProject handles deleting a project from a portfolio
func (h *Handler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	projectID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "projectID"))
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteProject(r.Context(), portfolioID, projectID, userID); err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrProjectNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddSection handles adding a section to a portfolio
func (h *Handler) AddSection(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	var input CreateSectionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	section, err := h.service.AddSection(r.Context(), portfolioID, userID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(section)
}

// UpdateSection handles updating a section in a portfolio
func (h *Handler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	sectionID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "sectionID"))
	if err != nil {
		http.Error(w, "Invalid section ID", http.StatusBadRequest)
		return
	}

	var input UpdateSectionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	section, err := h.service.UpdateSection(r.Context(), portfolioID, sectionID, userID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrSectionNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(section)
}

// DeleteSection handles deleting a section from a portfolio
func (h *Handler) DeleteSection(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	sectionID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "sectionID"))
	if err != nil {
		http.Error(w, "Invalid section ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteSection(r.Context(), portfolioID, sectionID, userID); err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrSectionNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddMedia handles adding media to a project
func (h *Handler) AddMedia(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	projectID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "projectID"))
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get other form values
	input := UploadMediaInput{
		Type:    r.FormValue("type"),
		Caption: r.FormValue("caption"),
		Order:   0, // Default order, can be updated later
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Use original filename
	filename := header.Filename

	if err := h.service.AddMedia(r.Context(), portfolioID, projectID, userID, input, filename); err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrProjectNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		case errors.Is(err, ErrInvalidMediaType):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// DeleteMedia handles deleting media from a project
func (h *Handler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	portfolioID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid portfolio ID", http.StatusBadRequest)
		return
	}

	projectID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "projectID"))
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	mediaID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "mediaID"))
	if err != nil {
		http.Error(w, "Invalid media ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(auth.UserIDKey).(primitive.ObjectID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteMedia(r.Context(), portfolioID, projectID, mediaID, userID); err != nil {
		switch {
		case errors.Is(err, ErrPortfolioNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrProjectNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrMediaNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, ErrUnauthorized):
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
