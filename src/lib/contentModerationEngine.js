import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as nsfwjs from 'nsfwjs';
import * as faceapi from '@vladmandic/face-api';

/**
 * Advanced Content Moderation Engine - Local Only
 * No external APIs, no cloud services
 *
 * Moderation Modes:
 * 1. STRICT: Requires face + NSFW check (Porn + Sexy > 20% = REJECT)
 * 2. POPUP: No face requirement, NSFW check only (Porn + Sexy > 20% = REJECT)
 *
 * For videos: Check every frame, reject if ANY frame fails
 */

let nsfwModel = null;
let faceApiModelsLoaded = false;

// Configuration
const CONFIG = {
  NSFW_COMBINED_THRESHOLD: 0.2, // Porn + Sexy > 20%
  HENTAI_THRESHOLD: 0.15, // Hentai > 15%
  MIN_FACE_CONFIDENCE: 0.3,
  REQUIRED_FACE_COUNT: 1, // At least 1 face required
  VIDEO_FRAME_INTERVAL: 1, // Extract frame every 1 second
  MAX_ANALYSIS_TIME: 30000, // 30 seconds max for analysis
  DEFAULT_MODE: 'popup', // 'strict' or 'popup'
};

/**
 * Load NSFW model
 */
const loadNSFWModel = async () => {
  if (nsfwModel) return nsfwModel;
  try {
    nsfwModel = await nsfwjs.load();
    return nsfwModel;
  } catch (error) {
    console.error('Error loading NSFW model:', error);
    return null;
  }
};

/**
 * Load face-api.js models
 */
const loadFaceApiModels = async () => {
  if (faceApiModelsLoaded) return true;
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    faceApiModelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    return false;
  }
};

/**
 * Convert File to HTMLImageElement
 */
const fileToImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyze NSFW content with detailed breakdown
 * Returns: { isUnsafe, porn, sexy, neutral, safe, combined }
 */
const analyzeNSFWContent = async (image) => {
  try {
    const model = await loadNSFWModel();
    if (!model) {
      return {
        isUnsafe: false,
        porn: 0,
        sexy: 0,
        neutral: 0,
        safe: 1,
        combined: 0,
        error: 'Model failed to load',
      };
    }

    const predictions = await model.classify(image);
    
    const result = {
      porn: 0,
      hentai: 0,
      sexy: 0,
      neutral: 0,
      safe: 0,
    };

    predictions.forEach((pred) => {
      const key = pred.className.toLowerCase();
      if (key in result) {
        result[key] = pred.probability;
      }
    });

    const combined = result.porn + result.sexy;
    const isUnsafe = combined > CONFIG.NSFW_COMBINED_THRESHOLD;

    return {
      ...result,
      combined,
      isUnsafe,
    };
  } catch (error) {
    console.error('NSFW analysis error:', error);
    return {
      porn: 0,
      hentai: 0,
      sexy: 0,
      neutral: 0,
      safe: 1,
      combined: 0,
      isUnsafe: false,
      error: error.message,
    };
  }
};

/**
 * Detect human faces
 * Returns: { hasFaces, faceCount, confidence }
 */
const detectFaces = async (image) => {
  try {
    const detection = await faceapi.detectAllFaces(
      image,
      new faceapi.TinyFaceDetectorOptions({
        scoreThreshold: CONFIG.MIN_FACE_CONFIDENCE,
      })
    );

    const hasFaces = detection.length >= CONFIG.REQUIRED_FACE_COUNT;
    const hasMinFaces = detection.length > 0;

    return {
      hasFaces,
      hasMinFaces,
      faceCount: detection.length,
      detections: detection,
      required: CONFIG.REQUIRED_FACE_COUNT,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      hasFaces: false,
      hasMinFaces: false,
      faceCount: 0,
      detections: [],
      required: CONFIG.REQUIRED_FACE_COUNT,
      error: error.message,
    };
  }
};

/**
 * Validate image
 *
 * Modes:
 * STRICT: ✓ Must NOT have NSFW content (Porn + Sexy <= 20%) + ✓ Must have at least 1 human face
 * POPUP: ✓ Must NOT have NSFW content (Porn + Sexy <= 20%) - No face requirement
 *
 * Returns:
 * {
 *   allowed: boolean,
 *   reason: string,
 *   details: {
 *     nsfw: { porn, sexy, hentai, combined, isUnsafe },
 *     faces: { faceCount, hasFaces },
 *     confidence: { porn: 0.xx, sexy: 0.xx },
 *     mode: 'strict' | 'popup'
 *   }
 * }
 */
