import React from 'react';
import { 
  Typography, 
  Box, 
  IconButton, 
  Button,
  Divider 
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';

interface EditableSectionProps {
  title: string;
  isEditing: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}

const EditableSection: React.FC<EditableSectionProps> = ({ 
  title, 
  isEditing, 
  onAdd, 
  children 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h5" component="h2" color="primary" fontWeight="500">
          {title}
        </Typography>
        {isEditing && onAdd && (
          <Button 
            startIcon={<AddIcon />} 
            variant="outlined" 
            size="small" 
            onClick={onAdd}
          >
            Add
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box>
        {children}
      </Box>
    </Box>
  );
};

export default EditableSection; 