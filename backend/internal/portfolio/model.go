package portfolio

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Portfolio represents a user's portfolio
type Portfolio struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       primitive.ObjectID `bson:"userId" json:"userId"`
	Title        string             `bson:"title" json:"title"`
	Description  string             `bson:"description" json:"description"`
	Theme        string             `bson:"theme" json:"theme"`
	Layout       string             `bson:"layout" json:"layout"`
	Type         string             `bson:"type" json:"type"`
	Projects     []Project          `bson:"projects" json:"projects"`
	Sections     []Section          `bson:"sections" json:"sections"`
	Subdomain    string             `bson:"subdomain" json:"subdomain"`
	CustomDomain *string            `bson:"customDomain,omitempty" json:"customDomain,omitempty"`
	IsPublished  bool               `bson:"isPublished" json:"isPublished"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Project represents a portfolio project
type Project struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Content     string             `bson:"content" json:"content"`
	Media       []Media            `bson:"media" json:"media"`
	Tags        []string           `bson:"tags" json:"tags"`
	Order       int                `bson:"order" json:"order"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Section represents a custom portfolio section
type Section struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string             `bson:"title" json:"title"`
	Type      string             `bson:"type" json:"type"`
	Content   string             `bson:"content" json:"content"`
	Order     int                `bson:"order" json:"order"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Media represents a media file in a project
type Media struct {
	ID        primitive.ObjectID `bson:"_id" json:"id"`
	Type      string             `bson:"type" json:"type" validate:"required,oneof=image video document"`
	URL       string             `bson:"url" json:"url" validate:"required"`
	Caption   string             `bson:"caption" json:"caption"`
	Order     int                `bson:"order" json:"order"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
}

// CreatePortfolioInput represents the input for creating a new portfolio
type CreatePortfolioInput struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description" validate:"required"`
	Theme       string `json:"theme" validate:"required"`
	Layout      string `json:"layout" validate:"required"`
	Subdomain   string `json:"subdomain" validate:"required,min=3,alphanum"`
	Type        string `json:"type" validate:"omitempty,oneof=about cv portfolio"`
}

// UpdatePortfolioInput represents the input for updating a portfolio
type UpdatePortfolioInput struct {
	Title        *string `json:"title,omitempty"`
	Description  *string `json:"description,omitempty"`
	Theme        *string `json:"theme,omitempty"`
	Layout       *string `json:"layout,omitempty"`
	Subdomain    *string `json:"subdomain,omitempty" validate:"omitempty,min=3,alphanum"`
	CustomDomain *string `json:"customDomain,omitempty"`
	IsPublished  *bool   `json:"isPublished,omitempty"`
	Type         *string `json:"type,omitempty" validate:"omitempty,oneof=about cv portfolio"`
}

// CreateProjectInput represents the input for creating a new project
type CreateProjectInput struct {
	Title       string   `json:"title" validate:"required"`
	Description string   `json:"description" validate:"required"`
	Content     string   `json:"content" validate:"required"`
	Tags        []string `json:"tags"`
	Order       int      `json:"order"`
}

// UpdateProjectInput represents the input for updating a project
type UpdateProjectInput struct {
	Title       *string   `json:"title,omitempty"`
	Description *string   `json:"description,omitempty"`
	Content     *string   `json:"content,omitempty"`
	Tags        *[]string `json:"tags,omitempty"`
	Order       *int      `json:"order,omitempty"`
}

// CreateSectionInput represents the input for creating a new section
type CreateSectionInput struct {
	Title   string `json:"title" validate:"required"`
	Type    string `json:"type" validate:"required"`
	Content string `json:"content" validate:"required"`
	Order   int    `json:"order"`
}

// UpdateSectionInput represents the input for updating a section
type UpdateSectionInput struct {
	Title   *string `json:"title,omitempty"`
	Type    *string `json:"type,omitempty"`
	Content *string `json:"content,omitempty"`
	Order   *int    `json:"order,omitempty"`
}

// UploadMediaInput represents the input for uploading media
type UploadMediaInput struct {
	Type    string `json:"type" validate:"required,oneof=image video document"`
	Caption string `json:"caption"`
	Order   int    `json:"order"`
}
