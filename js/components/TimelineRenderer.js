/**
 * TimelineRenderer component for vis-timeline integration
 * Handles timeline initialization, rendering, and updates
 */
class TimelineRenderer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.timeline = null;
    this.dataset = null;
    this.groups = null;
    
    if (!this.container) {
      throw new Error(`Timeline container with ID '${containerId}' not found`);
    }

    // Default timeline options with card-style display (Requirement 2.1, 2.2)
    this.options = {
      // Card-style display configuration
      type: 'box',
      orientation: 'top',
      stack: true,
      
      // Interactive features (Requirements 2.3, 2.4, 2.5)
      zoomable: true,
      moveable: true,
      selectable: false,
      
      // Timeline appearance
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      
      // Card spacing and layout
      margin: {
        item: 10,   // Space between cards
        axis: 20    // Space from timeline axis
      },
      
      // Party-based grouping configuration
      groupOrder: 'content',  // Order parties alphabetically
      groupTemplate: function(group) {
        return `<div class="timeline-group-label">${group.content}</div>`;
      },
      
      // Custom card template rendering
      template: function(item, element, data) {
        return item.content;
      },
      
      // Timeline height and responsiveness
      height: '400px',
      minHeight: '300px',
      maxHeight: '600px',
      
      // Date formatting
      format: {
        minorLabels: {
          millisecond:'SSS',
          second:     's',
          minute:     'HH:mm',
          hour:       'HH:mm',
          weekday:    'ddd D',
          day:        'D',
          week:       'w',
          month:      'MMM',
          year:       'YYYY'
        },
        majorLabels: {
          millisecond:'HH:mm:ss',
          second:     'D MMMM HH:mm',
          minute:     'ddd D MMMM',
          hour:       'ddd D MMMM',
          weekday:    'MMMM YYYY',
          day:        'MMMM YYYY',
          week:       'MMMM YYYY',
          month:      'YYYY',
          year:       ''
        }
      },
      
      // Merge with user-provided options
      ...options
    };

    // Initialize vis-timeline datasets
    this.initializeDatasets();
  }

  /**
   * Initialize vis-timeline datasets for items and groups
   */
  initializeDatasets() {
    // Initialize empty dataset for timeline items
    this.dataset = new vis.DataSet([]);
    
    // Initialize groups for party-based organization (Requirement 2.2)
    this.groups = new vis.DataSet([]);
    
    // Add default groups for known political parties
    this.initializePartyGroups();
  }

  /**
   * Initialize party-based groups for visual organization
   */
  initializePartyGroups() {
    const partyGroups = [
      { id: 'podemos', content: 'Podemos', className: 'timeline-group-podemos' },
      { id: 'psoe', content: 'PSOE', className: 'timeline-group-psoe' },
      { id: 'pp', content: 'PP', className: 'timeline-group-pp' },
      { id: 'ciudadanos', content: 'Ciudadanos', className: 'timeline-group-ciudadanos' },
      { id: 'vox', content: 'Vox', className: 'timeline-group-vox' },
      { id: 'equo', content: 'EQUO', className: 'timeline-group-equo' },
      { id: 'podemos-equo', content: 'Podemos-EQUO', className: 'timeline-group-podemos-equo' },
      { id: 'other', content: 'Other', className: 'timeline-group-other' }
    ];

    this.groups.add(partyGroups);
  }

  /**
   * Initialize the vis-timeline instance
   */
  initializeTimeline() {
    if (this.timeline) {
      this.timeline.destroy();
    }

    try {
      // Create timeline with datasets and options
      this.timeline = new vis.Timeline(
        this.container,
        this.dataset,
        this.groups,
        this.options
      );

      // Add event listeners for timeline interactions
      this.setupEventListeners();
      
      console.log('Timeline initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize timeline:', error);
      this.showTimelineError('Failed to initialize timeline visualization');
      return false;
    }
  }

  /**
   * Set up event listeners for timeline interactions (Requirements 2.3, 2.4, 2.5)
   */
  setupEventListeners() {
    if (!this.timeline) return;

    // Handle timeline selection events
    this.timeline.on('select', (event) => {
      if (event.items && event.items.length > 0) {
        const selectedItem = this.dataset.get(event.items[0]);
        this.handleItemSelection(selectedItem);
      } else {
        this.handleItemDeselection();
      }
    });

    // Handle timeline range changes (zoom/pan) - Requirement 2.3, 2.4
    this.timeline.on('rangechange', (event) => {
      this.handleRangeChange(event);
    });

    // Handle timeline range changed (after zoom/pan completed)
    this.timeline.on('rangechanged', (event) => {
      this.handleRangeChanged(event);
    });

    // Handle timeline click events
    this.timeline.on('click', (event) => {
      this.handleTimelineClick(event);
    });

    // Handle timeline double-click for zoom
    this.timeline.on('doubleClick', (event) => {
      this.handleDoubleClick(event);
    });

    // Handle context menu (right-click)
    this.timeline.on('contextmenu', (event) => {
      this.handleContextMenu(event);
    });

    // Handle mouse wheel for smooth zooming
    this.setupMouseWheelZoom();

    // Handle keyboard navigation
    this.setupKeyboardNavigation();

    // Handle touch gestures for mobile
    this.setupTouchGestures();
  }

  /**
   * Handle item selection
   * @param {Object} item - Selected timeline item
   */
  handleItemSelection(item) {
    console.log('Timeline item selected:', item);
    
    // Add visual feedback for selection
    this.showSelectionFeedback(item);
    
    // Optional: Trigger custom selection event
    this.dispatchCustomEvent('itemSelected', { item });
  }

  /**
   * Handle item deselection
   */
  handleItemDeselection() {
    console.log('Timeline item deselected');
    
    // Remove visual feedback
    this.hideSelectionFeedback();
    
    // Optional: Trigger custom deselection event
    this.dispatchCustomEvent('itemDeselected', {});
  }

  /**
   * Handle timeline range changes during zoom/pan (Requirement 2.3, 2.4)
   * @param {Object} event - Range change event
   */
  handleRangeChange(event) {
    // Update navigation indicators during interaction
    this.updateNavigationIndicators(event);
    
    // Performance optimization for large datasets (Requirement 2.5)
    this.optimizeForLargeDatasets(event);
  }

  /**
   * Handle timeline range changed after zoom/pan completed
   * @param {Object} event - Range changed event
   */
  handleRangeChanged(event) {
    console.log('Timeline range changed:', {
      start: event.start,
      end: event.end,
      byUser: event.byUser
    });

    // Update URL or state if needed
    this.updateTimelineState(event);
    
    // Dispatch custom event for external listeners
    this.dispatchCustomEvent('rangeChanged', {
      start: event.start,
      end: event.end,
      byUser: event.byUser
    });
  }

  /**
   * Handle timeline click events
   * @param {Object} event - Click event
   */
  handleTimelineClick(event) {
    console.log('Timeline clicked:', event);
    
    // If clicking on empty space, deselect items
    if (!event.item) {
      this.timeline.setSelection([]);
    }
  }

  /**
   * Handle double-click for smart zoom
   * @param {Object} event - Double-click event
   */
  handleDoubleClick(event) {
    if (event.item) {
      // Double-click on item: focus on that item with context
      this.focusItemWithContext(event.item);
    } else {
      // Double-click on empty space: fit all items
      this.timeline.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  }

  /**
   * Handle context menu (right-click)
   * @param {Object} event - Context menu event
   */
  handleContextMenu(event) {
    // Prevent default browser context menu
    event.event.preventDefault();
    
    // Show custom context menu if needed
    this.showContextMenu(event);
  }

  /**
   * Set up smooth mouse wheel zooming
   */
  setupMouseWheelZoom() {
    if (!this.container) return;

    // Enhanced zoom sensitivity for better user experience
    this.container.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) {
        // Prevent page zoom when zooming timeline
        event.preventDefault();
        
        // Custom zoom implementation for smoother experience
        this.handleCustomZoom(event);
      }
    }, { passive: false });
  }

  /**
   * Set up keyboard navigation (Requirement 2.5)
   */
  setupKeyboardNavigation() {
    if (!this.container) return;

    // Make container focusable
    this.container.setAttribute('tabindex', '0');
    
    this.container.addEventListener('keydown', (event) => {
      this.handleKeyboardNavigation(event);
    });
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardNavigation(event) {
    if (!this.timeline) return;

    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    const step = rangeSize * 0.1; // 10% of current range

    switch (event.key) {
      case 'ArrowLeft':
        // Pan left
        event.preventDefault();
        this.timeline.setWindow(
          new Date(currentRange.start - step),
          new Date(currentRange.end - step),
          { animation: { duration: 200 } }
        );
        break;

      case 'ArrowRight':
        // Pan right
        event.preventDefault();
        this.timeline.setWindow(
          new Date(currentRange.start + step),
          new Date(currentRange.end + step),
          { animation: { duration: 200 } }
        );
        break;

      case 'ArrowUp':
        // Zoom in
        event.preventDefault();
        this.zoomIn();
        break;

      case 'ArrowDown':
        // Zoom out
        event.preventDefault();
        this.zoomOut();
        break;

      case 'Home':
        // Go to start
        event.preventDefault();
        this.goToStart();
        break;

      case 'End':
        // Go to end
        event.preventDefault();
        this.goToEnd();
        break;

      case 'f':
      case 'F':
        // Fit all items
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.timeline.fit({ animation: { duration: 500 } });
        }
        break;
    }
  }

  /**
   * Set up touch gestures for mobile support (Requirement 2.5)
   */
  setupTouchGestures() {
    if (!this.container) return;

    let touchStartDistance = 0;
    let touchStartRange = null;

    // Handle pinch-to-zoom on mobile
    this.container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        touchStartDistance = this.getTouchDistance(event.touches);
        touchStartRange = this.timeline.getWindow();
      }
    });

    this.container.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2 && touchStartDistance > 0) {
        event.preventDefault();
        
        const currentDistance = this.getTouchDistance(event.touches);
        const scale = touchStartDistance / currentDistance;
        
        this.handlePinchZoom(scale, touchStartRange);
      }
    });

    this.container.addEventListener('touchend', () => {
      touchStartDistance = 0;
      touchStartRange = null;
    });
  }

  /**
   * Get distance between two touch points
   * @param {TouchList} touches - Touch points
   * @returns {number} Distance between touches
   */
  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Handle pinch zoom gesture
   * @param {number} scale - Zoom scale factor
   * @param {Object} originalRange - Original timeline range
   */
  handlePinchZoom(scale, originalRange) {
    if (!originalRange || !this.timeline) return;

    const rangeSize = originalRange.end - originalRange.start;
    const newRangeSize = rangeSize * scale;
    const center = new Date((originalRange.start.getTime() + originalRange.end.getTime()) / 2);
    
    const newStart = new Date(center.getTime() - newRangeSize / 2);
    const newEnd = new Date(center.getTime() + newRangeSize / 2);
    
    this.timeline.setWindow(newStart, newEnd);
  }

  /**
   * Custom zoom implementation
   * @param {WheelEvent} event - Wheel event
   */
  handleCustomZoom(event) {
    if (!this.timeline) return;

    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    const newRangeSize = rangeSize * zoomFactor;
    
    // Get mouse position relative to timeline for zoom center
    const rect = this.container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const mouseRatio = mouseX / timelineWidth;
    
    // Calculate new range centered on mouse position
    const currentCenter = currentRange.start.getTime() + (rangeSize * mouseRatio);
    const newStart = new Date(currentCenter - (newRangeSize * mouseRatio));
    const newEnd = new Date(currentCenter + (newRangeSize * (1 - mouseRatio)));
    
    this.timeline.setWindow(newStart, newEnd, {
      animation: { duration: 100 }
    });
  }

  /**
   * Zoom in on timeline
   */
  zoomIn() {
    if (!this.timeline) return;
    
    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    const newRangeSize = rangeSize * 0.8;
    const center = new Date((currentRange.start.getTime() + currentRange.end.getTime()) / 2);
    
    this.timeline.setWindow(
      new Date(center.getTime() - newRangeSize / 2),
      new Date(center.getTime() + newRangeSize / 2),
      { animation: { duration: 300 } }
    );
  }

  /**
   * Zoom out on timeline
   */
  zoomOut() {
    if (!this.timeline) return;
    
    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    const newRangeSize = rangeSize * 1.25;
    const center = new Date((currentRange.start.getTime() + currentRange.end.getTime()) / 2);
    
    this.timeline.setWindow(
      new Date(center.getTime() - newRangeSize / 2),
      new Date(center.getTime() + newRangeSize / 2),
      { animation: { duration: 300 } }
    );
  }

  /**
   * Go to timeline start
   */
  goToStart() {
    if (!this.timeline || !this.dataset) return;
    
    const items = this.dataset.get();
    if (items.length === 0) return;
    
    const dates = items.map(item => item.start).filter(Boolean);
    if (dates.length === 0) return;
    
    const minDate = new Date(Math.min(...dates));
    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    
    this.timeline.setWindow(
      minDate,
      new Date(minDate.getTime() + rangeSize),
      { animation: { duration: 500 } }
    );
  }

  /**
   * Go to timeline end
   */
  goToEnd() {
    if (!this.timeline || !this.dataset) return;
    
    const items = this.dataset.get();
    if (items.length === 0) return;
    
    const dates = items.map(item => item.start).filter(Boolean);
    if (dates.length === 0) return;
    
    const maxDate = new Date(Math.max(...dates));
    const currentRange = this.timeline.getWindow();
    const rangeSize = currentRange.end - currentRange.start;
    
    this.timeline.setWindow(
      new Date(maxDate.getTime() - rangeSize),
      maxDate,
      { animation: { duration: 500 } }
    );
  }

  /**
   * Focus on item with surrounding context
   * @param {string} itemId - Item ID to focus on
   */
  focusItemWithContext(itemId) {
    if (!this.timeline || !this.dataset) return;
    
    const item = this.dataset.get(itemId);
    if (!item || !item.start) return;
    
    // Show item with 30 days context on each side
    const contextDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const startDate = new Date(item.start.getTime() - contextDays);
    const endDate = new Date(item.start.getTime() + contextDays);
    
    this.timeline.setWindow(startDate, endDate, {
      animation: { duration: 500 }
    });
    
    // Select the item
    setTimeout(() => {
      this.timeline.setSelection([itemId]);
    }, 600);
  }

  /**
   * Update navigation indicators (Requirement 2.5)
   * @param {Object} event - Range change event
   */
  updateNavigationIndicators(event) {
    // Add visual indicators for timeline navigation
    // This could include progress bars, minimap, etc.
    
    if (!this.dataset) return;
    
    const items = this.dataset.get();
    if (items.length === 0) return;
    
    const dates = items.map(item => item.start).filter(Boolean);
    if (dates.length === 0) return;
    
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalRange = maxDate - minDate;
    
    if (totalRange <= 0) return;
    
    const currentStart = event.start.getTime();
    const currentEnd = event.end.getTime();
    
    // Calculate position within total range
    const startPosition = Math.max(0, (currentStart - minDate) / totalRange);
    const endPosition = Math.min(1, (currentEnd - minDate) / totalRange);
    
    // Update navigation indicator (if exists)
    this.updateNavigationBar(startPosition, endPosition);
  }

  /**
   * Optimize performance for large datasets (Requirement 2.5)
   * @param {Object} event - Range change event
   */
  optimizeForLargeDatasets(event) {
    if (!this.dataset) return;
    
    const itemCount = this.dataset.length;
    
    // For large datasets (>100 items), implement performance optimizations
    if (itemCount > 100) {
      // Throttle updates during rapid zoom/pan
      if (this.optimizationTimeout) {
        clearTimeout(this.optimizationTimeout);
      }
      
      this.optimizationTimeout = setTimeout(() => {
        // Perform expensive operations after user stops interacting
        this.performLargeDatasetOptimizations();
      }, 150);
    }
  }

  /**
   * Perform optimizations for large datasets
   */
  performLargeDatasetOptimizations() {
    // Implement clustering, virtualization, or other optimizations
    console.log('Performing large dataset optimizations');
    
    // Example: Could implement item clustering for very large datasets
    // This would group nearby items when zoomed out
  }

  /**
   * Show visual feedback for item selection
   * @param {Object} item - Selected item
   */
  showSelectionFeedback(item) {
    // Add visual feedback (could be tooltip, highlight, etc.)
    console.log('Showing selection feedback for:', item.id);
  }

  /**
   * Hide visual feedback for item selection
   */
  hideSelectionFeedback() {
    // Remove visual feedback
    console.log('Hiding selection feedback');
  }

  /**
   * Show custom context menu
   * @param {Object} event - Context menu event
   */
  showContextMenu(event) {
    // Implement custom context menu if needed
    console.log('Context menu requested:', event);
  }

  /**
   * Update timeline state (for URL or local storage)
   * @param {Object} event - Range changed event
   */
  updateTimelineState(event) {
    // Could save timeline state to URL parameters or localStorage
    // for persistence across page reloads
  }

  /**
   * Update navigation bar indicator
   * @param {number} startPosition - Start position (0-1)
   * @param {number} endPosition - End position (0-1)
   */
  updateNavigationBar(startPosition, endPosition) {
    // Update navigation bar if it exists
    // This could show current position within the full timeline
  }

  /**
   * Dispatch custom event
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  dispatchCustomEvent(eventName, detail) {
    if (!this.container) return;
    
    const customEvent = new CustomEvent(`timeline-${eventName}`, {
      detail,
      bubbles: true
    });
    
    this.container.dispatchEvent(customEvent);
  }

  /**
   * Get party group ID from party name
   * @param {string} party - Party name
   * @returns {string} Group ID for the party
   */
  getPartyGroupId(party) {
    if (!party) return 'other';
    
    const partyLower = party.toLowerCase().trim();
    
    // Handle compound party names
    if (partyLower.includes('podemos') && partyLower.includes('equo')) {
      return 'podemos-equo';
    }
    
    // Handle individual parties
    if (partyLower.includes('podemos')) return 'podemos';
    if (partyLower.includes('psoe')) return 'psoe';
    if (partyLower.includes('pp')) return 'pp';
    if (partyLower.includes('ciudadanos')) return 'ciudadanos';
    if (partyLower.includes('vox')) return 'vox';
    if (partyLower.includes('equo')) return 'equo';
    
    return 'other';
  }

  /**
   * Show error message in timeline container
   * @param {string} message - Error message to display
   */
  showTimelineError(message) {
    this.container.innerHTML = `
      <div class="no-data-message error-state">
        <h3>Timeline Error</h3>
        <p class="error-details">${message}</p>
        <button onclick="window.location.reload()" class="retry-button">Retry</button>
      </div>
    `;
  }

  /**
   * Show loading state in timeline container
   */
  showLoading() {
    this.container.innerHTML = `
      <div class="no-data-message">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading timeline...</div>
        </div>
      </div>
    `;
  }

  /**
   * Clear timeline container
   */
  clearContainer() {
    this.container.innerHTML = `
      <div class="no-data-message">
        Select a project to view its timeline
      </div>
    `;
  }

  /**
   * Render timeline with transformed timeline data (Requirement 1.4, 2.3, 2.4)
   * @param {Array} timelineData - Array of timeline items in vis-timeline format
   */
  render(timelineData) {
    if (!timelineData || !Array.isArray(timelineData)) {
      console.error('Invalid timeline data provided to render method');
      this.showTimelineError('Invalid timeline data format');
      return false;
    }

    try {
      // Show loading state
      this.showLoading();

      // Initialize timeline if not already done
      if (!this.timeline) {
        const initialized = this.initializeTimeline();
        if (!initialized) {
          return false;
        }
      }

      // Clear existing data
      this.dataset.clear();

      // Validate and add timeline items
      const validItems = this.validateTimelineItems(timelineData);
      
      if (validItems.length === 0) {
        this.showEmptyTimeline();
        return true;
      }

      // Add items to dataset
      this.dataset.add(validItems);

      // Fit timeline to show all items with some padding
      setTimeout(() => {
        if (this.timeline && validItems.length > 0) {
          this.timeline.fit({
            animation: {
              duration: 500,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      }, 100);

      console.log(`Timeline rendered with ${validItems.length} items`);
      return true;

    } catch (error) {
      console.error('Error rendering timeline:', error);
      this.showTimelineError('Failed to render timeline: ' + error.message);
      return false;
    }
  }

  /**
   * Update timeline data for project switching (Requirement 1.4)
   * @param {Array} newData - New timeline data to display
   */
  updateData(newData) {
    if (!newData || !Array.isArray(newData)) {
      console.error('Invalid data provided to updateData method');
      this.showTimelineError('Invalid timeline data format');
      return false;
    }

    try {
      // Show loading state during update
      this.showLoading();

      // If timeline doesn't exist, render from scratch
      if (!this.timeline) {
        return this.render(newData);
      }

      // Validate new items
      const validItems = this.validateTimelineItems(newData);

      // Update dataset with smooth transition
      this.dataset.clear();
      
      if (validItems.length === 0) {
        this.showEmptyTimeline();
        return true;
      }

      this.dataset.add(validItems);

      // Smooth transition to new data range
      setTimeout(() => {
        if (this.timeline && validItems.length > 0) {
          this.timeline.fit({
            animation: {
              duration: 750,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      }, 100);

      console.log(`Timeline updated with ${validItems.length} items`);
      return true;

    } catch (error) {
      console.error('Error updating timeline data:', error);
      this.showTimelineError('Failed to update timeline: ' + error.message);
      return false;
    }
  }

  /**
   * Validate and format timeline items for vis-timeline
   * @param {Array} items - Raw timeline items
   * @returns {Array} Validated timeline items
   */
  validateTimelineItems(items) {
    const validItems = [];

    items.forEach((item, index) => {
      try {
        // Validate required fields
        if (!item.id) {
          item.id = `item-${index}-${Date.now()}`;
        }

        if (!item.start) {
          console.warn(`Timeline item ${item.id} missing start date, skipping`);
          return;
        }

        // Ensure start is a Date object
        if (!(item.start instanceof Date)) {
          item.start = new Date(item.start);
        }

        // Validate date
        if (isNaN(item.start.getTime())) {
          console.warn(`Timeline item ${item.id} has invalid start date, skipping`);
          return;
        }

        // Ensure content exists
        if (!item.content) {
          console.warn(`Timeline item ${item.id} missing content, using placeholder`);
          item.content = '<div class="timeline-card">No content available</div>';
        }

        // Set item type to box for card-style display
        item.type = 'box';

        // Add party-based group and styling
        if (item.party) {
          const groupId = this.getPartyGroupId(item.party);
          item.group = groupId;
          item.className = `party-${groupId}`;
        } else {
          item.group = 'other';
          item.className = 'party-other';
        }

        validItems.push(item);

      } catch (error) {
        console.warn(`Error validating timeline item ${index}:`, error);
      }
    });

    return validItems;
  }

  /**
   * Show empty timeline state
   */
  showEmptyTimeline() {
    this.container.innerHTML = `
      <div class="no-data-message">
        <h3>No Timeline Data</h3>
        <p>No media events found for this project.</p>
        <p class="empty-state">The project sheet may be empty or contain invalid data.</p>
      </div>
    `;
  }

  /**
   * Get current timeline range
   * @returns {Object} Current timeline range with start and end dates
   */
  getCurrentRange() {
    if (!this.timeline) {
      return null;
    }

    try {
      const range = this.timeline.getWindow();
      return {
        start: range.start,
        end: range.end
      };
    } catch (error) {
      console.error('Error getting timeline range:', error);
      return null;
    }
  }

  /**
   * Set timeline range
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @param {Object} options - Animation options
   */
  setRange(start, end, options = {}) {
    if (!this.timeline) {
      console.warn('Timeline not initialized, cannot set range');
      return;
    }

    try {
      const defaultOptions = {
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      };

      this.timeline.setWindow(start, end, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error setting timeline range:', error);
    }
  }

  /**
   * Focus timeline on specific item
   * @param {string} itemId - ID of item to focus on
   * @param {Object} options - Focus options
   */
  focusItem(itemId, options = {}) {
    if (!this.timeline) {
      console.warn('Timeline not initialized, cannot focus item');
      return;
    }

    try {
      const defaultOptions = {
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      };

      this.timeline.focus(itemId, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error focusing timeline item:', error);
    }
  }

  /**
   * Get timeline statistics
   * @returns {Object} Timeline statistics
   */
  getStats() {
    if (!this.dataset) {
      return { itemCount: 0, dateRange: null, parties: [] };
    }

    const items = this.dataset.get();
    const parties = [...new Set(items.map(item => item.party).filter(Boolean))];
    
    let dateRange = null;
    if (items.length > 0) {
      const dates = items.map(item => item.start).filter(Boolean);
      if (dates.length > 0) {
        dateRange = {
          start: new Date(Math.min(...dates)),
          end: new Date(Math.max(...dates))
        };
      }
    }

    return {
      itemCount: items.length,
      dateRange,
      parties: parties.sort()
    };
  }

  /**
   * Destroy timeline instance and clean up resources
   */
  destroy() {
    try {
      if (this.timeline) {
        this.timeline.destroy();
        this.timeline = null;
      }

      if (this.dataset) {
        this.dataset.clear();
        this.dataset = null;
      }

      if (this.groups) {
        this.groups.clear();
        this.groups = null;
      }

      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }

      console.log('Timeline destroyed successfully');

    } catch (error) {
      console.error('Error destroying timeline:', error);
    }
  }
}