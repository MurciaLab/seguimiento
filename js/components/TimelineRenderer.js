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
      
      // Timeline height and responsiveness - match timeline-container height
      height: 'calc(95vh - var(--header-height) - var(--footer-space))',
      minHeight: '250px', // Responsive minimum height
      maxHeight: 'calc(95vh - 100px)', // Responsive maximum height
      
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
      // Clear any existing content (like initial "Select a project" message)
      this.container.innerHTML = '';
      
      // Create timeline with datasets and options (no groups for cleaner look)
      this.timeline = new vis.Timeline(
        this.container,
        this.dataset,
        null,
        this.options
      );

      // Add event listeners for timeline interactions
      this.setupEventListeners();
      
      // Add interaction helpers
      this.addInteractionHelpers();
      

      return true;
      
    } catch (error) {

      this.showTimelineError('Failed to initialize timeline visualization');
      return false;
    }
  }

  /**
   * Add interaction helpers (keyboard help, touch indicators)
   */
  addInteractionHelpers() {
    if (!this.container) return;
    
    // Add keyboard navigation help
    this.addKeyboardHelp();
    
    // Add zoom indicator
    this.addZoomIndicator();
    
    // Add touch indicators for mobile
    if (this.isMobileDevice()) {
      this.addTouchIndicators();
    }
  }

  /**
   * Add keyboard navigation help overlay
   */
  addKeyboardHelp() {
    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'timeline-keyboard-help';
    helpOverlay.innerHTML = `
      <div class="keyboard-shortcut"><span class="key">←→</span> Pan timeline</div>
      <div class="keyboard-shortcut"><span class="key">↑↓</span> Zoom in/out</div>
      <div class="keyboard-shortcut"><span class="key">Home</span> ${t('goToStart')}</div>
      <div class="keyboard-shortcut"><span class="key">End</span> ${t('goToEnd')}</div>
      <div class="keyboard-shortcut"><span class="key">Ctrl+F</span> ${t('fitAll')}</div>
    `;
    
    this.container.appendChild(helpOverlay);
  }

  /**
   * Add zoom level indicator
   */
  addZoomIndicator() {
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'timeline-zoom-indicator';
    zoomIndicator.id = 'timeline-zoom-indicator';
    zoomIndicator.textContent = '100%';
    
    this.container.appendChild(zoomIndicator);
  }

  /**
   * Add touch gesture indicators for mobile
   */
  addTouchIndicators() {
    const touchIndicator = document.createElement('div');
    touchIndicator.className = 'timeline-touch-indicator';
    touchIndicator.id = 'timeline-touch-indicator';
    touchIndicator.innerHTML = `
      <div>📱 ${t('pinchToZoom')}</div>
      <div>👆 ${t('swipeToPan')}</div>
    `;
    
    this.container.appendChild(touchIndicator);
    
    // Show briefly on first touch
    let firstTouch = true;
    this.container.addEventListener('touchstart', () => {
      if (firstTouch) {
        this.showTouchIndicator();
        firstTouch = false;
      }
    });
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * Show touch indicator briefly
   */
  showTouchIndicator() {
    const indicator = document.getElementById('timeline-touch-indicator');
    if (indicator) {
      indicator.classList.add('visible');
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }
  }

  /**
   * Update zoom indicator
   * @param {number} zoomLevel - Current zoom level (0-100)
   */
  updateZoomIndicator(zoomLevel) {
    const indicator = document.getElementById('timeline-zoom-indicator');
    if (indicator) {
      indicator.textContent = `${Math.round(zoomLevel)}%`;
      indicator.classList.add('visible');
      
      // Hide after 1 second
      clearTimeout(this.zoomIndicatorTimeout);
      this.zoomIndicatorTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
      }, 1000);
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
    // Throttle range change events for better performance during smooth interactions
    let rangeChangeTimeout;
    this.timeline.on('rangechange', (event) => {
      if (rangeChangeTimeout) {
        clearTimeout(rangeChangeTimeout);
      }
      rangeChangeTimeout = setTimeout(() => {
        this.handleRangeChange(event);
      }, 16); // ~60fps throttling for smooth interactions
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
    // Trigger custom selection event
    this.dispatchCustomEvent('itemSelected', { item });
  }

  /**
   * Handle item deselection
   */
  handleItemDeselection() {
    // Trigger custom deselection event
    this.dispatchCustomEvent('itemDeselected', {});
  }

  /**
   * Handle timeline range changes during zoom/pan (Requirement 2.3, 2.4)
   * @param {Object} event - Range change event
   */
  handleRangeChange(event) {
    // Update zoom level indicator
    this.updateZoomLevelIndicator(event);
    
    // Performance optimization for large datasets (Requirement 2.5)
    this.optimizeForLargeDatasets(event);
  }

  /**
   * Update zoom level indicator based on current range
   * @param {Object} event - Range change event
   */
  updateZoomLevelIndicator(event) {
    if (!this.dataset) return;
    
    const items = this.dataset.get();
    if (items.length === 0) return;
    
    const dates = items.map(item => item.start).filter(Boolean);
    if (dates.length === 0) return;
    
    const totalRange = Math.max(...dates) - Math.min(...dates);
    const currentRange = event.end.getTime() - event.start.getTime();
    
    if (totalRange > 0) {
      const zoomLevel = Math.max(1, (totalRange / currentRange) * 100);
      this.updateZoomIndicator(Math.min(zoomLevel, 10000)); // Cap at 10000%
    }
  }

  /**
   * Handle timeline range changed after zoom/pan completed
   * @param {Object} event - Range changed event
   */
  handleRangeChanged(event) {
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
    if (!this.dataset || !this.timeline) return;
    
    const itemCount = this.dataset.length;
    
    // For very large datasets (>500 items), implement clustering
    if (itemCount > 500) {
      this.enableItemClustering();
    }
    
    // Optimize timeline options for large datasets
    if (itemCount > 100) {
      this.optimizeTimelineOptions();
    }
    
    // Add performance monitoring
    this.monitorPerformance();
  }

  /**
   * Enable item clustering for very large datasets
   */
  enableItemClustering() {
    if (!this.timeline) return;
    
    // Update timeline options to enable clustering
    const clusterOptions = {
      cluster: {
        maxItems: 50, // Maximum items to show before clustering
        titleTemplate: '{count} events',
        showStipes: true,
        fitOnDoubleClick: true
      }
    };
    
    try {
      this.timeline.setOptions(clusterOptions);
    } catch (error) {

    }
  }

  /**
   * Optimize timeline options for large datasets
   */
  optimizeTimelineOptions() {
    if (!this.timeline) return;
    
    const optimizedOptions = {
      // Reduce animation duration for better performance
      animation: {
        duration: 200,
        easingFunction: 'linear'
      },
      // Optimize rendering
      throttleRedraw: 16, // ~60fps
      // Reduce visual complexity
      showMinorLabels: false,
      // Optimize item rendering
      template: (item) => {
        // Use simpler template for large datasets
        return this.createOptimizedItemTemplate(item);
      }
    };
    
    try {
      this.timeline.setOptions(optimizedOptions);
    } catch (error) {

    }
  }

  /**
   * Create optimized item template for large datasets
   * @param {Object} item - Timeline item
   * @returns {string} Optimized HTML template
   */
  createOptimizedItemTemplate(item) {
    // Simplified template with minimal DOM elements
    const party = item.party || 'other';
    const partyClass = `party-${this.getPartyGroupId(party)}`;
    
    return `
      <div>
        <div><strong>${item.headline || 'Event'}</strong></div>
        <div><em>${party}</em></div>
      </div>
    `;
  }

  /**
   * Monitor timeline performance
   */
  monitorPerformance() {
    if (!window.performance || !this.timeline) return;
    
    // Monitor frame rate during interactions
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {

          this.handleLowPerformance();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    // Start monitoring during interactions
    this.timeline.on('rangechange', () => {
      if (!this.performanceMonitoring) {
        this.performanceMonitoring = true;
        requestAnimationFrame(measureFPS);
      }
    });
  }

  /**
   * Handle low performance scenarios
   */
  handleLowPerformance() {
    
    // Disable animations temporarily
    if (this.timeline) {
      this.timeline.setOptions({
        animation: false,
        throttleRedraw: 32 // Reduce to 30fps
      });
    }
    
    // Show performance warning to user
    this.showPerformanceWarning();
  }

  /**
   * Show performance warning to user
   */
  showPerformanceWarning() {
    const warningId = 'timeline-performance-warning';
    let warning = document.getElementById(warningId);
    
    if (!warning) {
      warning = document.createElement('div');
      warning.id = warningId;
      warning.className = 'timeline-performance-warning';
      warning.innerHTML = `
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">Large dataset detected. Some animations disabled for better performance.</span>
          <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      if (this.container && this.container.parentElement) {
        this.container.parentElement.insertBefore(warning, this.container);
      }
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (warning && warning.parentElement) {
        warning.remove();
      }
    }, 5000);
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
        <h3>${t('timelineError')}</h3>
        <p class="error-details">${message}</p>
        <button onclick="window.location.reload()" class="retry-button">${t('retry')}</button>
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
          <div class="loading-text">${t('loadingTimeline')}</div>
        </div>
      </div>
    `;
  }

  /**
   * Clear timeline container (but preserve timeline DOM element)
   */
  clearContainer() {
    // Clear the dataset if it exists
    if (this.dataset) {
      this.dataset.clear();
    }
    
    // Always clear the container HTML to ensure clean state
    this.container.innerHTML = '';
    
    // If no timeline exists, show default message
    if (!this.timeline) {
      this.container.innerHTML = `
        <div class="no-data-message">
          ${t('selectProjectToView')}
        </div>
      `;
    }
    // If timeline exists, it will be reinitialized when new data is loaded
  }

  /**
   * Render timeline with transformed timeline data (Requirement 1.4, 2.3, 2.4)
   * @param {Array} timelineData - Array of timeline items in vis-timeline format
   */
  render(timelineData) {
    if (!timelineData || !Array.isArray(timelineData)) {
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

      // Add all items to dataset
      this.dataset.add(validItems);

      // Fit timeline to show all items with smooth animation (Requirement 2.3, 2.4)
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


      return true;

    } catch (error) {

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
      this.showTimelineError('Invalid timeline data format');
      return false;
    }

    try {
      // Validate new items first
      const validItems = this.validateTimelineItems(newData);
      
      if (validItems.length === 0) {
        // For empty timelines, destroy any existing timeline and show empty message
        if (this.timeline) {
          this.timeline.destroy();
          this.timeline = null;
        }
        this.showEmptyTimeline();
        return true;
      }

      // For non-empty timelines, ensure timeline is initialized
      // Check if timeline DOM structure exists
      const timelineElements = this.container.querySelectorAll('.vis-timeline');
      
      if (!this.timeline || timelineElements.length === 0) {
        // Timeline doesn't exist or DOM was cleared, initialize it
        const initialized = this.initializeTimeline();
        if (!initialized) {

          return false;
        }
      }

      // Clear existing data with smooth transition
      this.dataset.clear();

      // Add all items at once (simplified approach)
      this.dataset.add(validItems);
      
      // Fit all items in the timeline view
      setTimeout(() => {
        if (this.timeline && validItems.length > 0) {
          this.timeline.fit({
            animation: {
              duration: 750,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      }, 500);


      return true;

    } catch (error) {

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

          return;
        }

        // Ensure start is a Date object
        if (!(item.start instanceof Date)) {
          item.start = new Date(item.start);
        }

        // Validate date
        if (isNaN(item.start.getTime())) {

          return;
        }

        // Ensure content exists
        if (!item.content) {

          item.content = `<div class="timeline-card">${t('noDescriptionAvailable')}</div>`;
        }

        // Set item type to box for card-style display
        item.type = 'box';

        // Add party-based styling (no groups needed)
        if (item.party) {
          const groupId = this.getPartyGroupId(item.party);
          item.className = `party-${groupId}`;
        } else {
          item.className = 'party-other';
        }

        validItems.push(item);

      } catch (error) {

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
        <h3>${t('noTimelineData')}</h3>
        <p>${t('noMediaEvents')}</p>
        <p class="empty-state">${t('projectSheetEmpty')}</p>
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

    }
  }

  /**
   * Focus timeline on specific item
   * @param {string} itemId - ID of item to focus on
   * @param {Object} options - Focus options
   */
  focusItem(itemId, options = {}) {
    if (!this.timeline) {

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



    } catch (error) {

    }
  }
}