export const validateImageModeration = async (file, mode = CONFIG.DEFAULT_MODE) => {
  const startTime = Date.now();

  try {
    // Load NSFW model (required for all modes)
    const nsfwLoaded = await loadNSFWModel();

    if (!nsfwLoaded) {
      return {
        allowed: false,
        reason: 'Content moderation models failed to load',
        details: {
          error: 'Model loading failed',
        },
      };
    }

    // Load face detection only for strict mode
    let faceLoaded = true;
    if (mode === 'strict') {
      faceLoaded = await loadFaceApiModels();
      if (!faceLoaded) {
        return {
          allowed: false,
          reason: 'Content moderation models failed to load',
          details: { error: 'Face detection model loading failed' },
        };
      }
    }

    // Convert to image
    const image = await fileToImage(file);

    // Analyze NSFW content
    const nsfwResult = await analyzeNSFWContent(image);

    // Check timeout
    if (Date.now() - startTime > CONFIG.MAX_ANALYSIS_TIME) {
      return {
        allowed: false,
        reason: 'Analysis timeout - please try again',
        details: { error: 'Analysis took too long' },
      };
    }

    // Rule 1: Check NSFW (Porn + Sexy > 20% = REJECT) - Required for all modes
    if (nsfwResult.isUnsafe) {
      return {
        allowed: false,
        reason: `❌ محتوى غير آمن مكتشف (Porn: ${(nsfwResult.porn * 100).toFixed(1)}%, Sexy: ${(nsfwResult.sexy * 100).toFixed(1)}%)`,
        details: {
          nsfw: nsfwResult,
          mode,
          confidence: {
            porn: nsfwResult.porn,
            sexy: nsfwResult.sexy,
            combined: nsfwResult.combined,
          },
        },
      };
    }

    // For POPUP mode: No face requirement
    if (mode === 'popup') {
      return {
        allowed: true,
        reason: '✅ الصورة آمنة - مرحباً بالصور بدون وجه والمنتجات!',
        details: {
          nsfw: nsfwResult,
          mode,
          confidence: {
            porn: nsfwResult.porn,
            sexy: nsfwResult.sexy,
            combined: nsfwResult.combined,
          },
        },
      };
    }

    // For STRICT mode: Also check for required faces
    if (mode === 'strict') {
      const faceResult = await detectFaces(image);

      // Check timeout again
      if (Date.now() - startTime > CONFIG.MAX_ANALYSIS_TIME) {
        return {
          allowed: false,
          reason: 'Analysis timeout - please try again',
          details: { error: 'Analysis took too long' },
        };
      }

      // Rule 2: Check for required faces
      if (!faceResult.hasFaces) {
        return {
          allowed: false,
          reason: `❌ يجب أن يحتوي الملف على وجه إنساني واحد على الأقل (تم اكتشاف ${faceResult.faceCount} وجه)`,
          details: {
            nsfw: nsfwResult,
            faces: faceResult,
            mode,
          },
        };
      }

      // All checks passed
      return {
        allowed: true,
        reason: '✅ الملف آمن - وجه محتشم بدون محتوى غير آمن',
        details: {
          nsfw: nsfwResult,
          faces: faceResult,
          mode,
          confidence: {
            porn: nsfwResult.porn,
            sexy: nsfwResult.sexy,
            combined: nsfwResult.combined,
          },
        },
      };
    }
  } catch (error) {
    console.error('Image validation error:', error);
    return {
      allowed: false,
      reason: `خطأ في التحليل: ${error.message}`,
      details: { error: error.message },
    };
  }
};

/**
 * Extract frames from video at regular intervals
 * Interval: 1 frame per second
 */
