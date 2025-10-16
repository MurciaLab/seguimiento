// DataFetcher component for multi-sheet Google Spreadsheet access
class DataFetcher {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.parser = new PublicGoogleSheetsParser();
    this.mainSheetId = '885988754'; // Main sheet ID from existing proposals.js
  }

  async fetchProjectList() {
    try {
      // Configure parser for main sheet
      this.parser.setOption({ sheetId: this.mainSheetId });
      
      // Fetch project list from main sheet
      const projects = await this.parser.parse(this.spreadsheetId);
      
      // Validate required columns exist
      if (projects.length > 0) {
        const requiredColumns = ['project_id', 'project_name', 'completed_date', 'category'];
        const firstProject = projects[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstProject));
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns in main sheet: ${missingColumns.join(', ')}`);
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Error fetching project list:', error);
      throw new Error(`Failed to fetch project list: ${error.message}`);
    }
  }

  async fetchProjectTimeline(projectId) {
    try {
      // Create new parser instance for project sheet
      const projectParser = new PublicGoogleSheetsParser();
      
      // Configure parser for project-specific sheet using project_id as sheet name
      projectParser.setOption({ sheetName: projectId });
      
      // Fetch timeline data from project sheet
      const timelineData = await projectParser.parse(this.spreadsheetId);
      
      // Validate required columns exist
      if (timelineData.length > 0) {
        const requiredColumns = ['date_announced', 'news_link', 'headline', 'description', 'party'];
        const firstEvent = timelineData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstEvent));
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns in project sheet ${projectId}: ${missingColumns.join(', ')}`);
        }
      }
      
      return timelineData;
    } catch (error) {
      console.error(`Error fetching timeline for project ${projectId}:`, error);
      
      // Handle case where project sheet doesn't exist
      if (error.message.includes('Unable to parse') || error.message.includes('not found')) {
        throw new Error(`Project sheet "${projectId}" does not exist or is not accessible`);
      }
      
      throw new Error(`Failed to fetch timeline for project ${projectId}: ${error.message}`);
    }
  }

  transformToTimelineFormat(rawData) {
    return rawData.map((event, index) => {
      try {
        // Parse date from DD/MM/YYYY format
        const parsedDate = this.parseDate(event.date_announced);
        
        // Create timeline item in vis-timeline format
        return {
          id: `event_${index}`,
          start: parsedDate,
          content: this.createEventContent(event),
          title: event.headline || 'Media Event', // Minimal tooltip
          group: event.party || 'Unknown',
          className: `party-${(event.party || 'unknown').toLowerCase().replace(/\s+/g, '-')}`,
          type: 'box'
        };
      } catch (error) {
        console.warn(`Skipping invalid event at index ${index}:`, error.message);
        return null;
      }
    }).filter(item => item !== null); // Remove invalid entries
  }

  parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error('Invalid or missing date');
    }

    // Handle DD/MM/YYYY format
    const dateParts = dateString.trim().split('/');
    if (dateParts.length !== 3) {
      throw new Error(`Invalid date format: ${dateString}. Expected DD/MM/YYYY`);
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(dateParts[2], 10);

    // Validate date components
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components in: ${dateString}`);
    }

    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
      throw new Error(`Date out of valid range: ${dateString}`);
    }

    const date = new Date(year, month, day);
    
    // Verify the date was created correctly (handles invalid dates like 31/02/2020)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    return date;
  }

  createEventContent(event) {
    // Create basic HTML content for timeline card
    // This will be enhanced by CardRenderer in later tasks
    const headline = event.headline || 'No headline';
    const description = event.description || 'No description available';
    const party = event.party || 'Unknown';
    const newsLink = event.news_link || '#';

    return `
      <div class="timeline-card">
        <div class="card-header">
          <h4 class="card-title">${this.escapeHtml(headline)}</h4>
          <span class="party-badge party-${party.toLowerCase().replace(/\s+/g, '-')}">${this.escapeHtml(party)}</span>
        </div>
        <div class="card-body">
          <p class="card-description">${this.escapeHtml(description)}</p>
          <a href="${this.escapeHtml(newsLink)}" target="_blank" class="card-link">View Source</a>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}