package portfolio

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/musefolio/backend/internal/database"
)

// Repository handles portfolio data operations
type Repository struct {
	db         *database.DB
	collection *mongo.Collection
}

// NewRepository creates a new portfolio repository
func NewRepository(db *database.DB) *Repository {
	return &Repository{
		db:         db,
		collection: db.Collection(database.PortfoliosCollection),
	}
}

// Create creates a new portfolio
func (r *Repository) Create(ctx context.Context, userID primitive.ObjectID, input CreatePortfolioInput) (*Portfolio, error) {
	now := time.Now()
	portfolio := &Portfolio{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Title:       input.Title,
		Description: input.Description,
		Theme:       input.Theme,
		Layout:      input.Layout,
		Type:        input.Type,
		Projects:    []Project{},
		Sections:    []Section{},
		Subdomain:   input.Subdomain,
		IsPublished: false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err := r.collection.InsertOne(ctx, portfolio)
	if err != nil {
		return nil, err
	}

	return portfolio, nil
}

// FindByID finds a portfolio by ID
func (r *Repository) FindByID(ctx context.Context, id primitive.ObjectID) (*Portfolio, error) {
	var portfolio Portfolio
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&portfolio)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &portfolio, nil
}

// FindByUserID finds all portfolios for a user
func (r *Repository) FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]*Portfolio, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var portfolios []*Portfolio
	if err := cursor.All(ctx, &portfolios); err != nil {
		return nil, err
	}

	return portfolios, nil
}

// FindBySubdomain finds a portfolio by subdomain
func (r *Repository) FindBySubdomain(ctx context.Context, subdomain string) (*Portfolio, error) {
	var portfolio Portfolio
	err := r.collection.FindOne(ctx, bson.M{"subdomain": subdomain}).Decode(&portfolio)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &portfolio, nil
}

