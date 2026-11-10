import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X, Play, Pause, ChevronDown } from 'lucide-react';

interface HeroVideoStageProps {
  demoUrl: string;
  onOpenInteractiveModal?: () => void;
}

export const HeroVideoStage: React.FC<HeroVideoStageProps> = ({ demoUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const interactTimeoutRef = useRef<number | null>(null);

  // Initialize and ensure autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
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

    // Show temporary feedback indicator
    setIsInteracting(true);
    if (interactTimeoutRef.current) {
      window.clearTimeout(interactTimeoutRef.current);
    }
    interactTimeoutRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 700);
  };

  return (
    <section className="relative w-full h-[100dvh] min-h-[580px] overflow-hidden flex flex-col justify-between bg-black text-white select-none">
      {/* =====================================================================
          1. VIDÉO PLEIN BORD-À-BORD (Couvre les angles gauche et droite à 100%)
      ===================================================================== */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full overflow-hidden z-0 cursor-pointer"
        title={isPlaying ? 'Cliquer pour mettre en pause' : 'Cliquer pour reprendre'}
      >
        <video
          ref={videoRef}
          src="/assets/aistudio/LexIIA_presentation_v2__1__4936769a.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        />

        {/* Dégradés supérieurs et inférieurs légers pour garantir la lisibilité des boutons */}
        <div className="absolute inset-x-0 top-0 h-28 sm:h-36 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 sm:h-44 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        {/* Indicateur de pause / reprise élégant au clic */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            isInteracting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl">
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-9 sm:h-9" />
            ) : (
              <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. NAVIGATION SUPÉRIEURE TRANSPARENTE
      ===================================================================== */}
      <header className="relative z-30 w-full px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between gap-4">
        {/* Liens de gauche pour grand écran */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-white/90">
          <a
            href="#fonctionnalites"
            className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
          >
            Produit
          </a>
          <a
            href="#workflow"
            className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
          >
            Solutions
          </a>
          <a
            href="#securite"
            className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
          >
            Sécurité
          </a>
          <a
            href="#temoignages"
            className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
          >
            Clients
          </a>
          <a
            href="#contact"
            className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
          >
            Entreprise
          </a>
        </nav>

        {/* Logo central : LEXIIA */}
        <div className="flex items-center justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <a
            href="#"
            className="flex items-center group transition-opacity hover:opacity-90"
            aria-label="Accueil LexIIA"
          >
            <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest text-white font-sans drop-shadow-md">
              LEXIIA
            </span>
          </a>
        </div>

        {/* Liens de droite */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
            <a
              href="#workflow"
              className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
            >
              Ressources
            </a>
            <a
              href="#contact"
              className="hover:text-white transition drop-shadow-sm whitespace-nowrap"
            >
              Se connecter
            </a>
          </div>

          <a
            href={demoUrl}
            className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#059669] hover:bg-[#10b981] text-white shadow-lg shadow-emerald-950/40 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>Réservez une démo</span>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-[#059669] flex items-center justify-center shrink-0">
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
            </span>
          </a>

          {/* Menu Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/25 text-white transition cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Menu mobile déroulant translucide */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-18 inset-x-3 z-50 rounded-2xl bg-[#0b1120]/95 backdrop-blur-2xl border border-white/20 p-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-white/90">
            <a
              href="#fonctionnalites"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-white/10 transition"
            >
              Produit &amp; Fonctionnalités
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-white/10 transition"
            >
              Solutions &amp; Méthodologie
            </a>
            <a
              href="#securite"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-white/10 transition"
            >
              Sécurité &amp; Secret Professionnel
            </a>
            <a
              href="#temoignages"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-white/10 transition"
            >
              Clients &amp; Cas d&apos;usage
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-white/10 transition"
            >
              Entreprise &amp; Contact
            </a>
          </nav>

          <div className="pt-2 border-t border-white/15">
            <a
              href={demoUrl}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold bg-[#059669] hover:bg-[#10b981] text-white shadow-lg transition"
            >
              <span>Réservez une démo</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Spacer pour équilibrer la distribution verticale */}
      <div className="flex-1" />

      {/* =====================================================================
          3. BAS D'ÉCRAN : BOUTON PRINCIPAL & INDICATION DE DÉFILEMENT
      ===================================================================== */}
      <div className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 flex flex-col items-center justify-center text-center gap-3">
        <a
          href={demoUrl}
          className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold bg-[#059669] hover:bg-[#10b981] text-white shadow-2xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer border border-emerald-400/40"
        >
          <span>Réservez une démo</span>
          <span className="w-5 h-5 rounded-full bg-white text-[#059669] flex items-center justify-center shrink-0">
            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
          </span>
        </a>

        {/* Indicateur de scroll discret invitant à explorer la suite */}
        <a
          href="#workflow"
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white/70 hover:text-white transition pt-1 cursor-pointer"
        >
          <span>Découvrir la suite</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
        </a>
      </div>
    </section>
  );
};
