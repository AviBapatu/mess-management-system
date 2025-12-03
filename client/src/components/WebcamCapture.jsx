import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Camera } from "lucide-react";

/**
 * Simple webcam capture component.
 * Props:
 * - facingMode: 'user' (front) | 'environment' (rear)
 * - onCapture(blob: Blob, file: File)
 * - width, height (optional render size)
 * - guidanceText: Text to display as overlay (e.g. "Move to well-lit area")
 * - mirror: boolean to flip the video preview horizontally
 */
export default function WebcamCapture({
  facingMode = "user",
  onCapture,
  autoStart = true,
  guidanceText = "",
  mirror = false,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        if (mounted) {
          setDevices(videoDevices);
          // If we have devices and none selected, try to pick one based on facingMode
          if (videoDevices.length > 0 && !selectedDeviceId) {
            // This is a heuristic; browsers don't always label facing mode clearly in enumerateDevices
            // so we might just default to the first one or let getUserMedia handle it initially.
          }
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }

    getDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      mounted = false;
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function maybeStart() {
      if (autoStart && mounted) {
        await start();
      }
    }
    maybeStart();
    return () => {
      mounted = false;
      stop();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, facingMode, selectedDeviceId]);

  async function start() {
    setError(null);
    if (startingRef.current) return; // prevent concurrent starts
    // If already active, stop first to switch cameras
    if (isActive) stop();

    startingRef.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: !selectedDeviceId ? facingMode : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure metadata is loaded before play
        await new Promise((resolve) => {
          if (!videoRef.current) return resolve();
          const v = videoRef.current;
          if (v.readyState >= 1) return resolve();
          const handler = () => {
            v.removeEventListener("loadedmetadata", handler);
            resolve();
          };
          v.addEventListener("loadedmetadata", handler, { once: true });
        });

        try {
          await videoRef.current.play();
        } catch (_e) {
          // Ignore play interruption
        }
        setIsActive(true);
      }
    } catch (e) {
      setError(e.message || "Failed to access camera");
    } finally {
      startingRef.current = false;
    }
  }

  function stop() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
      setIsActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    // Capture at video's native resolution
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");

    // Apply mirror if needed
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        onCapture && onCapture(blob, file);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* Camera Selection */}
      {devices.length > 0 && (
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-gray-500" />
          <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Select Camera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Camera</SelectItem>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="relative bg-black w-full aspect-video overflow-hidden rounded-lg shadow-inner">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
          playsInline
          muted
        />

        {/* Guidance Overlay */}
        {isActive && guidanceText && (
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              {guidanceText}
            </span>
          </div>
        )}

        {/* Face Scanning Frame (Visual Aid) */}
        {isActive && guidanceText.toLowerCase().includes("face") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-2 border-white/50 rounded-[50%] box-border shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"></div>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!isActive ? (
          <Button type="button" onClick={start} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button type="button" onClick={capture} className="flex-1" variant="default">
              Capture Photo
            </Button>
            <Button type="button" variant="secondary" onClick={stop}>
              Stop
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {previewUrl && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Preview</p>
          <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-auto block"
            />
          </div>
        </div>
      )}
    </div>
  );
}
