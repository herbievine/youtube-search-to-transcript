import { $ } from "bun";

export async function ytdlpHealth(url: URL) {
	const videoId = url.searchParams.get("videoId") ?? "3RtM5pFLpRE";
	const cookiePath = Bun.env.COOKIE_TXT_PATH ?? "/app/cookies.txt";

	const cookieFile = Bun.file(cookiePath);

	if (!cookieFile.exists) {
		return "cookie_file_not_found";
	}

	try {
		const { stderr, stdout, exitCode } = await $`yt-dlp \
        --cookies ${cookiePath} \
        --list-subs \
        --ignore-no-formats-error \
        --no-check-formats \
        -v \
        https://www.youtube.com/watch?v=${videoId}`.quiet();

		if (exitCode !== 0) {
			console.error({ stdout, stderr, exitCode, cookiePath });

			return "yt-dlp-error";
		}
	} catch {
		return "unknown";
	}

	return "ok";
}
