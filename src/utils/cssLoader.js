/**
 * CSS Loader Utility
 * 
 * Helps validate that all required CSS files are properly loaded
 * Used for debugging in development environments
 */

const cssFiles = [
  'globals.css',
  'theme.css',
  'common.css',
  'layout.css',
  'dashboard.css',
  'conversation.css',
  'lessons.css',
  'profile.css',
  'settings.css',
  'animations.css',
  'responsive.css'
];

export const validateCssFiles = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🎨 Validating CSS files...');
  
  try {
    // First check if stylesheets are in the document
    const loadedStylesheets = Array.from(document.styleSheets || []);
    
    if (loadedStylesheets.length === 0) {
      console.warn('⚠️ No stylesheets found in the document. CSS might not be loaded correctly.');
      return;
    }
    
    // Check for webpack-injected styles
    const hasWebpackStyles = loadedStylesheets.some(sheet => 
      !sheet.href && sheet.cssRules && sheet.cssRules.length > 0
    );
    
    if (hasWebpackStyles) {
      console.log('✅ Webpack-injected styles detected');
      
      // Check for specific CSS rules to verify content is loaded
      const styleContent = Array.from(loadedStylesheets)
        .filter(sheet => !sheet.href)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules || [])
              .map(rule => rule.cssText || '')
              .join(' ');
          } catch (e) {
            // CORS restrictions might prevent reading cssRules
            return '';
          }
        })
        .join(' ');
      
      // Check for presence of specific CSS class patterns from our files
      let allDetected = true;
      
      const detectionPatterns = {
        'globals.css': ['.body', 'html', 'body'],
        'theme.css': ['--color-primary', '--color-secondary', 'theme-light', 'theme-dark'],
        'common.css': ['.btn', '.card'],
        'layout.css': ['.app-header', '.app-sidebar', '.app-main'],
        'dashboard.css': ['.dashboard-card', '.dashboard-stat'],
        'conversation.css': ['.conversation-', '.message-'],
        'lessons.css': ['.lesson-card', '.lesson-title'],
        'profile.css': ['.profile-', '.user-'],
        'settings.css': ['.settings-', '.preference-'],
        'animations.css': ['.animate-fade', '.animate-slide'],
        'responsive.css': ['@media']
      };
      
      // For each CSS file, check if its pattern is found
      Object.entries(detectionPatterns).forEach(([file, patterns]) => {
        const isDetected = patterns.some(pattern => styleContent.includes(pattern));
        if (isDetected) {
          console.log(`✅ ${file} content detected`);
        } else {
          console.warn(`⚠️ ${file} might not be loaded`);
          allDetected = false;
        }
      });
      
      if (allDetected) {
        console.log('✅ All CSS content appears to be loaded!');
      } else {
        console.warn('⚠️ Some CSS content might be missing.');
      }
    } else {
      // Fall back to checking external stylesheet URLs
      const loadedStylesheetUrls = loadedStylesheets.map(sheet => {
        try {
          return sheet.href ? new URL(sheet.href).pathname.split('/').pop() : '';
        } catch (e) {
          return '';
        }
      }).filter(Boolean);
      
      // For each CSS file, check if it's been loaded
      let allLoaded = true;
      cssFiles.forEach(file => {
        const isLoaded = loadedStylesheetUrls.some(url => url.includes(file));
        if (isLoaded) {
          console.log(`✅ ${file} appears to be loaded`);
        } else {
          console.warn(`⚠️ ${file} might not be loaded`);
          allLoaded = false;
        }
      });
      
      if (allLoaded) {
        console.log('✅ All expected CSS files appear to be loaded!');
      } else {
        console.warn('⚠️ Some CSS files might be missing.');
      }
    }
    
    // Additional check for Tailwind classes
    const hasTailwindClasses = document.body && document.body.innerHTML && 
      (document.body.innerHTML.includes('class="') && 
       (document.body.innerHTML.includes('bg-') || 
        document.body.innerHTML.includes('text-') || 
        document.body.innerHTML.includes('flex')));
        
    if (!hasTailwindClasses) {
      console.warn('⚠️ Tailwind classes might not be applied correctly.');
    } else {
      console.log('✅ Tailwind classes detected in the document.');
    }
  } catch (error) {
    console.error('❌ Error validating CSS files:', error);
  }
};

export default validateCssFiles; 