package portfolio

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrPortfolioNotFound = errors.New("portfolio not found")
	ErrProjectNotFound   = errors.New("project not found")
	ErrSectionNotFound   = errors.New("section not found")
	ErrMediaNotFound     = errors.New("media not found")
	ErrSubdomainTaken    = errors.New("subdomain already taken")
	ErrInvalidMediaType  = errors.New("invalid media type")
	ErrUnauthorized      = errors.New("unauthorized")
)

// Service handles portfolio business logic
type Service struct {
	repo      *Repository
	validate  *validator.Validate
	mediaPath string
}

// NewService creates a new portfolio service
func NewService(repo *Repository, mediaPath string) *Service {
	return &Service{
		repo:      repo,
		validate:  validator.New(),
		mediaPath: mediaPath,
	}
}

// Create creates a new portfolio
func (s *Service) Create(ctx context.Context, userID primitive.ObjectID, input CreatePortfolioInput) (*Portfolio, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if subdomain is taken
	existingPortfolio, err := s.repo.FindBySubdomain(ctx, input.Subdomain)
	if err != nil {
		return nil, err
	}
	if existingPortfolio != nil {
		return nil, ErrSubdomainTaken
	}

	return s.repo.Create(ctx, userID, input)
}

// GetByID gets a portfolio by ID
func (s *Service) GetByID(ctx context.Context, id primitive.ObjectID) (*Portfolio, error) {
	portfolio, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	return portfolio, nil
}

// GetByUserID gets all portfolios for a user
func (s *Service) GetByUserID(ctx context.Context, userID primitive.ObjectID) ([]*Portfolio, error) {
	return s.repo.FindByUserID(ctx, userID)
}

// GetBySubdomain gets a portfolio by subdomain
func (s *Service) GetBySubdomain(ctx context.Context, subdomain string) (*Portfolio, error) {
	portfolio, err := s.repo.FindBySubdomain(ctx, subdomain)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	return portfolio, nil
}

// Update updates a portfolio
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, userID primitive.ObjectID, input UpdatePortfolioInput) (*Portfolio, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Check if new subdomain is taken
	if input.Subdomain != nil && *input.Subdomain != portfolio.Subdomain {
		existingPortfolio, err := s.repo.FindBySubdomain(ctx, *input.Subdomain)
		if err != nil {
			return nil, err
		}
		if existingPortfolio != nil {
			return nil, ErrSubdomainTaken
		}
	}

	return s.repo.Update(ctx, id, input)
}

// Delete deletes a portfolio
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID, userID primitive.ObjectID) error {
	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if portfolio == nil {
		return ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return ErrUnauthorized
	}

	return s.repo.Delete(ctx, id)
}

// AddProject adds a project to a portfolio
func (s *Service) AddProject(ctx context.Context, portfolioID primitive.ObjectID, userID primitive.ObjectID, input CreateProjectInput) (*Project, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return nil, ErrUnauthorized
	}

	return s.repo.AddProject(ctx, portfolioID, input)
}

// UpdateProject updates a project in a portfolio
func (s *Service) UpdateProject(ctx context.Context, portfolioID, projectID primitive.ObjectID, userID primitive.ObjectID, input UpdateProjectInput) (*Project, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Check if project exists
	projectExists := false
	for _, project := range portfolio.Projects {
		if project.ID == projectID {
			projectExists = true
			break
		}
	}
	if !projectExists {
		return nil, ErrProjectNotFound
	}

	return s.repo.UpdateProject(ctx, portfolioID, projectID, input)
}

// DeleteProject deletes a project from a portfolio
func (s *Service) DeleteProject(ctx context.Context, portfolioID, projectID primitive.ObjectID, userID primitive.ObjectID) error {
	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return err
	}
	if portfolio == nil {
		return ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return ErrUnauthorized
	}

	// Check if project exists
	projectExists := false
	for _, project := range portfolio.Projects {
		if project.ID == projectID {
			projectExists = true
			break
		}
	}
	if !projectExists {
		return ErrProjectNotFound
	}

	return s.repo.DeleteProject(ctx, portfolioID, projectID)
}

// AddSection adds a section to a portfolio
func (s *Service) AddSection(ctx context.Context, portfolioID primitive.ObjectID, userID primitive.ObjectID, input CreateSectionInput) (*Section, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return nil, ErrUnauthorized
	}

	return s.repo.AddSection(ctx, portfolioID, input)
}

