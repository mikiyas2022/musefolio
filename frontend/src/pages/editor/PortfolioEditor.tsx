import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  IconButton,
  Divider,
  TextField,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { RootState } from '../../store';
import { Template, Theme } from '../../store/slices/templateSlice';
import { updatePortfolio, addProject, updateProject, deleteProject } from '../../store/slices/portfolioSlice';
import type { Portfolio } from '../../types/portfolio';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`editor-tabpanel-${index}`}
      aria-labelledby={`editor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PortfolioEditor: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState<'content' | 'layout' | 'style'>('content');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const dispatch = useDispatch();
  const currentPortfolio = useSelector((state: RootState) => state.portfolio.currentPortfolio);
  const selectedTemplate = useSelector((state: RootState) => state.template.selectedTemplate);
  const selectedTheme = useSelector((state: RootState) => state.template.selectedTheme);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (!currentPortfolio) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/portfolios/${currentPortfolio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(currentPortfolio),
      });

      if (!response.ok) throw new Error('Failed to save portfolio');
      const updatedPortfolio = await response.json();
      dispatch(updatePortfolio(updatedPortfolio));
    } catch (error) {
      console.error('Error saving portfolio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentPortfolio) return;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/v1/portfolios/${currentPortfolio.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to publish portfolio');
      const updatedPortfolio = await response.json();
      dispatch(updatePortfolio(updatedPortfolio));
    } catch (error) {
      console.error('Error publishing portfolio:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}>
      {/* Left Sidebar - Tools */}
      <Paper
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Editor Tools
          </Typography>
          <Tabs
            value={editMode}
            onChange={(e, value) => setEditMode(value)}
            orientation="horizontal"
            variant="fullWidth"
          >
            <Tab label="Content" value="content" />
            <Tab label="Layout" value="layout" />
            <Tab label="Style" value="style" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {editMode === 'content' && (
            <List>
              {currentPortfolio?.sections.map((section, index) => (
                <ListItemButton
                  key={section.id}
                  selected={selectedElement === section.id}
                  onClick={() => setSelectedElement(section.id)}
                >
                  <DragIndicatorIcon sx={{ mr: 1 }} />
                  <ListItemText primary={section.title} secondary={section.type} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))}
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
              >
                Add Section
              </Button>
            </List>
          )}

          {editMode === 'layout' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Template
              </Typography>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={selectedTemplate?.image}
                  alt={selectedTemplate?.name}
                />
                <CardContent>
                  <Typography variant="subtitle1">{selectedTemplate?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate?.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {editMode === 'style' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Theme
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Colors
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedTheme && Object.entries(selectedTheme.colors).map(([key, color]) => (
                    <Box
                      key={key}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: color,
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Typography
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Font Family"
                  value={selectedTheme?.typography?.fontFamily}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Main Content - Canvas */}
      <Box sx={{ 
        flex: '1 1 auto',
        display: 'flex', 
        flexDirection: 'column',
        width: 'calc(100% - 580px)', // 280px left sidebar + 300px right sidebar
        minWidth: 0, // Prevent flex items from growing beyond their container
      }}>
        {/* Toolbar */}
        <Paper sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {currentPortfolio?.title || 'Untitled Portfolio'}
            </Typography>
            <Box>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                Publish
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Canvas */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'grey.100',
            width: '100%',
            height: '100%',
          }}
        >
          <Paper
            sx={{
              width: '100%',
              height: '100%',
              m: 0,
              p: 3,
              boxShadow: 'none',
              borderRadius: 0,
            }}
          >
            {currentPortfolio ? (
              currentPortfolio.sections.map((section) => (
                <Box
                  key={section.id}
                  sx={{
                    mb: 4,
                    p: 2,
                    border: selectedElement === section.id ? 2 : 0,
                    borderColor: 'primary.main',
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => setSelectedElement(section.id)}
                >
                  <Typography variant="h5" gutterBottom>
                    {section.title}
                  </Typography>
                  <Typography>
                    {section.content}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" gutterBottom>
                  No Portfolio Selected
                </Typography>
                <Typography color="text.secondary">
                  Create a new portfolio or select an existing one to edit
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Right Sidebar - Properties */}
      <Paper
        sx={{
          width: 300,
          flexShrink: 0,
          borderLeft: 1,
          borderColor: 'divider',
          p: 2,
          display: selectedElement ? 'block' : 'none',
          zIndex: 1,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Properties
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {selectedElement && (
          <Box>
            <TextField
              fullWidth
              label="Title"
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={4}
              size="small"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PortfolioEditor; 