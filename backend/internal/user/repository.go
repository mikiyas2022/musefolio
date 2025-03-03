package user

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/musefolio/backend/internal/database"
)

// Repository handles user data operations
type Repository struct {
	db         *database.DB
	collection *mongo.Collection
}

// NewRepository creates a new user repository
func NewRepository(db *database.DB) *Repository {
	return &Repository{
		db:         db,
		collection: db.Collection(database.UsersCollection),
	}
}

// Create creates a new user
func (r *Repository) Create(ctx context.Context, input CreateUserInput) (*User, error) {
	now := time.Now()
	user := &User{
		ID:        primitive.NewObjectID(),
		Name:      input.Name,
		Username:  input.Username,
		Email:     input.Email,
		Password:  input.Password, // Note: Password should be hashed before this point
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err := r.collection.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// FindByID finds a user by ID
func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (*User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindByEmail finds a user by email
func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindByUsername finds a user by username
func (r *Repository) FindByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	err := r.collection.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// Update updates a user
func (r *Repository) Update(ctx context.Context, id primitive.ObjectID, input UpdateUserInput) (*User, error) {
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if input.Name != nil {
		update["$set"].(bson.M)["name"] = *input.Name
	}
	if input.Username != nil {
		update["$set"].(bson.M)["username"] = *input.Username
	}
	if input.Email != nil {
		update["$set"].(bson.M)["email"] = *input.Email
	}
	if input.Password != nil {
		update["$set"].(bson.M)["password"] = *input.Password // Note: Password should be hashed before this point
	}
	if input.Bio != nil {
		update["$set"].(bson.M)["bio"] = *input.Bio
	}
	if input.Profession != nil {
		update["$set"].(bson.M)["profession"] = *input.Profession
	}
	if input.Avatar != nil {
		update["$set"].(bson.M)["avatar"] = *input.Avatar
	}
	if input.SocialLinks != nil {
		update["$set"].(bson.M)["socialLinks"] = input.SocialLinks
	}

	log.Printf("Updating user ID: %s with data: %+v", id.Hex(), update["$set"])

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var user User
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": id}, update, opts).Decode(&user)
	if err != nil {
		log.Printf("Error updating user: %v", err)
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	log.Printf("User updated successfully: %+v", user)
	return &user, nil
}

// Delete deletes a user
func (r *Repository) Delete(ctx context.Context, id primitive.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

// List lists all users with pagination
func (r *Repository) List(ctx context.Context, page, limit int64) ([]*User, error) {
	opts := options.Find().
		SetSkip((page - 1) * limit).
		SetLimit(limit).
		SetSort(bson.M{"createdAt": -1})

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []*User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

// Count returns the total number of users
func (r *Repository) Count(ctx context.Context) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{})
}
