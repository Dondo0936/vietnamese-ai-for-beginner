"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Heart,
  Sparkles,
  Headphones,
  Play,
  Plus,
  User,
  Eye,
  Radio,
  Volume2,
} from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import ApplicationHero from "@/components/application/ApplicationHero";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";
import {
  InlineChallenge,
  Callout,
  StepReveal,
} from "@/components/interactive";

export const metadata: TopicMeta = {
  slug: "k-means-in-music-recs",
  title: "K-Means in Music Recommendations",
  titleVi: "k-means trong gợi ý nhạc",
  description:
    "Cách Spotify biến sở thích của 600 triệu người thành các điểm trong không gian 40 chiều, tìm đồng minh thẩm mỹ, và xây Discover Weekly mỗi thứ Hai.",
  category: "classic-ml",
  tags: ["clustering", "recommendation", "application"],
  difficulty: "intermediate",
  relatedSlugs: ["k-means"],
  vizType: "static",
  applicationOf: "k-means",
  featuredApp: {
    name: "Spotify",
    productFeature: "Discover Weekly",
    company: "Spotify AB",
    countryOrigin: "SE",
  },
  sources: [
    {
      title:
        "What Made Discover Weekly One of Our Most Successful Feature Launches to Date?",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/2015/11/what-made-discover-weekly-one-of-our-most-successful-feature-launches-to-date",
      date: "2015-11",
      kind: "engineering-blog",
    },
    {
      title: "From Idea to Execution: Spotify's Discover Weekly",
      publisher: "Chris Johnson & Edward Newett, DataEngConf NYC 2015",
      url: "https://www.slideshare.net/MrChrisJohnson/from-idea-to-execution-spotifys-discover-weekly",
      date: "2015-11",
      kind: "keynote",
    },
    {
      title: "Logistic Matrix Factorization for Implicit Feedback Data",
      publisher: "Chris Johnson, Spotify — NIPS 2014 Workshop",
      url: "https://research.atspotify.com/publications/logistic-matrix-factorization-for-implicit-feedback-data",
      date: "2014-12",
      kind: "paper",
    },
    {
      title:
        "Introducing Voyager: Spotify's New Nearest-Neighbor Search Library",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/2023/10/introducing-voyager-spotifys-new-nearest-neighbor-search-library",
      date: "2023-10",
      kind: "engineering-blog",
    },
    {
      title: "Recommending Music on Spotify with Deep Learning",
      publisher: "Sander Dieleman (Spotify internship)",
      url: "https://sander.ai/2014/08/05/spotify-cnns.html",
      date: "2014-08",
      kind: "engineering-blog",
    },
    {
      title: "How to Break Free of Spotify's Algorithm",
      publisher: "MIT Technology Review",
      url: "https://www.technologyreview.com/2024/08/16/1096276/spotify-algorithms-music-discovery-ux/",
      date: "2024-08",
      kind: "news",
    },
    {
      title:
        "How Fans Discover Your Music on Spotify — Made to Be Found",
      publisher: "Spotify for Artists",
      url: "https://artists.spotify.com/en/blog/how-fans-discover-music-on-spotify-playlists-made-to-be-found",
      date: "2022-03",
      kind: "documentation",
    },
  ],
  tocSections: [
    { id: "hero", labelVi: "Công ty nào?" },
    { id: "problem", labelVi: "Vấn đề" },
    { id: "mechanism", labelVi: "Cách giải quyết" },
    { id: "metrics", labelVi: "Con số thật" },
    { id: "tryIt", labelVi: "Thử tự tay" },
    { id: "counterfactual", labelVi: "Nếu không có" },
  ],
};

/* ────────────────────────────────────────────────────────────
   DỮ LIỆU — 18 bài hát giả lập, 4 cụm thể loại
   ──────────────────────────────────────────────────────────── */

type Genre = "pop" | "chill" | "rock" | "bolero";

interface Song {
  title: string;
  artist: string;
  energy: number;
  danceability: number;
  genre: Genre;
}

const GENRE_META: Record<
  Genre,
  { label: string; color: string; icon: typeof Music }
> = {
  pop: { label: "Pop", color: "#ec4899", icon: Sparkles },
  chill: { label: "Chill / Acoustic", color: "#22c55e", icon: Headphones },
  rock: { label: "Rock / EDM", color: "#ef4444", icon: Volume2 },
  bolero: { label: "Bolero / Ballad", color: "#a855f7", icon: Radio },
};

