import { describe, expect, test } from "bun:test";
import { getVideos } from "./youtube";

describe("getVideos", () => {
	test("should search for videos and return metadata", async () => {
		const videos = await getVideos({
			query: "bun javascript",
			maxResults: 3,
			order: "relevance",
			publishedBefore: undefined,
			publishedAfter: undefined,
		});

		expect(videos).toBeDefined();
		expect(videos.length).toBeGreaterThan(0);
		expect(videos[0].videoId).toBeDefined();
		expect(videos[0].title).toBeDefined();
		expect(videos[0].channelTitle).toBeDefined();
	});

	test("should respect maxResults parameter", async () => {
		const videos = await getVideos({
			query: "javascript tutorial",
			maxResults: 2,
			order: "relevance",
			publishedBefore: undefined,
			publishedAfter: undefined,
		});

		expect(videos).toBeDefined();
		expect(videos.length).toBeLessThanOrEqual(2);
	});

	test("should filter by date when publishedAfter is set", async () => {
		const videos = await getVideos({
			query: "typescript",
			maxResults: 5,
			order: "date",
			publishedBefore: undefined,
			publishedAfter: "2024-01-01T00:00:00Z",
		});

		expect(videos).toBeDefined();
		videos?.forEach((video) => {
			if (video.publishedAt) {
				const publishedDate = new Date(video.publishedAt);
				expect(publishedDate.getTime()).toBeGreaterThan(
					new Date("2024-01-01").getTime(),
				);
			}
		});
	});
});
