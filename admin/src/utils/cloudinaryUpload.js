import axios from "axios";

export const UPLOAD_TIMEOUT_MS = 90000;
export const MAX_IMAGE_SIZE_BYTES = 5242880;
export const MAX_PDF_SIZE_BYTES = 10485760;
export const MAX_UPLOAD_RETRIES = 3;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_PDF_TYPES = new Set(["application/pdf"]);

const CLOUDINARY_UPLOAD_URL_PATTERN =
  /^https:\/\/api\.cloudinary\.com\/v1_1\/([a-z0-9_-]+)\/image\/upload\/?$/i;

const UPLOAD_PRESET_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const INVALID_ENV_PLACEHOLDERS = new Set([
  "undefined",
  "null",
  "your_upload_preset",
  "your_cloud_name",
  "changeme",
  "replace_me",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEnvValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const isMissingEnvValue = (value) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return true;
  return INVALID_ENV_PLACEHOLDERS.has(normalized.toLowerCase());
};

export const parseCloudNameFromUploadUrl = (uploadUrl) => {
  const normalized = normalizeEnvValue(uploadUrl);
  const match = normalized.match(CLOUDINARY_UPLOAD_URL_PATTERN);
  return match ? match[1] : null;
};

const validateCloudinaryEnv = ({ uploadUrl, uploadPreset, cloudName }) => {
  if (isMissingEnvValue(uploadUrl)) {
    return "VITE_APP_CLOUDINARY_URL is missing or invalid. Rebuild admin after setting .env.";
  }

  if (isMissingEnvValue(uploadPreset)) {
    return "VITE_APP_CLOUDINARY_UPLOAD_PRESET is missing or invalid. Rebuild admin after setting .env.";
  }

  if (isMissingEnvValue(cloudName)) {
    return "VITE_APP_CLOUD_NAME is missing or invalid. Rebuild admin after setting .env.";
  }

  const normalizedUrl = normalizeEnvValue(uploadUrl);
  const normalizedPreset = normalizeEnvValue(uploadPreset);
  const normalizedCloudName = normalizeEnvValue(cloudName);

  const cloudNameFromUrl = parseCloudNameFromUploadUrl(normalizedUrl);
  if (!cloudNameFromUrl) {
    return "VITE_APP_CLOUDINARY_URL must match https://api.cloudinary.com/v1_1/<cloud_name>/image/upload";
  }

  if (cloudNameFromUrl !== normalizedCloudName) {
    return `Cloudinary config mismatch: URL uses "${cloudNameFromUrl}" but VITE_APP_CLOUD_NAME is "${normalizedCloudName}".`;
  }

  if (!UPLOAD_PRESET_PATTERN.test(normalizedPreset)) {
    return "VITE_APP_CLOUDINARY_UPLOAD_PRESET has an invalid format.";
  }

  return null;
};

export const getAdminCloudinaryConfig = () => {
  const uploadUrl = import.meta.env.VITE_APP_CLOUDINARY_URL;
  const uploadPreset = import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_APP_CLOUD_NAME;
  const validationError = validateCloudinaryEnv({
    uploadUrl,
    uploadPreset,
    cloudName,
  });

  if (validationError) {
    return {
      valid: false,
      error: validationError,
    };
  }

  return {
    valid: true,
    uploadUrl: normalizeEnvValue(uploadUrl),
    uploadPreset: normalizeEnvValue(uploadPreset),
    cloudName: normalizeEnvValue(cloudName),
  };
};

export const validateImageFile = (file, maxSizeBytes = MAX_IMAGE_SIZE_BYTES) => {
  if (!file) {
    return "No file selected.";
  }

  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return `Image must be smaller than ${maxMb} MB.`;
  }

  return null;
};

export const generateUniquePublicId = (fileName) => {
  const base =
    (fileName || "image")
      .replace(/\s/g, "")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60) || "image";

  return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const isRetryableCloudinaryError = (error) => {
  if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
    return false;
  }

  const status = error?.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) {
    return true;
  }

  if (error?.code === "ECONNABORTED" || error?.message === "Network Error") {
    return true;
  }

  return !error?.response;
};

