import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Dashboard as DashboardIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import ApiService from '../../services/api';

// Sidebar width matching Dashboard page
const SIDEBAR_WIDTH = 320;

// Interface for blog post
interface BlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const About: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUserData, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useFeedback();

  // States for editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aboutData, setAboutData] = useState({
    name: user?.name || '',
    profession: user?.profession || '',
    bio: user?.bio || '',
  });

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'My Journey in Tech',
      content: 'I started my journey in technology five years ago with a focus on web development. What began as a curiosity quickly became a passion that has driven my career choices and learning path.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Design Philosophy',
      content: 'I believe that the best designs come from understanding user needs deeply. My approach combines aesthetic sensibility with functional practicality, always keeping the end user in mind.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]);

  // Dialog states
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isNewPost, setIsNewPost] = useState(true);

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    if (user) {
      setAboutData(prev => ({
        ...prev,
        name: user.name || '',
        profession: user.profession || '',
        bio: user.bio || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAboutData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update only the bio and profession for now
      const result = await ApiService.updateProfile({
        bio: aboutData.bio,
        profession: aboutData.profession
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await refreshUserData();
      setIsEditing(false);
      showSuccess('About information updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update about information');
    } finally {
      setLoading(false);
    }
  };

  // Blog post handlers
  const handleOpenPostDialog = (post?: BlogPost) => {
    if (post) {
      setCurrentPost(post);
      setPostTitle(post.title);
      setPostContent(post.content);
      setIsNewPost(false);
    } else {
      setCurrentPost(null);
      setPostTitle('');
      setPostContent('');
      setIsNewPost(true);
    }
    setOpenPostDialog(true);
  };

  const handleClosePostDialog = () => {
    setOpenPostDialog(false);
    setCurrentPost(null);
    setPostTitle('');
    setPostContent('');
  };

  const handleSavePost = () => {
    if (postTitle.trim() === '' || postContent.trim() === '') {
      showError('Title and content are required');
      return;
    }

    if (isNewPost) {
      // Create new post
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: postTitle,
        content: postContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBlogPosts([newPost, ...blogPosts]);
      showSuccess('Blog post created successfully');
    } else if (currentPost) {
      // Update existing post
      const updatedPosts = blogPosts.map(post => 
        post.id === currentPost.id 
          ? { 
              ...post, 
              title: postTitle, 
              content: postContent, 
              updatedAt: new Date().toISOString() 
            } 
          : post
      );
      setBlogPosts(updatedPosts);
      showSuccess('Blog post updated successfully');
    }

    handleClosePostDialog();
  };

  const handleDeletePost = (post: BlogPost) => {
    const updatedPosts = blogPosts.filter(p => p.id !== post.id);
    setBlogPosts(updatedPosts);
    setMenuAnchorEl(null);
    showSuccess('Blog post deleted successfully');
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, post: BlogPost) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedPost(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
      {/* Left Sidebar - Similar to Dashboard */}
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
          flexShrink: 0,
          minWidth: SIDEBAR_WIDTH,
        }}
      >
        {/* Profile Section */}
        <Box sx={{ p: 4, textAlign: 'center', position: 'relative', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', mb: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
            <Avatar
              src={user?.avatar}
              alt={user?.name}
              sx={{
                width: 140,
                height: 140,
                mb: 2,
                mx: 'auto',
                border: '4px solid #ffffff',
                boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
              }}
            />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              {user?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {user?.profession || 'Add your profession'}
            </Typography>
          </Box>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ px: 3, flexGrow: 1 }}>
          <List component="nav" sx={{ '& .MuiListItemButton-root': { borderRadius: '8px', mb: 1 } }}>
            <ListItemButton
              onClick={() => navigate('/dashboard')}
            >
              <ListItemIcon>
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
              selected={true}
              onClick={() => navigate('/about')}
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
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="About Me" />
            </ListItemButton>
          </List>
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
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              About Me
            </Typography>
          </Box>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{ 
                  borderRadius: '8px',
                  bgcolor: 'rgba(103, 58, 183, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(103, 58, 183, 1)',
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ 
                borderRadius: '8px',
                bgcolor: 'rgba(103, 58, 183, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(103, 58, 183, 1)',
                }
              }}
            >
              Edit About
            </Button>
          )}
        </Paper>

        {/* Bio Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            maxWidth: '1000px',
            mx: 'auto'
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Bio
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={6}
              name="bio"
              placeholder="Write something about yourself..."
              value={aboutData.bio}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
          ) : (
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {aboutData.bio || 'No bio information added yet. Click Edit to add your bio.'}
            </Typography>
          )}
        </Paper>

        {/* Blog Posts Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            maxWidth: '1000px',
            mx: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Blog Posts
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenPostDialog()}
              sx={{ 
                borderRadius: '8px',
                bgcolor: 'rgba(103, 58, 183, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(103, 58, 183, 1)',
                }
              }}
            >
              New Post
            </Button>
          </Box>
          
          {blogPosts.length > 0 ? (
            <Grid container spacing={3}>
              {blogPosts.map(post => (
                <Grid item xs={12} key={post.id}>
                  <Card 
                    sx={{ 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <CardContent sx={{ position: 'relative', pb: 0 }}>
                      <IconButton
                        aria-label="more"
                        size="small"
                        onClick={(e) => handleOpenMenu(e, post)}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                      
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ pr: 5 }}>
                        {post.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(post.updatedAt)}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 2, mt: 2, lineHeight: 1.8 }}>
                        {post.content}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenPostDialog(post)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeletePost(post)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary">
                No blog posts yet. Click the "New Post" button to create your first post.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Menu for post actions */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => {
            handleCloseMenu();
            if (selectedPost) handleOpenPostDialog(selectedPost);
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedPost) handleDeletePost(selectedPost);
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete" />
          </MenuItem>
        </Menu>

        {/* Dialog for creating/editing posts */}
        <Dialog 
          open={openPostDialog} 
          onClose={handleClosePostDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {isNewPost ? 'Create New Post' : 'Edit Post'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="title"
              label="Title"
              type="text"
              fullWidth
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="content"
              label="Content"
              multiline
              rows={12}
              fullWidth
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePostDialog}>Cancel</Button>
            <Button 
              onClick={handleSavePost}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default About; 