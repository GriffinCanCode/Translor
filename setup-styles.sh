#!/bin/bash

# Setup script for Translor CSS styling system
echo "Setting up Translor CSS styling system..."

# Install required dependencies
echo "Installing required dependencies..."
npm install --save-dev css-minimizer-webpack-plugin

# Ensure all style directories exist
echo "Checking style directories..."
mkdir -p src/styles

# Check if CSS files exist and create them if missing
CSS_FILES=(
  "animations.css"
  "common.css"
  "conversation.css"
  "dashboard.css"
  "globals.css"
  "layout.css"
  "lessons.css"
  "profile.css"
  "responsive.css"
  "settings.css"
  "theme.css"
  "index.css"
)

for file in "${CSS_FILES[@]}"; do
  if [ ! -f "src/styles/$file" ]; then
    echo "Creating missing file: src/styles/$file"
    touch "src/styles/$file"
  else
    echo "File exists: src/styles/$file"
  fi
done

# Update package.json if needed
echo "Checking package.json for required dependencies..."
if ! grep -q "css-minimizer-webpack-plugin" package.json; then
  echo "Adding css-minimizer-webpack-plugin to package.json"
  # This is a simple approach, might need a more robust solution for complex package.json structures
  sed -i '' 's/"css-loader": "\^[0-9.]*"/"css-loader": "\^[0-9.]*",\n    "css-minimizer-webpack-plugin": "\^5.0.1"/' package.json
fi

echo "Setup complete!"
echo "You can now run 'npm run dev' to start the development server." 