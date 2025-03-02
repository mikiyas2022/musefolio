import React, { useState, useRef } from 'react';
import { Section } from '../ProjectEditor';

interface MediaUploaderProps {
  onUpload: (files: File[]) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
}

const DEFAULT_MAX_FILE_SIZE = 10; // 10MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  onError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    return files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        onError(`File type ${file.type} is not supported`);
        return false;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        onError(`File ${file.name} is too large (max ${maxFileSize}MB)`);
        return false;
      }

      return true;
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = validateFiles(fileArray);

    if (validFiles.length > 0) {
      // Generate previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      onUpload(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="media-uploader">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleChange}
          multiple={multiple}
          style={{ display: 'none' }}
        />
        
        <div className="upload-message">
          <i className="fas fa-cloud-upload-alt" />
          <p>Drag and drop files here or click to browse</p>
          <span className="upload-info">
            Supported formats: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
            <br />
            Maximum file size: {maxFileSize}MB
          </span>
        </div>

        {preview.length > 0 && (
          <div className="preview-container">
            {preview.map((url, index) => (
              <div key={index} className="preview-item">
                {url.startsWith('data:image') ? (
                  <img src={url} alt={`Preview ${index + 1}`} />
                ) : (
                  <video src={url} controls />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUploader; 