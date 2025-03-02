package database

import (
	"context"
	"log/slog"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"

	"github.com/musefolio/backend/internal/config"
)

// DB represents the MongoDB client and database
type DB struct {
	client   *mongo.Client
	database *mongo.Database
}

// Collections holds all collection names
const (
	UsersCollection      = "users"
	PortfoliosCollection = "portfolios"
	TemplatesCollection  = "templates"
	ThemesCollection     = "themes"
)

// New creates a new MongoDB connection
func New(cfg *config.MongoDBConfig) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Timeout)
	defer cancel()

	// Create MongoDB client
	clientOptions := options.Client().ApplyURI(cfg.URI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping the database
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, err
	}

	slog.Info("connected to MongoDB", "database", cfg.Database)

	return &DB{
		client:   client,
		database: client.Database(cfg.Database),
	}, nil
}

// Close disconnects from MongoDB
func (db *DB) Close(ctx context.Context) error {
	return db.client.Disconnect(ctx)
}

// Collection returns a MongoDB collection
func (db *DB) Collection(name string) *mongo.Collection {
	return db.database.Collection(name)
}

// Health checks the database connection
func (db *DB) Health(ctx context.Context) error {
	return db.client.Ping(ctx, readpref.Primary())
}

// WithTransaction executes the given function within a transaction
func (db *DB) WithTransaction(ctx context.Context, fn func(sessCtx mongo.SessionContext) error) error {
	session, err := db.client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
		return nil, fn(sessCtx)
	})
	return err
}

// EnsureIndexes creates all required indexes
func (db *DB) EnsureIndexes(ctx context.Context) error {
	// Users collection indexes
	userIndexes := []mongo.IndexModel{
		{
			Keys: map[string]interface{}{
				"email": 1,
			},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: map[string]interface{}{
				"username": 1,
			},
			Options: options.Index().SetUnique(true),
		},
	}

	// Portfolios collection indexes
	portfolioIndexes := []mongo.IndexModel{
		{
			Keys: map[string]interface{}{
				"userId": 1,
			},
		},
		{
			Keys: map[string]interface{}{
				"subdomain": 1,
			},
			Options: options.Index().SetUnique(true),
		},
	}

	// Create indexes
	if _, err := db.Collection(UsersCollection).Indexes().CreateMany(ctx, userIndexes); err != nil {
		return err
	}

	if _, err := db.Collection(PortfoliosCollection).Indexes().CreateMany(ctx, portfolioIndexes); err != nil {
		return err
	}

	return nil
}
