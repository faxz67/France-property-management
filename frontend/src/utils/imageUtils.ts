/**
 * Image URL normalization utility
 * Centralized logic for handling image URLs across the application
 */

/**
 * Get backend base URL from environment
 * @returns {string} Backend base URL without /api suffix
 */
export const getBackendBaseUrl = (): string => {
  // Get from environment or use default
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4002/api';
  return apiBaseUrl.replace('/api', '');
};

/**
 * Normalize photo URL to ensure proper display
 * Handles various URL formats and prevents double /uploads paths
 * @param {string} url - The photo URL from the database
 * @returns {string} Normalized URL for display
 */
export const normalizePhotoUrl = (url: string): string => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    console.warn('⚠️ Empty or invalid URL provided to normalizePhotoUrl:', url);
    return '';
  }
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  // If it's already a full URL, return as is (most common case)
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Get backend base URL
  const backendBaseUrl = getBackendBaseUrl();
  
  // If it starts with /uploads, prefix with backend base URL
  if (trimmedUrl.startsWith('/uploads')) {
    return `${backendBaseUrl}${trimmedUrl}`;
  }
  
  // If it starts with uploads/ (no leading slash), add leading slash
  if (trimmedUrl.startsWith('uploads/')) {
    return `${backendBaseUrl}/${trimmedUrl}`;
  }
  
  // If it's a relative path without /uploads, add it
  const cleanPath = trimmedUrl.startsWith('/') ? trimmedUrl.substring(1) : trimmedUrl;
  return `${backendBaseUrl}/uploads/${cleanPath}`;
};

/**
 * Check if an image URL is valid
 * @param {string} url - The image URL to validate
 * @returns {boolean} True if the URL appears to be valid
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    // If URL constructor fails, check if it's a relative path
    return url.startsWith('/uploads') || url.startsWith('uploads/');
  }
};

/**
 * Get image fallback URL
 * @returns {string} Fallback image URL
 */
export const getImageFallbackUrl = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
};

/**
 * Handle image load error
 * @param {HTMLImageElement} img - The image element that failed to load
 * @param {string} fallbackUrl - Optional fallback URL
 */
export const handleImageError = (img: HTMLImageElement, fallbackUrl?: string): void => {
  console.warn('🖼️ Image failed to load:', img.src);
  img.src = fallbackUrl || getImageFallbackUrl();
  img.alt = 'Image non disponible';
};

/**
 * Preload image to check if it's accessible
 * @param {string} url - The image URL to preload
 * @returns {Promise<boolean>} True if image loads successfully
 */
export const preloadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};
