import * as faceapi from '@vladmandic/face-api';
import * as nsfw from 'nsfwjs';

let nsfwModel = null;
let modelsLoaded = false;

/**
 * Load NSFW model with Vite-compatible import
 * This is the primary way to load the model for React + Vite
 */
export const loadNSFWModel = async () => {
  if (!nsfwModel) {
    nsfwModel = await nsfw.load();
  }
  return nsfwModel;
};

/**
 * Initialize face-api models
 */
export const initializeFaceApiModels = async () => {
  if (modelsLoaded) return true;

  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
    await faceapi.nets.faceExpressionNet.load(MODEL_URL);

    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    return false;
  }
};

/**
 * Initialize NSFW model
 */
export const initializeNsfwModel = async () => {
  if (nsfwModel) return nsfwModel;

  try {
    nsfwModel = await nsfw.load();
    return nsfwModel;
  } catch (error) {
    console.error('Error loading NSFW model:', error);
    return null;
  }
};

/**
 * Detect human faces in image
 * @param {HTMLImageElement | Blob | string} input - Image element, blob, or data URL
 * @returns {Promise<{hasFace: boolean, detections: Array}>}
 */
export const detectFaces = async (input) => {
  try {
    if (!modelsLoaded) {
      const initialized = await initializeFaceApiModels();
      if (!initialized) {
        throw new Error('Failed to initialize face detection models');
      }
    }

    let img;
    if (typeof input === 'string') {
      img = new Image();
      img.src = input;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } else if (input instanceof Blob) {
      const url = URL.createObjectURL(input);
      img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } else {
      img = input;
    }

    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    return {
      hasFace: detections.length > 0,
      detections: detections,
      count: detections.length,
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      hasFace: false,
      detections: [],
      count: 0,
      error: error.message,
    };
  }
};

/**
 * Classify image for NSFW content
 * @param {HTMLImageElement | Blob | string} input - Image element, blob, or data URL
 * @param {number} threshold - Confidence threshold (0-1), default 0.4
 * @returns {Promise<{isNsfw: boolean, scores: Object}>}
 */
export const classifyNsfw = async (input, threshold = 0.4) => {
  try {
    const model = await loadNSFWModel();
    if (!model) {
      throw new Error('Failed to initialize NSFW model');
    }

    let img;
    if (typeof input === 'string') {
      img = new Image();
      img.src = input;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } else if (input instanceof Blob) {
      const url = URL.createObjectURL(input);
      img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    } else {
      img = input;
    }

    const predictions = await model.classify(img);

    const scores = {
      Normal: 0,
      Porn: 0,
      Hentai: 0,
      Sexy: 0,
    };

    predictions.forEach((pred) => {
      if (scores.hasOwnProperty(pred.className)) {
        scores[pred.className] = pred.probability;
      }
    });

    const isNsfw =
      scores.Porn > threshold ||
      scores.Hentai > threshold ||
      scores.Sexy > threshold;

    return {
      isNsfw,
      scores,
      predictions,
    };
  } catch (error) {
    console.error('Error classifying NSFW:', error);
    return {
      isNsfw: false,
      scores: { Normal: 1, Porn: 0, Hentai: 0, Sexy: 0 },
      error: error.message,
    };
  }
};

/**
 * Comprehensive image validation
 * @param {File | Blob | string} input - Image file, blob, or data URL
 * @returns {Promise<{valid: boolean, rejected: boolean, reasons: Array}>}
 */
