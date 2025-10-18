/**
 * ProjectSelector Component
 * Handles project selection interface with category grouping and status indicators
 */
class ProjectSelector {
  constructor(containerId, onProjectChange) {
    this.container = document.getElementById(containerId);
    this.selectElement = document.getElementById('project-select');
    this.projectInfo = document.getElementById('project-info');
    this.projectCategory = document.getElementById('project-category');
    this.projectStatus = document.getElementById('project-status');
    this.loadingIndicator = document.getElementById('loading-indicator');

    this.onProjectChange = onProjectChange;
    this.projects = [];
    this.selectedProject = null;

    if (!this.selectElement) {

      return;
    }

    this.init();
  }

  init() {
    if (!this.selectElement) {

      return;
    }

    // Add event listener for project selection changes
    this.selectElement.addEventListener('change', (event) => {
      this.handleProjectSelection(event.target.value);
    });
  }

  /**
   * Populate the project selector with projects grouped by category
   * @param {Array} projects - Array of project objects from main sheet
   */
  populateProjects(projects) {
    if (!this.selectElement) {

      return;
    }

    this.projects = projects;
    this.selectElement.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = t('selectProjectPlaceholder');
    this.selectElement.appendChild(defaultOption);

    // Group projects by category
    const projectsByCategory = this.groupProjectsByCategory(projects);

    // Create optgroups for each category
    Object.keys(projectsByCategory).sort().forEach(category => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;

      projectsByCategory[category].forEach(project => {
        const option = document.createElement('option');
        option.value = String(project.project_id);
        option.textContent = this.formatProjectOptionText(project);

        // Add completion status to option text
        if (project.completed_date) {
          option.textContent += ' ✓';
        }

        optgroup.appendChild(option);
      });

      this.selectElement.appendChild(optgroup);
    });
  }

  /**
   * Group projects by their category
   * @param {Array} projects - Array of project objects
   * @returns {Object} Projects grouped by category
   */
  groupProjectsByCategory(projects) {
    const grouped = {};

    projects.forEach(project => {
      const category = project.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(project);
    });

    // Sort projects within each category by name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.project_name.localeCompare(b.project_name));
    });

    return grouped;
  }

  /**
   * Format project option text for display in dropdown
   * @param {Object} project - Project object
   * @returns {string} Formatted text
   */
  formatProjectOptionText(project) {
    return project.project_name;
  }

  /**
   * Handle project selection change
   * @param {string} projectId - Selected project ID
   */
  handleProjectSelection(projectId) {
    if (!projectId) {
      this.hideProjectInfo();
      this.selectedProject = null;
      if (this.onProjectChange) {
        this.onProjectChange(null);
      }
      return;
    }

    // Find selected project (ensure string comparison)
    this.selectedProject = this.projects.find(p => String(p.project_id) === String(projectId));

    if (this.selectedProject) {
      this.showProjectInfo(this.selectedProject);

      // Notify parent component of selection change
      if (this.onProjectChange) {
        this.onProjectChange(this.selectedProject);
      }
    }
  }

  /**
   * Show project information below the selector
   * @param {Object} project - Selected project object
   */
  showProjectInfo(project) {
    // Update category display
    this.projectCategory.textContent = project.category || t('uncategorized');

    // Update status display
    const status = this.determineProjectStatus(project);
    this.projectStatus.textContent = status.text;
    this.projectStatus.className = `project-status ${status.class}`;

    // Show project info container
    this.projectInfo.style.display = 'block';
  }

  /**
   * Hide project information
   */
  hideProjectInfo() {
    this.projectInfo.style.display = 'none';
  }

  /**
   * Determine project status based on completion date
   * @param {Object} project - Project object
   * @returns {Object} Status object with text and CSS class
   */
  determineProjectStatus(project) {
    if (project.completed_date && project.completed_date.trim()) {
      return {
        text: `${t('completed')} (${project.completed_date})`,
        class: 'completed'
      };
    } else {
      return {
        text: t('inProgress'),
        class: 'in-progress'
      };
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.loadingIndicator.style.display = 'inline-block';
    this.selectElement.disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loadingIndicator.style.display = 'none';
    this.selectElement.disabled = false;
  }

  /**
   * Show error state
   * @param {string} message - Error message to display
   */
  showError(message) {
    this.selectElement.innerHTML = `<option value="">Error: ${message}</option>`;
    this.hideLoading();
  }

  /**
   * Get currently selected project
   * @returns {Object|null} Selected project object or null
   */
  getSelectedProject() {
    return this.selectedProject;
  }

  /**
   * Set selected project programmatically
   * @param {string} projectId - Project ID to select
   */
  setSelectedProject(projectId) {
    this.selectElement.value = projectId;
    this.handleProjectSelection(projectId);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectElement.value = '';
    this.handleProjectSelection('');
  }
}