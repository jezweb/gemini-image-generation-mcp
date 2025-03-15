/**
 * test-gemini.js
 * 
 * A simple test script for the Gemini image generation functionality.
 * This script can be run directly to test the Gemini API without going through the MCP server.
 */

import { createGeminiImageGenerator } from './build/gemini.js';
import fs from 'fs';
import path from 'path';

// Check if API key is provided
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Please set the environment variable and try again:');
  console.error('  export GEMINI_API_KEY=your-api-key');
  process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'generated-images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create the image generator
const imageGenerator = createGeminiImageGenerator(outputDir);

// Default test prompt
const defaultPrompt = 'A sailing boat on Sydney Harbour with the Opera House in the background';

// Get prompt from command line arguments or use default
const prompt = process.argv[2] || defaultPrompt;

console.log(`Testing Gemini image generation with prompt: "${prompt}"`);
console.log('Output directory:', outputDir);
console.log('Generating image...');

// Generate the image
imageGenerator.generateImage({ prompt })
  .then(result => {
    if (result.error) {
      console.error('Error generating image:', result.error);
      process.exit(1);
    }
    
    if (result.imagePath) {
      console.log('Image generated successfully!');
      console.log('Image saved to:', result.imagePath);
    } else {
      console.log('No image was generated');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });