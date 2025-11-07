import { useState, useRef } from 'react';
import { Upload, X, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadVideo, validateVideoFile, formatFileSize } from '../../lib/videoStorage';

interface VideoUploadProps {
  courseId: string;
  lessonId: string;
  onUploadComplete: (storagePath: string) => void;
  onCancel?: () => void;
}

export function VideoUpload({ courseId, lessonId, onUploadComplete, onCancel }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    // Simulate progress (Supabase doesn't provide upload progress)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const { path, error: uploadError } = await uploadVideo(
        selectedFile,
        courseId,
        lessonId
      );

      clearInterval(progressInterval);

      if (uploadError) {
        setError(uploadError);
        setProgress(0);
        return;
      }

      setProgress(100);
      setSuccess(true);

      // Call the callback with the storage path
      setTimeout(() => {
        onUploadComplete(path);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to upload video');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function handleClearFile() {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-900 font-medium mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-500">
              MP4, WebM, OGG, or MOV (max 50MB)
            </p>
          </>
        ) : (
          <>
            <Video className="mx-auto text-green-600 mb-4" size={48} />
            <p className="text-gray-900 font-medium mb-1">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-green-900">Video uploaded successfully!</p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Uploading...</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {selectedFile && !uploading && !success && (
          <>
            <button
              onClick={handleUpload}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Upload Video
            </button>
            <button
              onClick={handleClearFile}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </>
        )}

        {onCancel && !uploading && (
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-gray-900 text-sm mb-2">Video Upload Tips</h4>
        <ul className="space-y-1 text-xs text-gray-700">
          <li>• Recommended format: MP4 (H.264 video, AAC audio)</li>
          <li>• Recommended resolution: 1080p or 720p</li>
          <li>• Keep file size under 50MB (Supabase free tier limit)</li>
          <li>• For larger videos, use external hosting (YouTube/Vimeo) and paste the URL</li>
          <li>• Videos are stored securely and require authentication to view</li>
        </ul>
      </div>
    </div>
  );
}
