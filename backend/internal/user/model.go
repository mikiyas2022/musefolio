package user

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SocialLinks represents user's social media links
type SocialLinks struct {
	LinkedIn  string `bson:"linkedin,omitempty" json:"linkedin,omitempty"`
	GitHub    string `bson:"github,omitempty" json:"github,omitempty"`
	Twitter   string `bson:"twitter,omitempty" json:"twitter,omitempty"`
	Instagram string `bson:"instagram,omitempty" json:"instagram,omitempty"`
	Website   string `bson:"website,omitempty" json:"website,omitempty"`
}

// User represents a user in the system
type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Username    string             `bson:"username" json:"username"`
	Email       string             `bson:"email" json:"email"`
	Password    string             `bson:"password" json:"-"`
	Avatar      string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Profession  string             `bson:"profession,omitempty" json:"profession,omitempty"`
	Bio         string             `bson:"bio,omitempty" json:"bio,omitempty"`
	SocialLinks *SocialLinks       `bson:"socialLinks,omitempty" json:"socialLinks,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CreateUserInput represents the input for creating a new user
type CreateUserInput struct {
	Name       string `json:"name" validate:"required"`
	Username   string `json:"username" validate:"required,min=3,alphanum"`
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required,min=8"`
	Profession string `json:"profession,omitempty"`
	Bio        string `json:"bio,omitempty"`
}

// UpdateUserInput represents the input for updating a user
type UpdateUserInput struct {
	Name        *string      `json:"name,omitempty"`
	Username    *string      `json:"username,omitempty" validate:"omitempty,min=3,alphanum"`
	Email       *string      `json:"email,omitempty" validate:"omitempty,email"`
	Password    *string      `json:"password,omitempty" validate:"omitempty,min=8"`
	Avatar      *string      `json:"avatar,omitempty"`
	Profession  *string      `json:"profession,omitempty"`
	Bio         *string      `json:"bio,omitempty"`
	SocialLinks *SocialLinks `json:"socialLinks,omitempty"`
}
