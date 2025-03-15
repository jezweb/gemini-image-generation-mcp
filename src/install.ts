#!/usr/bin/env node
/**
 * install.ts
 * 
 * Installation script for the Gemini Flash MCP server.
 * This script helps users configure the MCP server in Roo Code and Claude Desktop.
 * It modifies the appropriate configuration files to add the MCP server settings.
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt the user for input
 * 
 * @param question - The question to ask the user
 * @returns Promise resolving to the user's answer
 */
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Get the path to the Roo Code MCP settings file
 * 
 * @returns The path to the Roo Code MCP settings file
 */
function getRooCodeSettingsPath(): string {
  const homedir = os.homedir();
  
  // Different paths based on operating system
  if (process.platform === 'darwin') {
    // macOS
    return path.join(homedir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  } else if (process.platform === 'win32') {
    // Windows
    return path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  } else {
    // Linux
    return path.join(homedir, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
  }
}

/**
 * Get the path to the Claude Desktop config file
 * 
 * @returns The path to the Claude Desktop config file
 */
function getClaudeDesktopConfigPath(): string {
  const homedir = os.homedir();
  
  // Different paths based on operating system
  if (process.platform === 'darwin') {
    // macOS
    return path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'win32') {
    // Windows
    return path.join(homedir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux
    return path.join(homedir, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Update the MCP settings file with the Gemini Flash MCP server configuration
 * 
 * @param filePath - Path to the settings file
 * @param apiKey - Google AI API key
 * @returns True if successful, false otherwise
 */
async function updateMcpSettings(filePath: string, apiKey: string): Promise<boolean> {
  try {
    // Create directory if it doesn't exist
    await fs.ensureDir(path.dirname(filePath));
    
    // Read existing settings or create new ones
    let settings: any = {};
    try {
      if (await fs.pathExists(filePath)) {
        const fileContent = await fs.readFile(filePath, 'utf8');
        settings = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error(`Error reading settings file: ${error}`);
      // Continue with empty settings
    }
    
    // Initialize mcpServers if it doesn't exist
    if (!settings.mcpServers) {
      settings.mcpServers = {};
    }
    
    // Get the path to the server script
    const serverPath = path.join(__dirname, 'index.js');
    
    // Add the Gemini Flash MCP server configuration
    settings.mcpServers['gemini-flash-mcp'] = {
      command: 'node',
      args: [serverPath],
      env: {
        GEMINI_API_KEY: apiKey
      }
    };
    
    // Write the updated settings back to the file
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error updating settings file: ${error}`);
    return false;
  }
}

/**
 * Main function to run the installation script
 */
async function main() {
  console.log('Gemini Flash MCP Server Installation');
  console.log('===================================');
  console.log('This script will configure the Gemini Flash MCP server for Roo Code and Claude Desktop.');
  console.log('');
  
  // Get the Google AI API key
  const apiKey = await prompt('Enter your Google AI API key: ');
  if (!apiKey) {
    console.error('Error: API key is required');
    process.exit(1);
  }
  
  // Update Roo Code settings
  console.log('\nConfiguring Roo Code...');
  const rooCodeSettingsPath = getRooCodeSettingsPath();
  const rooCodeResult = await updateMcpSettings(rooCodeSettingsPath, apiKey);
  if (rooCodeResult) {
    console.log('✅ Roo Code configuration updated successfully');
  } else {
    console.log('❌ Failed to update Roo Code configuration');
  }
  
  // Ask if the user wants to configure Claude Desktop
  const configureClaudeDesktop = await prompt('\nDo you want to configure Claude Desktop? (y/n): ');
  if (configureClaudeDesktop.toLowerCase() === 'y') {
    console.log('\nConfiguring Claude Desktop...');
    const claudeDesktopConfigPath = getClaudeDesktopConfigPath();
    const claudeDesktopResult = await updateMcpSettings(claudeDesktopConfigPath, apiKey);
    if (claudeDesktopResult) {
      console.log('✅ Claude Desktop configuration updated successfully');
    } else {
      console.log('❌ Failed to update Claude Desktop configuration');
    }
  }
  
  console.log('\nInstallation complete!');
  console.log('Please restart Roo Code and/or Claude Desktop for the changes to take effect.');
  console.log('\nYou can now use the `generate_image` tool in Roo Code or Claude Desktop.');
  console.log('Example: "Please generate an image of a sailing boat on Sydney Harbour"');
  
  // Close the readline interface
  rl.close();
}

// Run the main function if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}