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
  Portfolio as BasePortfolio,
  PortfolioType
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
  CardMedia,
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

const SIDEBAR_WIDTH = 320;

// Extend the Portfolio interface to include projectMeta
interface Portfolio extends BasePortfolio {
  projectMeta?: {
    profession?: string;
    hasImage?: boolean;
  };
}

interface ProfileData {
  name?: string;
  profession?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  avatarPreview?: string;
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
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  // Menu states
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

  // Profile states
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);
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

  // Profession options
  const professionOptions = [
    { value: 'webDevelopment', label: 'Web Development', icon: '🌐', description: 'Websites and web applications' },
    { value: 'mobileDevelopment', label: 'Mobile Development', icon: '📱', description: 'iOS and Android applications' },
    { value: 'uiuxDesign', label: 'UI/UX Design', icon: '🎨', description: 'User interfaces and experiences' },
    { value: 'graphicDesign', label: 'Graphic Design', icon: '🖌️', description: 'Visual content and branding' },
    { value: 'productDesign', label: 'Product Design', icon: '📐', description: 'Physical and digital products' },
    { value: 'photography', label: 'Photography', icon: '📷', description: 'Professional photography work' },
    { value: 'videoProduction', label: 'Video Production', icon: '🎬', description: 'Videos and motion graphics' },
    { value: 'writing', label: 'Writing', icon: '✍️', description: 'Articles, blogs and content' },
    { value: 'marketing', label: 'Marketing', icon: '📊', description: 'Digital marketing campaigns' },
    { value: 'other', label: 'Other', icon: '🔍', description: 'Custom project type' }
  ];

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
      // Show the create dialog for portfolios
      setIsCreateDialogOpen(true);
  };

  const handleViewPortfolio = (portfolio: Portfolio) => {
    navigate(`/preview/${portfolio.id}`);
    setMenuAnchorEl(null);
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    navigate(`/editor/${portfolio.id}`);
    setMenuAnchorEl(null);
  };

  const handleCreateProject = async () => {
    if (!newPageTitle) {
      showError('Project title is required');
      return;
    }

    if (!selectedProfession) {
      showError('Please select a project profession type');
      return;
    }

    try {
      console.log('Creating new project:', newPageTitle, 'type:', selectedProfession);
      
      // Prepare project data with supported fields
      const portfolioData = {
        title: newPageTitle,
        description: newPageDescription,
        type: 'portfolio' as PortfolioType, // Use portfolio type since we're creating a project
        theme: 'modern',
        layout: 'standard',
        projectMeta: { // Store project specific data in metadata
          profession: selectedProfession,
          hasImage: !!projectImage
        }
      };
      
      const result = await dispatch(createPortfolio(portfolioData)).unwrap();
      
      if (result) {
        // If we have an image, upload it
        if (projectImage && result.id) {
          // Upload the image using the ApiService
          try {
            const uploadResponse = await ApiService.uploadProjectImage(result.id, projectImage);
            if (uploadResponse.error) {
              console.error('Failed to upload project image:', uploadResponse.error);
              showError(`Project created but image upload failed: ${uploadResponse.error}`);
            } else {
              console.log('Project image uploaded successfully');
            }
          } catch (imageError) {
            console.error('Error uploading project image:', imageError);
            showError('Project created but image upload failed');
          }
        }
      
        showSuccess('Project created successfully');
        setIsCreateDialogOpen(false);
        setNewPageTitle('');
        setNewPageDescription('');
        setSelectedProfession(null);
        setProjectImage(null);
        setProjectImagePreview(null);
        
        // Force refresh portfolios list
        dispatch(fetchPortfolios());
        
        // Redirect to editor for the newly created project
        setTimeout(() => {
          navigate(`/editor/${result.id}`);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      showError(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await dispatch(deletePortfolio(portfolioId)).unwrap();
      showSuccess('Portfolio deleted successfully');
      // Force refresh portfolios list
      dispatch(fetchPortfolios());
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete portfolio');
    }
  };

  const handlePublishPortfolio = async (portfolioId: string) => {
    try {
      await dispatch(publishPortfolio(portfolioId)).unwrap();
      showSuccess('Portfolio published successfully');
      // Force refresh portfolios list
      dispatch(fetchPortfolios());
    } catch (error) {
      console.error('Failed to publish portfolio:', error);
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
          // Include all keys, even if empty, to allow clearing links
          cleanedSocialLinks[key] = value ? value.trim() : '';
        });
      }
      
      console.log('Sending social links update:', cleanedSocialLinks);
      
      // Use the direct API service method
      const response = await ApiService.updateSocialLinks(cleanedSocialLinks);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh user data and update UI
      await refreshUserData();
      setIsEditingSocialLinks(false);
      showSuccess('Social links updated successfully');
    } catch (error) {
      console.error('Error updating social links:', error);
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
    console.log(`Updating ${platform} to ${e.target.value}`);
    setProfileData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: e.target.value,
      },
    }));
  };

  const toggleSocialLinksEditing = () => {
    setIsEditingSocialLinks(!isEditingSocialLinks);
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

  const handleProjectImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      console.log("Uploading project image:", file.name);
      setProjectImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar upload improvement
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      console.log("Uploading avatar file:", file.name);
      
      // Create a preview before upload
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create a temporary preview before server confirms
        const previewUrl = reader.result as string;
        // Update local UI immediately with preview
        setProfileData(prev => ({
          ...prev,
          avatarPreview: previewUrl
        }));
      };
      reader.readAsDataURL(file);
      
      // Upload to server - fix the endpoint path based on backend configuration
      ApiService.uploadAvatar(file)
        .then(response => {
          if (response.error) {
            console.error("❌ Failed to upload avatar:", response.error);
            throw new Error(response.error);
          }
          if (response.data) {
            console.log("✅ Avatar uploaded successfully:", response.data);
            dispatch(updateUser(response.data as User));
            showSuccess('Avatar uploaded successfully');
          }
        })
        .catch(error => {
          console.error("❌ Failed to upload avatar:", error);
          showError(error instanceof Error ? error.message : 'Failed to upload avatar');
        });
    }
  };

  return (
    <Box sx={{ 
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
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
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
        }}
      >
        {/* Profile Section */}
        <Box sx={{ p: 4, textAlign: 'center', position: 'relative', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', mb: 2 }}>
          <IconButton
            size="small"
            onClick={forceRefreshUI}
            title="Refresh Profile"
            sx={{ position: 'absolute', top: 10, right: 10 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="avatar-upload">
              <Avatar
                src={profileData.avatarPreview || user?.avatar}
                alt={user?.name}
                sx={{
                  width: 140,
                  height: 140,
                  mb: 2,
                  mx: 'auto',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '4px solid white',
                  '&:hover': {
                    opacity: 0.9,
                  }
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'white',
                  borderRadius: '50%',
                  p: 0.5,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </Box>
            </label>
          </Box>
          {isEditing ? (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Profession"
                name="profession"
                value={profileData.profession}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProfileUpdate}
                  sx={{ flex: 1, borderRadius: '8px' }}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{ flex: 1, borderRadius: '8px' }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {user?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {user?.profession || 'Add your profession'}
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={() => setIsEditing(true)}
                size="small"
                sx={{ 
                  borderRadius: '20px',
                  textTransform: 'none',
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(103, 58, 183, 0.08)',
                  }
                }}
              >
                Edit Profile
              </Button>
            </Box>
          )}
        </Box>

        {/* Bio Section */}
        <Box sx={{ px: 3, mb: 3 }}>
          <Box sx={{ 
            p: 3, 
            bgcolor: '#ffffff', 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            position: 'relative' 
          }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
              Bio
            </Typography>
            {isEditingBio ? (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Write something about yourself..."
                  value={profileData.bio}
                  onChange={handleBioChange}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBioSave}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditingBio(false)}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box 
                onClick={handleBioClick} 
                sx={{ 
                  borderRadius: 1,
                  p: 2, 
                  cursor: 'pointer',
                  minHeight: '100px',
                  position: 'relative',
                  bgcolor: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .edit-icon': {
                      opacity: 1,
                    }
                  }
                }}
              >
                <Typography variant="body2" color={profileData.bio ? 'text.primary' : 'text.secondary'}>
                  {profileData.bio || 'Click to add a bio...'}
                </Typography>
                <EditIcon 
                  className="edit-icon" 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8, 
                    fontSize: '1rem',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'text.secondary'
                  }} 
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* Social Links */}
        <Box sx={{ px: 3, mb: 3 }}>
          <Box sx={{ p: 3, bgcolor: '#ffffff', borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="600">
                Social Links
              </Typography>
              {isEditingSocialLinks ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={handleSocialLinksUpdate}
                    variant="contained"
                    color="primary"
                    sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                    startIcon={<SaveIcon />}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={toggleSocialLinksEditing}
                    variant="outlined"
                    color="secondary"
                    sx={{ borderRadius: '8px' }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button
                  size="small"
                  onClick={toggleSocialLinksEditing}
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: '8px' }}
                  startIcon={<EditIcon />}
                >
                  Edit Links
                </Button>
              )}
            </Box>
            
            {isEditingSocialLinks ? (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  value={profileData.socialLinks?.linkedin || ''}
                  onChange={handleSocialInputChange('linkedin')}
                  InputProps={{
                    startAdornment: <LinkedInIcon sx={{ mr: 1, color: '#0077B5' }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="GitHub"
                  placeholder="https://github.com/username"
                  value={profileData.socialLinks?.github || ''}
                  onChange={handleSocialInputChange('github')}
                  InputProps={{
                    startAdornment: <GitHubIcon sx={{ mr: 1, color: '#171515' }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Twitter"
                  placeholder="https://twitter.com/username"
                  value={profileData.socialLinks?.twitter || ''}
                  onChange={handleSocialInputChange('twitter')}
                  InputProps={{
                    startAdornment: <TwitterIcon sx={{ mr: 1, color: '#1DA1F2' }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Dribbble"
                  placeholder="https://dribbble.com/username"
                  value={profileData.socialLinks?.dribbble || ''}
                  onChange={handleSocialInputChange('dribbble')}
                  InputProps={{
                    startAdornment: <InstagramIcon sx={{ mr: 1, color: '#EA4C89' }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Behance"
                  placeholder="https://behance.net/username"
                  value={profileData.socialLinks?.behance || ''}
                  onChange={handleSocialInputChange('behance')}
                  InputProps={{
                    startAdornment: <WebsiteIcon sx={{ mr: 1, color: '#1769FF' }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </Stack>
            ) : (
              <Stack spacing={1}>
                {profileData.socialLinks?.linkedin ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <LinkedInIcon sx={{ mr: 2, color: '#0077B5' }} />
                    <Typography variant="body2" component="a" href={profileData.socialLinks.linkedin} target="_blank" sx={{ textDecoration: 'none', color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profileData.socialLinks.linkedin}
                    </Typography>
                  </Box>
                ) : null}
                
                {profileData.socialLinks?.github ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <GitHubIcon sx={{ mr: 2, color: '#171515' }} />
                    <Typography variant="body2" component="a" href={profileData.socialLinks.github} target="_blank" sx={{ textDecoration: 'none', color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profileData.socialLinks.github}
                    </Typography>
                  </Box>
                ) : null}
                
                {profileData.socialLinks?.twitter ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <TwitterIcon sx={{ mr: 2, color: '#1DA1F2' }} />
                    <Typography variant="body2" component="a" href={profileData.socialLinks.twitter} target="_blank" sx={{ textDecoration: 'none', color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profileData.socialLinks.twitter}
                    </Typography>
                  </Box>
                ) : null}
                
                {profileData.socialLinks?.dribbble ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <InstagramIcon sx={{ mr: 2, color: '#EA4C89' }} />
                    <Typography variant="body2" component="a" href={profileData.socialLinks.dribbble} target="_blank" sx={{ textDecoration: 'none', color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profileData.socialLinks.dribbble}
                    </Typography>
                  </Box>
                ) : null}
                
                {profileData.socialLinks?.behance ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    <WebsiteIcon sx={{ mr: 2, color: '#1769FF' }} />
                    <Typography variant="body2" component="a" href={profileData.socialLinks.behance} target="_blank" sx={{ textDecoration: 'none', color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profileData.socialLinks.behance}
                    </Typography>
                  </Box>
                ) : null}
                
                {!profileData.socialLinks?.linkedin && 
                 !profileData.socialLinks?.github && 
                 !profileData.socialLinks?.twitter && 
                 !profileData.socialLinks?.dribbble && 
                 !profileData.socialLinks?.behance && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No social links added yet. Click "Edit Links" to add your profiles.
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ px: 3, flexGrow: 1 }}>
          <List component="nav" sx={{ '& .MuiListItemButton-root': { borderRadius: '8px', mb: 1 } }}>
            <ListItemButton
              selected={true}
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: theme => theme.palette.primary.main,
                color: 'white',
                '&.Mui-selected': {
                  bgcolor: theme => theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme => theme.palette.primary.dark,
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Portfolio / Works" />
            </ListItemButton>
            
            <ListItemButton
              onClick={() => navigate('/cv')}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="CV / Resume" />
            </ListItemButton>
            
            <ListItemButton
              onClick={() => navigate('/about')}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="About Me" />
            </ListItemButton>
          </List>
        </Box>

        {/* Social Media Icons */}
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {profileData.socialLinks?.linkedin && (
            <IconButton 
              component="a" 
              href={profileData.socialLinks.linkedin} 
              target="_blank"
              sx={{ color: '#0077B5' }}
            >
              <LinkedInIcon />
            </IconButton>
          )}
          {profileData.socialLinks?.github && (
            <IconButton 
              component="a" 
              href={profileData.socialLinks.github} 
              target="_blank"
              sx={{ color: '#171515' }}
            >
              <GitHubIcon />
            </IconButton>
          )}
          {profileData.socialLinks?.twitter && (
            <IconButton 
              component="a" 
              href={profileData.socialLinks.twitter} 
              target="_blank"
              sx={{ color: '#1DA1F2' }}
            >
              <TwitterIcon />
            </IconButton>
          )}
          {profileData.socialLinks?.behance && (
            <IconButton 
              component="a" 
              href={profileData.socialLinks.behance} 
              target="_blank"
              sx={{ color: '#1769FF' }}
            >
              <WebsiteIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 4, 
        overflow: 'auto', 
        height: '100vh',
        bgcolor: '#f8f9fa'
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            My Portfolio / Works
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ 
              borderRadius: '8px', 
              fontWeight: 'bold',
              bgcolor: 'rgba(103, 58, 183, 0.9)',
              '&:hover': {
                bgcolor: 'rgba(103, 58, 183, 1)',
              }
            }}
          >
            Add Project
          </Button>
        </Paper>

        {/* Portfolio Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error">{error}</Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => dispatch(fetchPortfolios())}
              sx={{ mt: 2, borderRadius: '8px' }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {portfolios && portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.12)',
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{ 
                        height: 200,
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Use portfolio.coverImage or projectMeta to display image (if available) */}
                      {portfolio.projectMeta?.hasImage ? (
                        <img 
                          src={`/api/projects/${portfolio.id}/image`}
                          alt={portfolio.title} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                          }}
                          onError={(e) => {
                            // If image fails to load, show fallback icon
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const icon = document.createElement('div');
                              icon.style.width = '100%';
                              icon.style.height = '100%';
                              icon.style.display = 'flex';
                              icon.style.alignItems = 'center';
                              icon.style.justifyContent = 'center';
                              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="rgba(0,0,0,0.2)"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"></path></svg>';
                              parent.appendChild(icon);
                            }
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(103, 58, 183, 0.05)'
                        }}>
                          <CollectionsIcon sx={{ fontSize: 60, color: 'rgba(103, 58, 183, 0.2)' }} />
                        </Box>
                      )}
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPortfolio(portfolio);
                          setMenuAnchorEl(e.currentTarget);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </CardMedia>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {portfolio.title || 'Project Title'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {portfolio.description || 'No description provided'}
                      </Typography>
                      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                        <Chip 
                          label={portfolio.type || 'Portfolio'} 
                          size="small" 
                          sx={{ 
                            borderRadius: '8px', 
                            bgcolor: 'rgba(103, 58, 183, 0.1)',
                            color: 'rgba(103, 58, 183, 0.8)',
                            fontWeight: 'bold',
                            mb: 0.5
                          }} 
                        />
                        <Chip 
                          label={portfolio.theme || 'Modern'} 
                          size="small" 
                          sx={{ 
                            borderRadius: '8px', 
                            bgcolor: 'rgba(0,0,0,0.05)',
                            mb: 0.5
                          }} 
                        />
                      </Stack>
                      <Button
                        variant="contained"
                        fullWidth
                        color="primary"
                        onClick={() => {
                          setSelectedPortfolio(portfolio);
                          handleEditPortfolio(portfolio);
                        }}
                        sx={{ 
                          borderRadius: '8px',
                          bgcolor: 'rgba(103, 58, 183, 0.9)',
                          '&:hover': {
                            bgcolor: 'rgba(103, 58, 183, 1)',
                          }
                        }}
                      >
                        Edit Project
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    bgcolor: 'transparent',
                  }}
                >
                  <Box sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(103, 58, 183, 0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}>
                    <AddIcon sx={{ fontSize: 48, color: 'rgba(103, 58, 183, 0.5)' }} />
                  </Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    No projects yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create your first project to showcase your work.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateDialogOpen(true)}
                    sx={{ 
                      borderRadius: '8px', 
                      px: 3,
                      py: 1,
                      fontWeight: 'bold',
                      bgcolor: 'rgba(103, 58, 183, 0.9)',
                      '&:hover': {
                        bgcolor: 'rgba(103, 58, 183, 1)',
                      }
                    }}
                  >
                    Add Project
                  </Button>
                </Paper>
              </Grid>
            )}
            
            {/* Add Project Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 2, 
                  height: '100%',
                  minHeight: 330,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'transparent',
                  border: '2px dashed rgba(103, 58, 183, 0.2)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(103, 58, 183, 0.03)',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  }
                }}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'rgba(103, 58, 183, 0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <AddIcon sx={{ fontSize: 40, color: 'rgba(103, 58, 183, 0.5)' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Add New Project
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Showcase your work by adding a new project to your portfolio.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Create Portfolio Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            height: { md: '600px' }
          }}>
            {/* Left side - Image preview */}
            <Box sx={{ 
              width: { xs: '100%', md: '45%' },
              bgcolor: 'rgba(103, 58, 183, 0.03)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3, color: 'rgba(103, 58, 183, 0.9)' }}>
                Project Cover
              </Typography>
              
              {projectImagePreview ? (
                <Box sx={{ position: 'relative', width: '100%', height: '100%', maxHeight: 400 }}>
                  <img 
                    src={projectImagePreview} 
                    alt="Project preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: 16,
                      boxShadow: '0 8px 24px rgba(103, 58, 183, 0.15)'
                    }} 
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => {
                      setProjectImage(null);
                      setProjectImagePreview(null);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ 
                  width: '100%', 
                  height: '100%', 
                  maxHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '2px dashed rgba(103, 58, 183, 0.2)',
                  borderRadius: 4,
                  p: 3
                }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ 
                      height: '100%',
                      borderStyle: 'none',
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <CollectionsIcon sx={{ fontSize: 60, color: 'rgba(103, 58, 183, 0.4)' }} />
                    <Typography variant="body1" fontWeight="medium" color="rgba(103, 58, 183, 0.8)">
                      Upload Cover Image
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Drag and drop or click to browse
                    </Typography>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProjectImageChange}
                    />
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* Right side - Form fields */}
            <Box sx={{ 
              width: { xs: '100%', md: '55%' },
              p: 4,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <DialogTitle sx={{ p: 0, mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'rgba(103, 58, 183, 0.9)' }}>
                  Create New Project
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Enter basic information to create your project
                </Typography>
              </DialogTitle>
              
              <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              autoFocus
              id="title"
                    label="Project Title"
              type="text"
              fullWidth
              variant="outlined"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.2)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.5)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.8)'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'rgba(103, 58, 183, 0.7)'
                      }
                    }}
                  />
                  <TextField
                    id="description"
                    label="Project Description"
                    type="text"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={4}
                    value={newPageDescription || ''}
                    onChange={(e) => setNewPageDescription(e.target.value)}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.2)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.5)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(103, 58, 183, 0.8)'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'rgba(103, 58, 183, 0.7)'
                      }
                    }}
                  />
                  
                  {/* Modern Profession Type Selector */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ color: 'rgba(103, 58, 183, 0.7)', mb: 1 }}>
                      Project Profession Type
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                      {professionOptions.map((option) => (
                        <Grid item xs={6} sm={6} md={4} key={option.value}>
                          <Card
                            onClick={() => setSelectedProfession(option.value)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              cursor: 'pointer',
                              borderRadius: 2,
                              border: selectedProfession === option.value 
                                ? '2px solid rgba(103, 58, 183, 0.8)' 
                                : '1px solid rgba(0, 0, 0, 0.08)',
                              backgroundColor: selectedProfession === option.value 
                                ? 'rgba(103, 58, 183, 0.05)' 
                                : 'white',
                              transition: 'all 0.2s ease',
                              boxShadow: selectedProfession === option.value 
                                ? '0 4px 12px rgba(103, 58, 183, 0.15)' 
                                : 'none',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '100%',
                              minHeight: 80
                            }}
                          >
                            <Typography variant="h6" sx={{ fontSize: '1.5rem', mb: 0 }}>
                              {option.icon}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontWeight: selectedProfession === option.value ? 'bold' : 'medium',
                              color: selectedProfession === option.value ? 'rgba(103, 58, 183, 0.9)' : 'text.primary',
                              textAlign: 'center'
                            }}>
                              {option.label}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
          </DialogContent>
              
              <DialogActions sx={{ p: 0, mt: 4, justifyContent: 'space-between' }}>
                <Button 
                  onClick={() => setIsCreateDialogOpen(false)}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    color: 'rgba(103, 58, 183, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(103, 58, 183, 0.05)'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleCreateProject}
                  disabled={loading || !newPageTitle || !selectedProfession}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    bgcolor: 'rgba(103, 58, 183, 0.9)',
                    '&:hover': {
                      bgcolor: 'rgba(103, 58, 183, 1)'
                    },
                    boxShadow: '0 4px 12px rgba(103, 58, 183, 0.2)'
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create & Continue'}
                </Button>
          </DialogActions>
            </Box>
          </Box>
        </Dialog>
        
        {/* Portfolio Menu */}
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
    </Box>
  );
};

export default Dashboard;