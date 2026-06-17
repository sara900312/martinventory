// Utility functions for handling various video URL formats

export const getYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getVimeoId = (url) => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

export const isDirectVideo = (url) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

export const isPixabayVideo = (url) => {
  return url.includes('pixabay.com/videos/') || url.includes('cdn.pixabay.com');
};

export const parseVideoUrl = (url) => {
  if (!url) return { type: 'unknown' };

  // YouTube
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`,
    };
  }

  // Pixabay
  if (isPixabayVideo(url)) {
    return {
      type: 'pixabay',
      embedUrl: url,
    };
  }

  // Direct video file
  if (isDirectVideo(url)) {
    return {
      type: 'direct',
      embedUrl: url,
    };
  }

  // Unknown - treat as direct video attempt
  return {
    type: 'direct',
    embedUrl: url,
  };
};

export const isVideoUrl = (url) => {
  if (!url) return false;
  const info = parseVideoUrl(url);
  return info.type !== 'unknown';
};
