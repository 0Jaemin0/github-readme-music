import type { Track } from "../model/types";

const MOCK_TRACKS: Track[] = [
  {
    videoId: "nightdrive01",
    title: "Night Drive, Seoul 03:14 (Official Video) [4K]",
    channel: "lofi transit - Topic",
    duration: "4:12",
    views: "1.2M",
    cover: "/covers/night-drive.png",
    waveform: [12, 26, 18, 40, 32, 55, 44, 68, 52, 78, 60, 46, 70, 38, 54, 30, 44, 22, 34, 16],
  },
  {
    videoId: "lateshift02",
    title: "Late Shift (Deploy on Friday) [Official Audio]",
    channel: "compile & chill - Topic",
    duration: "3:38",
    views: "486K",
    cover: "/covers/late-shift.png",
    waveform: [20, 34, 24, 48, 36, 62, 40, 72, 58, 44, 66, 50, 76, 42, 58, 28, 40, 24, 30, 18],
  },
  {
    videoId: "bluehour03",
    title: "Blue Hour, No Notifications (MV)",
    channel: "rooftop tapes VEVO",
    duration: "5:02",
    views: "2.4M",
    cover: "/covers/blue-hour.png",
    waveform: [10, 22, 30, 18, 44, 34, 58, 46, 70, 54, 80, 62, 48, 66, 36, 52, 26, 38, 20, 14],
  },
];

export function getMockTrack(videoId: string): Track {
  const index = [...videoId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % MOCK_TRACKS.length;
  return { ...MOCK_TRACKS[index], videoId };
}
