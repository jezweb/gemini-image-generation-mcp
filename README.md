# Gemini Flash MCP - Image Generation for Roo Code

This project provides a Model Context Protocol (MCP) server for connecting to Google's Gemini 2.0 Flash image generation model. It's specifically designed to work with Roo Code and other MCP-compatible AI assistants.

## Overview

This MCP server provides a tool for Gemini 2.0 Flash image generation with comprehensive support for all available API options. It allows AI assistants like Roo Code to generate images through the Model Context Protocol (MCP) with fine-grained control over the generation process.

## Features

- Text-to-image generation using Google's Gemini 2.0 Flash model
- Full support for all available API parameters
- Simple web interface for testing and demonstration
- Easy installation for Roo Code and Claude Desktop
- Comprehensive documentation and examples

## Installation

### Prerequisites

- Node.js 18 or higher
- A Google AI Studio API key with access to the Gemini 2.0 Flash model

### Global Installation

1. Install the package globally:

```bash
npm install -g gemini-flash-mcp
```

2. Run the setup command to configure Roo Code:

```bash
gemini-flash-mcp-install
```

3. Set your Google AI API key in Roo Code settings:

- Open Roo Code
- Go to Settings
- Add the following environment variable to the MCP server configuration:

```json
"gemini-flash-mcp": {
  "env": {
    "GEMINI_API_KEY": "your-google-ai-api-key"
  }
}
```

4. Restart Roo Code

### Manual Installation

1. Clone this repository:

```bash
git clone https://github.com/jezweb/gemini-image-generation-mcp.git
cd gemini-image-generation-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Configure your MCP settings manually:

- For Roo Code: Edit `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- For Claude Desktop: Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or appropriate path for your OS

Add the following configuration:

```json
"gemini-flash-mcp": {
  "command": "node",
  "args": ["/path/to/gemini-flash-mcp/build/index.js"],
  "env": {
    "GEMINI_API_KEY": "your-google-ai-api-key"
  }
}
```

5. Restart Roo Code or Claude Desktop

## Usage

Once installed, you can use the `generate_image` tool in Roo Code or other MCP-compatible assistants:

```
Please generate an image of a sailing boat on Sydney Harbour
```

### Available Parameters

The `generate_image` tool supports the following parameters:

- `prompt` (required): Text description of the desired image
- `temperature`: Controls randomness (0.0 to 1.0, default: 1.0)
- `topP`: Controls diversity via nucleus sampling (0.0 to 1.0, default: 0.95)
- `topK`: Controls diversity via top-k sampling (default: 40)
- `maxOutputTokens`: Maximum number of tokens to generate (default: 8192)

### Web Interface

A web interface is available for testing the image generation:

```bash
npm start
```

Then open your browser to http://localhost:3000

## Development

### Project Structure

- `src/` - Source code for the MCP server
  - `index.ts` - Main server file with the image generation tool
  - `gemini.ts` - Gemini API integration
  - `install.ts` - Installation script for Roo Code and Claude Desktop
- `build/` - Compiled JavaScript files
- `test-gemini.html` - Web interface for testing image generation
- `test-gemini.js` - Direct test script for the Gemini API

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Troubleshooting

### API Key Issues

If you encounter authentication errors:
- Verify your API key is correct
- Ensure you have access to the Gemini 2.0 Flash model
- Check that the environment variable is properly set in your MCP configuration

### Connection Issues

If the MCP server fails to connect:
- Check that the server is running
- Verify the path in your MCP configuration is correct
- Ensure the server has the correct permissions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Google for providing the Gemini 2.0 Flash API
- The Model Context Protocol (MCP) team for enabling AI assistant extensibility