package user

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"

	"github.com/musefolio/backend/internal/auth"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already taken")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

// Service handles user business logic
type Service struct {
	repo      *Repository
	jwtSecret string
}

// NewService creates a new user service
func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

// GetJWTSecret returns the JWT secret
func (s *Service) GetJWTSecret() string {
	return s.jwtSecret
}

// Create creates a new user
func (s *Service) Create(ctx context.Context, input CreateUserInput) (*User, error) {
	// Check if email is taken
	existingUser, err := s.repo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, ErrEmailTaken
	}

	// Check if username is taken
	existingUser, err = s.repo.FindByUsername(ctx, input.Username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, ErrUsernameTaken
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	input.Password = string(hashedPassword)

	return s.repo.Create(ctx, input)
}

// GetByID gets a user by ID
func (s *Service) GetByID(ctx context.Context, id primitive.ObjectID) (*User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// GetByEmail gets a user by email
func (s *Service) GetByEmail(ctx context.Context, email string) (*User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// GetByUsername gets a user by username
func (s *Service) GetByUsername(ctx context.Context, username string) (*User, error) {
	user, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// Update updates a user
func (s *Service) Update(ctx context.Context, id primitive.ObjectID, input UpdateUserInput) (*User, error) {
	// Check if user exists
	existingUser, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existingUser == nil {
		return nil, ErrUserNotFound
	}

	// Check if email is taken
	if input.Email != nil && *input.Email != existingUser.Email {
		user, err := s.repo.FindByEmail(ctx, *input.Email)
		if err != nil {
			return nil, err
		}
		if user != nil {
			return nil, ErrEmailTaken
		}
	}

	// Check if username is taken
	if input.Username != nil && *input.Username != existingUser.Username {
		user, err := s.repo.FindByUsername(ctx, *input.Username)
		if err != nil {
			return nil, err
		}
		if user != nil {
			return nil, ErrUsernameTaken
		}
	}

	// Hash password if provided
	if input.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		password := string(hashedPassword)
		input.Password = &password
	}

	return s.repo.Update(ctx, id, input)
}

// Delete deletes a user
func (s *Service) Delete(ctx context.Context, id primitive.ObjectID) error {
	// Check if user exists
	existingUser, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existingUser == nil {
		return ErrUserNotFound
	}

	return s.repo.Delete(ctx, id)
}

// List lists all users with pagination
func (s *Service) List(ctx context.Context, page, limit int64) ([]*User, error) {
	return s.repo.List(ctx, page, limit)
}

// Count returns the total number of users
func (s *Service) Count(ctx context.Context) (int64, error) {
	return s.repo.Count(ctx)
}

// ValidateCredentials validates user credentials
func (s *Service) ValidateCredentials(ctx context.Context, email, password string) (*auth.User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	return &auth.User{
		ID:    user.ID.Hex(),
		Email: user.Email,
		Name:  user.Name,
	}, nil
}
