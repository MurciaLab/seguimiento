/**
 * CardRenderer component for generating rich timeline content
 * Handles creation of timeline cards with headlines, descriptions, and media links
 */
class CardRenderer {
  constructor() {
    // Static class - no instance needed
  }

  /**
   * Create a rich HTML card for news events in the timeline
   * Requirements: 3.2, 3.3 - Display detailed information with clickable links
   * Requirements: 3.4 - Handle incomplete media event data gracefully
   * @param {Object} newsEvent - Media event data from project sheet
   * @returns {string} Rich HTML content for timeline card
   */
  static createNewsCard(newsEvent) {
    // Handle completely invalid or missing event data
    if (!newsEvent || typeof newsEvent !== 'object') {
      return this.createFallbackCard('Invalid event data', 'Unable to display this media event due to invalid data format.');
    }

    // Validate and extract event data with comprehensive fallbacks
    const processedEvent = this.processIncompleteEventData(newsEvent);
    
    // If no meaningful content can be extracted, create a minimal fallback card
    if (!processedEvent.hasMinimalContent) {
      return this.createFallbackCard(
        'Incomplete Media Event', 
        'This media event has insufficient information to display properly.',
        processedEvent.date,
        processedEvent.party
      );
    }

    // Format the card content with processed data
    const cardContent = this.formatCardContent(processedEvent);

    return cardContent;
  }

  /**
   * Process incomplete event data and provide fallbacks
   * Requirements: 3.4 - Graceful handling of missing information
   * @param {Object} newsEvent - Raw event data
   * @returns {Object} Processed event data with fallbacks
   */
  static processIncompleteEventData(newsEvent) {
    // Extract raw data with null checks
    const rawHeadline = newsEvent.headline;
    const rawDescription = newsEvent.description;
    const rawLink = newsEvent.news_link;
    const rawParty = newsEvent.party;
    const rawDate = newsEvent.date_announced;

    // Process each field with appropriate fallbacks
    const headline = this.processHeadline(rawHeadline, rawLink);
    const description = this.processDescription(rawDescription, rawHeadline);
    const link = this.processLink(rawLink);
    const party = this.processParty(rawParty);
    const date = this.processDate(rawDate);

    // Detect media type from available link
    const mediaType = link && MediaTypeHandler ? 
      MediaTypeHandler.detectMediaType(link) : 'unknown';

    // Determine if we have enough content to create a meaningful card
    const hasMinimalContent = this.hasMinimalContent(headline, description, link);

    return {
      headline,
      description,
      link,
      party,
      date,
      mediaType,
      hasMinimalContent,
      isIncomplete: this.isIncompleteEvent(newsEvent)
    };
  }

  /**
   * Process headline with fallbacks
   * @param {string} headline - Raw headline
   * @param {string} link - Media link for fallback
   * @returns {string} Processed headline
   */
  static processHeadline(headline, link) {
    // Use provided headline if available and valid
    if (headline && typeof headline === 'string' && headline.trim().length > 0) {
      return headline.trim();
    }

    // Try to generate headline from link domain
    if (link && typeof link === 'string') {
      try {
        const url = new URL(link);
        const domain = url.hostname.replace('www.', '');
        return `Media from ${domain}`;
      } catch (e) {
        // Invalid URL, continue to default fallback
      }
    }

    // Default fallback
    return t('mediaEvent');
  }

  /**
   * Process description with fallbacks
   * @param {string} description - Raw description
   * @param {string} headline - Headline for context
   * @returns {string} Processed description
   */
  static processDescription(description, headline) {
    // Use provided description if available and valid
    if (description && typeof description === 'string' && description.trim().length > 0) {
      return description.trim();
    }

    // If no description but we have a meaningful headline, indicate missing description
    if (headline && headline !== t('mediaEvent') && headline !== t('noHeadlineAvailable')) {
      return t('noDescriptionAvailable');
    }

    // Return empty string for completely missing content
    return '';
  }

