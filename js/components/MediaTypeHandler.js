/**
 * MediaTypeHandler component for detecting and handling different media formats
 * Supports Twitter, news articles, and extensible media type detection
 */
class MediaTypeHandler {
  // Media type constants for consistency
  static MEDIA_TYPES = {
    TWITTER: 'twitter', // Covers both Twitter and X
    NEWS: 'news',
    YOUTUBE: 'youtube',
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
    UNKNOWN: 'unknown'
  };

  /**
   * Detect media type from URL patterns
   * @param {string} url - The media URL to analyze
   * @returns {string} Media type constant
   */
  static detectMediaType(url) {
    if (!url || typeof url !== 'string') {
      return this.MEDIA_TYPES.UNKNOWN;
    }

    // Normalize URL for consistent pattern matching
    const normalizedUrl = url.toLowerCase().trim();

    // Twitter detection (including x.com)
    if (this.isTwitterLink(normalizedUrl)) {
      return this.MEDIA_TYPES.TWITTER;
    }

    // YouTube detection
    if (this.isYouTubeLink(normalizedUrl)) {
      return this.MEDIA_TYPES.YOUTUBE;
    }

    // Facebook detection
    if (this.isFacebookLink(normalizedUrl)) {
      return this.MEDIA_TYPES.FACEBOOK;
    }

    // Instagram detection
    if (this.isInstagramLink(normalizedUrl)) {
      return this.MEDIA_TYPES.INSTAGRAM;
    }

    // News article detection (default for HTTP/HTTPS links)
    if (this.isNewsArticle(normalizedUrl)) {
      return this.MEDIA_TYPES.NEWS;
    }

    return this.MEDIA_TYPES.UNKNOWN;
  }

