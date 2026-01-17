import { describe, expect, test } from "bun:test";
import { getTranscript } from "./transcript";

describe("getTranscript", () => {
  test("should fetch transcript for a video with captions", async () => {
    // Fireship video - typically has captions
    const videoId = "dWqNgzZwVJQ";

    const text = await getTranscript(videoId);

    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(100);
    console.log("Preview:", text.substring(0, 200));
  });

  test("should return plain text without timestamps", async () => {
    const videoId = "dWqNgzZwVJQ";

    const text = await getTranscript(videoId);

    // Should not contain timestamp patterns like [00:00] or (00:00)
    expect(text).not.toMatch(/\[\d{2}:\d{2}\]/);
    expect(text).not.toMatch(/\(\d{2}:\d{2}\)/);
  });

  test("should throw error for invalid video ID", async () => {
    const invalidId = "invalid_video_id_12345";

    expect(getTranscript(invalidId)).rejects.toThrow();
  });
});
