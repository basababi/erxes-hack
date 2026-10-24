// "45", "0:45", "12:05" or "1:02:03" → seconds; null when malformed.
export const parseTimestamp = (value: string): number | null => {
  const trimmed = value.trim();

  if (!/^\d+(:[0-5]?\d){0,2}$/.test(trimmed)) return null;

  return trimmed.split(":").reduce((total, part) => total * 60 + Number(part), 0);
};

export const formatTimestamp = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");

  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};

const toUrl = (value: string) => {
  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com"];

export const youtubeVideoId = (value: string) => {
  const url = toUrl(value);

  if (!url) return null;
  if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (!YOUTUBE_HOSTS.includes(url.hostname)) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");

  return url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
};

const driveFileId = (value: string) => {
  const url = toUrl(value);

  if (url?.hostname !== "drive.google.com") return null;

  return url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get("id");
};

// Player URL for an iframe, or null for anything but YouTube / Drive.
export const videoEmbedUrl = (value: string) => {
  const youtube = youtubeVideoId(value);

  if (youtube) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}`;

  const drive = driveFileId(value);

  return drive ? `https://drive.google.com/file/d/${encodeURIComponent(drive)}/preview` : null;
};