  /**
   * Check if URL is a Twitter/X link
   * @param {string} url - URL to check
   * @returns {boolean} True if Twitter or X link
   */
  static isTwitterLink(url) {
    if (!url) return false;

    const twitterPatterns = [
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//,
      /^https?:\/\/mobile\.(twitter\.com|x\.com)\//,
      /^https?:\/\/t\.co\//  // Twitter/X shortened URLs
    ];

    return twitterPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if URL is a news article
   * @param {string} url - URL to check
   * @returns {boolean} True if news article
   */
  static isNewsArticle(url) {
    if (!url) return false;

    // Must be HTTP/HTTPS link
    if (!/^https?:\/\//.test(url)) {
      return false;
    }

    // Exclude social media platforms
    const socialMediaPatterns = [
      /twitter\.com|x\.com/,
      /facebook\.com|fb\.com/,
      /instagram\.com/,
      /youtube\.com|youtu\.be/,
      /linkedin\.com/,
      /tiktok\.com/,
      /snapchat\.com/
    ];

    const isSocialMedia = socialMediaPatterns.some(pattern => pattern.test(url));

    // If it's not social media and is HTTP/HTTPS, consider it a news article
    return !isSocialMedia;
  }

  /**
   * Check if URL is a YouTube link
   * @param {string} url - URL to check
   * @returns {boolean} True if YouTube link
   */
  static isYouTubeLink(url) {
    if (!url) return false;

    const youtubePatterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//,
      /^https?:\/\/m\.youtube\.com\//
    ];

    return youtubePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if URL is a Facebook link
   * @param {string} url - URL to check
   * @returns {boolean} True if Facebook link
   */
  static isFacebookLink(url) {
    if (!url) return false;

    const facebookPatterns = [
      /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\//,
      /^https?:\/\/m\.facebook\.com\//
    ];

    return facebookPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if URL is an Instagram link
   * @param {string} url - URL to check
   * @returns {boolean} True if Instagram link
   */
  static isInstagramLink(url) {
    if (!url) return false;

    const instagramPatterns = [
      /^https?:\/\/(www\.)?instagram\.com\//
    ];

    return instagramPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Format media card with media-type-specific styling
   * @param {Object} mediaEvent - Media event data
   * @param {string} mediaType - Media type constant
   * @returns {string} HTML content for timeline card
   */
  static formatMediaCard(mediaEvent, mediaType) {
    if (!mediaEvent) {
      return '<div class="media-card error">Invalid media event</div>';
    }

    // Auto-detect media type if not provided
    if (!mediaType && mediaEvent.news_link) {
      mediaType = this.detectMediaType(mediaEvent.news_link);
    }

    // Handle missing or incomplete data gracefully
    const headline = mediaEvent.headline || t('noHeadlineAvailable');
    const description = mediaEvent.description || '';
    const author = mediaEvent.author || '';
    const date = mediaEvent.date_announced || '';
    const link = mediaEvent.news_link || '';

    // Format description with truncation for long text
    const truncatedDescription = description.length > 150
      ? description.substring(0, 150) + '...'
      : description;

    // Build card HTML with media-specific styling
    let cardHTML;

    if (mediaType === this.MEDIA_TYPES.TWITTER) {
      // Twitter cards: simple format with tweet content and author info
      const twitterHandle = author ? `@${author}` : t('tweet');
      cardHTML = `
        <div>
          <div>
            <strong>${twitterHandle}</strong>
          </div>
          <div>
            <em>${date || t('noDate')}</em>
          </div>
          <div>
            ${truncatedDescription}
          </div>
          <div>
            <a href="${link}" target="_blank" title="${link}">${this.getMediaEmoji(mediaType)}</a>
          </div>
        </div>
      `;
    } else {
      // News and other media: simple format like DataFetcher used
      cardHTML = `
        <div>
          <div>
            <strong>${headline}</strong>
          </div>
          <div>
            <em>${date || t('noDate')}</em>
          </div>
          <div>
            ${truncatedDescription}
          </div>
          <div>
            <a href="${link}" target="_blank" title="${link}">${this.getMediaEmoji(mediaType)}</a>
          </div>
        </div>
      `;
    }

    return cardHTML;
  }

  /**
   * Get media type emoji (just the emoji character)
   * @param {string} mediaType - Media type constant
   * @returns {string} Emoji character
   */
  static getMediaEmoji(mediaType) {
    const iconMap = {
      [this.MEDIA_TYPES.TWITTER]: '🐦',
      [this.MEDIA_TYPES.NEWS]: '📰',
      [this.MEDIA_TYPES.YOUTUBE]: '📺',
      [this.MEDIA_TYPES.FACEBOOK]: '📘',
      [this.MEDIA_TYPES.INSTAGRAM]: '📷',
      [this.MEDIA_TYPES.UNKNOWN]: '🔗'
    };

    return iconMap[mediaType] || iconMap[this.MEDIA_TYPES.UNKNOWN];
  }

  /**
   * Create media type icon (HTML wrapped emoji)
   * @param {string} mediaType - Media type constant
   * @returns {string} HTML for media icon
   */
  static createMediaIcon(mediaType) {
    const emoji = this.getMediaEmoji(mediaType);
    return `<span class="media-icon media-icon-${mediaType}" title="${this.getMediaTypeLabel(mediaType)}">${emoji}</span>`;
  }

  /**
   * Get human-readable label for media type
   * @param {string} mediaType - Media type constant
   * @returns {string} Human-readable label
   */
  static getMediaTypeLabel(mediaType) {
    const labelMap = {
      [this.MEDIA_TYPES.TWITTER]: t('twitter'),
      [this.MEDIA_TYPES.NEWS]: t('newsArticle'),
      [this.MEDIA_TYPES.YOUTUBE]: t('youtube'),
      [this.MEDIA_TYPES.FACEBOOK]: t('facebook'),
      [this.MEDIA_TYPES.INSTAGRAM]: t('instagram'),
      [this.MEDIA_TYPES.UNKNOWN]: t('link')
    };

    return labelMap[mediaType] || t('unknown');
  }

  /**
   * Get CSS class name for media type styling
   * @param {string} mediaType - Media type constant
   * @returns {string} CSS class name
   */
  static getMediaTypeClass(mediaType) {
    return `media-${mediaType}`;
  }

  /**
   * Validate media event data structure
   * @param {Object} mediaEvent - Media event to validate
   * @returns {boolean} True if valid
   */
  static isValidMediaEvent(mediaEvent) {
    return mediaEvent &&
      typeof mediaEvent === 'object' &&
      (mediaEvent.headline || mediaEvent.description || mediaEvent.news_link);
  }
}