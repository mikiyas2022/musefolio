import React from 'react';
import { Section } from '../ProjectEditor';

interface SectionToolbarProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
}

const SectionToolbar: React.FC<SectionToolbarProps> = ({ section, onUpdate }) => {
  const handleStyleChange = (property: keyof Section['style'], value: string | number) => {
    onUpdate({
      style: {
        ...section.style,
        [property]: value,
      },
    });
  };

  return (
    <div className="section-toolbar">
      <div className="toolbar-group">
        <label>Layout:</label>
        <select
          value={section.style.layout}
          onChange={(e) => handleStyleChange('layout', e.target.value as Section['style']['layout'])}
        >
          <option value="full">Full Width</option>
          <option value="left">Left Aligned</option>
          <option value="right">Right Aligned</option>
          <option value="center">Centered</option>
        </select>
      </div>

      <div className="toolbar-group">
        <label>Background:</label>
        <input
          type="color"
          value={section.style.backgroundColor || '#ffffff'}
          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
        />
      </div>

      <div className="toolbar-group">
        <label>Padding:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={section.style.padding || 0}
          onChange={(e) => handleStyleChange('padding', parseInt(e.target.value))}
        />
        <span>{section.style.padding || 0}px</span>
      </div>

      {section.type === 'text' && (
        <div className="toolbar-group text-options">
          <button onClick={() => {/* Implement text alignment */}}>
            <i className="fas fa-align-left" />
          </button>
          <button onClick={() => {/* Implement text style */}}>
            <i className="fas fa-bold" />
          </button>
          <button onClick={() => {/* Implement text color */}}>
            <i className="fas fa-palette" />
          </button>
        </div>
      )}

      {(section.type === 'image' || section.type === 'video') && (
        <div className="toolbar-group media-options">
          <button onClick={() => {/* Implement media fit */}}>
            <i className="fas fa-expand" />
          </button>
          <button onClick={() => {/* Implement media position */}}>
            <i className="fas fa-crop" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionToolbar; 