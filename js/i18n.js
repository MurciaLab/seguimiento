// i18next configuration and initialization
const i18nConfig = {
  lng: 'es', // Spanish as default language
  fallbackLng: 'es',
  debug: false,
  backend: {
    loadPath: 'js/locales/{{lng}}.json'
  }
};

// Initialize i18next with HTTP backend
async function initializeI18n() {
  try {
    // Load Spanish translations
    const response = await fetch('js/locales/es.json');
    const translations = await response.json();
    
    // Configure i18next with loaded translations
    const config = {
      lng: 'es',
      fallbackLng: 'es',
      debug: false,
      resources: {
        es: {
          translation: translations
        }
      }
    };
    
    await i18next.init(config);
    console.log('i18next initialized successfully with Spanish translations');
    
    // Update translations after initialization
    updateTranslations();
    
  } catch (error) {
    console.error('Failed to initialize i18next:', error);
    // Fallback to basic configuration without external files
    await i18next.init({
      lng: 'es',
      fallbackLng: 'es',
      debug: false,
      resources: {
        es: {
          translation: {
            loading: 'Cargando...',
            selectProject: 'Selecciona un Proyecto:',
            selectProjectToView: 'Selecciona un proyecto para ver su cronología'
          }
        }
      }
    });
  }
}

// Helper function to get translation
function t(key, options = {}) {
  return i18next.t(key, options);
}

// Helper function to update HTML content with translations
function updateTranslations() {
  // Update page title
  document.title = t('pageTitle');
  
  // Update static HTML elements with data-i18n attributes
  const elementsWithI18n = document.querySelectorAll('[data-i18n]');
  elementsWithI18n.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = t(key);
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeI18n);

// Expose global functions
window.i18nHelpers = {
  t,
  updateTranslations
};