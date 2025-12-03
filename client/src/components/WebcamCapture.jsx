import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Simple webcam capture component.
 * Props:
 * - facingMode: 'user' (front) | 'environment' (rear)
 * - onCapture(blob: Blob, file: File)
 * - width, height (optional render size)
 * - guidanceText: Text to display as overlay (e.g. "Move to well-lit area")
 */
export default function WebcamCapture({
  facingMode = "user",
  onCapture,
  width = 480,
  height = 360,
  autoStart = true,
  guidanceText = "",
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
  }, [autoStart, facingMode]);

  async function start() {
    setError(null);
    if (startingRef.current || isActive) return; // prevent concurrent starts
    startingRef.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }
      // Try exact facing mode first, then ideal, then no constraint as fallback
      const constraintsList = [
        { video: { facingMode: { exact: facingMode } }, audio: false },
        { video: { facingMode }, audio: false },
        { video: true, audio: false },
      ];
      let stream = null;
      let lastErr = null;
      for (const c of constraintsList) {
        try {
          // eslint-disable-next-line no-await-in-loop
          stream = await navigator.mediaDevices.getUserMedia(c);
          if (stream) break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!stream) throw lastErr || new Error("Unable to access camera");
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
        // Attempt to play; ignore the common interruption warning in dev
        try {
          const p = videoRef.current.play();
          if (p && typeof p.then === "function") {
            await p;
          }
        } catch (_e) {
          // Chrome may log: play() request was interrupted by a new load request.
          // Not fatal; the stream is attached and will play once stable.
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
      // Detach stream to avoid subsequent play() interruptions
      videoRef.current.srcObject = null;
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = width;
    const h = height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
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
    <div className="space-y-2">
      <div className="relative bg-black w-full overflow-hidden rounded-md" style={{ width, height }}>
        <video ref={videoRef} style={{ width, height, objectFit: "cover" }} playsInline muted />

        {/* Guidance Overlay */}
        {isActive && guidanceText && (
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              {guidanceText}
            </span>
          </div>
        )}

        {/* Face Scanning Frame (Visual Aid) */}
        {isActive && guidanceText.toLowerCase().includes("face") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-2 border-white/50 rounded-full"></div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isActive ? (
          <Button type="button" onClick={start}>
            Start camera
          </Button>
        ) : (
          <>
            <Button type="button" onClick={capture}>
              Capture
            </Button>
            <Button type="button" variant="outline" onClick={stop}>
              Stop
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {previewUrl && (
        <div>
          <p className="text-sm text-gray-600">Preview:</p>
          <img
            src={previewUrl}
            alt="preview"
            style={{ width, height }}
            className="rounded border"
          />
        </div>
      )}
    </div>
  );
}