const SONGS: Song[] = [
  { title: "Waiting For You", artist: "MONO", energy: 68, danceability: 78, genre: "pop" },
  { title: "Có chắc yêu là đây", artist: "Sơn Tùng M-TP", energy: 70, danceability: 82, genre: "pop" },
  { title: "Bạc phận", artist: "Jack", energy: 72, danceability: 76, genre: "pop" },
  { title: "Hai Phút Hơn", artist: "Pháo", energy: 74, danceability: 84, genre: "pop" },
  { title: "Nơi này có anh", artist: "Sơn Tùng M-TP", energy: 32, danceability: 38, genre: "chill" },
  { title: "Anh nhà ở đâu thế", artist: "AMEE", energy: 40, danceability: 45, genre: "chill" },
  { title: "Hôm Nay Tôi Buồn", artist: "Phùng Khánh Linh", energy: 28, danceability: 32, genre: "chill" },
  { title: "Nếu Lúc Đó", artist: "Tlinh", energy: 36, danceability: 42, genre: "chill" },
  { title: "Mưa Tháng Sáu", artist: "Hoàng Dũng", energy: 30, danceability: 36, genre: "chill" },
  { title: "Đi Để Trở Về", artist: "Soobin", energy: 82, danceability: 58, genre: "rock" },
  { title: "Bigcityboi", artist: "Binz", energy: 90, danceability: 72, genre: "rock" },
  { title: "Thu Cuối", artist: "Mr. Siro", energy: 85, danceability: 55, genre: "rock" },
  { title: "Đường Tôi Chở Em Về", artist: "Buitruonglinh", energy: 88, danceability: 62, genre: "rock" },
  { title: "Sầu Tím Thiệp Hồng", artist: "Đàm Vĩnh Hưng", energy: 22, danceability: 24, genre: "bolero" },
  { title: "Áo Mới Cà Mau", artist: "Phi Nhung", energy: 26, danceability: 28, genre: "bolero" },
  { title: "Duyên Phận", artist: "Như Quỳnh", energy: 18, danceability: 22, genre: "bolero" },
  { title: "Đoạn Tái Bút", artist: "Bích Phương", energy: 24, danceability: 26, genre: "bolero" },
  { title: "Chuyện Của Mùa Đông", artist: "Lệ Quyên", energy: 20, danceability: 25, genre: "bolero" },
];

/* ────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────── */

function distanceToCentroid(song: Song, cx: number, cy: number) {
  return Math.hypot(song.energy - cx, song.danceability - cy);
}

function centroidOf(songs: Song[]) {
  if (songs.length === 0) return { energy: 50, danceability: 50 };
  const e = songs.reduce((s, x) => s + x.energy, 0) / songs.length;
  const d = songs.reduce((s, x) => s + x.danceability, 0) / songs.length;
  return { energy: e, danceability: d };
}

/* ────────────────────────────────────────────────────────────
   COMPONENT CHÍNH
   ──────────────────────────────────────────────────────────── */

