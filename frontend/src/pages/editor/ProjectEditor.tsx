import React, { useState, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ResizableBox } from 'react-resizable';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import 'react-resizable/css/styles.css';
import ApiService from '../../services/api';
import Section from './components/Section';
import MediaUploader from './components/MediaUploader';
import ProjectSettings from './components/ProjectSettings';
import SectionToolbar from './components/SectionToolbar';
import './ProjectEditor.css';

export interface Section {
  id: string;
  type: 'text' | 'image' | 'gallery' | 'video';
  content: any;
  style: {
    width: number;
    height: number;
    layout: 'full' | 'left' | 'right' | 'center';
    backgroundColor?: string;
    padding?: number;
  };
}

interface Theme {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent: string;
}

interface Layout {
  type: 'grid' | 'masonry' | 'list';
  spacing: number;
  maxWidth: number;
}

interface ProjectEditorState {
  title: string;
  description: string;
  sections: Section[];
  selectedSectionId: string | null;
  isDragging: boolean;
  isUploading: boolean;
  unsavedChanges: boolean;
  theme: Theme;
  layout: Layout;
  showSettings: boolean;
  isSaving: boolean;
}

const DEFAULT_THEME: Theme = {
  primary: '#007bff',
  secondary: '#6c757d',
  text: '#212529',
  background: '#ffffff',
  accent: '#28a745',
};

const DEFAULT_LAYOUT: Layout = {
  type: 'grid',
  spacing: 24,
  maxWidth: 1200,
};

const ProjectEditor: React.FC = () => {
  const [state, setState] = useState<ProjectEditorState>({
    title: '',
    description: '',
    sections: [],
    selectedSectionId: null,
    isDragging: false,
    isUploading: false,
    unsavedChanges: false,
    theme: DEFAULT_THEME,
    layout: DEFAULT_LAYOUT,
    showSettings: false,
    isSaving: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section Management
  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: type === 'text' ? EditorState.createEmpty() : null,
      style: {
        width: 100,
        height: type === 'text' ? 200 : 400,
        layout: 'full',
      },
    };

    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      selectedSectionId: newSection.id,
      unsavedChanges: true,
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
      unsavedChanges: true,
    }));
  };

  const deleteSection = (sectionId: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
      selectedSectionId: null,
      unsavedChanges: true,
    }));
  };

  // Drag and Drop Handling
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sections = Array.from(state.sections);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    setState(prev => ({
      ...prev,
      sections,
      isDragging: false,
      unsavedChanges: true,
    }));
  };

  // Media Upload Handling
  const handleFileUpload = async (files: File[]) => {
    setState(prev => ({ ...prev, isUploading: true }));

    try {
      for (const file of files) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newSection: Section = {
            id: `section-${Date.now()}`,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            content: {
              url: reader.result as string,
              file,
            },
            style: {
              width: 100,
              height: 400,
              layout: 'full',
            },
          };

          setState(prev => ({
            ...prev,
            sections: [...prev.sections, newSection],
            selectedSectionId: newSection.id,
            unsavedChanges: true,
          }));
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Theme and Layout Management
  const handleThemeChange = (theme: Theme) => {
    setState(prev => ({
      ...prev,
      theme,
      unsavedChanges: true,
    }));
  };

  const handleLayoutChange = (layout: Layout) => {
    setState(prev => ({
      ...prev,
      layout,
      unsavedChanges: true,
    }));
  };

  // Save Project
  const saveProject = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      // Convert content to JSON string for storage
      const projectData = {
        title: state.title,
        description: state.description,
        sections: state.sections.map(section => ({
          ...section,
          content: typeof section.content === 'object' ? 
            JSON.stringify(section.content) : section.content
        })),
        theme: state.theme,
        layout: state.layout
      };
      
      // Send to API - this should be updated to use the actual API endpoint
      // Mock success for now
      console.log('Saving project:', projectData);
      
      // If we had a project ID, we would update instead
      // const response = await ApiService.createPortfolio(projectData);
      
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isSaving: false,
          unsavedChanges: false
        }));
        alert('Project saved successfully!');
      }, 1000);
      
    } catch (error) {
      console.error('Error saving project:', error);
      setState(prev => ({ ...prev, isSaving: false }));
      alert('Failed to save project. Please try again.');
    }
  };

  return (
    <div 
      className="project-editor"
      style={{
        '--primary-color': state.theme.primary,
        '--secondary-color': state.theme.secondary,
        '--text-color': state.theme.text,
        '--background-color': state.theme.background,
        '--accent-color': state.theme.accent,
      } as React.CSSProperties}
    >
      <header className="editor-header">
        <div className="editor-title">
          <input
            type="text"
            value={state.title}
            onChange={e => setState(prev => ({ ...prev, title: e.target.value, unsavedChanges: true }))}
            placeholder="Project Title"
            className="title-input"
          />
          <textarea
            value={state.description}
            onChange={e => setState(prev => ({ ...prev, description: e.target.value, unsavedChanges: true }))}
            placeholder="Project Description"
            className="description-input"
          />
        </div>

        <div className="editor-actions">
          <button onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}>
            <i className="fas fa-cog" />
            Settings
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            <i className="fas fa-image" />
            Add Media
          </button>
          <button onClick={() => addSection('text')}>
            <i className="fas fa-font" />
            Add Text
          </button>
          <button onClick={saveProject} disabled={state.isSaving}>
            {state.isSaving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </header>

      {state.showSettings && (
        <ProjectSettings
          theme={state.theme}
          layout={state.layout}
          onThemeChange={handleThemeChange}
          onLayoutChange={handleLayoutChange}
        />
      )}

      <MediaUploader
        onUpload={handleFileUpload}
        onError={(error) => console.error(error)}
        multiple={true}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="sections-container"
              style={{
                maxWidth: state.layout.maxWidth,
                gap: state.layout.spacing,
              }}
            >
              {state.sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <Section
                        section={section}
                        isSelected={state.selectedSectionId === section.id}
                        onUpdate={(updates) => updateSection(section.id, updates)}
                        onDelete={() => deleteSection(section.id)}
                        dragHandleProps={provided.dragHandleProps}
                      />
                      {state.selectedSectionId === section.id && (
                        <SectionToolbar
                          section={section}
                          onUpdate={(updates) => updateSection(section.id, updates)}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ProjectEditor; 