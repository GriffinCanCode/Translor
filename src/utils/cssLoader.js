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
  let allValid = true;
  
  cssFiles.forEach(file => {
    try {
      // Test importing the file - this is just for validation
      require(`../styles/${file}`);
      console.log(`✅ ${file} loaded successfully`);
    } catch (error) {
      console.error(`❌ Error loading ${file}: ${error.message}`);
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log('✅ All CSS files loaded successfully!');
  } else {
    console.error('❌ Some CSS files failed to load. Check the paths and imports.');
  }
};

export default validateCssFiles; 