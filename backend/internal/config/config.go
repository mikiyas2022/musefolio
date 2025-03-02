package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for our application
type Config struct {
	Server  ServerConfig
	MongoDB MongoDBConfig
	Auth    AuthConfig
	Storage StorageConfig
}

type ServerConfig struct {
	Port            int
	ShutdownTimeout time.Duration
}

type MongoDBConfig struct {
	URI      string
	Database string
	Timeout  time.Duration
}

type AuthConfig struct {
	JWTSecret    string
	TokenExpiry  time.Duration
	RefreshToken time.Duration
}

type StorageConfig struct {
	Provider string
	Bucket   string
	Region   string
}

// Load returns a Config struct populated with values from environment variables
func Load() (*Config, error) {
	return &Config{
		Server: ServerConfig{
			Port:            getEnvAsInt("SERVER_PORT", 8080),
			ShutdownTimeout: getEnvAsDuration("SERVER_SHUTDOWN_TIMEOUT", 30*time.Second),
		},
		MongoDB: MongoDBConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "musefolio"),
			Timeout:  getEnvAsDuration("MONGODB_TIMEOUT", 10*time.Second),
		},
		Auth: AuthConfig{
			JWTSecret:    getEnv("JWT_SECRET", "your-secret-key"),
			TokenExpiry:  getEnvAsDuration("TOKEN_EXPIRY", 24*time.Hour),
			RefreshToken: getEnvAsDuration("REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),
		},
		Storage: StorageConfig{
			Provider: getEnv("STORAGE_PROVIDER", "local"),
			Bucket:   getEnv("STORAGE_BUCKET", "musefolio"),
			Region:   getEnv("STORAGE_REGION", "us-east-1"),
		},
	}, nil
}

// Helper functions to get environment variables
func getEnv(key string, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultVal
}

func getEnvAsDuration(key string, defaultVal time.Duration) time.Duration {
	valueStr := getEnv(key, "")
	if value, err := time.ParseDuration(valueStr); err == nil {
		return value
	}
	return defaultVal
}
