// Main application controller
class TimelineApp {
  constructor() {
    this.dataFetcher = null;
    this.projectSelector = null;
    this.timelineRenderer = null;
    this.currentProject = null;
    this.isLoading = false;
    this.spreadsheetId = '1kAQ344FGDrWCJUjIV4irwCrPc3_fIW2D8BmZ1g_JAck';
    this.appState = {
      initialized: false,
      hasData: false,
      currentView: 'selector'
    };
  }

  async init() {
    try {
      console.log('Initializing Timeline Application...');

      // Set application state
      this.appState.initialized = false;

      // Initialize timeline renderer first
      this.initializeTimelineRenderer();

      // Initialize project selector with callback for project changes
      this.initializeProjectSelector();

      // Initialize data fetcher and load projects
      await this.initializeDataFetcher();

      // Mark application as initialized
      this.appState.initialized = true;
      console.log('Timeline Application initialized successfully');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application: ' + error.message);
      this.appState.initialized = false;
    }
  }

  /**
   * Initialize timeline renderer component
   */
  initializeTimelineRenderer() {
    try {
      this.timelineRenderer = new TimelineRenderer('timeline-container');
      console.log('Timeline renderer initialized');
    } catch (error) {
      console.error('Failed to initialize timeline renderer:', error);
      throw new Error('Timeline renderer initialization failed: ' + error.message);
    }
  }

  /**
   * Initialize project selector component
   */
  initializeProjectSelector() {
    try {
      this.projectSelector = new ProjectSelector('project-selector', (project) => {
        this.handleProjectSelection(project);
      });
      console.log('Project selector initialized');
    } catch (error) {
      console.error('Failed to initialize project selector:', error);
      throw new Error('Project selector initialization failed: ' + error.message);
    }
  }

  /**
   * Initialize data fetcher and load initial data
   */
  async initializeDataFetcher() {
    try {
      // Check if DataFetcher is available
      if (typeof DataFetcher !== 'undefined') {
        this.dataFetcher = new DataFetcher(this.spreadsheetId);
        await this.loadProjects();
        this.appState.hasData = true;
        console.log('Data fetcher initialized with real data');
      } else {
        // Fallback to placeholder data for testing
        this.loadPlaceholderProjects();
        this.appState.hasData = false;
        console.log('Data fetcher not available, using placeholder data');
      }
    } catch (error) {
      console.error('Failed to initialize data fetcher:', error);
      // Fallback to placeholder data on error
      this.loadPlaceholderProjects();
      this.appState.hasData = false;
      this.showError('Failed to load project data. Using test data.');
    }
  }

  async loadProjects() {
    try {
      this.projectSelector.showLoading();

      // Fetch project list from main sheet
      const projects = await this.dataFetcher.fetchProjectList();

      // Populate project selector
      this.projectSelector.populateProjects(projects);
      this.projectSelector.hideLoading();

    } catch (error) {
      this.projectSelector.showError('Failed to load projects');
      this.showError('Failed to load projects: ' + error.message);
    }
  }

  loadPlaceholderProjects() {
    // Placeholder projects for testing the selector interface
    const placeholderProjects = [
      {
        project_id: '1',
        project_name: 'Tranvía al Carmen',
        category: 'Movilidad',
        completed_date: '15/03/2023'
      },
      {
        project_id: '2',
        project_name: 'Parque Central',
        category: 'Parques y jardines'
        // No completed_date - demonstrates optional field
      },
      {
        project_id: '3',
        project_name: 'Biblioteca Municipal',
        category: 'Cultura',
        completed_date: '22/11/2022'
      },
      {
        project_id: '4',
        project_name: 'Centro de Salud Norte',
        category: 'Sanidad'
        // No completed_date - demonstrates optional field
      },
      {
        project_id: '5',
        project_name: 'Renovación Plaza Mayor',
        category: 'Urbanismo',
        completed_date: '08/07/2023'
      }
    ];

    this.projectSelector.populateProjects(placeholderProjects);
  }

