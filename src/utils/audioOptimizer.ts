/**
 * Client-Side Audio Optimizer and Format Normalizer
 * Prepares user-uploaded audio files for fast, resilient AI processing
 * by downsampling to 16kHz mono or slicing if payload exceeds safe limits.
 */

// Helper to convert an AudioBuffer into standard 16-bit Mono WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer, sampleRate: number): Blob {
  const channelData = buffer.getChannelData(0); // mono
  const numSamples = channelData.length;
  const dataByteLength = numSamples * 2; // 16-bit PCM
  const wavBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length minus RIFF identifier & length = 36 + data length */
  view.setUint32(4, 36 + dataByteLength, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 is PCM) */
  view.setUint16(20, 1, true);
  /* channel count (1 is Mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * numChannels * bitsPerSample / 8) */
  view.setUint32(28, sampleRate * 1 * 2, true);
  /* block align (numChannels * bitsPerSample / 8) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, dataByteLength, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp sample between -1.0 and 1.0
    const s = Math.max(-1, Math.min(1, channelData[i]));
    // Convert to 16-bit signed integer
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Reads real duration of any audio file using HTML5 Audio element
 */
export async function getAudioDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";

      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.removeEventListener("loadedmetadata", onLoaded);
        audio.removeEventListener("error", onError);
      };

      const onLoaded = () => {
        const duration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 60;
        cleanup();
        resolve(Math.round(duration));
      };

      const onError = () => {
        cleanup();
        resolve(60);
      };

      audio.addEventListener("loadedmetadata", onLoaded);
      audio.addEventListener("error", onError);
      audio.src = url;

      // Fallback timeout in case metadata event stalls
      setTimeout(() => {
        cleanup();
        resolve(60);
      }, 2500);
    } catch {
      resolve(60);
    }
  });
}

/**
 * Optimizes an uploaded audio file:
 * - If under 3.5MB: returns directly as base64.
 * - If larger: resamples to 16kHz mono WAV using OfflineAudioContext,
 *   reducing payload size by up to 80% while keeping speech crisp and clear.
 */
export async function prepareAudioForUpload(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{
  base64Audio: string;
  mimeType: string;
  durationSeconds: number;
}> {
  // First obtain real duration
  onProgress?.("جارٍ قراءة بيانات الملف الصوتي...");
  const durationSeconds = await getAudioDuration(file);

  // If already small (<= 3.5MB), use direct base64
  const SAFE_DIRECT_SIZE = 3.5 * 1024 * 1024;
  if (file.size <= SAFE_DIRECT_SIZE) {
    onProgress?.("الملف بحجم مثالي، جارٍ التجهيز للنقل المباشر...");
    const base64Audio = await blobToBase64(file);
    return {
      base64Audio,
      mimeType: file.type || "audio/mp3",
      durationSeconds,
    };
  }

  // File is large, attempt client-side downsampling to 16kHz mono WAV
  onProgress?.("الملف كبير، جارٍ ضغطه وتعديل التردد لتسريع المعالجة...");
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      // AudioContext not available, fallback to direct with slicing if needed
      const base64Audio = await blobToBase64(file);
      return { base64Audio, mimeType: file.type || "audio/mp3", durationSeconds };
    }

    const arrayBuffer = await file.arrayBuffer();
    const tempCtx = new AudioContextClass();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      try {
        await tempCtx.close();
      } catch {}
    }

    const targetSampleRate = 16000;
    // Limit to max 6 minutes of speech for upload analysis to prevent extreme payload
    const maxSeconds = Math.min(audioBuffer.duration, 360);
    const targetLength = Math.floor(maxSeconds * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWavBlob(renderedBuffer, targetSampleRate);

    const base64Audio = await blobToBase64(wavBlob);
    onProgress?.("تم تجهيز وضغط الصوت بنجاح، جارٍ الإرسال...");

    return {
      base64Audio,
      mimeType: "audio/wav",
      durationSeconds: Math.round(audioBuffer.duration || durationSeconds),
    };
  } catch (err) {
    console.warn("Audio downsampling failed or not supported, using slice/direct:", err);
    // Fallback: If original file is huge (> 10MB), slice the first 8MB to prevent network reset
    let blobToSend: Blob = file;
    if (file.size > 8 * 1024 * 1024) {
      blobToSend = file.slice(0, 8 * 1024 * 1024, file.type || "audio/mp3");
    }
    const base64Audio = await blobToBase64(blobToSend);
    return {
      base64Audio,
      mimeType: file.type || "audio/mp3",
      durationSeconds,
    };
  }
}

/**
 * Standard Blob to Base64 data string (excluding prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