export default function KMeansInMusicRecs() {
  const [liked, setLiked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const toggleLike = useCallback((title: string) => {
    setLiked((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  }, []);

  const likedSongs = useMemo(
    () => SONGS.filter((s) => liked.includes(s.title)),
    [liked],
  );

  const userCentroid = useMemo(() => centroidOf(likedSongs), [likedSongs]);

  const recommendations = useMemo(() => {
    if (likedSongs.length === 0) return [];
    return SONGS.filter((s) => !liked.includes(s.title))
      .map((s) => ({
        song: s,
        distance: distanceToCentroid(
          s,
          userCentroid.energy,
          userCentroid.danceability,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [liked, likedSongs, userCentroid]);

  const selectedSong = useMemo(
    () => SONGS.find((s) => s.title === selected) ?? null,
    [selected],
  );

  return (
    <ApplicationLayout
      metadata={metadata}
      parentTitleVi="Phân cụm k-means"
    >
      <ApplicationHero
        parentTitleVi="Phân cụm k-means"
        topicSlug="k-means-in-music-recs"
      >
        <p>
          Sáng thứ Hai nào đó bạn mở Spotify (dịch vụ phát nhạc lớn nhất
          thế giới) và thấy Discover Weekly — 30 bài hát mới — đã sẵn
          sàng. Bài đầu tiên lạ hoắc nhưng <em>hợp gu đến kỳ lạ</em>.
          Làm sao Spotify biết bạn thích bài này, khi bạn còn chưa từng
          nghe?
        </p>
        <p>
          Đằng sau sự &ldquo;tiên tri&rdquo; đó là một cách nhìn thú vị:
          Spotify biến bạn và mỗi bài hát thành{" "}
          <strong>một điểm trong không gian nhiều chiều</strong>. Gu âm
          nhạc của bạn là một toạ độ. Nhiệm vụ duy nhất: tìm các bài
          hát có toạ độ gần bạn — dùng đúng kỹ thuật phân cụm bạn đã
          học ở bài lý thuyết.
        </p>
      </ApplicationHero>

      <ApplicationProblem topicSlug="k-means-in-music-recs">
        <p>
          Spotify có hơn <strong>100 triệu bài hát</strong> và hơn{" "}
          <strong>600 triệu người dùng</strong>. Dịch vụ này phân loại
          tới 6.291 thể loại vi mô (micro-genre) — từ &ldquo;trance
          guru&rdquo; đến &ldquo;cult-progressive-rock&rdquo;.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 my-4">
          {[
            {
              icon: Music,
              title: "Kho nhạc khổng lồ",
              desc: "100 triệu bài. Đọc thủ công mỗi bài mất 10 năm làm việc không nghỉ.",
              color: "#3b82f6",
            },
            {
              icon: User,
              title: "Gu rất đa dạng",
              desc: "600 triệu người nghe. Không có hai người có gu giống nhau 100%.",
              color: "#a855f7",
            },
            {
              icon: Sparkles,
              title: "Phải cá nhân hoá",
              desc: "Gợi ý chung kiểu “Top 50 toàn cầu” không ai xem. Cần riêng cho từng người.",
              color: "#ec4899",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-xl border p-4 bg-card"
              style={{ borderColor: c.color + "35" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={16} style={{ color: c.color }} />
                <p
                  className="text-sm font-bold"
                  style={{ color: c.color }}
                >
                  {c.title}
                </p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        <p>
          Vấn đề cốt lõi: từ ma trận tương tác (ai đã nghe bài gì) giữa
          hàng trăm triệu người và bài hát, làm sao tìm ra những nhóm
          người nghe có gu giống nhau? Rồi gợi ý bài hát mà &ldquo;đồng
          minh thẩm mỹ&rdquo; của bạn yêu thích mà bạn chưa từng nghe.
        </p>
      </ApplicationProblem>

      <ApplicationMechanism
        parentTitleVi="Phân cụm k-means"
        topicSlug="k-means-in-music-recs"
      >
        <Beat step={1}>
          <p>
            <strong>Thu thập phản hồi ẩn (implicit feedback).</strong>{" "}
            Spotify không hỏi bạn thích bài gì — quá rườm rà. Thay vào
            đó, họ ghi lại lượt nghe đủ lâu (&gt;30 giây), lưu vào
            playlist, bỏ qua giữa chừng — khoảng <strong>1 TB mỗi
            ngày</strong> trên toàn hệ thống.
          </p>
        </Beat>
        <Beat step={2}>
          <p>
            <strong>Biến người và bài hát thành &ldquo;điểm&rdquo;.</strong>{" "}
            Ma trận khổng lồ {`{người × bài}`} được phân rã thành hai
            ma trận nhỏ: người dùng trở thành vector 40 chiều, bài hát
            cũng trở thành vector 40 chiều. Hai điểm gần nhau trong
            không gian 40 chiều = gu âm nhạc tương đồng.
          </p>
        </Beat>
        <Beat step={3}>
          <p>
            <strong>Tìm láng giềng gần nhất.</strong> Với vector của
            bạn, Spotify dùng thư viện <em>Voyager</em> (nhanh hơn
            Annoy 10 lần) để tìm bài hát có vector gần nhất — đúng
            logic của k-means, nhưng với k rất lớn và không gian nhiều
            chiều. Việc này tương đương: tìm cụm bài hát phù hợp nhất
            với mỗi người nghe.
          </p>
        </Beat>
        <Beat step={4}>
          <p>
            <strong>Bổ sung tín hiệu âm thanh.</strong> Bài hát mới
            chưa có lịch sử nghe (cold-start)? CNN (mạng nơ-ron tích
            chập) phân tích phổ âm thanh thô của bài đó để dự đoán
            vector — không cần chờ nghìn lượt nghe để &ldquo;hiểu&rdquo;
            bài này.
          </p>
        </Beat>
        <Beat step={5}>
          <p>
            <strong>Vòng phản hồi mỗi thứ Hai.</strong> Bạn nghe một
            bài trong Discover Weekly, bỏ qua bài khác. Mỗi hành động
            cập nhật vector của bạn một chút — tâm gu (user centroid)
            dịch chuyển nhẹ về bài bạn vừa thích. Tuần sau, 30 bài mới
            đã phản ánh dịch chuyển đó.
          </p>
        </Beat>
      </ApplicationMechanism>

      {/* ──── 2D FEATURE SPACE VISUAL ──── */}
      <section className="mb-10 space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-foreground">
            Không gian đặc trưng 2D: energy × danceability
          </h3>
        </div>

        <p className="text-sm text-muted leading-relaxed">
          Thực tế Spotify dùng 40 chiều, nhưng chỉ 2 chiều cũng đủ thấy
          các cụm tự nhiên. Mỗi chấm là một bài hát tiếng Việt. Trục X
          là <strong>energy</strong> (năng lượng), trục Y là{" "}
          <strong>danceability</strong> (khiêu vũ). Bấm vào một bài để
          xem nó thuộc cụm nào.
        </p>

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <svg viewBox="0 0 440 380" className="w-full">
            <line
              x1={40}
              y1={340}
              x2={420}
              y2={340}
              stroke="currentColor"
              strokeOpacity={0.3}
            />
            <line
              x1={40}
              y1={20}
              x2={40}
              y2={340}
              stroke="currentColor"
              strokeOpacity={0.3}
            />
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={`grid-${v}`}>
                <line
                  x1={40 + (v * 380) / 100}
                  y1={20}
                  x2={40 + (v * 380) / 100}
                  y2={340}
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeDasharray="2,3"
                />
                <line
                  x1={40}
                  y1={340 - (v * 320) / 100}
                  x2={420}
                  y2={340 - (v * 320) / 100}
                  stroke="currentColor"
                  strokeOpacity={0.05}
                  strokeDasharray="2,3"
                />
                <text
                  x={40 + (v * 380) / 100}
                  y={355}
                  fontSize={11}
                  fill="currentColor"
                  fillOpacity={0.4}
                  textAnchor="middle"
                >
                  {v}
                </text>
                <text
                  x={35}
                  y={340 - (v * 320) / 100 + 3}
                  fontSize={11}
                  fill="currentColor"
                  fillOpacity={0.4}
                  textAnchor="end"
                >
                  {v}
                </text>
              </g>
            ))}
            <text x={230} y={375} fontSize={11} fill="currentColor" fillOpacity={0.6} textAnchor="middle" fontWeight={600}>
              energy →
            </text>
            <text
              x={15}
              y={180}
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.6}
              textAnchor="middle"
              fontWeight={600}
              transform="rotate(-90, 15, 180)"
            >
              danceability →
            </text>

            {/* Cluster halos */}
            {(Object.keys(GENRE_META) as Genre[]).map((g) => {
              const members = SONGS.filter((s) => s.genre === g);
              const c = centroidOf(members);
              const x = 40 + (c.energy * 380) / 100;
              const y = 340 - (c.danceability * 320) / 100;
              return (
                <circle
                  key={`halo-${g}`}
                  cx={x}
                  cy={y}
                  r={60}
                  fill={GENRE_META[g].color}
                  fillOpacity={0.06}
                  stroke={GENRE_META[g].color}
                  strokeOpacity={0.2}
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Cluster centroids */}
            {(Object.keys(GENRE_META) as Genre[]).map((g) => {
              const members = SONGS.filter((s) => s.genre === g);
              const c = centroidOf(members);
              const x = 40 + (c.energy * 380) / 100;
              const y = 340 - (c.danceability * 320) / 100;
              const color = GENRE_META[g].color;
              return (
                <g key={`centroid-${g}`}>
                  <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} stroke={color} strokeWidth={3} />
                  <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} stroke={color} strokeWidth={3} />
                  <text
                    x={x + 10}
                    y={y - 8}
                    fontSize={11}
                    fill={color}
                    fontWeight={700}
                  >
                    {GENRE_META[g].label}
                  </text>
                </g>
              );
            })}

            {/* User centroid (if liked any) */}
            {likedSongs.length > 0 && (
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <circle
                  cx={40 + (userCentroid.energy * 380) / 100}
                  cy={340 - (userCentroid.danceability * 320) / 100}
                  r={10}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={3}
                />
                <text
                  x={40 + (userCentroid.energy * 380) / 100 + 14}
                  y={340 - (userCentroid.danceability * 320) / 100 + 4}
                  fontSize={11}
                  fontWeight={700}
                  fill="#f59e0b"
                >
                  Gu của bạn
                </text>
              </motion.g>
            )}

            {/* Songs */}
            {SONGS.map((s) => {
              const x = 40 + (s.energy * 380) / 100;
              const y = 340 - (s.danceability * 320) / 100;
              const isSel = s.title === selected;
              const isLiked = liked.includes(s.title);
              const color = GENRE_META[s.genre].color;
              return (
                <g
                  key={`song-${s.title}`}
                  onClick={() =>
                    setSelected(isSel ? null : s.title)
                  }
                  style={{ cursor: "pointer" }}
                >
                  {isSel && (
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={14}
                      fill={color}
                      fillOpacity={0.2}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.1, 1] }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={isSel ? 7 : 5}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={isLiked ? 2.5 : 1.5}
                    animate={{
                      r: isSel ? 7 : 5,
                      strokeWidth: isLiked ? 2.5 : 1.5,
                    }}
                  />
                  {isLiked && (
                    <motion.text
                      x={x + 8}
                      y={y - 6}
                      fontSize={11}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ♥
                    </motion.text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected song detail */}
        <AnimatePresence mode="wait">
          {selectedSong && (
            <motion.div
              key={selectedSong.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border-2 bg-card p-4"
              style={{
                borderColor: GENRE_META[selectedSong.genre].color + "60",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        GENRE_META[selectedSong.genre].color + "20",
                    }}
                  >
                    <Music
                      size={18}
                      style={{
                        color:
                          GENRE_META[selectedSong.genre].color,
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {selectedSong.title}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedSong.artist}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      color: GENRE_META[selectedSong.genre].color,
                      backgroundColor:
                        GENRE_META[selectedSong.genre].color + "15",
                    }}
                  >
                    Cụm: {GENRE_META[selectedSong.genre].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleLike(selectedSong.title)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      liked.includes(selectedSong.title)
                        ? "bg-pink-500 text-white"
                        : "border border-border bg-card hover:bg-surface"
                    }`}
                  >
                    <Heart
                      size={12}
                      fill={
                        liked.includes(selectedSong.title)
                          ? "#fff"
                          : "none"
                      }
                    />
                    {liked.includes(selectedSong.title)
                      ? "Đã thích"
                      : "Thích"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-lg bg-surface/60 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary">
                    Energy
                  </div>
                  <div className="text-sm font-bold text-foreground tabular-nums">
                    {selectedSong.energy}
                  </div>
                </div>
                <div className="rounded-lg bg-surface/60 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-tertiary">
                    Danceability
                  </div>
                  <div className="text-sm font-bold text-foreground tabular-nums">
                    {selectedSong.danceability}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Song list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface/30 p-2">
          {SONGS.map((s) => {
            const isLiked = liked.includes(s.title);
            const isSel = s.title === selected;
            const color = GENRE_META[s.genre].color;
            return (
              <div
                key={s.title}
                className={`flex items-center justify-between gap-2 rounded-lg p-2 transition-colors ${
                  isSel
                    ? "bg-card border border-accent/40"
                    : "hover:bg-card/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(isSel ? null : s.title)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-foreground truncate">
                    {s.title}
                  </span>
                  <span className="text-[10px] text-tertiary truncate">
                    — {s.artist}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleLike(s.title)}
                  className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded text-[11px] transition-colors ${
                    isLiked
                      ? "bg-pink-500 text-white"
                      : "text-muted hover:text-pink-500"
                  }`}
                  aria-label={
                    isLiked ? `Bỏ thích ${s.title}` : `Thích ${s.title}`
                  }
                >
                  <Heart
                    size={11}
                    fill={isLiked ? "#fff" : "none"}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* "For You" shelf */}
        <div className="rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-900/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-amber-600 dark:text-amber-400"
              />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Dành cho bạn (mô phỏng Discover Weekly)
              </span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-300">
              {liked.length} bài đã thích
            </span>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-xs text-muted italic">
              Bấm tim ít nhất 2 bài hát trên để xem gợi ý. Gu của bạn
              sẽ hiện thành chấm vàng trong không gian bên trên.
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {recommendations.map((r, idx) => {
                  const color = GENRE_META[r.song.genre].color;
                  return (
                    <motion.div
                      key={r.song.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center gap-3 rounded-lg bg-card border border-border p-2.5"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                        #{idx + 1}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {r.song.title}
                        </p>
                        <p className="text-[10px] text-muted truncate">
                          {r.song.artist} ·{" "}
                          {GENRE_META[r.song.genre].label}
                        </p>
                      </div>
                      <span className="text-[10px] text-tertiary tabular-nums shrink-0">
                        d = {r.distance.toFixed(1)}
                      </span>
                      <Play
                        size={12}
                        className="text-muted shrink-0"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <p className="text-xs text-muted italic leading-relaxed">
          Quan sát: mỗi lần bạn bấm tim thêm một bài, chấm vàng (gu của
          bạn) dời nhẹ. Các bài được gợi ý là những bài có khoảng cách
          d nhỏ nhất đến chấm vàng. Spotify thực tế làm điều này trên
          40 chiều và hàng triệu bài hát, nhưng nguyên lý giống hệt.
        </p>
      </section>

      <ApplicationMetrics
        sources={metadata.sources!}
        topicSlug="k-means-in-music-recs"
      >
        <Metric
          value="Ít nhất 30% lượt nghe trên Spotify đến từ gợi ý thuật toán"
          sourceRef={6}
        />
        <Metric
          value="33% lượt khám phá nghệ sĩ mới xảy ra qua playlist cá nhân hoá"
          sourceRef={7}
        />
        <Metric
          value="Xử lý 1 TB dữ liệu người dùng mỗi ngày"
          sourceRef={2}
        />
        <Metric
          value="Voyager nhanh hơn 10 lần so với Annoy, tiết kiệm bộ nhớ gấp 4 lần"
          sourceRef={4}
        />
      </ApplicationMetrics>

      {/* ──── DEEPEN: step-by-step user centroid update ──── */}
      <section className="mb-10 space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          Gu của bạn cập nhật thế nào khi thích bài mới?
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Mỗi khi bạn bấm tim, Spotify không viết lại toàn bộ hồ sơ. Nó
          chỉ <em>dịch chuyển nhẹ</em> vector của bạn về phía vector
          của bài hát vừa thích. Bấm &ldquo;Tiếp tục&rdquo; để đi qua
          từng bước.
        </p>

        <StepReveal
          labels={[
            "Bước 1: Gu ban đầu",
            "Bước 2: Thích một bài Chill",
            "Bước 3: Thích thêm bài Chill nữa",
            "Bước 4: Gu đã trôi về Chill",
          ]}
        >
          {[
            <StepInitialTaste key="s1" />,
            <StepFirstLike key="s2" />,
            <StepSecondLike key="s3" />,
            <StepTasteShifted key="s4" />,
          ]}
        </StepReveal>
      </section>

      {/* ──── TRY IT YOURSELF ──── */}
      <ApplicationTryIt topicSlug="k-means-in-music-recs">
        <p className="mb-4 text-sm text-muted leading-relaxed">
          Ba câu hỏi nhanh để kiểm tra bạn đã nắm vững nguyên lý
          Spotify dùng để gợi ý nhạc.
        </p>

        <div className="space-y-4">
          <InlineChallenge
            question="Bạn vừa tạo tài khoản Spotify mới và chưa nghe bài nào. Hệ thống sẽ gợi ý thế nào?"
            options={[
              "Gợi ý 30 bài ngẫu nhiên",
              "Gợi ý bài phổ biến nhất toàn cầu — vì chưa có dữ liệu cá nhân, Spotify phải dùng prior của đám đông",
              "Từ chối gợi ý cho đến khi có đủ dữ liệu",
              "Gợi ý bài bạn của bạn đang nghe",
            ]}
            correct={1}
            explanation="Đây chính là bài toán “cold-start” (khởi đầu lạnh). Khi chưa có vector cá nhân, Spotify mặc định dùng vector trung bình của tất cả người dùng (hoặc phân khúc khu vực) — bài phổ biến toàn cầu. Khi bạn thích/bỏ qua vài bài, vector cá nhân bắt đầu hình thành và gợi ý chính xác dần."
          />

          <InlineChallenge
            question="Bạn nghe 9 bài bolero và 1 bài EDM liên tục. Tuần sau Discover Weekly chủ yếu có gì?"
            options={[
              "50% bolero + 50% EDM — chia đều",
              "Chủ yếu bolero — vì 9/10 lượt nghe là bolero, user centroid nằm rất gần cụm bolero",
              "Chủ yếu EDM — vì bài EDM nghe gần đây nhất, ảnh hưởng nhất",
              "Toàn bài pop — phổ biến nhất",
            ]}
            correct={1}
            explanation="User centroid là trung bình có trọng số của các bài đã nghe. 9 bài bolero “kéo” centroid về cụm bolero; bài EDM đơn lẻ không đủ để dịch chuyển nhiều. Kết quả: bolero thắng lớn trong Discover Weekly, nhưng có thể xuất hiện 1-2 bài “thăm dò” ngoài gu để thuật toán học thêm."
          />

          <InlineChallenge
            question="Spotify ra bài mới chưa có ai nghe. Làm sao đưa vào gợi ý mà không chờ hàng ngàn lượt nghe đầu tiên?"
            options={[
              "Bỏ bài đó ra khỏi hệ thống cho đến khi đủ dữ liệu",
              "CNN phân tích phổ âm thanh (mel-spectrogram) để tự động dự đoán vector của bài hát",
              "Gửi email cho toàn bộ 600 triệu người",
              "Chỉ gợi ý cho nghệ sĩ thân thiết",
            ]}
            correct={1}
            explanation="Đây là đóng góp của Sander Dieleman (2014): dùng CNN trên mel-spectrogram để dự đoán vector 40 chiều chỉ từ bản thu âm — không cần lịch sử nghe. Nhờ vậy bài mới ra ngay lập tức có thể được gợi ý cho người có gu phù hợp. Đây là sức mạnh khi kết hợp phân cụm cộng tác (collaborative) với đặc trưng nội dung (content-based)."
          />

          <InlineChallenge
            question="Tại sao Spotify dùng 40 chiều mà không phải 2 chiều (energy + dance) như đồ thị trên?"
            options={[
              "40 chiều đẹp hơn",
              "2 chiều không đủ tách biệt mọi gu — một bài pop buồn và một bài chill vui có thể trùng (energy=50, dance=50) nhưng thực tế rất khác. Càng nhiều chiều → tách càng mịn",
              "40 là con số may mắn trong văn hoá Bắc Âu",
              "Để tốn thêm CPU",
            ]}
            correct={1}
            explanation="Với 2 chiều, “rock Việt thập niên 90” và “pop Hàn Quốc đương đại” có thể có cùng toạ độ mà nghe hoàn toàn khác. 40 chiều cho phép nắm bắt nhiều yếu tố: tempo, giọng, nhạc cụ, ngôn ngữ, thể loại con, cảm xúc... Đây là nguyên lý của embedding — nén thông tin rộng vào không gian vector vẫn giữ được cấu trúc gần/xa."
          />
        </div>

        <div className="mt-6">
          <Callout variant="insight" title="Tại sao thứ Hai?">
            Spotify nhận thấy người dùng có thói quen &ldquo;nghe nhạc
            mới&rdquo; nhiều nhất đầu tuần. Discover Weekly ra đời năm
            2015 cố ý nhắm vào khung giờ đó — và ngay tuần đầu đã đạt
            <strong> 40 triệu người dùng</strong>, trở thành một trong
            những sản phẩm thành công nhất của công ty. Thuật toán thì
            đã có từ trước; cái mới là <em>đóng gói nó thành một khoảnh
            khắc nghi thức hàng tuần</em>.
          </Callout>
        </div>
      </ApplicationTryIt>

      <ApplicationCounterfactual
        parentTitleVi="Phân cụm k-means"
        topicSlug="k-means-in-music-recs"
      >
        <p>
          Không có phân cụm và biểu diễn vector, Spotify sẽ phải so
          sánh trực tiếp mỗi người dùng với hàng trăm triệu người khác
          — bất khả thi về mặt tính toán. Một truy vấn gợi ý đơn giản
          sẽ mất hàng giờ thay vì mili-giây.
        </p>
        <p>
          Kỹ thuật phân rã ma trận và phân cụm biến mỗi người, mỗi bài
          hát thành vector ngắn gọn — biến bài toán so sánh thành phép
          nhân vector đơn giản. Thư viện tìm kiếm láng giềng gần đúng
          (Voyager) tiếp tục tăng tốc bằng cách không duyệt toàn bộ
          không gian. Kết quả: Discover Weekly có thể tạo ra cho 600
          triệu người mỗi thứ Hai, xong trong vài giờ tính toán ngắn
          ngủi — một con số không thể tưởng tượng được nếu so từng
          cặp.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2">
          <Plus size={14} className="text-accent" />
          <p className="text-xs text-muted leading-snug">
            Nguyên lý này không chỉ dành cho nhạc — Netflix dùng cho
            phim, TikTok cho video, Shopee cho sản phẩm. Tất cả đều
            quy về bài toán: biến người và sản phẩm thành điểm, rồi
            tìm láng giềng gần nhất.
          </p>
        </div>
      </ApplicationCounterfactual>
    </ApplicationLayout>
  );
}

/* ────────────────────────────────────────────────────────────
   STEP REVEAL sub-components
   ──────────────────────────────────────────────────────────── */

function StepInitialTaste() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Bạn mới tạo tài khoản — Spotify chưa biết gì về gu của bạn.
        Vector khởi đầu là một giá trị mặc định (thường là trung bình
        toàn hệ thống, kiểu &ldquo;người nghe phổ thông&rdquo;).
      </p>
      <Mini2DPlot
        centroid={{ x: 55, y: 52 }}
        highlighted={[]}
        caption="Gu của bạn (chấm vàng) nằm giữa — chưa có hướng rõ ràng."
      />
    </div>
  );
}

function StepFirstLike() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Bạn bấm tim cho <strong>&ldquo;Mưa Tháng Sáu&rdquo;</strong>{" "}
        (energy = 30, danceability = 36 — cụm Chill). Vector của bạn{" "}
        <em>dịch chuyển</em> — không phải nhảy thẳng về bài đó, mà là
        trung bình của (vector cũ + vector bài mới).
      </p>
      <Mini2DPlot
        centroid={{ x: 43, y: 44 }}
        highlighted={[{ x: 30, y: 36, label: "Mưa Tháng Sáu", color: "#22c55e" }]}
        caption="Tâm vàng dời một đoạn ngắn về phía bài Chill vừa thích."
      />
    </div>
  );
}

function StepSecondLike() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Bạn thích thêm <strong>&ldquo;Hôm Nay Tôi Buồn&rdquo;</strong>{" "}
        (energy = 28, danceability = 32 — cũng Chill). Hai bài cùng
        cụm kéo tâm của bạn mạnh hơn về phía cụm đó.
      </p>
      <Mini2DPlot
        centroid={{ x: 38, y: 40 }}
        highlighted={[
          { x: 30, y: 36, label: "Mưa Tháng Sáu", color: "#22c55e" },
          { x: 28, y: 32, label: "Hôm Nay Tôi Buồn", color: "#22c55e" },
        ]}
        caption="Tâm vàng dịch sâu hơn vào cụm Chill (xanh lá)."
      />
    </div>
  );
}

function StepTasteShifted() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5 space-y-3">
      <p className="text-sm text-foreground leading-relaxed">
        Sau 5 bài Chill liên tiếp, tâm của bạn đã &ldquo;trôi&rdquo;
        nằm gọn trong cụm Chill. Discover Weekly tuần sau: 80% sẽ là
        chill / acoustic — Spotify đã &ldquo;hiểu&rdquo; bạn.
      </p>
      <Mini2DPlot
        centroid={{ x: 33, y: 37 }}
        highlighted={[
          { x: 30, y: 36, label: "Mưa Tháng Sáu", color: "#22c55e" },
          { x: 28, y: 32, label: "Hôm Nay Tôi Buồn", color: "#22c55e" },
          { x: 40, y: 45, label: "Anh nhà ở đâu thế", color: "#22c55e" },
          { x: 36, y: 42, label: "Nếu Lúc Đó", color: "#22c55e" },
          { x: 32, y: 38, label: "Nơi này có anh", color: "#22c55e" },
        ]}
        caption="Tâm vàng đã định cư trong cụm Chill. Mọi gợi ý từ giờ trở đi nằm quanh đây."
      />
      <div className="rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-700 p-3">
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <strong>Kết quả:</strong> Spotify học được bạn thích chill
          mà không cần bạn tự tay gắn thẻ gu. Đây chính là phép màu
          của phản hồi ẩn (implicit feedback) — hành động thay cho lời
          nói.
        </p>
      </div>
    </div>
  );
}

function Mini2DPlot({
  centroid,
  highlighted,
  caption,
}: {
  centroid: { x: number; y: number };
  highlighted: { x: number; y: number; label: string; color: string }[];
  caption: string;
}) {
  const scaleX = (v: number) => 30 + (v * 280) / 100;
  const scaleY = (v: number) => 220 - (v * 200) / 100;

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 340 250" className="w-full rounded-lg border border-border bg-background">
        <line x1={30} y1={220} x2={310} y2={220} stroke="currentColor" strokeOpacity={0.3} />
        <line x1={30} y1={20} x2={30} y2={220} stroke="currentColor" strokeOpacity={0.3} />
        <text x={170} y={240} fontSize={11} fill="currentColor" fillOpacity={0.5} textAnchor="middle">
          energy
        </text>
        <text x={15} y={120} fontSize={11} fill="currentColor" fillOpacity={0.5} textAnchor="middle" transform="rotate(-90, 15, 120)">
          dance
        </text>

        {(Object.keys(GENRE_META) as Genre[]).map((g) => {
          const members = SONGS.filter((s) => s.genre === g);
          const c = centroidOf(members);
          return (
            <circle
              key={`halo-${g}`}
              cx={scaleX(c.energy)}
              cy={scaleY(c.danceability)}
              r={40}
              fill={GENRE_META[g].color}
              fillOpacity={0.05}
              stroke={GENRE_META[g].color}
              strokeOpacity={0.2}
              strokeDasharray="3,3"
            />
          );
        })}

        {SONGS.map((s, i) => (
          <circle
            key={`bg-${i}`}
            cx={scaleX(s.energy)}
            cy={scaleY(s.danceability)}
            r={3}
            fill={GENRE_META[s.genre].color}
            opacity={0.3}
          />
        ))}

        {highlighted.map((h, i) => (
          <motion.g
            key={`hl-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.15, type: "spring" }}
          >
            <circle
              cx={scaleX(h.x)}
              cy={scaleY(h.y)}
              r={6}
              fill={h.color}
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={scaleX(h.x) + 9}
              y={scaleY(h.y) - 5}
              fontSize={11}
              fill={h.color}
            >
              ♥
            </text>
          </motion.g>
        ))}

        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <circle
            cx={scaleX(centroid.x)}
            cy={scaleY(centroid.y)}
            r={10}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={3}
          />
          <text
            x={scaleX(centroid.x) + 14}
            y={scaleY(centroid.y) + 4}
            fontSize={11}
            fontWeight={700}
            fill="#f59e0b"
          >
            Gu bạn
          </text>
        </motion.g>
      </svg>
      <p className="text-xs text-muted italic leading-relaxed">{caption}</p>
    </div>
  );
}