  /**
   * Process link with validation
   * @param {string} link - Raw link
   * @returns {string} Processed link or empty string
   */
  static processLink(link) {
    if (!link || typeof link !== 'string') {
      return '';
    }

    const trimmedLink = link.trim();
    
    // Basic URL validation
    if (trimmedLink.length === 0) {
      return '';
    }

    // Check if it looks like a URL
    if (trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')) {
      return trimmedLink;
    }

    // If it doesn't start with protocol but looks like a domain, add https
    if (trimmedLink.includes('.') && !trimmedLink.includes(' ')) {
      return `https://${trimmedLink}`;
    }

    // Invalid link format
    return '';
  }

  /**
   * Process party name with validation
   * @param {string} party - Raw party name
   * @returns {string} Processed party name
   */
  static processParty(party) {
    if (!party || typeof party !== 'string') {
      return '';
    }

    const trimmedParty = party.trim();
    return trimmedParty.length > 0 ? trimmedParty : '';
  }

  /**
   * Process date with validation
   * @param {string} date - Raw date
   * @returns {string} Processed date
   */
  static processDate(date) {
    if (!date || typeof date !== 'string') {
      return '';
    }

    const trimmedDate = date.trim();
    return trimmedDate.length > 0 ? trimmedDate : '';
  }

  /**
   * Check if event has minimal content for display
   * @param {string} headline - Processed headline
   * @param {string} description - Processed description
   * @param {string} link - Processed link
   * @returns {boolean} True if has minimal content
   */
  static hasMinimalContent(headline, description, link) {
    // Must have at least a meaningful headline or description or a valid link
    const hasHeadline = headline && headline !== t('mediaEvent');
    const hasDescription = description && description.length > 0;
    const hasLink = link && link.length > 0;

    return hasHeadline || hasDescription || hasLink;
  }

  /**
   * Check if event data is incomplete
   * @param {Object} newsEvent - Original event data
   * @returns {boolean} True if incomplete
   */
  static isIncompleteEvent(newsEvent) {
    const requiredFields = ['headline', 'description', 'news_link', 'date_announced'];
    const missingFields = requiredFields.filter(field => 
      !newsEvent[field] || 
      (typeof newsEvent[field] === 'string' && newsEvent[field].trim().length === 0)
    );

    return missingFields.length > 0;
  }

  /**
   * Create fallback card for events with insufficient data
   * Requirements: 3.4 - Ensure cards display properly with partial information
   * @param {string} title - Fallback title
   * @param {string} message - Fallback message
   * @param {string} date - Optional date
   * @param {string} party - Optional party
   * @returns {string} Fallback card HTML
   */
  static createFallbackCard(title, message, date = '', party = '') {
    const formattedDate = date ? this.formatDate(date) : '';
    const partyBadgeHTML = party ? this.createPartyBadgeHTML(party) : '';

    return `
      <div class="timeline-card media-card incomplete-event">
        <div class="card-header">
          <div class="media-info">
            <span class="media-icon">⚠️</span>
            <span class="media-type">${t('incompleteEvent')}</span>
            ${formattedDate ? `<span class="card-date">${formattedDate}</span>` : ''}
          </div>
          ${partyBadgeHTML}
        </div>
        
        <div class="card-content">
          <h4 class="card-headline incomplete">${title}</h4>
          <p class="card-description incomplete">${message}</p>
        </div>
        
        <div class="card-footer incomplete">
          <span class="incomplete-notice">${t('incompleteNotice')}</span>
        </div>
      </div>
    `;
  }

