# Design Document

## Overview

The Google Sheet Timeline system will extend the existing MurciaLAB project structure to create a multi-project timeline visualization system. Users can select from a list of city government projects and view dedicated interactive timelines showing news coverage, social media posts, and other media events for each project. The system uses a multi-sheet Google Spreadsheet structure with a main project directory and individual project timeline sheets.

## Architecture

### High-Level Architecture

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Google Spreadsheet │────│  Timeline System │────│ Timeline Visualization │
│  ┌─────────────────┐│    │   (Web App)      │    │     (vis-timeline)   │
│  │   Main Sheet    ││    │                  │    └─────────────────────┘
│  │ (Project List)  ││    │                  │
│  └─────────────────┘│    │                  │    ┌─────────────────────┐
│  ┌─────────────────┐│    │                  │────│  Project Selector   │
│  │ Project Sheet 1 ││    │                  │    │   (Dropdown/List)   │
│  └─────────────────┘│    │                  │    └─────────────────────┘
│  ┌─────────────────┐│    │                  │
│  │ Project Sheet 2 ││    │                  │
│  └─────────────────┘│    │                  │
│         ...         │    └──────────────────┘
└─────────────────────┘
```

### Technology Stack

- **Data Fetching**: `public-google-sheets-parser` (already integrated)
- **Timeline Visualization**: vis-timeline library
- **Frontend**: Vanilla HTML/CSS/JavaScript (consistent with existing project)
- **Hosting**: Static hosting (GitHub Pages, Netlify, etc.)

### Data Flow

1. **Initialization**: Web application loads and fetches main project list
2. **Project Selection**: User selects a project from the project selector
3. **Project Data Fetching**: Fetch specific project sheet data using project_id
4. **Data Transformation**: Convert project sheet rows to vis-timeline format
5. **Timeline Rendering**: Display project-specific timeline with media events
6. **Project Switching**: Allow users to switch between different project timelines

## Components and Interfaces

### Core Components

#### 1. DataFetcher Component
```javascript
class DataFetcher {
  constructor(spreadsheetId)
  async fetchProjectList()
  async fetchProjectTimeline(projectId)
  transformToTimelineFormat(rawData)
}
```

**Responsibilities:**
- Fetch main project list from the primary sheet
- Fetch individual project timeline data by project_id
- Transform raw sheet data to vis-timeline format
- Handle API errors and missing project sheets

#### 2. TimelineRenderer Component
```javascript
class TimelineRenderer {
  constructor(containerId, options)
  render(timelineData)
  updateData(newData)
  destroy()
}
```

**Responsibilities:**
- Initialize and configure timeline visualization library
- Render timeline with news events
- Handle timeline updates and interactions

#### 3. MediaTypeHandler Component
```javascript
class MediaTypeHandler {
  static detectMediaType(url)
  static isTwitterLink(url)
  static isNewsArticle(url)
  static formatMediaCard(mediaEvent, mediaType)
  static createMediaIcon(mediaType)
}
```

**Responsibilities:**
- Detect media type from URL (Twitter, news sites, etc.)
- Apply appropriate styling and icons for different media types
- Format timeline cards based on media type
- Handle unknown or unsupported media types

#### 4. CardRenderer Component
```javascript
class CardRenderer {
  constructor()
  static createNewsCard(newsEvent)
  static formatCardContent(newsEvent)
  static addPartyBadge(cardElement, party)
}
```

**Responsibilities:**
- Generate HTML card content for timeline items
- Format news event information as rich cards
- Apply party-specific styling and badges to cards

### Data Interfaces

#### Main Sheet Schema
```javascript
interface Project {
  project_id: string;       // "1", "2", "3"
  project_name: string;     // "Tranvía al Carmen"
  completed_date: string;   // "" or "DD/MM/YYYY"
  category: string;         // "Movilidad", "Parques y jardines"
}
```

#### Project Sheet Schema
```javascript
interface MediaEvent {
  date_announced: string;   // "28/01/2020"
  news_link: string;       // "https://..." (news, Twitter, etc.)
  headline: string;        // "Podemos-EQUO lleva al pleno..."
  description: string;     // "Iniciar los estudios para..."
  party: string;          // "Podemos", "PSOE", "PP"
}
```

#### vis-timeline Format
```javascript
interface TimelineItem {
  id: string;
  start: Date;
  content: string;  // Rich HTML card content
  title?: string;   // Optional tooltip (minimal use)
  group?: string;   // For party grouping
  className?: string;  // For party-based styling
  type?: 'box';     // Card-style items
}
```

## Data Models

### Project Management

1. **Project Loading**: Fetch and display list of available projects from main sheet
2. **Project Selection**: Handle user selection and load corresponding project timeline
3. **Project Switching**: Allow seamless switching between different project timelines

### Media Event Processing

1. **Date Parsing**: Convert "DD/MM/YYYY" format to JavaScript Date objects
2. **Media Type Detection**: Analyze news_link URL to determine media type (Twitter, news, etc.)
3. **Card Content Generation**: Create rich HTML card content for timeline items including:
   - Headline as card title
   - Description text in card body
   - Party badge with color coding
   - Media type icon (Twitter, news, etc.)
   - Clickable links to original media sources
   - Publication date display

4. **Grouping Strategy**: Group events by political party for visual organization
5. **Card Styling**: Apply party-specific and media-type-specific styling to cards

### vis-timeline Configuration

```javascript
const timelineOptions = {
  orientation: 'top',
  stack: true,
  showCurrentTime: false,
  zoomable: true,
  moveable: true,
  type: 'box',  // Card-style items
  margin: {
    item: 10,   // Space between cards
    axis: 20    // Space from timeline axis
  },
  groupOrder: 'content',  // Order parties alphabetically
  template: function(item) {
    // Custom card template rendering
    return item.content;
  }
};
```

## Error Handling

### Data Fetching Errors
- **Network Issues**: Display user-friendly error message with retry option
- **Invalid Sheet Structure**: Validate required columns and show specific error
- **Empty Data**: Handle gracefully with "No data available" message

### Timeline Rendering Errors
- **Library Loading Failures**: Fallback to simple list view
- **Invalid Date Formats**: Skip invalid entries and log warnings
- **Media Embed Failures**: Show placeholder or text-only version

### User Experience Errors
- **Performance Issues**: Implement data pagination for large datasets
- **Mobile Compatibility**: Ensure timeline works on touch devices
- **Accessibility**: Provide keyboard navigation and screen reader support

## Testing Strategy

### Unit Testing Focus Areas
1. **Data Transformation**: Test Google Sheet data parsing and timeline format conversion
2. **Date Handling**: Verify correct parsing of DD/MM/YYYY format
3. **Media Detection**: Test Twitter link detection and embed generation
4. **Error Scenarios**: Test handling of malformed data and API failures

### Integration Testing
1. **Google Sheets API**: Test with actual sheet data and various data scenarios
2. **Timeline Library**: Verify timeline renders correctly with transformed data
3. **Cross-browser**: Test timeline functionality across major browsers
4. **Responsive Design**: Test timeline behavior on different screen sizes

### Manual Testing Scenarios
1. **Timeline Navigation**: Verify zoom and scroll functionality works smoothly
2. **Card Interaction**: Test card display, readability, and click behaviors for news events
3. **Media Embeds**: Verify Twitter embeds and news links work correctly within cards
4. **Party Grouping**: Confirm visual grouping and color coding by political party
5. **Card Layout**: Test card spacing, sizing, and responsive behavior

## Implementation Considerations

### vis-timeline Implementation
**Selected Library: vis-timeline**
- **Card-based Display**: Use `type: 'box'` for card-style timeline items
- **Rich Content**: HTML content in cards with headlines, descriptions, and party badges
- **Interactive Features**: Built-in zoom, pan, and selection capabilities
- **Grouping Support**: Visual grouping by political party
- **Customization**: Flexible styling and templating options for news cards

### Performance Optimization
- **Data Caching**: Cache Google Sheets data in localStorage with timestamp
- **Lazy Loading**: Load media embeds only when visible
- **Debounced Updates**: Throttle timeline updates during rapid interactions

### Accessibility Features
- **Keyboard Navigation**: Support arrow keys for timeline navigation
- **Screen Reader Support**: Provide alt text and ARIA labels
- **High Contrast**: Ensure party colors meet accessibility standards
- **Focus Management**: Clear focus indicators for interactive elements

### Mobile Considerations
- **Touch Gestures**: Ensure pinch-to-zoom and swipe work on mobile
- **Responsive Layout**: Adapt timeline height and controls for mobile screens
- **Performance**: Optimize for mobile rendering performance