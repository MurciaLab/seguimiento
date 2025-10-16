// Main application controller
class TimelineApp {
  constructor() {
    this.dataFetcher = null;
    this.projectSelector = null;
    this.timelineRenderer = null;
    this.currentProject = null;
    this.isLoading = false;
  }

  async init() {
    try {
      // Initialize timeline renderer
      this.timelineRenderer = new TimelineRenderer('timeline-container');

      // Initialize project selector with callback for project changes
      this.projectSelector = new ProjectSelector('project-selector', (project) => {
        this.handleProjectSelection(project);
      });

      // Initialize data fetcher (will be implemented in task 2)
      // For now, we'll create a placeholder that can be used when DataFetcher is ready
      if (typeof DataFetcher !== 'undefined') {
        // Spreadsheet ID will need to be configured
        this.dataFetcher = new DataFetcher('your-spreadsheet-id-here');
        await this.loadProjects();
      } else {
        // Show placeholder projects for testing the selector
        this.loadPlaceholderProjects();
      }

    } catch (error) {
      this.showError('Failed to initialize application: ' + error.message);
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
        category: 'Parques y jardines',
        completed_date: ''
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
        category: 'Sanidad',
        completed_date: ''
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
      return;
    }

    // Prevent multiple simultaneous loads for the same project
    if (this.isLoading || (this.currentProject && this.currentProject.project_id === project.project_id)) {
      return;
    }

    try {
      this.isLoading = true;
      this.currentProject = project;

      // Show loading state immediately (Requirement 1.3 - user feedback during fetch)
      this.showTimelineLoading(true);

      // Requirement 1.3: Fetch the corresponding Project_Sheet data
      if (this.dataFetcher && typeof this.dataFetcher.fetchProjectTimeline === 'function') {
        console.log(`Fetching timeline data for project: ${project.project_name} (ID: ${project.project_id})`);

        const timelineData = await this.dataFetcher.fetchProjectTimeline(project.project_id);

        // Validate that we received data for the correct project
        if (!timelineData || timelineData.length === 0) {
          console.warn(`No timeline data found for project ${project.project_id}`);
          this.showEmptyTimeline(project);
        } else {
          // Requirement 1.4: Display Project_Timeline showing Media_Events for selected project only
          if (this.timelineRenderer) {
            const success = this.timelineRenderer.updateData(timelineData);
            if (success) {
              console.log(`Rendered ${timelineData.length} media events for project ${project.project_name}`);
            } else {
              this.showPlaceholderTimeline(project, timelineData.length);
            }
          } else {
            this.showPlaceholderTimeline(project, timelineData.length);
          }
        }
      } else {
        // Show placeholder timeline for testing when DataFetcher is not available
        console.log(`DataFetcher not available, showing test timeline for project: ${project.project_name}`);
        this.showTestTimeline(project);
      }

      this.showTimelineLoading(false);

    } catch (error) {
      this.showTimelineLoading(false);
      console.error(`Error loading timeline for project ${project.project_name}:`, error);

      // Show user-friendly error message
      this.showError(`Failed to load timeline for "${project.project_name}". Please try again.`);

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
        <p>Status: ${project.completed_date ? `Completed (${project.completed_date})` : 'In Progress'}</p>
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
        <p>Status: ${project.completed_date ? `Completed (${project.completed_date})` : 'In Progress'}</p>
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
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  hideError() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'none';
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
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new TimelineApp();
  app.init();
});