const getRetryDelayMs = (error, attempt) => {
  const retryAfter = error?.response?.headers?.["retry-after"];
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }

  return 1000 * 2 ** attempt;
};

export const getCloudinaryErrorMessage = (error) => {
  const cloudinaryMessage = error?.response?.data?.error?.message;
  if (cloudinaryMessage) {
    return cloudinaryMessage;
  }

  if (error?.code === "ECONNABORTED") {
    return "Upload timed out. Please check your connection and try again.";
  }

  if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
    return "Upload was cancelled.";
  }

  if (error?.message === "Network Error") {
    return "Network error during upload. Please try again.";
  }

  return error?.message || "Image upload failed. Please try again.";
};

const postToCloudinary = async ({
  file,
  folder,
  config,
  onProgress,
  signal,
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("cloud_name", config.cloudName);
  formData.append("public_id", generateUniquePublicId(file.name));

  if (folder) {
    formData.append("folder", folder);
  }

  const response = await axios.post(config.uploadUrl, formData, {
    timeout: UPLOAD_TIMEOUT_MS,
    signal,
    onUploadProgress: (progressEvent) => {
      if (!onProgress || !progressEvent.total) return;
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percent);
    },
  });

  const secureUrl = response?.data?.secure_url;
  if (!secureUrl) {
    throw new Error("Cloudinary did not return a valid image URL.");
  }

  if (!secureUrl.includes(`res.cloudinary.com/${config.cloudName}/`)) {
    throw new Error("Cloudinary response cloud name does not match configuration.");
  }

  return secureUrl;
};

export const uploadToCloudinary = async ({
  file,
  folder,
  config,
  onProgress,
  signal,
}) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
    try {
      return await postToCloudinary({
        file,
        folder,
        config,
        onProgress,
        signal,
      });
    } catch (error) {
      lastError = error;

      if (
        signal?.aborted ||
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED"
      ) {
        throw error;
      }

      if (!isRetryableCloudinaryError(error) || attempt === MAX_UPLOAD_RETRIES) {
        throw error;
      }

      await sleep(getRetryDelayMs(error, attempt));
    }
  }

  throw lastError;
};

export const validatePdfFile = (file, maxSizeBytes = MAX_PDF_SIZE_BYTES) => {
  if (!file) {
    return "No file selected.";
  }

  const type = (file.type || "").toLowerCase();
  const isPdf =
    ALLOWED_PDF_TYPES.has(type) ||
    String(file.name || "").toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Only PDF files are allowed.";
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return `PDF must be smaller than ${maxMb} MB.`;
  }

  return null;
};

/** Prefer raw; fall back to auto (unsigned presets often only allow image/auto). */
export const getPdfUploadUrls = (imageUploadUrl) => {
  const base = normalizeEnvValue(imageUploadUrl);
  return [
    base.replace("/image/upload", "/raw/upload"),
    base.replace("/image/upload", "/auto/upload"),
  ].filter((url, i, arr) => url && arr.indexOf(url) === i);
};

export const getRawUploadUrl = (imageUploadUrl) =>
  getPdfUploadUrls(imageUploadUrl)[0];

export const uploadPdfToCloudinary = async ({
  file,
  folder = "datasheets",
  config,
  onProgress,
  signal,
}) => {
  const uploadUrls = getPdfUploadUrls(config.uploadUrl);
  let lastError;

  for (const uploadUrl of uploadUrls) {
    const pdfConfig = { ...config, uploadUrl };

    for (let attempt = 0; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
      try {
        return await postToCloudinary({
          file,
          folder,
          config: pdfConfig,
          onProgress,
          signal,
        });
      } catch (error) {
        lastError = error;

        if (
          signal?.aborted ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          throw error;
        }

        if (!isRetryableCloudinaryError(error)) {
          break;
        }

        if (attempt < MAX_UPLOAD_RETRIES) {
          await sleep(getRetryDelayMs(error, attempt));
        }
      }
    }
  }

  throw lastError || new Error("PDF upload failed.");
};