const extractVideoFrames = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const video = document.createElement('video');
      video.src = e.target.result;
      video.crossOrigin = 'anonymous';

      const frames = [];
      let videoDuration = 0;

      video.onloadedmetadata = () => {
        videoDuration = video.duration;
        let currentTime = 0;
        let frameExtracted = 0;

        const extractFrame = () => {
          if (currentTime >= videoDuration) {
            video.pause();
            resolve(frames);
            return;
          }

          video.currentTime = currentTime;
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          const img = new Image();
          img.src = canvas.toDataURL();
          frames.push({
            image: img,
            timestamp: currentTime,
            index: frameExtracted,
          });

          frameExtracted++;
          currentTime += CONFIG.VIDEO_FRAME_INTERVAL;

          // Extract next frame
          if (currentTime < videoDuration) {
            video.currentTime = currentTime;
          } else {
            video.pause();
            resolve(frames);
          }
        };

        video.onerror = () => reject(new Error('Failed to load video'));
        extractFrame();
      };

      video.onerror = () => reject(new Error('Failed to process video'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate video - Check all frames
 * Rejects if ANY frame fails validation
 *
 * Modes:
 * STRICT: Requires NSFW check + face detection for all frames
 * POPUP: Only NSFW check, no face requirement
 */
export const validateVideoModeration = async (file, mode = CONFIG.DEFAULT_MODE) => {
  const startTime = Date.now();

  try {
    // Load NSFW model (required for all modes)
    const nsfwLoaded = await loadNSFWModel();

    if (!nsfwLoaded) {
      return {
        allowed: false,
        reason: 'Content moderation models failed to load',
        details: { error: 'Model loading failed' },
      };
    }

    // Load face detection only for strict mode
    let faceLoaded = true;
    if (mode === 'strict') {
      faceLoaded = await loadFaceApiModels();
      if (!faceLoaded) {
        return {
          allowed: false,
          reason: 'Content moderation models failed to load',
          details: { error: 'Face detection model loading failed' },
        };
      }
    }

    // Extract frames (every 1 second)
    const frames = await extractVideoFrames(file);

    if (frames.length === 0) {
      return {
        allowed: false,
        reason: 'فشل استخراج إطارات من الفيديو',
        details: { error: 'No frames extracted' },
      };
    }

    // Analyze each frame
    const frameResults = [];
    let failedFrames = 0;

    for (const frame of frames) {
      if (Date.now() - startTime > CONFIG.MAX_ANALYSIS_TIME) {
        return {
          allowed: false,
          reason: 'انتهت مهلة التحليل - يرجى المحاولة مرة أخرى',
          details: { error: 'Analysis timeout' },
        };
      }

      const nsfwResult = await analyzeNSFWContent(frame.image);

      // For POPUP mode: Only check NSFW
      if (mode === 'popup') {
        const frameValid = !nsfwResult.isUnsafe;

        frameResults.push({
          frameIndex: frame.index,
          timestamp: frame.timestamp.toFixed(2),
          nsfw: nsfwResult,
          valid: frameValid,
          mode,
        });

        if (!frameValid) {
          failedFrames++;
        }
      } else {
        // For STRICT mode: Check both NSFW and faces
        const faceResult = await detectFaces(frame.image);
        const frameValid = !nsfwResult.isUnsafe && faceResult.hasFaces;

        frameResults.push({
          frameIndex: frame.index,
          timestamp: frame.timestamp.toFixed(2),
          nsfw: nsfwResult,
          faces: faceResult,
          valid: frameValid,
          mode,
        });

        if (!frameValid) {
          failedFrames++;
        }
      }
    }

    // If any frame failed, reject entire video
    if (failedFrames > 0) {
      const failedFramesList = frameResults
        .filter(f => !f.valid)
        .slice(0, 3) // Show first 3 failed frames
        .map(f => `الإطار ${f.frameIndex} (${f.timestamp}s)`)
        .join(', ');

      return {
        allowed: false,
        reason: `❌ الفيديو يحتوي على محتوى غير آمن - فشل ${failedFrames} من ${frames.length} إطار (${failedFramesList})`,
        details: {
          totalFrames: frames.length,
          failedFrames,
          frameResults,
          mode,
        },
      };
    }

    return {
      allowed: true,
      reason: `✅ الفيديو آمن - تم فحص ${frames.length} إطار بنجاح`,
      details: {
        totalFrames: frames.length,
        analysisTimeMs: Date.now() - startTime,
        frameResults,
        mode,
      },
    };
  } catch (error) {
    console.error('Video validation error:', error);
    return {
      allowed: false,
      reason: `خطأ في تحليل الفيديو: ${error.message}`,
      details: { error: error.message },
    };
  }
};

/**
 * Main validation function for any file type
 *
 * @param {File} file - The file to validate
 * @param {string} mode - 'strict' (with face requirement) or 'popup' (NSFW only)
 */
export const validateMediaModeration = async (file, mode = CONFIG.DEFAULT_MODE) => {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return validateImageModeration(file, mode);
  }

  if (isVideo) {
    return validateVideoModeration(file, mode);
  }

  return {
    allowed: false,
    reason: 'نوع ملف غير مدعوم',
    details: { error: `Unsupported file type: ${file.type}` },
  };
};

/**
 * Clean up TensorFlow resources
 */
export const cleanupValidation = () => {
  tf.disposeVariables();
};

export default {
  validateImageModeration,
  validateVideoModeration,
  validateMediaModeration,
  cleanupValidation,
  CONFIG,
};
