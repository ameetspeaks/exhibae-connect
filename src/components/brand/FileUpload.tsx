import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxSize?: number;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedFileTypes = ['image/*', 'application/pdf'],
  maxFiles = 1,
  maxSize = 3 * 1024 * 1024, // 3MB
  selectedFiles = [],
  onRemoveFile,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Create previews for images
    const newPreviews = acceptedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    setPreviews(newPreviews);
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  // Cleanup previews when component unmounts
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize,
  });

  const handleRemoveFile = (index: number) => {
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    onRemoveFile?.(index);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-exhibae-navy bg-exhibae-navy/5' : 'border-gray-300 hover:border-exhibae-navy'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? (
            'Drop the files here...'
          ) : (
            <>
              Drag & drop files here, or <span className="text-exhibae-navy">browse</span>
              <br />
              <span className="text-xs text-gray-500">
                {acceptedFileTypes.includes('application/pdf') ? 
                  'Supports images and PDF files up to 3MB' : 
                  'Supports images up to 3MB'}
              </span>
            </>
          )}
        </p>
      </div>

      {selectedFiles.length > 0 &&
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                {file.type.startsWith('image/') ? (
                  <div className="relative w-12 h-12">
                    {previews[index] && (
                      <img
                        src={previews[index]}
                        alt="Preview"
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                ) : (
                  <FileText className="h-12 w-12 text-blue-500" />
                )}
                <div>
                  <span className="text-sm text-gray-700 truncate max-w-[200px] block">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}; 