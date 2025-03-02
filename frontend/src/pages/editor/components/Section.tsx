import React from 'react';
import { ResizableBox } from 'react-resizable';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState } from 'draft-js';
import { Section as SectionType } from '../ProjectEditor';

interface SectionProps {
  section: SectionType;
  isSelected: boolean;
  onUpdate: (updates: Partial<SectionType>) => void;
  onDelete: () => void;
  dragHandleProps?: any;
}

const Section: React.FC<SectionProps> = ({
  section,
  isSelected,
  onUpdate,
  onDelete,
  dragHandleProps,
}) => {
  const handleResize = (e: any, { size }: { size: { width: number; height: number } }) => {
    onUpdate({
      style: {
        ...section.style,
        width: size.width,
        height: size.height,
      },
    });
  };

  const handleLayoutChange = (layout: SectionType['style']['layout']) => {
    onUpdate({
      style: {
        ...section.style,
        layout,
      },
    });
  };

  const renderContent = () => {
    switch (section.type) {
      case 'text':
        return (
          <Editor
            editorState={section.content as EditorState}
            onEditorStateChange={(newState) => onUpdate({ content: newState })}
            toolbar={{
              options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'textAlign', 'colorPicker'],
              inline: { options: ['bold', 'italic', 'underline'] },
              textAlign: { inDropdown: true },
              link: { inDropdown: true },
              history: { inDropdown: true },
            }}
          />
        );

      case 'image':
        return (
          <div className="media-container">
            <img src={section.content.url} alt="" />
          </div>
        );

      case 'video':
        return (
          <div className="media-container">
            <video src={section.content.url} controls />
          </div>
        );

      case 'gallery':
        return (
          <div className="gallery-container">
            {section.content.images.map((image: { url: string }, index: number) => (
              <img key={index} src={image.url} alt="" />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`section ${isSelected ? 'selected' : ''}`}
      {...dragHandleProps}
    >
      <div className="section-toolbar">
        <select
          value={section.style.layout}
          onChange={(e) => handleLayoutChange(e.target.value as SectionType['style']['layout'])}
        >
          <option value="full">Full Width</option>
          <option value="left">Left Aligned</option>
          <option value="right">Right Aligned</option>
          <option value="center">Centered</option>
        </select>
        <button className="delete-section" onClick={onDelete}>×</button>
      </div>

      <ResizableBox
        width={section.style.width}
        height={section.style.height}
        onResize={handleResize}
        draggableOpts={{ grid: [10, 10] }}
        minConstraints={[200, 100]}
        maxConstraints={[1200, 800]}
      >
        {renderContent()}
      </ResizableBox>
    </div>
  );
};

export default Section; 