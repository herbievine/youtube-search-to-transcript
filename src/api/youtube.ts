import { google } from "googleapis";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
	console.error("YOUTUBE_API_KEY environment variable is required");
	process.exit(1);
}

const youtube = google.youtube({
	version: "v3",
	auth: YOUTUBE_API_KEY,
});

export async function getVideos({
	query,
	maxResults,
	order,
	publishedBefore,
	publishedAfter,
}: {
	query: string;
	maxResults: number;
	order: "relevance" | "date" | "rating" | "title" | "videoCount" | "viewCount";
	publishedBefore: string | undefined;
	publishedAfter: string | undefined;
}) {
	try {
		const response = await youtube.search.list({
			part: ["snippet"],
			q: query,
			type: ["video"],
			maxResults,
			order,
			...(publishedBefore && { publishedBefore }),
			...(publishedAfter && { publishedAfter }),
		});

		if (response.status !== 200 || !response.data.items) {
			console.error(`Failed to fetch videos: ${response.statusText}`);
			return [];
		}

		const videos = response.data.items.map((item) => ({
			videoId: item.id?.videoId,
			title: item.snippet?.title,
			description: item.snippet?.description,
			publishedAt: item.snippet?.publishedAt,
			channelTitle: item.snippet?.channelTitle,
			thumbnailUrl: item.snippet?.thumbnails?.high?.url,
		}));

		return videos;
	} catch {
		return [];
	}
}

export async function searchChannels({
	query,
	maxResults,
	order,
}: {
	query: string;
	maxResults: number;
	order: "relevance" | "date" | "rating" | "title" | "videoCount" | "viewCount";
}) {
	try {
		const response = await youtube.search.list({
			part: ["snippet"],
			q: query,
			type: ["channel"],
			maxResults,
			order,
		});

		if (response.status !== 200 || !response.data.items) {
			console.error("Failed to search channels:", response.statusText);
			return [];
		}

		return response.data.items.map((item) => ({
			channelId: item.id?.channelId ?? null,
			title: item.snippet?.title ?? null,
			description: item.snippet?.description ?? null,
			publishedAt: item.snippet?.publishedAt ?? null,
			thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? null,
		}));
	} catch (err) {
		console.error("Error in searchChannels:", err);
		return [];
	}
}

export async function getLatestVideosByChannel({
	channelId,
	maxResults,
}: {
	channelId: string;
	maxResults: number;
}) {
	try {
		const channelResp = await youtube.channels.list({
			part: ["contentDetails", "snippet"],
			id: [channelId],
		});

		if (
			channelResp.status !== 200 ||
			!channelResp.data.items ||
			!channelResp.data.items[0]
		) {
			console.error("Channel not found or API error:", channelResp.statusText);
			return [];
		}

		const channel = channelResp.data.items[0];
		const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

		if (!uploadsPlaylistId) {
			console.error("No uploads playlist found for channel:", channelId);
			return [];
		}

		const playlistResp = await youtube.playlistItems.list({
			part: ["snippet", "contentDetails"],
			playlistId: uploadsPlaylistId,
			maxResults,
		});

		if (playlistResp.status !== 200 || !playlistResp.data.items) {
			console.error("Failed to fetch playlist items:", playlistResp.statusText);
			return [];
		}

		return playlistResp.data.items.map((item) => ({
			videoId: item.contentDetails?.videoId ?? null,
			title: item.snippet?.title ?? null,
			description: item.snippet?.description ?? null,
			publishedAt:
				item.contentDetails?.videoPublishedAt ??
				item.snippet?.publishedAt ??
				null,
			channelTitle: item.snippet?.channelTitle ?? null,
			channelId: item.snippet?.channelId ?? channelId,
			thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? null,
		}));
	} catch (err) {
		console.error("Error in getLatestVideosByChannel:", err);
		return [];
	}
}
