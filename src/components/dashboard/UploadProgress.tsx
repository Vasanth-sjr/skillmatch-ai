import { Upload, FileText, Award, FolderOpen, File, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
}

const uploadTypes = [
  { name: "Assignments", icon: FileText, accept: ".pdf,.doc,.docx" },
  { name: "Certificates", icon: Award, accept: ".pdf,.png,.jpg" },
  { name: "Project Files", icon: FolderOpen, accept: ".zip,.rar,.7z" },
  { name: "Resume", icon: File, accept: ".pdf,.doc,.docx" },
];

export function UploadProgress() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const simulateUpload = useCallback(
    (file: File) => {
      const uploadFile: UploadedFile = {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };

      setFiles((prev) => [uploadFile, ...prev]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress: 100, status: "success" } : f
            )
          );
          toast({
            title: "Upload complete",
            description: `${file.name} uploaded successfully.`,
          });
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress: Math.min(progress, 95) } : f
            )
          );
        }
      }, 500);
    },
    [toast]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      Array.from(fileList).forEach((file) => simulateUpload(file));
    },
    [simulateUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl bg-card p-5 card-shadow border border-border">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Upload Learning Progress
      </h3>

      {/* Drag and drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-8",
          "flex flex-col items-center justify-center gap-3",
          "transition-all duration-200 cursor-pointer group",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <div
          className={cn(
            "p-4 rounded-xl transition-colors",
            isDragging ? "bg-primary/10" : "bg-accent group-hover:bg-primary/10"
          )}
        >
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {isDragging ? "Drop files here" : "Drag and drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOC, PNG, ZIP — Max 10MB per file
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Upload type chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {uploadTypes.map((type) => (
          <button
            key={type.name}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = type.accept;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) handleFiles(files);
              };
              input.click();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs font-semibold text-accent-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer border border-border"
          >
            <type.icon className="h-3 w-3" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recent Uploads
          </h4>
          {files.slice(0, 5).map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border"
            >
              <div className="shrink-0">
                {file.status === "uploading" && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                )}
                {file.status === "success" && (
                  <CheckCircle className="h-4 w-4 text-metric-green" />
                )}
                {file.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              {file.status === "uploading" && (
                <div className="w-20">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
