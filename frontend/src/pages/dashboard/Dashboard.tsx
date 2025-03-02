import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, User } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { 
  fetchPortfolios, 
  createPortfolio, 
  updatePortfolio, 
  deletePortfolio, 
  publishPortfolio,
  Portfolio
} from '../../store/slices/pageSlice';
import {
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  TextField,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as WebsiteIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  BugReport as BugReportIcon,
  Save as SaveIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { SocialLinks } from '../../types';
import ApiService from '../../services/api';

const SIDEBAR_WIDTH = 280;

interface ProfileData {
  name?: string;
  profession?: string;
  bio?: string;
  socialLinks?: SocialLinks;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const portfolios = useSelector((state: RootState) => state.page.portfolios);
  const loading = useSelector((state: RootState) => state.page.loading);
  const error = useSelector((state: RootState) => state.page.error);
  const { user, updateProfile, isAuthenticated, refreshUserData } = useAuth();
  const { showSuccess, showError } = useFeedback();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPageType, setNewPageType] = useState<'about' | 'cv' | 'portfolio'>('about');
  const [newPageTitle, setNewPageTitle] = useState('');

  // Menu states
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

  // Profile states
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    profession: user?.profession || '',
    bio: user?.bio || '',
    socialLinks: {
      linkedin: user?.socialLinks?.linkedin || '',
      github: user?.socialLinks?.github || '',
      twitter: user?.socialLinks?.twitter || '',
      behance: user?.socialLinks?.behance || '',
      dribbble: user?.socialLinks?.dribbble || '',
    },
  });

  // Fetch portfolios on component mount
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, fetching portfolios');
      dispatch(fetchPortfolios())
        .unwrap()
        .then((result) => {
          console.log('✅ Successfully fetched portfolios:', result);
          console.log('Portfolios type:', typeof result, Array.isArray(result) ? 'Is Array' : 'Not Array');
          // Even if result is null, it's handled by the component's null check
        })
        .catch((error) => {
          console.error('❌ Failed to fetch portfolios:', error);
          showError(typeof error === 'string' ? error : 'Failed to load portfolios');
        });
    } else {
      navigate('/login');
      showError('Please login to view your portfolios');
    }
  }, [dispatch, isAuthenticated, navigate, showError]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleCreateNew = async () => {
    if (newPageType === 'portfolio') {
      // Show the create dialog for portfolios
      setIsCreateDialogOpen(true);
    } else {
      // Direct to the editor for other page types
      navigate('/editor', { state: { pageType: newPageType } });
    }
  };

  const handleViewPortfolio = (portfolio: Portfolio) => {
    navigate(`/preview/${portfolio.id}`);
    setMenuAnchorEl(null);
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    navigate(`/editor/${portfolio.id}`);
    setMenuAnchorEl(null);
  };

  const getPortfolioTemplate = (type: string): { description: string, sections: any[] } => {
    switch(type) {
      case 'about':
        return {
          description: 'My personal page showcasing my background, skills, and interests',
          sections: [
            {
              title: 'About Me',
              type: 'text',
              content: 'This is your about me page. Here you can share your background, interests, and story with visitors.',
              order: 0
            },
            {
              title: 'My Skills',
              type: 'list',
              content: 'Web Development\nUI/UX Design\nProject Management',
              order: 1
            },
            {
              title: 'Experience',
              type: 'timeline',
              content: 'Share your professional journey and achievements here.',
              order: 2
            }
          ]
        };
      case 'cv':
        return {
          description: 'My professional resume showcasing my skills and experience',
          sections: [
            {
              title: 'Professional Summary',
              type: 'text',
              content: 'A brief overview of your professional background and key qualifications.',
              order: 0
            },
            {
              title: 'Work Experience',
              type: 'timeline',
              content: 'List your work experience with company names, dates, and key responsibilities.',
              order: 1
            },
            {
              title: 'Education',
              type: 'timeline',
              content: 'Share your educational background including degrees, institutions, and graduation dates.',
              order: 2
            },
            {
              title: 'Skills',
              type: 'list',
              content: 'Technical Skills\nSoft Skills\nCertifications',
              order: 3
            }
          ]
        };
      case 'portfolio':
        return {
          description: 'My creative portfolio showcasing my projects and work',
          sections: [
            {
              title: 'Portfolio Introduction',
              type: 'text',
              content: 'Welcome to my portfolio. Here you\'ll find a collection of my best work and projects.',
              order: 0
            },
            {
              title: 'Featured Projects',
              type: 'gallery',
              content: 'This section will display your featured projects with images and descriptions.',
              order: 1
            }
          ]
        };
      default:
        return {
          description: `A new ${type} page`,
          sections: []
        };
    }
  };

  const handleCreatePortfolio = async () => {
    if (!newPageTitle) {
      showError('Portfolio name is required');
      return;
    }

    try {
      console.log('Creating new portfolio:', newPageTitle, 'type:', newPageType);
      
      // Get template data based on portfolio type
      const template = getPortfolioTemplate(newPageType);
      
      // Prepare portfolio data with supported fields
      const portfolioData = {
        title: newPageTitle,
        description: template.description,
        type: newPageType,
        // Add theme and layout for better connection between components
        theme: 'modern',
        layout: 'standard'
      };
      
      const result = await dispatch(createPortfolio(portfolioData)).unwrap();
      
      if (result) {
        showSuccess(`${newPageType.charAt(0).toUpperCase() + newPageType.slice(1)} page created successfully`);
        setIsCreateDialogOpen(false);
        setNewPageTitle('');
        
        // Force refresh portfolios list
        dispatch(fetchPortfolios());
        
        // Redirect to editor for the newly created portfolio
        setTimeout(() => {
          navigate(`/editor/${result.id}`);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      showError(error instanceof Error ? error.message : 'Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await dispatch(deletePortfolio(portfolioId)).unwrap();
      setMenuAnchorEl(null);
      showSuccess('Portfolio deleted successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete portfolio');
    }
  };

  const handlePublishPortfolio = async (portfolioId: string) => {
    try {
      await dispatch(publishPortfolio(portfolioId)).unwrap();
      setMenuAnchorEl(null);
      showSuccess('Portfolio published successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to publish portfolio');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!profileData.name?.trim()) {
        showError('Name is required');
        return;
      }

      // First update in the backend using direct API call
      const response = await ApiService.updateProfile({
        name: profileData.name,
        profession: profileData.profession,
        bio: profileData.bio
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('Profile updated successfully:', response.data);
      
      // Force refresh user data with the latest from server
      await forceRefreshUI();
      
      // Exit edit mode
      setIsEditing(false);
      
      showSuccess('Profile updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleSocialLinksUpdate = async () => {
    try {
      // Create a clean object with only non-empty social links
      const cleanedSocialLinks: Record<string, string> = {};
      
      if (profileData.socialLinks) {
        Object.entries(profileData.socialLinks).forEach(([key, value]) => {
          if (value && value.trim()) {
            cleanedSocialLinks[key] = value.trim();
          }
        });
      }
      
      // Use the direct API service method instead of updateProfile
      const response = await ApiService.updateSocialLinks(cleanedSocialLinks);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh user data from updated localStorage
      refreshUserData();
      
      // Force UI update with the latest data
      setTimeout(() => {
        forceRefreshUI();
      }, 100);
      
      showSuccess('Social links updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update social links');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social-')) {
      const socialPlatform = name.replace('social-', '') as keyof SocialLinks;
      setProfileData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialPlatform]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Direct handler for social link inputs
  const handleSocialInputChange = (platform: keyof SocialLinks) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: e.target.value,
      },
    }));
  };

  // Updated useEffect for debugging and additional logging
  useEffect(() => {
    if (user) {
      console.log('User data updated in Dashboard:', user);
      setProfileData({
        name: user.name,
        profession: user.profession || '',
        bio: user.bio || '',
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || '',
          github: user.socialLinks?.github || '',
          twitter: user.socialLinks?.twitter || '',
          behance: user.socialLinks?.behance || '',
          dribbble: user.socialLinks?.dribbble || '',
        },
      });
    }
  }, [user]);

  const handleLogout = () => {
    ApiService.logout();
    navigate('/login');
  };

  const forceRefreshUI = async () => {
    try {
      // First, get the latest user data from the server
      const response = await ApiService.getCurrentUser();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        // 1. Refresh user data in context
        refreshUserData();
        
        // 2. Update local component state
        setProfileData({
          name: response.data.name || '',
          profession: response.data.profession || '',
          bio: response.data.bio || '',
          socialLinks: response.data.socialLinks || {}
        });
        
        console.log('Refreshed user data from server:', response.data);
        showSuccess('Profile data refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
      showError('Could not refresh profile data. Please try again.');
    }
  };

  // Utility function to safely check for portfolio types
  const hasPortfolioOfType = (type: string): boolean => {
    if (!portfolios) return false;
    if (!Array.isArray(portfolios)) {
      console.error('portfolios is not an array:', portfolios);
      return false;
    }
    return portfolios.some(p => p && (p as any).type === type);
  };

  // Add separate handler for bio editing
  const handleBioClick = () => {
    if (!isEditing) {
      setIsEditingBio(true);
    }
  };

  // Add specific handler for bio input
  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      bio: e.target.value
    }));
  };

  const handleBioSave = async () => {
    try {
      // Update bio only
      const result = await updateProfile({
        bio: profileData.bio
      });
      
      console.log('Bio updated successfully:', result);
      setIsEditingBio(false);
      
      // Force refresh user data
      refreshUserData();
      
      showSuccess('Bio updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update bio');
    }
  };

  return (
    <Box sx={{ 
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: 'background.default',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      display: 'flex',
    }}>
      {/* Left Sidebar */}
      <Paper
        elevation={3}
        sx={{
          width: SIDEBAR_WIDTH,
          height: '100vh',
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Profile Section */}
        <Box sx={{ p: 3, textAlign: 'center', position: 'relative' }}>
          <IconButton
            size="small"
            onClick={forceRefreshUI}
            title="Refresh Profile"
            sx={{ position: 'absolute', top: 10, right: 10 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              onChange={(e) => {
                if (e.target.files?.length) {
                  const file = e.target.files[0];
                  ApiService.uploadAvatar(file)
                    .then(response => {
                      if (response.error) throw new Error(response.error);
                      if (response.data) {
                        dispatch(updateUser(response.data as User));
                        showSuccess('Avatar uploaded successfully');
                      }
                    })
                    .catch(error => {
                      showError(error instanceof Error ? error.message : 'Failed to upload avatar');
                    });
                }
              }}
            />
            <label htmlFor="avatar-upload">
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  mx: 'auto',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              />
            </label>
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'background.paper' },
              }}
              onClick={() => setIsEditing(true)}
            >
              <EditIcon />
            </IconButton>
          </Box>
          {isEditing ? (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Professional Title"
                name="profession"
                value={profileData.profession}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={4}
                value={profileData.bio}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom data-profile-name>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom data-profile-profession>
                {user?.profession || 'Professional Title'}
              </Typography>
            </>
          )}
        </Box>

        <Divider />

        {/* Pages Management */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Your Pages
            </Typography>
            <Button 
              size="small" 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create New
            </Button>
          </Box>

          {/* Display fixed page types with their statuses */}
          <List sx={{ width: '100%' }}>
            {/* About Me Page */}
            <ListItem
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={() => navigate('/editor', { state: { pageType: 'about' } })}
                  title="Edit About Me Page"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="About Me" 
                secondary={
                  hasPortfolioOfType('about')
                    ? "Published" 
                    : "Not created yet"
                } 
              />
            </ListItem>

            {/* CV/Resume Page */}
            <ListItem
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={() => navigate('/editor', { state: { pageType: 'cv' } })}
                  title="Edit CV/Resume Page"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText 
                primary="CV/Resume" 
                secondary={
                  hasPortfolioOfType('cv')
                    ? "Published" 
                    : "Not created yet"
                } 
              />
            </ListItem>

            {/* Portfolio Page */}
            <ListItem
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={() => navigate('/editor', { state: { pageType: 'portfolio' } })}
                  title="Edit Portfolio Page"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon>
                <CollectionsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Portfolio Gallery" 
                secondary={
                  hasPortfolioOfType('portfolio')
                    ? "Published" 
                    : "Not created yet"
                } 
              />
            </ListItem>
          </List>

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Bio Section */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Bio
            </Typography>
            {isEditingBio ? (
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleBioSave}
                startIcon={<SaveIcon />}
              >
                Save Bio
              </Button>
            ) : (
              <IconButton 
                size="small" 
                onClick={() => setIsEditingBio(true)}
                title="Edit Bio"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          {isEditingBio ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              name="bio"
              value={profileData.bio || ''}
              onChange={handleBioChange}
              placeholder="Add a short bio to tell your story..."
              variant="outlined"
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph 
              data-profile-bio
              onClick={handleBioClick}
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                p: 1,
                borderRadius: 1,
                minHeight: '80px'
              }}
            >
              {user?.bio || 'Add a short bio to tell your story... (click to edit)'}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Social Links */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Social Links
            </Typography>
            <Button
              size="small"
              onClick={handleSocialLinksUpdate}
              variant="outlined"
              startIcon={<SaveIcon />}
            >
              Save Links
            </Button>
          </Box>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="LinkedIn URL"
              value={profileData.socialLinks?.linkedin || ''}
              onChange={handleSocialInputChange('linkedin')}
              name="social-linkedin"
              InputProps={{
                startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="GitHub URL"
              value={profileData.socialLinks?.github || ''}
              onChange={handleSocialInputChange('github')}
              name="social-github"
              InputProps={{
                startAdornment: <GitHubIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Twitter URL"
              value={profileData.socialLinks?.twitter || ''}
              onChange={handleSocialInputChange('twitter')}
              name="social-twitter"
              InputProps={{
                startAdornment: <TwitterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Dribbble URL"
              value={profileData.socialLinks?.dribbble || ''}
              onChange={handleSocialInputChange('dribbble')}
              InputProps={{
                startAdornment: <InstagramIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Behance URL"
              value={profileData.socialLinks?.behance || ''}
              onChange={handleSocialInputChange('behance')}
              InputProps={{
                startAdornment: <WebsiteIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Stack>
        </Box>

        {/* Navigation Section */}
        <List sx={{ flexGrow: 1 }}>
          <ListItemButton selected>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          
          {/* Logout at bottom */}
          <Box sx={{ mt: 'auto' }}>
            <Divider />
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </Box>
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Container maxWidth={false} sx={{ py: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4,
            px: 2,
          }}>
            <Typography variant="h4" component="h1">
              My Portfolios
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              size="large"
            >
              Create New Portfolio
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ px: 2 }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography color="error" variant="body2" gutterBottom>
                  {error}
                </Typography>
                <Button
                  size="small"
                  onClick={() => dispatch(fetchPortfolios())}
                  startIcon={<RefreshIcon />}
                >
                  Retry
                </Button>
              </Box>
            ) : (
              portfolios?.map((portfolio) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={portfolio.id}>
                  <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8],
                    },
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {portfolio.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {portfolio.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Paper sx={{ px: 1, py: 0.5, bgcolor: 'primary.light' }}>
                          <Typography variant="caption" color="primary.contrastText">
                            {portfolio.theme}
                          </Typography>
                        </Paper>
                        <Paper sx={{ px: 1, py: 0.5, bgcolor: 'secondary.light' }}>
                          <Typography variant="caption" color="secondary.contrastText">
                            {portfolio.layout}
                          </Typography>
                        </Paper>
                      </Box>
                      {portfolio.customDomain && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Domain: {portfolio.customDomain}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        Subdomain: {portfolio.subdomain}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => handleViewPortfolio(portfolio)}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleEditPortfolio(portfolio)}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}

            {/* Show message when no portfolios */}
            {(portfolios === null || portfolios.length === 0) && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No portfolios found. Create your first one!
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Create Portfolio
                </Button>
              </Box>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Create New Portfolio Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create New Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Portfolio Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="portfolio-type-label">Portfolio Type</InputLabel>
            <Select
              labelId="portfolio-type-label"
              id="portfolio-type"
              value={newPageType}
              label="Portfolio Type"
              onChange={(e) => setNewPageType(e.target.value as 'about' | 'cv' | 'portfolio')}
            >
              <MenuItem value="portfolio">Gallery Portfolio</MenuItem>
              <MenuItem value="about">About Me</MenuItem>
              <MenuItem value="cv">CV/Resume</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePortfolio}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Page Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem 
          onClick={() => selectedPortfolio && handleViewPortfolio(selectedPortfolio)}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => selectedPortfolio && handleEditPortfolio(selectedPortfolio)}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {selectedPortfolio?.isPublished === false && (
          <MenuItem 
            onClick={() => selectedPortfolio && handlePublishPortfolio(selectedPortfolio.id)}
          >
            <ListItemIcon>
              <WebsiteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Publish
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => selectedPortfolio && handleDeletePortfolio(selectedPortfolio.id)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;