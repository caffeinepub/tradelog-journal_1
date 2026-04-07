import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface ChartUploadZoneProps {
  onUploaded: (url: string) => void;
  onClear: () => void;
  uploadedUrl: string | null;
}

export function ChartUploadZone({
  onUploaded,
  onClear,
  uploadedUrl,
}: ChartUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10 MB.");
        return;
      }
      setError(null);
      setIsUploading(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        onUploaded(dataUrl);
      } catch {
        setError("Failed to load image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  if (uploadedUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#00ff41]/30 bg-card/60">
        <img
          src={uploadedUrl}
          alt="Uploaded chart"
          className="w-full max-h-56 object-contain"
        />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-destructive/20 transition-colors"
          aria-label="Remove chart image"
          data-ocid="chart-upload-remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isUploading}
        data-ocid="chart-upload-zone"
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-smooth flex flex-col items-center justify-center gap-3 py-10 px-4 text-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff41]/50",
          isDragging
            ? "border-[#00ff41]/70 bg-[#00ff41]/5 shadow-[0_0_20px_rgba(0,255,65,0.15)]"
            : "border-border/60 bg-card/40 hover:border-[#00ff41]/40 hover:bg-[#00ff41]/5",
          isUploading && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload chart screenshot"
        />
        {isUploading ? (
          <div className="flex items-center gap-2 text-[#00ff41] text-sm">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-[#00ff41] border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <span>Loading image…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/60 border border-border">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop chart screenshot here
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                or{" "}
                <span className="text-[#00ff41] underline underline-offset-2">
                  browse files
                </span>
                . PNG, JPG, WEBP supported.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="h-3 w-3" />
              <span>Max 10 MB</span>
            </div>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive-foreground bg-destructive/15 border border-destructive/30 rounded-lg px-3 py-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
