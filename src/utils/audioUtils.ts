// Real-time audio analysis, recording, and speech recognition helper

export interface SpeechRecognitionResultItem {
  transcript: string;
  isFinal: boolean;
  timestampSeconds: number;
}

// Check if browser supports Web Speech API
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
}

// Convert Blob to Base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds into MM:SS
export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Audio Visualizer Class for Canvas
export class SoundVisualizer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private onVolumeUpdate?: (volume: number, isSilent: boolean) => void;

  constructor(canvas: HTMLCanvasElement, onVolumeUpdate?: (volume: number, isSilent: boolean) => void) {
    this.canvas = canvas;
    this.onVolumeUpdate = onVolumeUpdate;
  }

  public start(stream: MediaStream) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.draw();
    } catch (err) {
      console.warn("Could not start audio visualizer:", err);
    }
  }

  private draw = () => {
    if (!this.canvas || !this.analyser || !this.dataArray) return;
    this.animationId = requestAnimationFrame(this.draw);
    this.analyser.getByteFrequencyData(this.dataArray);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length;
    const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));
    const isSilent = avg < 8;

    if (this.onVolumeUpdate) {
      this.onVolumeUpdate(normalizedVol, isSilent);
    }

    // Draw stylized fiery red waveform bars
    const barCount = 36;
    const barWidth = (width / barCount) * 0.65;
    const step = Math.floor(this.dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const val = this.dataArray[i * step] || 0;
      const percent = val / 255;
      const barHeight = Math.max(4, percent * height * 0.85);
      const x = i * (width / barCount) + (width / barCount - barWidth) / 2;
      const y = (height - barHeight) / 2;

      // Fiery gradient: from bright flame red to deep crimson
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#ff4444"); // bright flame red
      gradient.addColorStop(0.5, "#ef4444"); // intense fiery red
      gradient.addColorStop(1, "#991b1b"); // deep crimson
      ctx.fillStyle = gradient;

      ctx.beginPath();
      const radius = Math.min(barWidth / 2, barHeight / 2);
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }
  };

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
