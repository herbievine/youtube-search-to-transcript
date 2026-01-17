import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

export async function getTranscript(videoId: string): Promise<string> {
	const tempDir = tmpdir();
	const outputPath = join(tempDir, videoId);
	const vttPath = `${outputPath}.en.vtt`;

	try {
		// Use yt-dlp to download subtitles
		await $`yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o ${outputPath} https://www.youtube.com/watch?v=${videoId}`.quiet();

		// Read and parse the VTT file
		const vttContent = await Bun.file(vttPath).text();
		const plainText = parseVTT(vttContent);

		// Clean up
		await unlink(vttPath).catch(() => {});

		if (!plainText) {
			throw new Error("No transcript content found");
		}

		return plainText;
	} catch (error) {
		// Clean up on error
		await unlink(vttPath).catch(() => {});

		if (error instanceof Error) {
			if (error.message.includes("No transcript")) {
				throw error;
			}
			throw new Error(`Failed to fetch transcript: ${error.message}`);
		}
		throw new Error("Failed to fetch transcript");
	}
}

function parseVTT(vttContent: string): string {
	const lines = vttContent.split("\n");
	const textLines: string[] = [];
	let lastText = "";

	for (const line of lines) {
		// Skip headers, timestamps, and empty lines
		if (
			line.startsWith("WEBVTT") ||
			line.startsWith("Kind:") ||
			line.startsWith("Language:") ||
			line.includes("-->") ||
			line.startsWith("align:") ||
			line.trim() === ""
		) {
			continue;
		}

		// Remove VTT formatting tags like <00:00:00.599><c>text</c>
		const cleanedLine = line
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim();

		// Avoid duplicate lines (VTT often has duplicates)
		if (cleanedLine && cleanedLine !== lastText) {
			textLines.push(cleanedLine);
			lastText = cleanedLine;
		}
	}

	return textLines.join(" ").replace(/\s+/g, " ").trim();
}
