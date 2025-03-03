import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Grid,
  Divider,
  LinearProgress,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ListItem,
  ListItemSecondaryAction,
  Tooltip,
  Slider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Dashboard as DashboardIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import ApiService from '../../services/api';

// Sidebar width matching Dashboard page
const SIDEBAR_WIDTH = 320;

// CV Section Types
type SectionType = 'education' | 'experience' | 'skills' | 'languages' | 'certifications';

// CV Item interfaces
interface EducationItem {
  id: string;
  school: string;
  degree: string;
  years: string;
  description: string;
}

interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  years: string;
  description: string;
}

interface SkillItem {
  name: string;
  level: number;
}

interface LanguageItem {
  name: string;
  level: string; // Beginner, Intermediate, Fluent, Native
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface CVData {
  name: string;
  profession: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
}

const CV: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUserData, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useFeedback();

  // States for editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<SectionType | null>(null);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: '' as SectionType,
    isNew: false,
    currentItem: null as any,
    itemIndex: -1,
  });

  // CV Data state
  const [cvData, setCvData] = useState<CVData>({
    name: user?.name || '',
    profession: user?.profession || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary: 'Experienced software developer with a strong background in frontend and backend technologies. Passionate about creating user-friendly interfaces and scalable applications.',
    education: [
      { 
        id: '1',
        school: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        years: '2015 - 2019',
        description: 'Graduated with honors. Specialized in web technologies and software engineering.'
      },
      {
        id: '2',
        school: 'Design Academy',
        degree: 'UI/UX Design Certification',
        years: '2020',
        description: 'Intensive program focused on user experience design principles and interface development.'
      }
    ],
    experience: [
      {
        id: '1',
        company: 'Tech Innovations Inc.',
        position: 'Senior Frontend Developer',
        years: '2020 - Present',
        description: 'Leading the frontend development team in creating responsive web applications. Responsible for architectural decisions, code reviews, and mentoring junior developers.'
      },
      {
        id: '2',
        company: 'Creative Solutions',
        position: 'UI Developer',
        years: '2019 - 2020',
        description: 'Designed and implemented user interfaces for client projects. Collaborated with design and backend teams to deliver full-stack solutions. Improved user engagement by 35% through interface optimizations.'
      }
    ],
    skills: [
      { name: 'JavaScript', level: 90 },
      { name: 'React', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'Node.js', level: 75 },
      { name: 'HTML/CSS', level: 95 },
      { name: 'MongoDB', level: 70 },
      { name: 'GraphQL', level: 65 },
      { name: 'UI/UX Design', level: 75 }
    ],
    languages: [
      { name: 'English', level: 'Native' },
      { name: 'Spanish', level: 'Intermediate' },
      { name: 'French', level: 'Beginner' }
    ],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        year: '2021'
      },
      {
        id: '2',
        name: 'Google Professional Cloud Developer',
        issuer: 'Google Cloud',
        year: '2020'
      }
    ]
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    if (user) {
      setCvData(prev => ({
        ...prev,
        name: user.name || '',
        profession: user.profession || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Load CV data from localStorage in useEffect
  useEffect(() => {
    // Try to load saved CV data from localStorage
    const savedCVData = localStorage.getItem('cvData');
    
    if (savedCVData) {
      try {
        const parsedData = JSON.parse(savedCVData);
        setCvData(prev => ({
          ...prev,
          // Load all fields from localStorage if they exist
          name: parsedData.name || prev.name,
          profession: parsedData.profession || prev.profession,
          email: parsedData.email || prev.email,
          phone: parsedData.phone || prev.phone,
          location: parsedData.location || prev.location,
          summary: parsedData.summary || prev.summary,
          education: parsedData.education || prev.education,
          experience: parsedData.experience || prev.experience,
          skills: parsedData.skills || prev.skills, 
          languages: parsedData.languages || prev.languages,
          certifications: parsedData.certifications || prev.certifications
        }));
      } catch (e) {
        console.error('Error parsing saved CV data:', e);
      }
    }
  }, []);

  // Handle input change for basic info
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCvData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle opening the dialog for new item or editing
  const handleOpenDialog = (type: SectionType, item: any = null, index: number = -1) => {
    let defaultItem: any;
    
    switch(type) {
      case 'education':
        defaultItem = {
          id: `edu-${Date.now()}`,
          school: '',
          degree: '',
          years: '',
          description: ''
        };
        break;
      case 'experience':
        defaultItem = {
          id: `exp-${Date.now()}`,
          company: '',
          position: '',
          years: '',
          description: ''
        };
        break;
      case 'skills':
        defaultItem = { name: '', level: 50 };
        break;
      case 'languages':
        defaultItem = { name: '', level: 'Intermediate' };
        break;
      case 'certifications':
        defaultItem = {
          id: `cert-${Date.now()}`,
          name: '',
          issuer: '',
          year: new Date().getFullYear().toString()
        };
        break;
      default:
        defaultItem = {};
    }
    
    setEditDialog({
      open: true,
      type,
      isNew: item === null,
      currentItem: item ? { ...item } : defaultItem,
      itemIndex: index,
    });
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    setEditDialog({
      ...editDialog,
      open: false,
    });
  };

  // Handle item change in dialog
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name) {
      setEditDialog(prev => ({
        ...prev,
        currentItem: {
          ...prev.currentItem,
          [name]: value
        }
      }));
    }
  };

  // Handle slider change for skills
  const handleSkillSliderChange = (newValue: number) => {
    setEditDialog(prev => ({
      ...prev,
      currentItem: {
        ...prev.currentItem,
        level: newValue
      }
    }));
  };

  // Handle saving an item from dialog
  const handleSaveItem = () => {
    const { type, currentItem, itemIndex, isNew } = editDialog;
    let updatedItems;
    
    if (isNew) {
      updatedItems = [...cvData[type], currentItem];
    } else {
      updatedItems = cvData[type].map((item, i) => 
        i === itemIndex ? currentItem : item
      );
    }
    
    setCvData(prev => ({
      ...prev,
      [type]: updatedItems
    }));
    
    handleCloseDialog();
    showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1, -1)} ${isNew ? 'added' : 'updated'} successfully`);
  };

  // Handle deleting an item
  const handleDeleteItem = (type: SectionType, index: number) => {
    const updatedItems = [...cvData[type]];
    updatedItems.splice(index, 1);
    
    setCvData(prev => ({
      ...prev,
      [type]: updatedItems
    }));
    
    showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1, -1)} removed successfully`);
  };

  // Handle saving all CV data
  const handleSave = async () => {
    setLoading(true);
    try {
      // Update the user profile with the basic information
      const result = await ApiService.updateProfile({
        name: cvData.name,
        profession: cvData.profession,
        // We can also save the bio if we have it in the CV data
        bio: cvData.summary
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Store the complete CV data in localStorage for persistence
      // This is a temporary solution until we have a proper CV data API
      localStorage.setItem('cvData', JSON.stringify(cvData));
      
      await refreshUserData();
      setIsEditing(false);
      showSuccess('CV information updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update CV information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate and download a PDF
    showSuccess('CV download feature will be implemented soon');
  };

  const handlePrint = () => {
    window.print();
  };

  // Render dialog content based on the current type
  const renderDialogContent = () => {
    const { type, currentItem } = editDialog;
    
    if (!currentItem) return null;
    
    switch(type) {
      case 'education':
        return (
          <>
            <TextField
              fullWidth
              label="School/Institution"
              name="school"
              value={currentItem.school}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Degree/Certification"
              name="degree"
              value={currentItem.degree}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Years"
              name="years"
              value={currentItem.years}
              onChange={handleItemChange}
              margin="normal"
              placeholder="e.g., 2015 - 2019"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={currentItem.description}
              onChange={handleItemChange}
              margin="normal"
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
          </>
        );
      case 'experience':
        return (
          <>
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={currentItem.company}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Position"
              name="position"
              value={currentItem.position}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Years"
              name="years"
              value={currentItem.years}
              onChange={handleItemChange}
              margin="normal"
              placeholder="e.g., 2019 - Present"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={currentItem.description}
              onChange={handleItemChange}
              margin="normal"
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
          </>
        );
      case 'skills':
        return (
          <>
            <TextField
              fullWidth
              label="Skill Name"
              name="name"
              value={currentItem.name}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <Typography gutterBottom>
              Proficiency Level: {currentItem.level}%
            </Typography>
            <Slider
              value={currentItem.level}
              onChange={(event: Event, value: number | number[]) => {
                if (typeof value === 'number') {
                  handleSkillSliderChange(value);
                }
              }}
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0px 0px 0px 8px rgba(103, 58, 183, 0.16)',
                  },
                },
              }}
            />
          </>
        );
      case 'languages':
        return (
          <>
            <TextField
              fullWidth
              label="Language"
              name="name"
              value={currentItem.name}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-level-label">Proficiency Level</InputLabel>
              <Select
                labelId="language-level-label"
                name="level"
                value={currentItem.level}
                onChange={handleItemChange}
                label="Proficiency Level"
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Fluent">Fluent</MenuItem>
                <MenuItem value="Native">Native</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      case 'certifications':
        return (
          <>
            <TextField
              fullWidth
              label="Certification Name"
              name="name"
              value={currentItem.name}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Issuing Organization"
              name="issuer"
              value={currentItem.issuer}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
            <TextField
              fullWidth
              label="Year"
              name="year"
              value={currentItem.year}
              onChange={handleItemChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={textFieldSx}
              onClick={handleTextFieldClick}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Render the section for education, experience, skills, languages, or certifications
  const renderSection = (type: SectionType, title: string) => {
    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
            {title}
          </Typography>
          {isEditing && (
            <Button 
              startIcon={<AddIcon />} 
              variant="outlined" 
              size="small"
              onClick={() => handleOpenDialog(type)}
              sx={{ borderRadius: '8px' }}
            >
              Add {title.slice(0, -1)}
            </Button>
          )}
        </Box>

        {isEditing ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2 }}>
            {cvData[type].length === 0 ? (
              <ListItem sx={{ py: 2, px: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <ListItemText 
                  primary={`No ${title.toLowerCase()} added yet.`}
                  secondary={`Click the "Add ${title.slice(0, -1)}" button to add one.`}
                />
              </ListItem>
            ) : (
              cvData[type].map((item: any, index: number) => (
                <ListItem 
                  key={item.id || index}
                  sx={{ 
                    py: 2, 
                    px: 3, 
                    mb: 1, 
                    bgcolor: '#f9f9f9', 
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <ListItemText 
                    primary={
                      type === 'education' ? item.degree : 
                      type === 'experience' ? item.position :
                      type === 'skills' ? `${item.name} (${item.level}%)` :
                      type === 'languages' ? `${item.name} - ${item.level}` :
                      item.name
                    }
                    secondary={
                      type === 'education' ? `${item.school}, ${item.years}` : 
                      type === 'experience' ? `${item.company}, ${item.years}` :
                      type === 'certifications' ? `${item.issuer}, ${item.year}` :
                      null
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleOpenDialog(type, item, index)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteItem(type, index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        ) : (
          type === 'skills' ? (
            // Skills display
            <Grid container spacing={2}>
              {cvData.skills.map((skill, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {skill.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skill.level}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={skill.level} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'rgba(103, 58, 183, 0.8)',
                        }
                      }} 
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : type === 'languages' ? (
            // Languages display
            <Grid container spacing={2}>
              {cvData.languages.map((lang, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid rgba(0,0,0,0.08)', 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <LanguageIcon sx={{ fontSize: 40, color: 'rgba(103, 58, 183, 0.8)', mb: 1 }} />
                    <Typography variant="body1" fontWeight="bold">
                      {lang.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lang.level}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Education, Experience, and Certifications display
            cvData[type].map((item: any, index: number) => (
              <Box key={item.id || index} sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" fontWeight="bold" color="text.secondary">
                      {type === 'education' || type === 'experience' ? item.years : item.year}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={9}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {type === 'education' ? item.degree : 
                       type === 'experience' ? item.position : item.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {type === 'education' ? item.school : 
                       type === 'experience' ? item.company : item.issuer}
                    </Typography>
                    {(type === 'education' || type === 'experience') && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))
          )
        )}
      </Box>
    );
  };

  // Define a common style for all TextField components to make them fully clickable
  const textFieldSx = {
    '& .MuiOutlinedInput-root': { cursor: 'text' },
    '& .MuiInputBase-root': { cursor: 'text' },
    '& .MuiInputLabel-root': { cursor: 'text' }
  };

  // Function to enhance TextField focus behavior with proper typing
  const handleTextFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const input = e.currentTarget.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
    if (input) input.focus();
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
          flexShrink: 0, // Prevent shrinking
          minWidth: SIDEBAR_WIDTH, // Ensure minimum width
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
              selected={true}
              onClick={() => navigate('/cv')}
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              CV / Resume
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
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
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPDF}
                  sx={{ borderRadius: '8px' }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ borderRadius: '8px' }}
                >
                  Print
                </Button>
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
                  Edit CV
                </Button>
              </>
            )}
          </Box>
        </Paper>

        {/* CV Content */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            mb: 3,
            borderRadius: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            maxWidth: '1000px',
            mx: 'auto'
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 5 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={cvData.name}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                      onClick={handleTextFieldClick}
                    />
                    <TextField
                      fullWidth
                      label="Professional Title"
                      name="profession"
                      value={cvData.profession}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                      onClick={handleTextFieldClick}
                    />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                      {cvData.name}
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="medium">
                      {cvData.profession}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={4} sx={{ 
                textAlign: { xs: 'left', md: 'right' },
                width: { md: '300px' }, // Fixed width on medium and larger screens
                minWidth: { md: '300px' }, // Ensure minimum width
                flexShrink: 0 // Prevent shrinking
              }}>
                {isEditing ? (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={cvData.email}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                      onClick={handleTextFieldClick}
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={cvData.phone}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                      onClick={handleTextFieldClick}
                    />
                    <TextField
                      fullWidth
                      label="Location"
                      name="location"
                      value={cvData.location}
                      onChange={handleInputChange}
                      margin="normal"
                      variant="outlined"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={textFieldSx}
                      onClick={handleTextFieldClick}
                    />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, color: 'rgba(103, 58, 183, 0.8)' }} />
                      <Typography variant="body2">{cvData.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'rgba(103, 58, 183, 0.8)' }} />
                      <Typography variant="body2">{cvData.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                      <LocationIcon sx={{ mr: 1, color: 'rgba(103, 58, 183, 0.8)' }} />
                      <Typography variant="body2">{cvData.location}</Typography>
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Professional Summary */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
              Professional Summary
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="summary"
                value={cvData.summary}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={textFieldSx}
                onClick={handleTextFieldClick}
              />
            ) : (
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {cvData.summary}
              </Typography>
            )}
          </Box>

          {/* Work Experience */}
          {renderSection('experience', 'Work Experience')}

          {/* Education */}
          {renderSection('education', 'Education')}

          {/* Skills */}
          {renderSection('skills', 'Technical Skills')}

          {/* Languages */}
          {renderSection('languages', 'Languages')}

          {/* Certifications */}
          {renderSection('certifications', 'Certifications')}
        </Paper>
      </Box>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editDialog.isNew 
            ? `Add New ${editDialog.type.charAt(0).toUpperCase() + editDialog.type.slice(1, -1)}` 
            : `Edit ${editDialog.type.charAt(0).toUpperCase() + editDialog.type.slice(1, -1)}`}
        </DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            color="primary"
            sx={{ 
              bgcolor: 'rgba(103, 58, 183, 0.9)',
              '&:hover': {
                bgcolor: 'rgba(103, 58, 183, 1)',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CV; 