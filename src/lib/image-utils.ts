// Image URL validation and conversion utilities

/**
 * Converts various image hosting URLs to direct image URLs
 */
export const convertToDirectImageUrl = (url: string): string => {
  if (!url) return url;

  // ImgBB URLs - convert page URLs to direct image URLs
  if (url.includes('ibb.co/')) {
    // Extract image ID from URLs like https://ibb.co/xWHSwt8
    const match = url.match(/ibb\.co\/([a-zA-Z0-9]+)/);
    if (match) {
      const imageId = match[1];
      // Convert to direct image URL format
      return `https://i.ibb.co/${imageId}.jpg`;
    }
  }

  // Google Drive URLs - convert to direct download links
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // Dropbox URLs - convert to direct links
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return url.replace('dl=0', 'raw=1');
  }

  // GitHub URLs - convert to raw URLs
  if (url.includes('github.com') && url.includes('/blob/')) {
    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // Return as-is if already a direct URL or unknown format
  return url;
};

/**
 * Validates if a URL is likely to be a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;

  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  if (imageExtensions.test(url)) {
    return true;
  }

  // Check for known image hosting domains
  const imageHosts = [
    'i.ibb.co',
    'imgur.com',
    'i.imgur.com',
    'cloudinary.com',
    'unsplash.com',
    'images.unsplash.com',
    'pixabay.com',
    'pexels.com',
    'raw.githubusercontent.com'
  ];

  return imageHosts.some(host => url.includes(host));
};

/**
 * Gets the suggested direct URL with helpful message
 */
export const getSuggestedImageUrl = (url: string): { url: string; message?: string } => {
  const directUrl = convertToDirectImageUrl(url);
  
  if (directUrl !== url) {
    return {
      url: directUrl,
      message: `Converted to direct image URL. Original: ${url.substring(0, 50)}...`
    };
  }

  if (!isValidImageUrl(url)) {
    return {
      url: url,
      message: `This URL might not be a direct image link. For best results, use direct image URLs ending in .jpg, .png, etc.`
    };
  }

  return { url: directUrl };
};

/**
 * Common image hosting platforms and their URL formats
 */
export const IMAGE_URL_EXAMPLES = {
  'ImgBB': {
    wrong: 'https://ibb.co/xWHSwt8',
    correct: 'https://i.ibb.co/xWHSwt8.jpg',
    tip: 'Right-click on the image and select "Copy image address"'
  },
  'Imgur': {
    wrong: 'https://imgur.com/a/xyz123',
    correct: 'https://i.imgur.com/xyz123.jpg',
    tip: 'Use the direct link by adding "i." before imgur.com'
  },
  'Google Drive': {
    wrong: 'https://drive.google.com/file/d/xyz/view',
    correct: 'https://drive.google.com/uc?export=view&id=xyz',
    tip: 'Make sure the file is publicly accessible'
  }
};