// UpdateSection updates a section in a portfolio
func (s *Service) UpdateSection(ctx context.Context, portfolioID, sectionID primitive.ObjectID, userID primitive.ObjectID, input UpdateSectionInput) (*Section, error) {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return nil, err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	if portfolio == nil {
		return nil, ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Check if section exists
	sectionExists := false
	for _, section := range portfolio.Sections {
		if section.ID == sectionID {
			sectionExists = true
			break
		}
	}
	if !sectionExists {
		return nil, ErrSectionNotFound
	}

	return s.repo.UpdateSection(ctx, portfolioID, sectionID, input)
}

// DeleteSection deletes a section from a portfolio
func (s *Service) DeleteSection(ctx context.Context, portfolioID, sectionID primitive.ObjectID, userID primitive.ObjectID) error {
	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return err
	}
	if portfolio == nil {
		return ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return ErrUnauthorized
	}

	// Check if section exists
	sectionExists := false
	for _, section := range portfolio.Sections {
		if section.ID == sectionID {
			sectionExists = true
			break
		}
	}
	if !sectionExists {
		return ErrSectionNotFound
	}

	return s.repo.DeleteSection(ctx, portfolioID, sectionID)
}

// AddMedia adds media to a project
func (s *Service) AddMedia(ctx context.Context, portfolioID, projectID primitive.ObjectID, userID primitive.ObjectID, input UploadMediaInput, filename string) error {
	// Validate input
	if err := s.validate.Struct(input); err != nil {
		return err
	}

	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return err
	}
	if portfolio == nil {
		return ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return ErrUnauthorized
	}

	// Check if project exists
	projectExists := false
	for _, project := range portfolio.Projects {
		if project.ID == projectID {
			projectExists = true
			break
		}
	}
	if !projectExists {
		return ErrProjectNotFound
	}

	// Validate media type based on file extension
	ext := strings.ToLower(filepath.Ext(filename))
	switch input.Type {
	case "image":
		if !isValidImageExt(ext) {
			return ErrInvalidMediaType
		}
	case "video":
		if !isValidVideoExt(ext) {
			return ErrInvalidMediaType
		}
	case "document":
		if !isValidDocumentExt(ext) {
			return ErrInvalidMediaType
		}
	default:
		return ErrInvalidMediaType
	}

	// Create media object
	media := Media{
		ID:        primitive.NewObjectID(),
		Type:      input.Type,
		URL:       fmt.Sprintf("/media/%s/%s/%s", portfolioID.Hex(), projectID.Hex(), filename),
		Caption:   input.Caption,
		Order:     input.Order,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
	}

	return s.repo.AddMedia(ctx, portfolioID, projectID, media)
}

// DeleteMedia deletes media from a project
func (s *Service) DeleteMedia(ctx context.Context, portfolioID, projectID, mediaID primitive.ObjectID, userID primitive.ObjectID) error {
	// Check if portfolio exists and belongs to user
	portfolio, err := s.repo.FindByID(ctx, portfolioID)
	if err != nil {
		return err
	}
	if portfolio == nil {
		return ErrPortfolioNotFound
	}
	if portfolio.UserID != userID {
		return ErrUnauthorized
	}

	// Check if project exists and contains media
	projectExists := false
	mediaExists := false
	for _, project := range portfolio.Projects {
		if project.ID == projectID {
			projectExists = true
			for _, media := range project.Media {
				if media.ID == mediaID {
					mediaExists = true
					break
				}
			}
			break
		}
	}
	if !projectExists {
		return ErrProjectNotFound
	}
	if !mediaExists {
		return ErrMediaNotFound
	}

	return s.repo.DeleteMedia(ctx, portfolioID, projectID, mediaID)
}

// Helper functions for media type validation
func isValidImageExt(ext string) bool {
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}
	return validExts[ext]
}

func isValidVideoExt(ext string) bool {
	validExts := map[string]bool{
		".mp4":  true,
		".webm": true,
		".mov":  true,
	}
	return validExts[ext]
}

func isValidDocumentExt(ext string) bool {
	validExts := map[string]bool{
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".txt":  true,
	}
	return validExts[ext]
}
