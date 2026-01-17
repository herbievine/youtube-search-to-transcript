import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getVideos } from "./api/youtube";
import { getTranscript } from "./api/transcript";

const server = new McpServer({
  name: "youtube-mcp-server",
  version: "1.0.0",
});

server.tool(
  "search_youtube",
  "Search for YouTube videos and retrieve metadata including title, description, date, and video ID",
  {
    query: z.string().describe("The search query to find YouTube videos"),
    maxResults: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of results to return (1-50, default: 10)"),
    order: z
      .enum(['relevance', 'date', 'rating', 'title', 'videoCount', 'viewCount'])
      .default('relevance')
      .describe('The order in which to sort the results'),
    publishedBefore: z.string().datetime().optional().describe('The date before which the video was published'),
    publishedAfter: z.string().datetime().optional().describe('The date after which the video was published')
  },
  async (payload) => {
    try {
      const videos = await getVideos(payload)

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(videos, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error searching YouTube: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_transcript",
  "Get the transcript/captions of a YouTube video as plain text",
  {
    videoId: z
      .string()
      .describe(
        "The YouTube video ID (e.g., 'dQw4w9WgXcQ' from youtube.com/watch?v=dQw4w9WgXcQ)"
      ),
  },
  async ({ videoId }) => {
    try {
      const plainText = await getTranscript(videoId);

      return {
        content: [
          {
            type: "text" as const,
            text: plainText,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching transcript: ${message}. The video may not have captions available.`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YouTube MCP Server running on stdio");
}

main().catch(console.error);
