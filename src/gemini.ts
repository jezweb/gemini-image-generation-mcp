/**
 * gemini.ts
 * 
 * This module handles the integration with Google's Gemini 2.0 Flash image generation API.
 * It provides a clean interface for generating images from text prompts with various
 * configuration options.
 * 
 * The module follows the Single Responsibility Principle by focusing solely on
 * Gemini API interactions, making it easy to maintain and extend.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  GenerationConfig,
} from "@google/generative-ai";
// Note: We're not importing GoogleAIFileManager as it's not available in the types
import fs from 'fs';
import path from 'path';
import os from 'os';

// Default model name for Gemini 2.0 Flash image generation
const MODEL_NAME = "gemini-2.0-flash-exp-image-generation";

// Default generation configuration
const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 1.0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  // Note: responseMimeType is not in the TypeScript types but is supported by the API
  // We'll use a type assertion to include it
};

// Extended generation config with responseMimeType
interface ExtendedGenerationConfig extends GenerationConfig {
  responseMimeType?: string;
}

/**
 * Interface for image generation options
 */
export interface ImageGenerationOptions {
  prompt: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  outputDirectory?: string;
}

/**
 * Interface for image generation result
 */
export interface ImageGenerationResult {
  imageData: Buffer | null;
  imagePath: string | null;
  error?: string;
}

// Define custom interfaces for the Gemini API response types
interface FileData {
  mimeType: string;
  fileUri: string;
}

interface ExtendedPart {
  text?: string;
  fileData?: FileData;
}

interface ExtendedContent {
  parts: ExtendedPart[];
  role: string;
}

interface ExtendedCandidate {
  content: ExtendedContent;
  finishReason: string;
  index: number;
}

interface ExtendedResponse {
  candidates: ExtendedCandidate[];
}

/**
 * GeminiImageGenerator class
 *
 * Handles image generation using Google's Gemini 2.0 Flash model.
 * Follows the Open/Closed Principle by allowing extension through configuration
 * without modifying the core functionality.
 */
export class GeminiImageGenerator {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private outputDirectory: string;

  /**
   * Constructor for GeminiImageGenerator
   *
   * @param apiKey - Google AI API key
   * @param outputDirectory - Directory to save generated images (defaults to temp directory)
   */
  constructor(apiKey: string, outputDirectory?: string) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: MODEL_NAME });
    this.outputDirectory = outputDirectory || path.join(os.tmpdir(), 'gemini-images');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }
  }

  /**
   * Generate an image from a text prompt
   *
   * @param options - Image generation options
   * @returns Promise resolving to ImageGenerationResult
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      // Create generation config by merging defaults with provided options
      const generationConfig: ExtendedGenerationConfig = {
        temperature: options.temperature ?? DEFAULT_CONFIG.temperature,
        topP: options.topP ?? DEFAULT_CONFIG.topP,
        topK: options.topK ?? DEFAULT_CONFIG.topK,
        maxOutputTokens: options.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens,
        responseMimeType: "image/png", // Add this even though it's not in the types
      };

      // Start a chat session with the model
      const chatSession = this.model.startChat({
        generationConfig: generationConfig as GenerationConfig, // Type assertion
        history: [],
      });

      // Send the prompt to generate an image
      const result = await chatSession.sendMessage(options.prompt);
      
      // Use type assertion to access the extended response properties
      const response = result.response as unknown as ExtendedResponse;
      
      // Check if we have a response with image data
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0] as ExtendedPart;
          
          // Handle image data if present
          if (part.fileData && part.fileData.mimeType.startsWith('image/')) {
            // Get image data from the file URI
            const fileUri = part.fileData.fileUri;
            if (fileUri) {
              // Save the image to the output directory
              const timestamp = new Date().getTime();
              const imageName = `gemini-image-${timestamp}.png`;
              const imagePath = path.join(this.outputDirectory, imageName);
              
              console.log(`Image would be saved to: ${imagePath}`);
              console.log(`File URI: ${fileUri}`);
              
              // TODO: Implement fetching and saving the image from fileUri
              // This is a placeholder as the actual implementation depends on how
              // Google provides access to the generated image
              
              return {
                imageData: null, // Will be populated with actual image data
                imagePath: imagePath,
              };
            }
          }
        }
      }
      
      // If we reach here, no image was found in the response
      return {
        imageData: null,
        imagePath: null,
        error: "No image was generated in the response",
      };
    } catch (error) {
      console.error("Error generating image:", error);
      return {
        imageData: null,
        imagePath: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the output directory for saved images
   *
   * @returns The path to the output directory
   */
  getOutputDirectory(): string {
    return this.outputDirectory;
  }

  /**
   * Set a new output directory for saved images
   *
   * @param directory - New directory path
   */
  setOutputDirectory(directory: string): void {
    this.outputDirectory = directory;
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }
  }
}

/**
 * Create a GeminiImageGenerator instance using the API key from environment variables
 *
 * @param outputDirectory - Optional custom output directory
 * @returns A configured GeminiImageGenerator instance
 */
export function createGeminiImageGenerator(outputDirectory?: string): GeminiImageGenerator {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  
  return new GeminiImageGenerator(apiKey, outputDirectory);
}