// Update updates a portfolio
func (r *Repository) Update(ctx context.Context, id primitive.ObjectID, input UpdatePortfolioInput) (*Portfolio, error) {
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if input.Title != nil {
		update["$set"].(bson.M)["title"] = *input.Title
	}
	if input.Description != nil {
		update["$set"].(bson.M)["description"] = *input.Description
	}
	if input.Theme != nil {
		update["$set"].(bson.M)["theme"] = *input.Theme
	}
	if input.Layout != nil {
		update["$set"].(bson.M)["layout"] = *input.Layout
	}
	if input.Subdomain != nil {
		update["$set"].(bson.M)["subdomain"] = *input.Subdomain
	}
	if input.CustomDomain != nil {
		update["$set"].(bson.M)["customDomain"] = *input.CustomDomain
	}
	if input.IsPublished != nil {
		update["$set"].(bson.M)["isPublished"] = *input.IsPublished
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var portfolio Portfolio
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": id}, update, opts).Decode(&portfolio)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &portfolio, nil
}

// Delete deletes a portfolio
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

// AddProject adds a project to a portfolio
func (r *Repository) AddProject(ctx context.Context, portfolioID primitive.ObjectID, input CreateProjectInput) (*Project, error) {
	now := time.Now()
	project := &Project{
		ID:          primitive.NewObjectID(),
		Title:       input.Title,
		Description: input.Description,
		Content:     input.Content,
		Tags:        input.Tags,
		Order:       input.Order,
		Media:       []Media{},
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	update := bson.M{
		"$push": bson.M{"projects": project},
		"$set":  bson.M{"updatedAt": now},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var portfolio Portfolio
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": portfolioID}, update, opts).Decode(&portfolio)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	// Find and return the newly added project
	for _, p := range portfolio.Projects {
		if p.ID == project.ID {
			return &p, nil
		}
	}

	return nil, nil
}

// UpdateProject updates a project in a portfolio
func (r *Repository) UpdateProject(ctx context.Context, portfolioID, projectID primitive.ObjectID, input UpdateProjectInput) (*Project, error) {
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if input.Title != nil {
		update["$set"].(bson.M)["projects.$.title"] = *input.Title
	}
	if input.Description != nil {
		update["$set"].(bson.M)["projects.$.description"] = *input.Description
	}
	if input.Content != nil {
		update["$set"].(bson.M)["projects.$.content"] = *input.Content
	}
	if input.Tags != nil {
		update["$set"].(bson.M)["projects.$.tags"] = *input.Tags
	}
	if input.Order != nil {
		update["$set"].(bson.M)["projects.$.order"] = *input.Order
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var portfolio Portfolio
	err := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":          portfolioID,
			"projects._id": projectID,
		},
		update,
		opts,
	).Decode(&portfolio)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	// Find and return the updated project
	for _, project := range portfolio.Projects {
		if project.ID == projectID {
			return &project, nil
		}
	}

	return nil, nil
}

// DeleteProject deletes a project from a portfolio
func (r *Repository) DeleteProject(ctx context.Context, portfolioID, projectID primitive.ObjectID) error {
	update := bson.M{
		"$pull": bson.M{
			"projects": bson.M{"_id": projectID},
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": portfolioID},
		update,
	)

	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

// AddSection adds a section to a portfolio
func (r *Repository) AddSection(ctx context.Context, portfolioID primitive.ObjectID, input CreateSectionInput) (*Section, error) {
	now := time.Now()
	section := &Section{
		ID:        primitive.NewObjectID(),
		Title:     input.Title,
		Type:      input.Type,
		Content:   input.Content,
		Order:     input.Order,
		CreatedAt: now,
		UpdatedAt: now,
	}

	update := bson.M{
		"$push": bson.M{"sections": section},
		"$set":  bson.M{"updatedAt": now},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var portfolio Portfolio
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": portfolioID}, update, opts).Decode(&portfolio)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	// Find and return the newly added section
	for _, s := range portfolio.Sections {
		if s.ID == section.ID {
			return &s, nil
		}
	}

	return nil, nil
}

// UpdateSection updates a section in a portfolio
func (r *Repository) UpdateSection(ctx context.Context, portfolioID, sectionID primitive.ObjectID, input UpdateSectionInput) (*Section, error) {
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if input.Title != nil {
		update["$set"].(bson.M)["sections.$.title"] = *input.Title
	}
	if input.Type != nil {
		update["$set"].(bson.M)["sections.$.type"] = *input.Type
	}
	if input.Content != nil {
		update["$set"].(bson.M)["sections.$.content"] = *input.Content
	}
	if input.Order != nil {
		update["$set"].(bson.M)["sections.$.order"] = *input.Order
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var portfolio Portfolio
	err := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":          portfolioID,
			"sections._id": sectionID,
		},
		update,
		opts,
	).Decode(&portfolio)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	// Find and return the updated section
	for _, section := range portfolio.Sections {
		if section.ID == sectionID {
			return &section, nil
		}
	}

	return nil, nil
}

// DeleteSection deletes a section from a portfolio
func (r *Repository) DeleteSection(ctx context.Context, portfolioID, sectionID primitive.ObjectID) error {
	update := bson.M{
		"$pull": bson.M{
			"sections": bson.M{"_id": sectionID},
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": portfolioID},
		update,
	)

	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

// AddMedia adds media to a project
func (r *Repository) AddMedia(ctx context.Context, portfolioID, projectID primitive.ObjectID, media Media) error {
	update := bson.M{
		"$push": bson.M{
			"projects.$.media": media,
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id":          portfolioID,
			"projects._id": projectID,
		},
		update,
	)

	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}

// DeleteMedia deletes media from a project
func (r *Repository) DeleteMedia(ctx context.Context, portfolioID, projectID, mediaID primitive.ObjectID) error {
	update := bson.M{
		"$pull": bson.M{
			"projects.$.media": bson.M{"_id": mediaID},
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id":          portfolioID,
			"projects._id": projectID,
		},
		update,
	)

	if err != nil {
		return err
	}

	if result.ModifiedCount == 0 {
		return mongo.ErrNoDocuments
	}

	return nil
}
