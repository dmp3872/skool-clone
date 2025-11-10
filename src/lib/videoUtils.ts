/**
 * Video Embed Utilities
 *
 * Handles conversion of video URLs to embeddable formats
 * Supports: YouTube, Vimeo
 */

export interface VideoEmbed {
  type: 'youtube' | 'vimeo' | 'unknown';
  embedUrl: string;
  originalUrl: string;
}

/**
 * Detects video platform and returns embed information
 */
export function getVideoEmbed(url: string): VideoEmbed | null {
  if (!url) return null;

  // YouTube detection
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return {
      type: 'youtube',
      embedUrl: getYouTubeEmbedUrl(url),
      originalUrl: url,
    };
  }

  // Vimeo detection
  if (url.includes('vimeo.com')) {
    return {
      type: 'vimeo',
      embedUrl: getVimeoEmbedUrl(url),
      originalUrl: url,
    };
  }

  return null;
}

/**
 * Converts YouTube URL to embed format
 */
export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  let videoId = '';

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  }
  // Format: https://www.youtube.com/embed/VIDEO_ID
  else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

/**
 * Converts Vimeo URL to embed format
 */
export function getVimeoEmbedUrl(url: string): string {
  if (!url) return '';

  // If it's already an embed URL, return it
  if (url.includes('player.vimeo.com/video/')) {
    return url;
  }

  let videoId = '';

  // Format: https://vimeo.com/VIDEO_ID
  // Format: https://www.vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    videoId = vimeoMatch[1];
  }

  // Format: https://vimeo.com/channels/staffpicks/VIDEO_ID
  const channelMatch = url.match(/vimeo\.com\/channels\/[^/]+\/(\d+)/);
  if (channelMatch) {
    videoId = channelMatch[1];
  }

  // Format: https://vimeo.com/groups/shortfilms/videos/VIDEO_ID
  const groupMatch = url.match(/vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/);
  if (groupMatch) {
    videoId = groupMatch[1];
  }

  // Format: https://player.vimeo.com/video/VIDEO_ID
  const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (playerMatch) {
    videoId = playerMatch[1];
  }

  if (videoId) {
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
}

/**
 * Validates if a URL is a supported video platform
 */
export function isSupportedVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') ||
         url.includes('youtu.be') ||
         url.includes('vimeo.com');
}

/**
 * Gets platform name from URL
 */
export function getVideoPlatform(url: string): string {
  if (!url) return 'Unknown';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YouTube';
  }
  if (url.includes('vimeo.com')) {
    return 'Vimeo';
  }

  return 'Unknown';
}
