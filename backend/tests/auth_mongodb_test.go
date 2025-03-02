package tests

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/musefolio/backend/internal/auth"
	"github.com/musefolio/backend/internal/config"
	"github.com/musefolio/backend/internal/database"
	"github.com/musefolio/backend/internal/user"
)

// Setup test MongoDB connection
func setupTestDB(t *testing.T) *database.DB {
	// Use a test-specific MongoDB URI or the default one
	mongoURI := os.Getenv("TEST_MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	cfg := &config.MongoDBConfig{
		URI:      mongoURI,
		Database: "musefolio_test",
		Timeout:  10 * time.Second,
	}

	db, err := database.New(cfg)
	require.NoError(t, err, "Failed to connect to test MongoDB")

	// Clean up any previous test data
	ctx := context.Background()
	err = db.Collection(database.UsersCollection).Drop(ctx)
	if err != nil && err != mongo.ErrNamespaceNotFound {
		t.Fatalf("Failed to drop users collection: %v", err)
	}

	return db
}

// Create a test user in the database
func createTestUser(t *testing.T, db *database.DB) (primitive.ObjectID, string) {
	ctx := context.Background()

	// Create a test user
	hashedPassword, err := user.HashPassword("testpassword")
	require.NoError(t, err, "Failed to hash password")

	userID := primitive.NewObjectID()
	testUser := bson.M{
		"_id":           userID,
		"name":          "Test User",
		"email":         "test@example.com",
		"username":      "testuser",
		"password_hash": hashedPassword,
		"created_at":    time.Now(),
		"updated_at":    time.Now(),
	}

	_, err = db.Collection(database.UsersCollection).InsertOne(ctx, testUser)
	require.NoError(t, err, "Failed to insert test user")

	return userID, hashedPassword
}

func TestAuthenticationWithMongoDB(t *testing.T) {
	// Skip this test if we're not running integration tests
	if os.Getenv("SKIP_INTEGRATION_TESTS") == "true" {
		t.Skip("Skipping integration test")
	}

	// Setup test database
	db := setupTestDB(t)
	defer func() {
		err := db.Close(context.Background())
		if err != nil {
			t.Logf("Error closing DB connection: %v", err)
		}
	}()

	// Create a test user
	userID, _ := createTestUser(t, db)

	// Create a user service for testing
	userService := &user.Service{
		DB: db,
	}

	// Create an auth handler
	jwtSecret := "test-secret-key"
	authHandler := auth.NewHandler(userService, jwtSecret, 24*time.Hour)

	t.Run("ValidateCredentials", func(t *testing.T) {
		// Test with valid credentials
		ctx := context.Background()
		user, err := userService.ValidateCredentials(ctx, "test@example.com", "testpassword")
		assert.NoError(t, err, "Should validate correct credentials")
		assert.NotNil(t, user, "Should return user")
		assert.Equal(t, userID.Hex(), user.ID, "Should return correct user ID")

		// Test with invalid password
		user, err = userService.ValidateCredentials(ctx, "test@example.com", "wrongpassword")
		assert.Error(t, err, "Should reject wrong password")
		assert.Nil(t, user, "Should not return user")

		// Test with invalid email
		user, err = userService.ValidateCredentials(ctx, "nonexistent@example.com", "testpassword")
		assert.Error(t, err, "Should reject nonexistent email")
		assert.Nil(t, user, "Should not return user")
	})

	t.Run("GenerateTokenAndVerify", func(t *testing.T) {
		// Create a JWT token for our test user
		tokenString, err := generateTestToken(userID.Hex(), jwtSecret)
		assert.NoError(t, err, "Should generate token")

		// Verify the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		assert.NoError(t, err, "Should parse token")
		assert.True(t, token.Valid, "Token should be valid")

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		assert.True(t, ok, "Should extract claims")
		assert.Equal(t, userID.Hex(), claims["sub"], "Subject should match user ID")
	})

	t.Run("CookieBasedAuthentication", func(t *testing.T) {
		// This test verifies that our JWT tokens can be stored in cookies
		// for authentication persistence in the frontend

		// Generate a token
		tokenString, err := generateTestToken(userID.Hex(), jwtSecret)
		assert.NoError(t, err, "Should generate token")

		// In a real application, this token would be set as a cookie
		// and sent with requests. For this test, we're just verifying
		// that the token functions correctly.

		// Parse and verify the token as if it came from a cookie
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		assert.NoError(t, err, "Should parse token from cookie")
		assert.True(t, token.Valid, "Cookie token should be valid")
	})

	t.Run("UserExists", func(t *testing.T) {
		// Test user existence in MongoDB
		ctx := context.Background()

		// Check if our test user exists
		filter := bson.M{"email": "test@example.com"}
		result := db.Collection(database.UsersCollection).FindOne(ctx, filter)
		assert.NoError(t, result.Err(), "Test user should exist in database")

		// Check for non-existent user
		filter = bson.M{"email": "nonexistent@example.com"}
		result = db.Collection(database.UsersCollection).FindOne(ctx, filter)
		assert.Equal(t, mongo.ErrNoDocuments, result.Err(), "Non-existent user should not be found")
	})

	t.Run("MongoDBIndexes", func(t *testing.T) {
		// Verify that important indexes exist
		ctx := context.Background()
		cursor, err := db.Collection(database.UsersCollection).Indexes().List(ctx)
		assert.NoError(t, err, "Should list indexes")

		var indexes []bson.M
		err = cursor.All(ctx, &indexes)
		assert.NoError(t, err, "Should get all indexes")

		// We should have at least the _id index and potentially others
		assert.True(t, len(indexes) >= 1, "Should have at least _id index")
	})
}

// Helper function to generate a JWT token for testing
func generateTestToken(userID, secret string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,                                // Subject (user ID)
		"exp": time.Now().Add(24 * time.Hour).Unix(), // Expiration time
		"iat": time.Now().Unix(),                     // Issued at
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
