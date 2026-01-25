import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getTranscript } from "./api/transcript";
import {
	getLatestVideosByChannel,
	getVideos,
	searchChannels,
} from "./api/youtube";
import { ytdlpHealth } from "./api/ytdlp";

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
			.enum(["relevance", "date", "rating", "title", "videoCount", "viewCount"])
			.default("relevance")
			.describe("The order in which to sort the results"),
		publishedBefore: z
			.string()
			.datetime()
			.optional()
			.describe("The date before which the video was published"),
		publishedAfter: z
			.string()
			.datetime()
			.optional()
			.describe("The date after which the video was published"),
	},
	async (payload) => {
		try {
			const videos = await getVideos(payload);

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
	},
);

server.tool(
	"search_channel",
	"Search for YouTube channels by name or query string",
	{
		query: z
			.string()
			.describe(
				"The search query to find YouTube channels (e.g. channel name or topic)",
			),
		maxResults: z
			.number()
			.min(1)
			.max(50)
			.default(10)
			.describe("Maximum number of channels to return (1-50, default: 10)"),
		order: z
			.enum(["relevance", "date", "rating", "title", "videoCount", "viewCount"])
			.default("relevance")
			.describe("The order in which to sort the channel search results"),
	},
	async (payload) => {
		try {
			const channels = await searchChannels(payload);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(channels, null, 2),
					},
				],
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";

			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching channels: ${message}`,
					},
				],
				isError: true,
			};
		}
	},
);

server.tool(
	"get_latest_videos_by_channel",
	"Get the latest uploads from a specific YouTube channel",
	{
		channelId: z
			.string()
			.describe(
				"The YouTube channel ID (e.g. 'UC_x5XG1OV2P6uZZ5FSM9Ttw', not the handle)",
			),
		maxResults: z
			.number()
			.min(1)
			.max(50)
			.default(10)
			.describe(
				"Maximum number of videos to return from the channel (1-50, default: 10)",
			),
	},
	async ({ channelId, maxResults }) => {
		try {
			const videos = await getLatestVideosByChannel({ channelId, maxResults });

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
						text: `Error fetching latest videos for channel ${channelId}: ${message}`,
					},
				],
				isError: true,
			};
		}
	},
);

server.tool(
	"get_transcript",
	"Get the transcript/captions of a YouTube video as plain text",
	{
		videoId: z
			.string()
			.describe(
				"The YouTube video ID (e.g., 'dQw4w9WgXcQ' from youtube.com/watch?v=dQw4w9WgXcQ)",
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
	},
);

const port = parseInt(Bun.env.PORT || "3000", 10);

const transport = new WebStandardStreamableHTTPServerTransport({
	sessionIdGenerator: undefined, // Stateless mode for Open WebUI compatibility
});

await server.connect(transport);

const httpServer = Bun.serve({
	port,
	routes: {
		"/health": async (req) => {
			const ytdlp = await ytdlpHealth(new URL(req.url));

			if (ytdlp === "ok") {
				return Response.json({ status: "ok", ytdlp: "ok" });
			}

			return Response.json({ status: "degraded", ytdlp });
		},
		"/mcp": (req) => transport.handleRequest(req),
	},
	fetch() {
		return Response.json({ message: "Not found" }, { status: 404 });
	},
});

console.log(
	`YouTube MCP Server running on http://localhost:${httpServer.port}/mcp`,
);
