import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  File, 
  FileText, 
  FileImage, 
  X,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { uploadFiles } from "@/lib/hrApi";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  errorMessage?: string;
}

interface FileUploadZoneProps {
  onFilesChange?: (files: UploadedFile[]) => void;
}

const acceptedTypes = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-danger' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, label: 'DOCX', color: 'text-primary' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileImage, label: 'PPT', color: 'text-warning' },
  'text/plain': { icon: FileText, label: 'TXT', color: 'text-muted-foreground' },
};

export function FileUploadZone({ onFilesChange }: FileUploadZoneProps = {}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = Object.keys(acceptedTypes).includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload PDF, DOCX, PPT, or TXT files.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large", 
          description: `${file.name} is larger than 10MB. Please upload a smaller file.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // First add all valid files to the UI in an 'uploading' state
    const newUploads = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 10, // Initial progress
    }));

    setUploadedFiles(prev => {
      const updated = [...prev, ...newUploads];
      onFilesChange?.(updated);
      return updated;
    });
    
    // Animate progress up to 90% while waiting for the API
    const progressIntervals = newUploads.map(upload => {
      return setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === upload.id && f.status === 'uploading' && (f.progress || 0) < 90) {
            return { ...f, progress: (f.progress || 0) + 10 };
          }
          return f;
        }));
      }, 300);
    });

    try {
      // Call the mock API
      const results = await uploadFiles(validFiles);
      
      // Update UI with results
      setUploadedFiles(prev => {
        const updated = prev.map(f => {
          // Find matching result by file name (since ID in API differs from UI init ID)
          const result = results.find(r => r.name === f.name && f.status === 'uploading');
          if (result) {
            return {
              ...f,
              status: (result.success ? 'success' : 'error') as 'success' | 'error',
              progress: result.success ? 100 : f.progress,
              errorMessage: result.message
            };
          }
          return f;
        });
        onFilesChange?.(updated);
        return updated;
      });

      // Show toasts for results
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast({
          title: "Uploads Complete",
          description: `Successfully processed ${successCount} document(s).`,
        });
      }
      const failCount = results.length - successCount;
      if (failCount > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failCount} document(s) failed validation or processing.`,
          variant: "destructive",
        });
      }
    } finally {
      // Clean up intervals
      progressIntervals.forEach(clearInterval);
    }
  }, [onFilesChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      onFilesChange?.(updated);
      return updated;
    });
  }, [onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5 shadow-primary" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className={cn(
            "rounded-full p-4 mb-4 transition-colors",
            isDragOver ? "bg-primary/10" : "bg-muted/50"
          )}>
            <Upload className={cn(
              "h-8 w-8",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? "Drop files here" : "Upload Resume or Documents"}
          </h3>
          
          <p className="text-muted-foreground mb-4 max-w-sm">
            Drag and drop your files here, or click to browse. 
            Supports PDF, DOCX, PPT, and TXT files up to 10MB each.
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            {Object.entries(acceptedTypes).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                <config.icon className={cn("h-3 w-3", config.color)} />
                {config.label}
              </div>
            ))}
          </div>
          
          <Button asChild>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.ppt,.pptx,.txt"
                onChange={handleFileSelect}
                className="sr-only"
              />
              Choose Files
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Uploaded Files</h4>
            <div className="space-y-3">
              {uploadedFiles.map(file => {
                const fileConfig = acceptedTypes[file.type as keyof typeof acceptedTypes];
                const FileIcon = fileConfig?.icon || File;
                
                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={cn("p-1 rounded", fileConfig?.color)}>
                      <FileIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      
                      {file.status === 'uploading' && (
                        <div className="mt-1">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${file.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      {file.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-danger" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}