export const validateImage = async (input) => {
  const reasons = [];

  try {
    let imgForDisplay;
    if (input instanceof File || input instanceof Blob) {
      imgForDisplay = URL.createObjectURL(input);
    } else if (typeof input === 'string') {
      imgForDisplay = input;
    } else {
      throw new Error('Invalid input type');
    }

    // Check for faces
    const faceResult = await detectFaces(imgForDisplay);
    if (faceResult.hasFace) {
      reasons.push({
        type: 'face_detected',
        message: `Face detected (count: ${faceResult.count})`,
      });
    }

    // Check for NSFW content
    const nsfwResult = await classifyNsfw(imgForDisplay, 0.4);
    if (nsfwResult.isNsfw) {
      const nsfwReasons = [];
      if (nsfwResult.scores.Porn > 0.4)
        nsfwReasons.push(`Porn: ${(nsfwResult.scores.Porn * 100).toFixed(1)}%`);
      if (nsfwResult.scores.Hentai > 0.4)
        nsfwReasons.push(`Hentai: ${(nsfwResult.scores.Hentai * 100).toFixed(1)}%`);
      if (nsfwResult.scores.Sexy > 0.4)
        nsfwReasons.push(`Sexy: ${(nsfwResult.scores.Sexy * 100).toFixed(1)}%`);

      reasons.push({
        type: 'nsfw_detected',
        message: `NSFW detected: ${nsfwReasons.join(', ')}`,
      });
    }

    const valid = reasons.length === 0;

    return {
      valid,
      rejected: !valid,
      reasons,
      faceDetection: faceResult,
      nsfwClassification: nsfwResult,
    };
  } catch (error) {
    console.error('Error validating image:', error);
    return {
      valid: false,
      rejected: true,
      reasons: [
        {
          type: 'validation_error',
          message: `Validation error: ${error.message}`,
        },
      ],
    };
  }
};

/**
 * Normalize string for image-to-product name matching
 * Rules:
 * - Remove file extension if requested
 * - Replace underscores (_) with spaces
 * - Replace special characters (+, &, -, /, etc.) with spaces
 * - Replace multiple spaces with single space
 * - Ignore case sensitivity (convert to lowercase)
 * - Trim leading and trailing whitespace
 * - Supports both Latin and non-Latin characters (Arabic, etc.)
 *
 * @param {string} str - String to normalize
 * @param {boolean} removeExtension - Whether to remove file extension (default: false)
 * @returns {string} Normalized string
 */
const normalizeString = (str, removeExtension = false) => {
  if (!str) return '';

  let normalized = str;

  // Remove file extension if requested
  if (removeExtension) {
    normalized = normalized.replace(/\.[^/.]+$/, '');
  }

  // Replace underscores with spaces
  normalized = normalized.replace(/_/g, ' ');

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Replace specific special characters with spaces: +, &, -, /
  // Then remove remaining punctuation and symbols while preserving letters and digits
  // First pass: replace specified special characters with space
  normalized = normalized.replace(/[\+\&\-\/]/g, ' ');

  // Second pass: remove other punctuation/symbols but keep Unicode letters, digits, and spaces
  // This regex keeps: \p{L} (any letter), \p{N} (any digit), \s (spaces)
  // and removes everything else that isn't alphanumeric
  // For better compatibility, we use a simpler approach:
  // Remove common punctuation and symbols, but this may need updating for other symbols
  normalized = normalized.replace(/[^\w\s\u0600-\u06FF]/g, ' ');

  // Collapse multiple spaces into single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Trim leading and trailing whitespace
  normalized = normalized.trim();

  return normalized;
};

/**
 * Normalize filename for matching
 * @param {string} filename - Filename with or without extension
 * @returns {string} Normalized filename
 */
export const normalizeFilename = (filename) => {
  return normalizeString(filename, true); // Remove extension for filenames
};

/**
 * Normalize product name for matching
 * @param {string} name - Product name
 * @returns {string} Normalized name
 */
export const normalizeProductName = (name) => {
  return normalizeString(name, false); // Keep full name without removing extension
};

/**
 * Match filename to product using normalized names
 * Handles matching even when filenames have different special characters or underscores
 *
 * Example:
 * - Image filename: "Parachute_Advansed_Onion_Enriched_Coconut_Hair_Oil.webp"
 *   Normalizes to: "parachute advansed onion enriched coconut hair oil"
 * - Product name: "Parachute Advansed Onion Enriched Coconut Hair Oil"
 *   Normalizes to: "parachute advansed onion enriched coconut hair oil"
 * Result: MATCH
 *
 * @param {string} filename - Filename to match
 * @param {Array} products - List of products with name property
 * @returns {Object | null} Matched product or null
 */
export const matchFilenameToProduct = (filename, products) => {
  const normalizedFilename = normalizeFilename(filename);

  if (!normalizedFilename) return null;

  for (const product of products) {
    const normalizedName = normalizeProductName(product.name || product.name_en || '');

    if (normalizedName && normalizedFilename === normalizedName) {
      return product;
    }
  }

  return null;
};
