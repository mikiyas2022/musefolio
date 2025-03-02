# MuseFolio

MuseFolio is a dynamic, all-in-one platform for professionals to create, customize, and publish polished CVs and portfolios. It combines AI-driven template suggestions tailored to various professions, deep customization options, and dynamic content management.

## Features

- **Professional Templates**: Pre-designed templates for 20+ professions
- **AI-Guided Design**: Smart suggestions for layout and content
- **Dynamic Content Management**: Seamlessly sync CV and portfolio content
- **Custom Domains**: Use your domain or get a free musefolio.com subdomain
- **Responsive Design**: Perfect display on all devices
- **Rich Media Support**: Images, videos, PDFs, and more
- **SEO Optimization**: Built-in tools for better visibility

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- Formik & Yup for form handling
- React Router for navigation

### Backend
- Go (Golang)
- PostgreSQL for data storage
- Redis for caching
- AWS S3 for media storage

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Go (v1.21 or later)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/musefolio.git
cd musefolio
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
go mod tidy
```

4. Set up environment variables:
```bash
# Backend (.env)
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=musefolio
JWT_SECRET=your-secret-key

# Frontend (.env)
VITE_API_URL=http://localhost:8080
```

5. Start the development servers:

Backend:
```bash
cd backend
go run cmd/api/main.go
```

Frontend:
```bash
cd frontend
npm run dev
```

## Project Structure

### Frontend
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API and external services
│   ├── store/          # Redux store and slices
│   └── utils/          # Utility functions
```

### Backend
```
backend/
├── cmd/
│   └── api/           # Application entry points
├── internal/
│   ├── auth/         # Authentication
│   ├── portfolio/    # Portfolio management
│   ├── template/     # Template engine
│   └── user/         # User management
├── pkg/              # Public packages
└── api/              # API definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI for the beautiful components
- The Go community for excellent packages
- All contributors who help make MuseFolio better 