  async handleProjectSelection(project) {
    // Clear any existing error messages
    this.hideError();

    if (!project) {
      // Clear timeline when no project is selected
      this.currentProject = null;
      this.clearTimeline();
      this.updateAppState({ currentView: 'selector' });
      return;
    }

    // Prevent multiple simultaneous loads for the same project
    if (this.isLoading || (this.currentProject && this.currentProject.project_id === project.project_id)) {
      return;
    }

    try {
      this.isLoading = true;
      this.currentProject = project;
      this.updateAppState({ currentView: 'timeline' });

      // Show loading state immediately (Requirement 1.5 - user feedback during fetch)
      this.showTimelineLoading(true);
      this.showLoadingIndicator(true, `Loading timeline for ${project.project_name}...`);

      // Requirement 1.3: Fetch the corresponding Project_Sheet data
      if (this.dataFetcher && typeof this.dataFetcher.fetchProjectTimeline === 'function') {
        console.log(`Fetching timeline data for project: ${project.project_name} (ID: ${project.project_id})`);

        const rawTimelineData = await this.dataFetcher.fetchProjectTimeline(project.project_id);

        // Transform data to timeline format
        const timelineData = this.dataFetcher.transformToTimelineFormat(rawTimelineData);

        // Validate that we received data for the correct project
        if (!timelineData || timelineData.length === 0) {
          console.warn(`No timeline data found for project ${project.project_id}`);
          this.showEmptyTimeline(project);
          this.showUserFeedback('info', `No media events found for "${project.project_name}".`);
        } else {
          // Requirement 1.4: Display Project_Timeline showing Media_Events for selected project only
          if (this.timelineRenderer) {
            const success = this.timelineRenderer.updateData(timelineData);
            if (success) {
              console.log(`Rendered ${timelineData.length} media events for project ${project.project_name}`);
              this.showUserFeedback('success', `Loaded ${timelineData.length} media events for "${project.project_name}".`);
            } else {
              this.showPlaceholderTimeline(project, timelineData.length);
              this.showUserFeedback('warning', 'Timeline visualization failed. Showing placeholder view.');
            }
          } else {
            this.showPlaceholderTimeline(project, timelineData.length);
            this.showUserFeedback('warning', 'Timeline renderer not available. Showing placeholder view.');
          }
        }
      } else {
        // Show placeholder timeline for testing when DataFetcher is not available
        console.log(`DataFetcher not available, showing test timeline for project: ${project.project_name}`);
        this.showTestTimeline(project);
        this.showUserFeedback('info', 'Using test data for demonstration.');
      }

      this.showTimelineLoading(false);
      this.showLoadingIndicator(false);

    } catch (error) {
      this.showTimelineLoading(false);
      this.showLoadingIndicator(false);
      console.error(`Error loading timeline for project ${project.project_name}:`, error);

      // Enhanced error handling with specific error types
      let errorMessage = `Failed to load timeline for "${project.project_name}".`;
      let errorType = 'error';

      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        errorMessage = `Project sheet "${project.project_name}" not found. The project may not have timeline data yet.`;
        errorType = 'warning';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = `Network error loading "${project.project_name}". Please check your connection and try again.`;
      } else if (error.message.includes('parse') || error.message.includes('format')) {
        errorMessage = `Data format error for "${project.project_name}". The project sheet may have invalid data.`;
      }

      // Show user-friendly error message
      this.showUserFeedback(errorType, errorMessage);

      // Show error state in timeline container
      this.showTimelineError(project, error.message);
    } finally {
      this.isLoading = false;
    }
  }

  showPlaceholderTimeline(project, eventCount = null) {
    const timelineContainer = document.getElementById('timeline-container');
    const eventInfo = eventCount !== null ? `<p>Media Events: ${eventCount}</p>` : '';

    timelineContainer.innerHTML = `
      <div class="no-data-message">
        <h3>Timeline for: ${project.project_name}</h3>
        <p>Category: ${project.category}</p>
        <p>Status: ${project.completed_date && project.completed_date.trim() ? `Completed (${project.completed_date})` : 'In Progress'}</p>
        ${eventInfo}
        <p><em>Timeline visualization will be implemented in future tasks.</em></p>
      </div>
    `;
  }

  showEmptyTimeline(project) {
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = `
      <div class="no-data-message">
        <h3>Timeline for: ${project.project_name}</h3>
        <p>Category: ${project.category}</p>
        <p>Status: ${project.completed_date && project.completed_date.trim() ? `Completed (${project.completed_date})` : 'In Progress'}</p>
        <p class="empty-state">No media events found for this project.</p>
        <p><em>Check if the project sheet exists and contains data.</em></p>
      </div>
    `;
  }

  showTimelineError(project, errorMessage) {
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = `
      <div class="no-data-message error-state">
        <h3>Error loading timeline for: ${project.project_name}</h3>
        <p class="error-details">${errorMessage}</p>
        <button onclick="window.location.reload()" class="retry-button">Retry</button>
      </div>
    `;
  }

  showTestTimeline(project) {
    // Create test timeline data to demonstrate the timeline functionality
    const testTimelineData = this.generateTestTimelineData(project);

    if (this.timelineRenderer && testTimelineData.length > 0) {
      const success = this.timelineRenderer.updateData(testTimelineData);
      if (success) {
        console.log(`Rendered test timeline with ${testTimelineData.length} items for project ${project.project_name}`);
      } else {
        this.showPlaceholderTimeline(project, testTimelineData.length);
      }
    } else {
      this.showPlaceholderTimeline(project);
    }
  }

  generateTestTimelineData(project) {
    // Generate sample timeline data for testing
    const baseDate = new Date('2023-01-01');
    const testEvents = [
      {
        headline: `${project.project_name} - Initial Announcement`,
        description: `The city announces plans for the ${project.project_name} project in the ${project.category} category.`,
        party: 'PSOE',
        news_link: 'https://example.com/news1'
      },
      {
        headline: `Opposition Response to ${project.project_name}`,
        description: `Political opposition raises concerns about the proposed ${project.project_name} project.`,
        party: 'PP',
        news_link: 'https://twitter.com/example/status/123'
      },
      {
        headline: `Community Meeting on ${project.project_name}`,
        description: `Local community holds public meeting to discuss the ${project.project_name} project.`,
        party: 'Podemos',
        news_link: 'https://example.com/news2'
      },
      {
        headline: `Budget Approval for ${project.project_name}`,
        description: `City council approves budget allocation for the ${project.project_name} project.`,
        party: 'PSOE',
        news_link: 'https://example.com/news3'
      },
      {
        headline: `Construction Begins on ${project.project_name}`,
        description: `Construction work officially begins on the ${project.project_name} project.`,
        party: 'Ciudadanos',
        news_link: 'https://example.com/news4'
      }
    ];

    // Convert to timeline format using CardRenderer if available
    return testEvents.map((event, index) => {
      const eventDate = new Date(baseDate.getTime() + (index * 30 * 24 * 60 * 60 * 1000)); // 30 days apart

      let content = `<div class="timeline-card party-${event.party.toLowerCase()}">`;

      if (typeof CardRenderer !== 'undefined') {
        // Use CardRenderer if available
        const mediaEvent = {
          date_announced: eventDate.toLocaleDateString('en-GB'),
          news_link: event.news_link,
          headline: event.headline,
          description: event.description,
          party: event.party
        };
        content = CardRenderer.createNewsCard(mediaEvent);
      } else {
        // Fallback simple card
        content += `
          <div class="card-headline">${event.headline}</div>
          <div class="card-description">${event.description}</div>
          <div class="card-meta">
            <span class="party-badge party-${event.party.toLowerCase()}">${event.party}</span>
            <span class="card-date">${eventDate.toLocaleDateString()}</span>
          </div>
        `;
        content += `</div>`;
      }

      return {
        id: `test-${project.project_id}-${index}`,
        start: eventDate,
        content: content,
        party: event.party,
        type: 'box'
      };
    });
  }

  clearTimeline() {
    if (this.timelineRenderer) {
      this.timelineRenderer.clearContainer();
    } else {
      const timelineContainer = document.getElementById('timeline-container');
      timelineContainer.innerHTML = `
        <div class="no-data-message">
          Select a project to view its timeline
        </div>
      `;
    }
  }

  showTimelineLoading(show) {
    const timelineContainer = document.getElementById('timeline-container');

    if (show) {
      const projectName = this.currentProject ? this.currentProject.project_name : 'project';
      timelineContainer.innerHTML = `
        <div class="no-data-message">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading timeline data for ${projectName}...</div>
          </div>
        </div>
      `;
    }
  }

  showError(message) {
    this.showUserFeedback('error', message);
  }

  hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Show user feedback with different types (Requirements 1.5, 6.1, 6.2)
   * @param {string} type - Feedback type: 'success', 'error', 'warning', 'info'
   * @param {string} message - Feedback message
   * @param {number} duration - Auto-hide duration in milliseconds (0 = no auto-hide)
   */
  showUserFeedback(type, message, duration = 5000) {
    let feedbackElement = document.getElementById('user-feedback');

    if (!feedbackElement) {
      feedbackElement = this.createFeedbackElement();
    }

    // Set feedback content and type
    feedbackElement.textContent = message;
    feedbackElement.className = `user-feedback ${type}`;
    feedbackElement.style.display = 'block';

    // Auto-hide after specified duration
    if (duration > 0) {
      setTimeout(() => {
        if (feedbackElement) {
          feedbackElement.style.display = 'none';
        }
      }, duration);
    }

    console.log(`User feedback (${type}): ${message}`);
  }

  /**
   * Create feedback element if it doesn't exist
   * @returns {HTMLElement} Feedback element
   */
  createFeedbackElement() {
    const feedbackElement = document.createElement('div');
    feedbackElement.id = 'user-feedback';
    feedbackElement.className = 'user-feedback';
    feedbackElement.style.display = 'none';

    // Insert after error message element or at the beginning of container
    const errorElement = document.getElementById('error-message');
    const container = document.getElementById('app-container');

    if (errorElement && errorElement.parentElement) {
      errorElement.parentElement.insertBefore(feedbackElement, errorElement.nextSibling);
    } else if (container) {
      container.insertBefore(feedbackElement, container.firstChild);
    } else {
      document.body.appendChild(feedbackElement);
    }

    return feedbackElement;
  }

  /**
   * Show loading indicator with custom message (Requirements 1.5, 6.1, 6.2)
   * @param {boolean} show - Whether to show or hide the indicator
   * @param {string} message - Loading message
   */
  showLoadingIndicator(show, message = 'Loading...') {
    let loadingElement = document.getElementById('global-loading');

    if (!loadingElement) {
      loadingElement = this.createLoadingElement();
    }

    if (show) {
      const messageElement = loadingElement.querySelector('.loading-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      loadingElement.style.display = 'flex';
    } else {
      loadingElement.style.display = 'none';
    }
  }

  /**
   * Create global loading element if it doesn't exist
   * @returns {HTMLElement} Loading element
   */
  createLoadingElement() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'global-loading';
    loadingElement.className = 'global-loading';
    loadingElement.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-message">Loading...</div>
      </div>
    `;

    // Insert at the beginning of container
    const container = document.getElementById('app-container');
    if (container) {
      container.insertBefore(loadingElement, container.firstChild);
    } else {
      document.body.appendChild(loadingElement);
    }

    return loadingElement;
  }

  /**
   * Switch to a different project programmatically
   * @param {string} projectId - ID of project to switch to
   */
  async switchToProject(projectId) {
    if (this.projectSelector) {
      this.projectSelector.setSelectedProject(projectId);
    }
  }

  /**
   * Get the currently selected project
   * @returns {Object|null} Current project or null
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Check if the application is currently loading data
   * @returns {boolean} True if loading
   */
  isLoadingData() {
    return this.isLoading;
  }

  /**
   * Get current application state
   * @returns {Object} Application state object
   */
  getAppState() {
    return {
      ...this.appState,
      currentProject: this.currentProject,
      isLoading: this.isLoading,
      hasTimelineRenderer: !!this.timelineRenderer,
      hasProjectSelector: !!this.projectSelector,
      hasDataFetcher: !!this.dataFetcher
    };
  }

  /**
   * Update application state
   * @param {Object} newState - State updates to apply
   */
  updateAppState(newState) {
    this.appState = { ...this.appState, ...newState };
    console.log('App state updated:', this.appState);
  }

  /**
   * Reset application to initial state
   */
  resetAppState() {
    this.currentProject = null;
    this.isLoading = false;
    this.appState = {
      initialized: false,
      hasData: false,
      currentView: 'selector'
    };

    // Clear UI
    this.clearTimeline();
    if (this.projectSelector) {
      this.projectSelector.clearSelection();
    }
    this.hideError();
  }

  /**
   * Configure spreadsheet ID for data fetching
   * @param {string} spreadsheetId - Google Spreadsheet ID
   */
  configureSpreadsheet(spreadsheetId) {
    if (!spreadsheetId || typeof spreadsheetId !== 'string') {
      throw new Error('Invalid spreadsheet ID provided');
    }

    this.spreadsheetId = spreadsheetId;

    // Reinitialize data fetcher with new spreadsheet ID
    if (typeof DataFetcher !== 'undefined') {
      this.dataFetcher = new DataFetcher(this.spreadsheetId);
      console.log('Spreadsheet configured:', spreadsheetId);
    }
  }

  /**
   * Refresh application data
   */
  async refreshData() {
    if (!this.appState.initialized) {
      console.warn('Cannot refresh data: application not initialized');
      return;
    }

    try {
      this.showTimelineLoading(true);

      if (this.dataFetcher) {
        await this.loadProjects();

        // Reload current project if one is selected
        if (this.currentProject) {
          await this.handleProjectSelection(this.currentProject);
        }
      }

      this.showTimelineLoading(false);
      console.log('Data refreshed successfully');

    } catch (error) {
      this.showTimelineLoading(false);
      console.error('Failed to refresh data:', error);
      this.showError('Failed to refresh data: ' + error.message);
    }
  }
}

// Global app instance
let timelineApp = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  timelineApp = new TimelineApp();
  timelineApp.init();

  // Set up global event listeners for better data flow
  setupGlobalEventListeners();
});

/**
 * Set up global event listeners for enhanced data flow and error handling
 */
function setupGlobalEventListeners() {
  // Set up mobile-specific enhancements
  setupMobileEnhancements();
  // Handle page visibility changes to refresh data when user returns
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && timelineApp && timelineApp.getAppState().initialized) {
      console.log('Page became visible, checking for data updates...');
      // Optional: refresh data when user returns to page
      // timelineApp.refreshData();
    }
  });

  // Handle online/offline status changes
  window.addEventListener('online', () => {
    if (timelineApp) {
      timelineApp.showUserFeedback('success', 'Connection restored. Data will be refreshed.', 3000);
      // Refresh data when connection is restored
      setTimeout(() => {
        if (timelineApp.getAppState().initialized) {
          timelineApp.refreshData();
        }
      }, 1000);
    }
  });

  window.addEventListener('offline', () => {
    if (timelineApp) {
      timelineApp.showUserFeedback('warning', 'Connection lost. Some features may not work properly.', 0);
    }
  });

  // Handle unhandled promise rejections for better error reporting
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (timelineApp) {
      timelineApp.showUserFeedback('error', 'An unexpected error occurred. Please refresh the page if problems persist.');
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    if (timelineApp && event.error && event.error.message) {
      // Only show user feedback for non-trivial errors
      if (!event.error.message.includes('Script error') &&
        !event.error.message.includes('Non-Error promise rejection')) {
        timelineApp.showUserFeedback('error', 'A technical error occurred. Please refresh the page if problems persist.');
      }
    }
  });

  // Add keyboard shortcuts for better user experience
  document.addEventListener('keydown', (event) => {
    if (!timelineApp || !timelineApp.getAppState().initialized) return;

    // Ctrl/Cmd + R: Refresh data
    if ((event.ctrlKey || event.metaKey) && event.key === 'r' && event.shiftKey) {
      event.preventDefault();
      timelineApp.refreshData();
      timelineApp.showUserFeedback('info', 'Refreshing data...', 2000);
    }

    // Escape: Clear selection
    if (event.key === 'Escape') {
      if (timelineApp.projectSelector) {
        timelineApp.projectSelector.clearSelection();
      }
    }
  });
}

/**
 * Set up mobile-specific enhancements (Requirement 2.5)
 */
function setupMobileEnhancements() {
  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);

  if (isMobile) {
    console.log('Mobile device detected, applying mobile enhancements');

    // Add mobile-specific CSS class
    document.body.classList.add('mobile-device');

    // Prevent zoom on input focus (iOS)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Add touch-friendly interactions
    setupTouchEnhancements();

    // Handle orientation changes
    setupOrientationHandling();

    // Optimize performance for mobile
    setupMobilePerformanceOptimizations();
  }

  // Handle window resize for responsive behavior
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (timelineApp && timelineApp.timelineRenderer) {
        // Notify timeline renderer of resize
        console.log('Window resized, updating timeline layout');
        // Timeline will handle resize automatically via vis-timeline
      }
    }, 250);
  });
}

/**
 * Set up touch-specific enhancements
 */
function setupTouchEnhancements() {
  // Improve touch scrolling
  document.addEventListener('touchstart', () => { }, { passive: true });
  document.addEventListener('touchmove', () => { }, { passive: true });

  // Add haptic feedback for supported devices
  if ('vibrate' in navigator) {
    document.addEventListener('click', (event) => {
      if (event.target.matches('.nav-btn, .retry-button, .project-dropdown')) {
        navigator.vibrate(10); // Short haptic feedback
      }
    });
  }

  // Prevent double-tap zoom on specific elements
  const preventDoubleTapZoom = (selector) => {
    document.addEventListener('touchend', (event) => {
      if (event.target.matches(selector)) {
        event.preventDefault();
        event.target.click();
      }
    });
  };

  preventDoubleTapZoom('.nav-btn');
  preventDoubleTapZoom('.retry-button');
}

/**
 * Handle device orientation changes
 */
function setupOrientationHandling() {
  let orientationTimeout;

  const handleOrientationChange = () => {
    clearTimeout(orientationTimeout);
    orientationTimeout = setTimeout(() => {
      if (timelineApp) {
        console.log('Orientation changed, updating layout');

        // Show brief feedback about orientation change
        const isLandscape = window.innerHeight < window.innerWidth;
        timelineApp.showUserFeedback('info',
          `Switched to ${isLandscape ? 'landscape' : 'portrait'} mode`, 2000);

        // Refresh timeline layout if needed
        if (timelineApp.timelineRenderer && timelineApp.timelineRenderer.timeline) {
          setTimeout(() => {
            timelineApp.timelineRenderer.timeline.redraw();
          }, 300);
        }
      }
    }, 500); // Delay to allow for orientation transition
  };

  window.addEventListener('orientationchange', handleOrientationChange);

  // Fallback for browsers that don't support orientationchange
  window.addEventListener('resize', () => {
    clearTimeout(orientationTimeout);
    orientationTimeout = setTimeout(handleOrientationChange, 100);
  });
}

/**
 * Set up mobile performance optimizations
 */
function setupMobilePerformanceOptimizations() {
  // Reduce animation duration on mobile for better performance
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .timeline-card,
      .media-card,
      .nav-btn,
      .user-feedback {
        transition-duration: 0.15s !important;
      }
      
      .vis-item {
        transition-duration: 0.1s !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Use passive event listeners for better scroll performance
  const passiveSupported = (() => {
    let passive = false;
    try {
      const options = Object.defineProperty({}, 'passive', {
        get: () => { passive = true; }
      });
      window.addEventListener('test', null, options);
    } catch (err) { }
    return passive;
  })();

  if (passiveSupported) {
    document.addEventListener('touchstart', () => { }, { passive: true });
    document.addEventListener('touchmove', () => { }, { passive: true });
    document.addEventListener('wheel', () => { }, { passive: true });
  }

  // Optimize timeline for mobile devices
  if (timelineApp && timelineApp.timelineRenderer) {
    // Mobile-specific timeline options will be handled by TimelineRenderer
    console.log('Mobile timeline optimizations will be applied by TimelineRenderer');
  }
}

/**
 * Expose global functions for external access and debugging
 */
window.TimelineAppAPI = {
  getApp: () => timelineApp,
  getState: () => timelineApp ? timelineApp.getAppState() : null,
  refreshData: () => timelineApp ? timelineApp.refreshData() : null,
  switchProject: (projectId) => timelineApp ? timelineApp.switchToProject(projectId) : null,
  configureSpreadsheet: (spreadsheetId) => timelineApp ? timelineApp.configureSpreadsheet(spreadsheetId) : null,
  isMobile: () => document.body.classList.contains('mobile-device')
};