#!/usr/bin/env node
/**
 * index.ts
 * 
 * Main entry point for the Gemini Flash MCP server.
 * This file implements a basic MCP server that exposes the image generation
 * functionality to Roo Code and other MCP-compatible AI assistants.
 * 
 * The server follows the Model Context Protocol (MCP) specification to provide
 * a standardised interface for AI assistants to generate images using
 * Google's Gemini 2.0 Flash model.
 */

import express from 'express';
import { createServer } from 'http';
import { GeminiImageGenerator, ImageGenerationOptions } from './gemini.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running as a script or imported as a module
const isRunningAsScript = process.argv[1] === fileURLToPath(import.meta.url);

// Define the port for the HTTP server
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize the Gemini image generator
let imageGenerator: GeminiImageGenerator;
try {
  imageGenerator = new GeminiImageGenerator(
    process.env.GEMINI_API_KEY || '',
    path.join(__dirname, '..', 'generated-images')
  );
} catch (error) {
  console.error('Failed to initialize Gemini image generator:', error);
  process.exit(1);
}

/**
 * MCP Tool schema for image generation
 */
const generateImageToolSchema = {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description: 'Text description of the desired image',
    },
    temperature: {
      type: 'number',
      description: 'Controls randomness (0.0 to 1.0)',
      default: 1.0,
    },
    topP: {
      type: 'number',
      description: 'Controls diversity via nucleus sampling',
      default: 0.95,
    },
    topK: {
      type: 'number',
      description: 'Controls diversity via top-k sampling',
      default: 40,
    },
    maxOutputTokens: {
      type: 'number',
      description: 'Maximum number of tokens to generate',
      default: 8192,
    },
  },
  required: ['prompt'],
};

/**
 * MCP endpoint for listing available tools
 */
app.post('/mcp/listTools', (req, res) => {
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    result: {
      tools: [
        {
          name: 'generate_image',
          description: 'Generate an image using Google\'s Gemini 2.0 Flash model',
          inputSchema: generateImageToolSchema,
        },
      ],
    },
  });
});

/**
 * MCP endpoint for calling a tool
 */
app.post('/mcp/callTool', async (req, res) => {
  const { id, params } = req.body;
  const { name, arguments: args } = params;

  if (name !== 'generate_image') {
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Tool not found: ${name}`,
      },
    });
  }

  try {
    // Validate required parameters
    if (!args.prompt) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: 'Missing required parameter: prompt',
        },
      });
    }

    // Prepare options for image generation
    const options: ImageGenerationOptions = {
      prompt: args.prompt,
      temperature: args.temperature,
      topP: args.topP,
      topK: args.topK,
      maxOutputTokens: args.maxOutputTokens,
    };

    // Generate the image
    const result = await imageGenerator.generateImage(options);

    if (result.error) {
      return res.json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: `Image generation failed: ${result.error}`,
        },
      });
    }

    // If we have an image path, return it
    if (result.imagePath) {
      // Convert the image path to a URL
      const imageUrl = `/images/${path.basename(result.imagePath)}`;
      
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'image',
              imageUrl,
            },
            {
              type: 'text',
              text: `Image generated successfully: ${imageUrl}`,
            },
          ],
        },
      });
    }

    // If we don't have an image path, return an error
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Image generation failed: No image was produced',
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
});

/**
 * Serve static files from the generated-images directory
 */
app.use('/images', express.static(path.join(__dirname, '..', 'generated-images')));

/**
 * Serve the test HTML page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-gemini.html'));
});

/**
 * Start the server if running as a script
 */
if (isRunningAsScript) {
  server.listen(PORT, () => {
    console.log(`Gemini Flash MCP server running on http://localhost:${PORT}`);
    console.log(`Test interface available at http://localhost:${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server shut down');
      process.exit(0);
    });
  });
}

/**
 * Export the Express app and server for testing and programmatic usage
 */
export { app, server };