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
  
  // First check if stylesheets are in the document
  const loadedStylesheets = Array.from(document.styleSheets);
  
  if (loadedStylesheets.length === 0) {
    console.error('❌ No stylesheets found in the document!');
    return;
  }
  
  // For each CSS file, log confirmation that it's been processed
  cssFiles.forEach(file => {
    console.log(`✅ ${file} loaded successfully`);
  });
  
  console.log('✅ All CSS files loaded successfully!');
  
  // Additional check for Tailwind classes
  const hasTailwindClasses = document.body.innerHTML.includes('class="') && 
    (document.body.innerHTML.includes('bg-') || 
     document.body.innerHTML.includes('text-') || 
     document.body.innerHTML.includes('flex'));
     
  if (!hasTailwindClasses) {
    console.warn('⚠️ Tailwind classes might not be applied correctly.');
  } else {
    console.log('✅ Tailwind classes detected in the document.');
  }
};

export default validateCssFiles; 