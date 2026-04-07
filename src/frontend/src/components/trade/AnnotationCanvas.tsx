import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Lock,
  Minus,
  MousePointer,
  Pencil,
  Redo2,
  Square,
  Type,
  Undo2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type ToolId = "select" | "pen" | "line" | "rect" | "text" | "arrow";
type NeonColor = "#00ff41" | "#00ffff" | "#b900ff" | "#ffffff" | "#ff3b30";

interface Point {
  x: number;
  y: number;
}

interface DrawPath {
  id: string;
  tool: ToolId;
  color: NeonColor;
  lineWidth: number;
  points: Point[];
  text?: string;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  isPaid: boolean;
  onAnnotated?: (dataUrl: string) => void;
  onClose?: () => void;
}

const COLORS: { color: NeonColor; label: string }[] = [
  { color: "#00ff41", label: "Electric green" },
  { color: "#00ffff", label: "Cyan" },
  { color: "#b900ff", label: "Purple" },
  { color: "#ffffff", label: "White" },
  { color: "#ff3b30", label: "Red" },
];

const TOOLS: {
  id: ToolId;
  label: string;
  Icon: React.ElementType;
  paid?: boolean;
}[] = [
  { id: "select", label: "Select / Pan", Icon: MousePointer },
  { id: "pen", label: "Freehand pen", Icon: Pencil },
  { id: "line", label: "Line", Icon: Minus },
  { id: "rect", label: "Rectangle", Icon: Square },
  { id: "text", label: "Text label", Icon: Type },
  { id: "arrow", label: "Arrow (Pro)", Icon: ArrowUpRight, paid: true },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function AnnotationCanvas({
  imageUrl,
  isPaid,
  onAnnotated,
  onClose,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolId>("pen");
  const [activeColor, setActiveColor] = useState<NeonColor>("#00ff41");
  const [lineWidth] = useState(2);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [pendingText, setPendingText] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [textValue, setTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  // Load and draw the background image
  const drawAll = useCallback(
    (pathList: DrawPath[], drawing?: DrawPath | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background image
      if (imgRef.current) {
        ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      }

      const allPaths = drawing ? [...pathList, drawing] : pathList;

      for (const p of allPaths) {
        if (p.points.length === 0) continue;
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (p.tool === "pen") {
          ctx.beginPath();
          ctx.moveTo(p.points[0].x, p.points[0].y);
          for (const pt of p.points.slice(1)) ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        } else if (p.tool === "line") {
          const start = p.points[0];
          const end = p.points[p.points.length - 1];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else if (p.tool === "rect") {
          const start = p.points[0];
          const end = p.points[p.points.length - 1];
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (p.tool === "arrow") {
          const start = p.points[0];
          const end = p.points[p.points.length - 1];
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLen = 16;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
        } else if (p.tool === "text" && p.text) {
          ctx.font = `${Math.max(14, p.lineWidth * 6)}px 'JetBrains Mono', monospace`;
          ctx.fillText(p.text, p.points[0].x, p.points[0].y);
        }
      }
    },
    [],
  );

  // Initialize canvas with image
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const ratio = img.naturalWidth / img.naturalHeight;
      const maxW = container.clientWidth;
      const maxH = 420;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      drawAll(paths);
    };
    img.src = imageUrl;
  }, [imageUrl, drawAll, paths]);

  // Re-draw when paths change
  useEffect(() => {
    drawAll(paths);
  }, [paths, drawAll]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0] ?? e.changedTouches[0];
    return {
      x: (touch.clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (touch.clientY - rect.top) * (canvasRef.current!.height / rect.height),
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (activeTool === "select") return;
    if (activeTool === "text") {
      setPendingText(getTouchPos(e));
      setTextValue("");
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }
    const pos = getTouchPos(e);
    setIsDrawing(true);
    setRedoStack([]);
    const newPath: DrawPath = {
      id: uid(),
      tool: activeTool,
      color: activeColor,
      lineWidth,
      points: [pos],
    };
    setCurrentPath(newPath);
    drawAll(paths, newPath);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !currentPath) return;
    const pos = getTouchPos(e);
    const updated: DrawPath =
      currentPath.tool === "pen"
        ? { ...currentPath, points: [...currentPath.points, pos] }
        : { ...currentPath, points: [currentPath.points[0], pos] };
    setCurrentPath(updated);
    drawAll(paths, updated);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !currentPath) return;
    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") return;
    if (activeTool === "text") {
      setPendingText(getPos(e));
      setTextValue("");
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }
    const pos = getPos(e);
    setIsDrawing(true);
    setRedoStack([]);
    const newPath: DrawPath = {
      id: uid(),
      tool: activeTool,
      color: activeColor,
      lineWidth,
      points: [pos],
    };
    setCurrentPath(newPath);
    drawAll(paths, newPath);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath) return;
    const pos = getPos(e);
    const updated: DrawPath =
      currentPath.tool === "pen"
        ? { ...currentPath, points: [...currentPath.points, pos] }
        : { ...currentPath, points: [currentPath.points[0], pos] };
    setCurrentPath(updated);
    drawAll(paths, updated);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentPath) return;
    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath(null);
    setIsDrawing(false);
  };

  const commitText = () => {
    if (!pendingText || !textValue.trim()) {
      setPendingText(null);
      setTextValue("");
      return;
    }
    const newPath: DrawPath = {
      id: uid(),
      tool: "text",
      color: activeColor,
      lineWidth,
      points: [pendingText],
      text: textValue,
    };
    setPaths((prev) => [...prev, newPath]);
    setPendingText(null);
    setTextValue("");
  };

  const undo = () => {
    if (paths.length === 0) return;
    const last = paths[paths.length - 1];
    setRedoStack((r) => [...r, [...paths]]);
    setPaths((p) => p.slice(0, -1));
    drawAll(paths.slice(0, -1));
    return last;
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setPaths(last);
    drawAll(last);
  };

  const handleToolSelect = (toolId: ToolId, isPaidTool: boolean) => {
    if (isPaidTool && !isPaid) {
      setShowUpgradePrompt(true);
      return;
    }
    setActiveTool(toolId);
  };

  const saveAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onAnnotated?.(dataUrl);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-card/70 border border-border backdrop-blur-sm">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {TOOLS.map(({ id, label, Icon, paid }) => {
            const locked = paid && !isPaid;
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => handleToolSelect(id, !!paid)}
                data-ocid={`annotation-tool-${id}`}
                className={cn(
                  "relative p-2 rounded-lg transition-smooth",
                  activeTool === id && !locked
                    ? "bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/40 shadow-[0_0_8px_rgba(0,255,65,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  locked && "opacity-60",
                )}
              >
                <Icon className="h-4 w-4" />
                {locked && (
                  <Lock className="absolute -top-1 -right-1 h-2.5 w-2.5 text-[#b900ff]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-border" aria-hidden="true" />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              aria-label={`Color: ${label}`}
              title={label}
              onClick={() => setActiveColor(color)}
              data-ocid={`annotation-color-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-smooth hover:scale-110",
                activeColor === color
                  ? "border-foreground scale-110 shadow-[0_0_8px_currentColor]"
                  : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-border" aria-hidden="true" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={paths.length === 0}
            aria-label="Undo"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-smooth disabled:opacity-30"
            data-ocid="annotation-undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.length === 0}
            aria-label="Redo"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-smooth disabled:opacity-30"
            data-ocid="annotation-redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close annotation canvas"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={saveAnnotation}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 transition-smooth"
            data-ocid="annotation-save"
          >
            Save annotations
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-border bg-card/40"
        style={{
          cursor:
            activeTool === "text"
              ? "text"
              : activeTool === "select"
                ? "default"
                : "crosshair",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="max-w-full block"
          data-ocid="annotation-canvas"
        />

        {/* Text input overlay */}
        {pendingText && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText();
              if (e.key === "Escape") {
                setPendingText(null);
                setTextValue("");
              }
            }}
            className="absolute bg-transparent border-b border-dashed text-sm font-mono outline-none z-10"
            style={{
              left: pendingText.x,
              top: pendingText.y - 16,
              color: activeColor,
              borderColor: activeColor,
              width: 160,
            }}
            placeholder="Type & press Enter"
          />
        )}
      </div>

      {/* Arrow locked upgrade prompt */}
      {showUpgradePrompt && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#b900ff]/10 border border-[#b900ff]/30">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#b900ff] shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold text-[#b900ff]">
                Arrow tool is Premium.
              </span>{" "}
              Upgrade to unlock arrows, custom shapes and more.
            </p>
          </div>
          <a
            href="/pricing"
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#b900ff]/15 text-[#b900ff] border border-[#b900ff]/40 hover:bg-[#b900ff]/30 transition-smooth whitespace-nowrap"
            data-ocid="annotation-upgrade-cta"
          >
            Go Pro
          </a>
          <button
            type="button"
            onClick={() => setShowUpgradePrompt(false)}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
