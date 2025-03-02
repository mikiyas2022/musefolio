import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Link,
  IconButton,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';

const PortfolioPreview: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const portfolio = useSelector((state: RootState) => {
    // TODO: Implement proper portfolio selection based on username
    return state.portfolio.currentPortfolio;
  });

  if (!portfolio) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5">Portfolio not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {portfolio.title}
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          {portfolio.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <IconButton href="#" target="_blank" aria-label="github">
            <GitHubIcon />
          </IconButton>
          <IconButton href="#" target="_blank" aria-label="linkedin">
            <LinkedInIcon />
          </IconButton>
          <IconButton href="#" target="_blank" aria-label="website">
            <WebsiteIcon />
          </IconButton>
          <IconButton href="#" target="_blank" aria-label="email">
            <EmailIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Projects Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Projects
        </Typography>
        <Grid container spacing={4}>
          {portfolio.projects.map((project) => (
            <Grid item xs={12} md={6} key={project.id}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {project.title}
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {project.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {project.tags.map((tag) => (
                    <Typography
                      key={tag}
                      variant="body2"
                      component="span"
                      sx={{
                        mr: 1,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
                {project.media.length > 0 && (
                  <Box
                    component="img"
                    src={project.media[0]}
                    alt={project.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider />

      {/* Custom Sections */}
      {portfolio.sections.map((section) => (
        <Box key={section.id} sx={{ py: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {section.title}
          </Typography>
          <Typography paragraph>
            {section.content}
          </Typography>
        </Box>
      ))}

      {/* Footer */}
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Created with MuseFolio
        </Typography>
      </Box>
    </Container>
  );
};

export default PortfolioPreview; 