import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  ArrowRight,
} from 'lucide-react';

interface HeroVideoStageProps {
  demoUrl: string;
  onOpenInteractiveModal?: () => void;
}

const TOTAL_DURATION = 32; // Duration of LexIIA presentation video

interface SceneChapter {
  id: string;
  label: string;
  shortLabel: string;
  time: number;
}

const CHAPTERS: SceneChapter[] = [
  { id: 'intro', label: '01 · Dossier d’instruction', shortLabel: '01 · Dossier modèle', time: 0 },
  { id: 'prompt', label: '02 · Requête juridique & IA', shortLabel: '02 · Requête IA', time: 3.2 },
  { id: 'plan', label: '03 · Calendrier d’instruction', shortLabel: '03 · Calendrier', time: 6.8 },
  { id: 'sorting', label: '04 · Dépouillement du bordereau', shortLabel: '04 · Tri 148 pièces', time: 12.8 },
  { id: 'timeline', label: '05 · Chronologie contradictoire', shortLabel: '05 · Chronologie', time: 16.5 },
  { id: 'brief', label: '06 · Note de synthèse & visas', shortLabel: '06 · Note de synthèse', time: 19.8 },
  { id: 'augmented', label: '07 · Cabinet augmenté & Secret', shortLabel: '07 · Cabinet augmenté', time: 26.0 },
];

export const HeroVideoStage: React.FC<HeroVideoStageProps> = ({ demoUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Sync state with HTML5 video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Initial autoplay attempt
    video.play().catch(() => {
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const jumpToTime = (timeInSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRestart = () => {
    jumpToTime(0);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      if (video.requestFullscreen) {
        video.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Find active chapter
  const activeChapter =
    [...CHAPTERS].reverse().find((c) => currentTime >= c.time) || CHAPTERS[0];

  return (
    <section className="relative w-full bg-white pt-4 pb-14 sm:pt-6 sm:pb-20 px-4 sm:px-6 flex flex-col items-center">
      {/* =====================================================================
          1. LA VIDÉO DANS LE HERO (Première position à l'ouverture)
      ===================================================================== */}
      <div className="w-full max-w-6xl mb-3 flex items-center justify-between px-1 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-semibold text-slate-900">
            Démonstration en conditions réelles · Instruction automatisée d&apos;un dossier
          </span>
        </div>
        <span className="hidden sm:inline font-mono-tabular text-emerald-700 font-semibold">
          Dossier modèle : Moreau SARL c/ Delta SA · 148 pièces cotées
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-6xl aspect-video min-h-[300px] sm:min-h-[440px] md:min-h-[540px] max-h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-slate-200 bg-black flex flex-col justify-between group"
      >
        <video
          ref={videoRef}
          src="/assets/aistudio/LexIIA_presentation_v2__1__4936769a.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain md:object-cover bg-black"
        />

        {/* Ambient video blur for letterbox areas */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 blur-2xl scale-110">
          <video
            src="/assets/aistudio/LexIIA_presentation_v2__1__4936769a.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Top & bottom subtle gradient overlays for in-video controls readability */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

        {/* TOP CONTROLS (Active Scene Badge + Audio/Replay/Fullscreen buttons) */}
        <div className="relative z-20 px-3.5 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 hover:bg-black/80 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs text-slate-200 shadow-md transition">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-none">
              <span className="hidden sm:inline">{activeChapter.label}</span>
              <span className="sm:hidden">{activeChapter.shortLabel}</span>
            </span>
            <span className="text-slate-400 font-mono-tabular shrink-0">
              {Math.floor(currentTime)}s / {TOTAL_DURATION}s
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Replay Button */}
            <button
              type="button"
              onClick={handleRestart}
              title="Recommencer depuis le début"
              className="p-2 sm:p-2.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleFullscreen}
              title="Plein écran"
              className="hidden sm:inline-flex p-2.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FLOATING PLAY / PAUSE BUTTON */}
        <div className="absolute right-3.5 sm:right-6 top-1/2 -translate-y-1/2 z-20">
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
            className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="2.5"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.8"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                strokeLinecap="round"
              />
            </svg>
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* BOTTOM PROGRESS LINE ON VIDEO */}
        <div className="relative z-20 w-full h-1 bg-white/20">
          <div
            className="h-full bg-emerald-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* =====================================================================
          CHAPTERS SCRUBBER & CALL TO ACTION
      ===================================================================== */}
      <div className="w-full max-w-4xl mt-6 sm:mt-8 flex flex-col items-center gap-5 mb-14 sm:mb-20">
        {/* Interactive Chapters Scrubber Bar */}
        <div
          ref={scrubberRef}
          className="w-full flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1.5 scroll-smooth scrollbar-none snap-x snap-mandatory bg-slate-100/90 border border-slate-200/90 rounded-full p-1.5 shadow-sm"
        >
          {CHAPTERS.map((ch) => {
            const isActive = activeChapter.id === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToTime(ch.time)}
                className={`snap-start px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#10b981] text-slate-950 shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400 font-black'
                    : 'bg-white hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-950 border border-slate-200 shadow-xs'
                }`}
              >
                <span className="hidden sm:inline">{ch.label}</span>
                <span className="sm:hidden">{ch.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Action Callouts */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
          <a
            href={demoUrl}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold bg-[#10b981] hover:bg-[#059669] text-slate-950 hover:text-white shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 text-center"
          >
            <span>Tester la Démo en Direct</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#demo-form"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm transition whitespace-nowrap shrink-0 text-center"
          >
            <span>Réserver un RDV cabinet</span>
            <ArrowRight className="w-4 h-4 text-emerald-800" />
          </a>
        </div>
      </div>
    </section>
  );
};
