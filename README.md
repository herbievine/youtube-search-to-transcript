# YouTube MCP Server

An MCP (Model Context Protocol) server that provides tools for searching YouTube videos and fetching video transcripts.

## Tools

### `search_youtube`
Search for YouTube videos and retrieve metadata.

**Parameters:**
- `query` (string, required): The search query
- `maxResults` (number, optional): Number of results to return (1-50, default: 10)
- `order` (string, optional): Sort order - `relevance`, `date`, `rating`, `title`, `videoCount`, `viewCount` (default: `relevance`)
- `publishedBefore` (string, optional): ISO 8601 datetime to filter videos published before
- `publishedAfter` (string, optional): ISO 8601 datetime to filter videos published after

**Returns:** JSON array with video metadata:
- `videoId`: YouTube video ID
- `title`: Video title
- `description`: Video description
- `publishedAt`: Publication date
- `channelTitle`: Channel name
- `thumbnailUrl`: Thumbnail image URL

### `get_transcript`
Get the transcript/captions of a YouTube video as plain text.

**Parameters:**
- `videoId` (string, required): The YouTube video ID (e.g., `dQw4w9WgXcQ`)

**Returns:** Plain text transcript of the video

## Prerequisites

- [Bun](https://bun.sh) runtime
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (for transcript fetching)
- YouTube Data API key

## Setup

### Local Development

1. Install yt-dlp:
```bash
# macOS
brew install yt-dlp

# Linux
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file with your YouTube API key:
```
YOUTUBE_API_KEY=your_api_key_here
```

4. Get a YouTube Data API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### Docker

Build and run with Docker Compose:
```bash
docker compose up --build
```

Or build manually:
```bash
docker build -t youtube-mcp-server .
docker run -e YOUTUBE_API_KEY=your_api_key_here -it youtube-mcp-server
```

## Usage

### Run the server
```bash
bun run start
```

### Run tests
```bash
bun test
```

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "youtube": {
      "command": "bun",
      "args": ["run", "/path/to/youtube-search-to-transcript/src/index.ts"],
      "env": {
        "YOUTUBE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Using Docker with Claude Desktop

```json
{
  "mcpServers": {
    "youtube": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "YOUTUBE_API_KEY=your_api_key_here", "youtube-mcp-server"]
    }
  }
}
```
