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

type GetVideosParams = {
	query: string;
	maxResults: number;
	order: "relevance" | "date" | "rating" | "title" | "videoCount" | "viewCount";
	publishedBefore: string | undefined;
	publishedAfter: string | undefined;
};

export async function getVideos({
	query,
	maxResults,
	order,
	publishedBefore,
	publishedAfter,
}: GetVideosParams) {
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
