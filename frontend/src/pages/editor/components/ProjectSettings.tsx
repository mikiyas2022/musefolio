import React from 'react';

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

interface ProjectSettingsProps {
  theme: Theme;
  layout: Layout;
  onThemeChange: (theme: Theme) => void;
  onLayoutChange: (layout: Layout) => void;
}

const DEFAULT_THEMES: Record<string, Theme> = {
  light: {
    primary: '#007bff',
    secondary: '#6c757d',
    text: '#212529',
    background: '#ffffff',
    accent: '#28a745',
  },
  dark: {
    primary: '#0d6efd',
    secondary: '#495057',
    text: '#f8f9fa',
    background: '#212529',
    accent: '#198754',
  },
  minimal: {
    primary: '#000000',
    secondary: '#666666',
    text: '#333333',
    background: '#ffffff',
    accent: '#000000',
  },
};

const ProjectSettings: React.FC<ProjectSettingsProps> = ({
  theme,
  layout,
  onThemeChange,
  onLayoutChange,
}) => {
  const handleThemeSelect = (themeName: keyof typeof DEFAULT_THEMES) => {
    onThemeChange(DEFAULT_THEMES[themeName]);
  };

  const handleCustomThemeChange = (property: keyof Theme, value: string) => {
    onThemeChange({
      ...theme,
      [property]: value,
    });
  };

  const handleLayoutChange = (property: keyof Layout, value: any) => {
    onLayoutChange({
      ...layout,
      [property]: value,
    });
  };

  return (
    <div className="project-settings">
      <section className="settings-section">
        <h3>Theme</h3>
        <div className="theme-presets">
          {Object.entries(DEFAULT_THEMES).map(([name, preset]) => (
            <button
              key={name}
              className={`theme-preset ${theme === preset ? 'active' : ''}`}
              onClick={() => handleThemeSelect(name as keyof typeof DEFAULT_THEMES)}
            >
              <div className="theme-preview" style={{ background: preset.background }}>
                <div className="color-dot" style={{ background: preset.primary }} />
                <div className="color-dot" style={{ background: preset.secondary }} />
                <div className="color-dot" style={{ background: preset.accent }} />
              </div>
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="custom-theme">
          <h4>Custom Colors</h4>
          <div className="color-inputs">
            {Object.entries(theme).map(([key, value]) => (
              <div key={key} className="color-input">
                <label>{key}</label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleCustomThemeChange(key as keyof Theme, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>Layout</h3>
        <div className="layout-options">
          <div className="layout-type">
            <label>Type</label>
            <select
              value={layout.type}
              onChange={(e) => handleLayoutChange('type', e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="masonry">Masonry</option>
              <option value="list">List</option>
            </select>
          </div>

          <div className="layout-spacing">
            <label>Spacing</label>
            <input
              type="range"
              min="0"
              max="48"
              value={layout.spacing}
              onChange={(e) => handleLayoutChange('spacing', parseInt(e.target.value))}
            />
            <span>{layout.spacing}px</span>
          </div>

          <div className="layout-width">
            <label>Max Width</label>
            <input
              type="number"
              min="600"
              max="1920"
              step="60"
              value={layout.maxWidth}
              onChange={(e) => handleLayoutChange('maxWidth', parseInt(e.target.value))}
            />
            <span>px</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectSettings; 