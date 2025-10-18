// DataFetcher component for multi-sheet Google Spreadsheet access
class DataFetcher {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.parser = new PublicGoogleSheetsParser();
    this.mainSheetId = '885988754';

    // Configure parser to use formatted data from spreadsheet
    this.parser.setOption({ useFormat: true });
  }

  async fetchProjectList() {
    try {
      // Configure parser for main sheet
      this.parser.setOption({ sheetId: this.mainSheetId });

      // Fetch project list from main sheet
      const projects = await this.parser.parse(this.spreadsheetId);

      // Validate required columns exist (completed_date is optional)
      if (projects.length > 0) {
        const requiredColumns = ['project_id', 'project_name', 'category'];
        const optionalColumns = ['completed_date'];
        const firstProject = projects[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstProject));

        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns in main sheet: ${missingColumns.join(', ')}`);
        }

        // Log info about optional columns that are missing
        const missingOptionalColumns = optionalColumns.filter(col => !(col in firstProject));
        if (missingOptionalColumns.length > 0) {
          console.info(`Optional columns not found in main sheet: ${missingOptionalColumns.join(', ')}`);
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
      projectParser.setOption({
        sheetName: projectId,
        useFormat: true  // Get formatted data from spreadsheet
      });

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
          title: event.headline || t('mediaEvent'), // Minimal tooltip
          party: event.party, // Keep original party name for processing
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
    if (!dateString) {
      throw new Error('Invalid or missing date');
    }

    // Convert to string if it's not already
    const dateStr = String(dateString).trim();

    // Handle DD/MM/YYYY format (most common from formatted Google Sheets)
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // JavaScript months are 0-indexed
      const year = parseInt(ddmmyyyyMatch[3], 10);

      const date = new Date(year, month, day);

      // Verify the date was created correctly (handles invalid dates like 31/02/2020)
      if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        throw new Error(`Invalid date: ${dateString}`);
      }

      return date;
    }

    // Handle MM/DD/YYYY format (alternative US format)
    const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      // Try MM/DD/YYYY if DD/MM/YYYY didn't work
      const month = parseInt(mmddyyyyMatch[1], 10) - 1;
      const day = parseInt(mmddyyyyMatch[2], 10);
      const year = parseInt(mmddyyyyMatch[3], 10);

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const date = new Date(year, month, day);

        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date;
        }
      }
    }

    // Handle ISO date format (YYYY-MM-DD)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);

      const date = new Date(year, month, day);

      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }

    // Try parsing as a standard JavaScript date string
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    throw new Error(`Invalid date format: ${dateString}. Expected DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, or standard date format`);
  }

  createEventContent(event) {
    // Create compact HTML content for timeline card
    const headline = event.headline || t('noHeadlineAvailable');
    const description = event.description || t('noDescriptionAvailable');
    const party = event.party || 'Unknown';
    const newsLink = event.news_link || '#';

    // Get party class for styling
    const partyClass = party ? `party-${party.toLowerCase().replace(/\s+/g, '-')}` : 'party-other';

    // Truncate description to keep cards compact
    const truncatedDescription = description.length > 160
      ? description.substring(0, 160).trim() + '...'
      : description;

    // Format the date for display
    const eventDate = event.date_announced || 'No date';

    return `
      <div class="timeline-card-compact ${partyClass}" style="background-color: white; padding: 8px 10px;">
        <div style="margin-bottom: 8px; color: #2d3748; font-size: 13px; font-weight: bold;">
          <strong>${this.escapeHtml(headline)}</strong>
        </div>
        <div style="margin-bottom: 8px; color: #718096; font-size: 10px; font-weight: 500;">
          <em>${this.escapeHtml(eventDate)}</em>
        </div>
        <div style="margin-bottom: 15px; color: #4a5568; font-size: 11px; line-height: 1.4;">
          ${this.escapeHtml(truncatedDescription)}
        </div>
        <div style="text-align: right; padding-top: 8px;">
          <a href="${this.escapeHtml(newsLink)}" target="_blank">📰</a>
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