  /**
   * Format card content with proper HTML structure
   * Requirements: 3.2 - Show headlines, publication dates, descriptions, and party attribution
   * @param {Object} eventData - Processed event data
   * @returns {string} Formatted HTML card content
   */
  static formatCardContent(eventData) {
    const {
      headline,
      description,
      link,
      party,
      date,
      mediaType = 'unknown'
    } = eventData;

    // Create media type icon and label
    const mediaIcon = MediaTypeHandler ? MediaTypeHandler.createMediaIcon(mediaType) : '🔗';
    const mediaLabel = MediaTypeHandler ? MediaTypeHandler.getMediaTypeLabel(mediaType) : 'Link';
    
    // Create party badge if party information is available
    const partyBadgeHTML = party ? this.createPartyBadgeHTML(party) : '';
    
    // Format description with smart truncation
    const formattedDescription = this.formatDescription(description);
    
    // Format date for display
    const formattedDate = this.formatDate(date);

    // Build the complete card HTML
    const cardHTML = `
      <div class="timeline-card media-card media-${mediaType}">
        <div class="card-header">
          <div class="media-info">
            ${mediaIcon}
            <span class="media-type">${mediaLabel}</span>
            ${formattedDate ? `<span class="card-date">${formattedDate}</span>` : ''}
          </div>
          ${partyBadgeHTML}
        </div>
        
        <div class="card-content">
          <h4 class="card-headline">
            ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="card-link">${headline}</a>` : headline}
          </h4>
          ${formattedDescription ? `<p class="card-description">${formattedDescription}</p>` : ''}
        </div>
        
