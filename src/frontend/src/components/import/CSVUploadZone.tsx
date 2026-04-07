import { cn } from "@/lib/utils";
import { CheckCircle, FileText, Upload, X } from "lucide-react";

interface CSVUploadZoneProps {
  file: File | null;
  columnCount: number;
  onFile: (f: File) => void;
  onClear: () => void;
}

export function CSVUploadZone({
  file,
  columnCount,
  onFile,
  onClear,
}: CSVUploadZoneProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) onFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-2xl transition-smooth",
        file
          ? "border-[#00ff41]/50 bg-[#00ff41]/5"
          : "border-border hover:border-[#00ff41]/40 bg-card/40 hover:bg-[#00ff41]/5",
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label
        htmlFor="csv-file-input"
        className="flex flex-col items-center justify-center gap-3 p-12 cursor-pointer"
        data-ocid="import-dropzone"
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleChange}
        />
        {file ? (
          <>
            <div className="relative">
              <CheckCircle className="h-12 w-12 text-[#00ff41]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-sm">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {columnCount} columns detected · {(file.size / 1024).toFixed(1)}{" "}
                KB
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ background: "rgba(0,255,65,0.12)" }}
              />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-[#00ff41]/30">
                <Upload className="h-7 w-7 text-[#00ff41]" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Drop your CSV here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or{" "}
                <span className="text-[#00ff41] underline underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports standard broker export formats · .csv only
              </p>
            </div>
          </>
        )}
      </label>

      {file && (
        <div className="pb-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
            Remove file
          </button>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Ready to map columns
          </span>
        </div>
      )}
    </div>
  );
}