        ${link ? `<div class="card-footer">
          <a href="${link}" target="_blank" rel="noopener noreferrer" class="external-link">
            ${t('readFull')} ${mediaLabel.toLowerCase()} →
          </a>
        </div>` : ''}
      </div>
    `;

    return cardHTML;
  }

  /**
   * Format description text with smart truncation and line breaks
   * @param {string} description - Raw description text
   * @returns {string} Formatted description HTML
   */
  static formatDescription(description) {
    if (!description || typeof description !== 'string') {
      return '';
    }

    // Clean up the description
    const cleanDescription = description.trim();
    
    if (cleanDescription.length === 0) {
      return '';
    }

    // Smart truncation for very long descriptions
    const maxLength = 200;
    let truncatedDescription = cleanDescription;
    
    if (cleanDescription.length > maxLength) {
      // Find the last complete sentence or word within the limit
      const truncateAt = cleanDescription.lastIndexOf('.', maxLength);
      if (truncateAt > maxLength * 0.7) {
        // If we found a sentence end reasonably close to the limit, use it
        truncatedDescription = cleanDescription.substring(0, truncateAt + 1);
      } else {
        // Otherwise, truncate at word boundary
        const lastSpace = cleanDescription.lastIndexOf(' ', maxLength);
        truncatedDescription = cleanDescription.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
      }
    }

    // Convert line breaks to HTML and escape HTML entities
    return this.escapeHtml(truncatedDescription).replace(/\n/g, '<br>');
  }

  /**
   * Format date for display
   * @param {string} date - Date in DD/MM/YYYY format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    if (!date || typeof date !== 'string') {
      return '';
    }

    // Handle DD/MM/YYYY format
    const dateMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const dateObj = new Date(year, month - 1, day);
      
      // Validate the date
      if (dateObj.getFullYear() == year && 
          dateObj.getMonth() == month - 1 && 
          dateObj.getDate() == day) {
        
        // Format as readable date
        const options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        };
        return dateObj.toLocaleDateString('en-US', options);
      }
    }

    // Return original date if parsing fails
    return date;
  }

  /**
   * Create party badge HTML
   * @param {string} party - Party name
   * @returns {string} Party badge HTML
   */
  static createPartyBadgeHTML(party) {
    if (!party || typeof party !== 'string') {
      return '';
    }

    const normalizedParty = party.toLowerCase().replace(/\s+/g, '-');
    return `<span class="party-badge party-${normalizedParty}">${party}</span>`;
  }

  /**
   * Add party badge to a card element with party-specific colors
   * Requirements: 3.2 - Party attribution display with consistent color coding
   * @param {HTMLElement} cardElement - Card DOM element to add badge to
   * @param {string} party - Party name
   * @returns {HTMLElement} Modified card element with party badge
   */
  static addPartyBadge(cardElement, party) {
    if (!cardElement || !party) {
      return cardElement;
    }

    // Create party badge element
    const badge = this.createPartyBadgeElement(party);
    
    // Find the card header or create one if it doesn't exist
    let header = cardElement.querySelector('.card-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'card-header';
      cardElement.insertBefore(header, cardElement.firstChild);
    }

    // Add the badge to the header
    header.appendChild(badge);

    // Apply party-specific styling to the entire card
    this.applyPartyCardStyling(cardElement, party);

    return cardElement;
  }

  /**
   * Create party badge DOM element with party-specific styling
   * @param {string} party - Party name
   * @returns {HTMLElement} Party badge element
   */
  static createPartyBadgeElement(party) {
    const badge = document.createElement('span');
    badge.className = `party-badge ${this.getPartyClass(party)}`;
    badge.textContent = party;
    badge.setAttribute('title', `Political party: ${party}`);
    
    return badge;
  }

  /**
   * Apply party-specific styling to card element
   * @param {HTMLElement} cardElement - Card element to style
   * @param {string} party - Party name
   */
  static applyPartyCardStyling(cardElement, party) {
    if (!cardElement || !party) {
      return;
    }

    // Add party-specific class to card for consistent styling
    const partyClass = this.getPartyClass(party);
    cardElement.classList.add(`card-${partyClass}`);
  }

  /**
   * Get normalized CSS class name for party
   * @param {string} party - Party name
   * @returns {string} Normalized party class name
   */
  static getPartyClass(party) {
    if (!party || typeof party !== 'string') {
      return 'party-default';
    }

    // Normalize party name to CSS-safe class name
    const normalized = party.toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric characters except hyphens
      .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens

    return normalized || 'party-default';
  }

  /**
   * Get party-specific color configuration
   * Requirements: 3.2 - Consistent party color coding across timeline
   * @param {string} party - Party name
   * @returns {Object} Color configuration for party
   */
  static getPartyColors(party) {
    const partyClass = this.getPartyClass(party);
    
    // Party color mapping based on Spanish political parties
    const colorMap = {
      'podemos': {
        primary: '#6f2c91',
        background: '#f3e8ff',
        text: '#553c9a'
      },
      'psoe': {
        primary: '#e53e3e',
        background: '#fed7d7',
        text: '#c53030'
      },
      'pp': {
        primary: '#3182ce',
        background: '#dbeafe',
        text: '#2c5aa0'
      },
      'ciudadanos': {
        primary: '#ff8c00',
        background: '#fef5e7',
        text: '#dd6b20'
      },
      'vox': {
        primary: '#38a169',
        background: '#c6f6d5',
        text: '#2f855a'
      },
      'equo': {
        primary: '#22c55e',
        background: '#dcfce7',
        text: '#16a34a'
      },
      'podemos-equo': {
        primary: '#6f2c91',
        background: '#f3e8ff',
        text: '#553c9a'
      },
      'party-default': {
        primary: '#718096',
        background: '#f7fafc',
        text: '#4a5568'
      }
    };

    return colorMap[partyClass] || colorMap['party-default'];
  }

  /**
   * Create inline styles for party-specific elements
   * @param {string} party - Party name
   * @returns {string} CSS style string
   */
  static getPartyInlineStyles(party) {
    const colors = this.getPartyColors(party);
    
    return `
      background-color: ${colors.primary};
      color: white;
      border-color: ${colors.primary};
    `.trim();
  }

  /**
   * Validate party name and provide fallback
   * @param {string} party - Party name to validate
   * @returns {string} Valid party name or default
   */
  static validatePartyName(party) {
    if (!party || typeof party !== 'string' || party.trim().length === 0) {
      return '';
    }

    return party.trim();
  }

  /**
   * Escape HTML entities to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}