/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeroVideoStage } from './components/HeroVideoStage';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  FileText,
  Clock,
  Scale,
  Search,
  Lock,
  CheckCircle2,
  PlayCircle,
  X,
  Menu,
  Table,
  ExternalLink,
  LogOut,
  Loader2,
} from 'lucide-react';
import { googleSignIn, initAuth, logoutGoogle } from './services/googleAuth';
import {
  createLeadsSpreadsheet,
  appendLeadToGoogleSheet,
  getStoredSpreadsheetId,
  ContactLead,
} from './services/googleSheets';
import type { User } from 'firebase/auth';

const DEMO_URL = '#demo-form';

const WORKFLOW_TABS = [
  {
    id: 'tri',
    index: '01',
    title: 'Tri du Bordereau & Qualification des Pièces',
    subtitle: '148 pièces cotées classées instantanément',
    description:
      'Dépouillement exhaustif de dossiers volumineux (contrats sous seing privé, avenants, procès-verbaux d’AG, correspondances officielles, états financiers). LexIIA identifie la qualification juridique de chaque pièce, extrait les dates certaines et indexe le bordereau dans le respect du contradictoire.',
    folders: [
      { code: 'PDF', name: 'Actes & Conventions', count: '38 pièces cotées', sample: 'Contrat-cadre de prestation et avenants n°1 à 4 · Moreau SARL / Delta SA' },
      { code: 'DOCX', name: 'Délibérations & AG', count: '24 pièces cotées', sample: 'Procès-verbaux d’Assemblée Générale Ordinaire et résolutions approuvées' },
      { code: 'PDF', name: 'Correspondances officielles', count: '52 pièces cotées', sample: 'Échanges d’avocat à avocat, notifications et courriels probatoires' },
      { code: 'XLSX', name: 'États comptables & Chiffrage', count: '19 pièces cotées', sample: 'Relevés de facturation, décomptes d’acomptes et pénalités de retard' },
      { code: 'PDF', name: 'Mises en demeure & Constats', count: '15 pièces cotées', sample: 'Notification LRAR de mise en demeure et sommations interpellatives' },
    ],
  },
  {
    id: 'chronologie',
    index: '02',
    title: 'Chronologie Contradictoire des Faits',
    subtitle: 'Frise temporelle probatoire et alertes de rupture',
    description:
      'LexIIA croise les correspondances, procès-verbaux et actes notifiés pour établir la chaîne ininterrompue des événements. Chaque fait générateur de responsabilité est automatiquement relié à sa pièce cotée au bordereau.',
    events: [
      { date: '12 janv. 2026', event: 'Signature du contrat-cadre et engagement des prestations', party: 'Moreau SARL · Delta SA', exhibit: 'Bordereau : Pièce n°1' },
      { date: '03 mars 2026', event: 'Premier manquement contractuel et retard d’exécution avéré', party: 'Delta SA (Défendeur)', exhibit: 'Bordereau : Pièce n°14' },
      { date: '18 mars 2026', event: 'Notification formelle de mise en demeure d’exécuter sous 15 jours', party: 'Me C. Laurent (Conseil)', exhibit: 'Bordereau : Pièce n°22' },
      { date: '02 avr. 2026', event: 'Tentative de conciliation amiable préalable demeurée infructueuse', party: 'En présence des conseils', exhibit: 'Bordereau : Pièce n°31' },
      { date: '15 avr. 2026', event: 'Notification de la résiliation unilatérale aux torts exclusifs', party: 'Moreau SARL (Demandeur)', exhibit: 'Bordereau : Pièce n°39' },
      { date: '30 avr. 2026', event: 'Réception des prétentions indemnitaires reconventionnelles', party: 'Delta SA (Défendeur)', exhibit: 'Bordereau : Pièce n°45' },
    ],
  },
  {
    id: 'synthese',
    index: '03',
    title: 'Note de Synthèse & Qualification Juridique Citée',
    subtitle: 'Visas légaux, doctrine et jurisprudence appliqués',
    description:
      'Génération d’une note de synthèse à l’attention du tribunal ou du client : exposé chronologique des faits constants, qualification juridique des griefs, visas textuels applicables et recommandations stratégiques pour les conclusions au fond.',
    claims: [
      {
        claim: 'Caractérisation de la gravité de l’inexécution contractuelle',
        assessment: 'Droit français : Art. 1217, 1224 et 1226 du Code civil',
        detail:
          'Manquements réitérés constatés malgré la mise en demeure formelle du 18 mars 2026. La résolution unilatérale par notification opérée par Moreau SARL est rigoureusement fondée en droit et conforme aux exigences probatoires de l’article 1226 du Code civil.',
      },
      {
        claim: 'Vérification de la clause résolutoire & Droit luxembourgeois subsidiaire',
        assessment: 'Droit luxembourgeois : Art. 1134 et 1184 du Code civil luxembourgeois',
        detail:
          'La clause résolutoire expresse et le délai de préavis contractuel ont été scrupuleusement observés. L’exception d’inexécution soulevée par la partie adverse ne saurait prospérer au vu des éléments probants cotés sous le bordereau n°22.',
      },
    ],
  },
];

export default function App() {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<string>('tri');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(() => getStoredSpreadsheetId());
  const [sheetUrl, setSheetUrl] = useState<string | null>(() => {
    const id = getStoredSpreadsheetId();
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
  });
  const [isSyncingLead, setIsSyncingLead] = useState(false);
  const [lastSyncedToSheet, setLastSyncedToSheet] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleConnectGoogleSheets = async () => {
    setIsGoogleLoading(true);
    setGoogleSyncMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);

        let currentId = getStoredSpreadsheetId();
        let currentUrl = currentId
          ? `https://docs.google.com/spreadsheets/d/${currentId}/edit`
          : null;

        if (!currentId) {
          const created = await createLeadsSpreadsheet(res.accessToken);
          currentId = created.spreadsheetId;
          currentUrl = created.spreadsheetUrl;
          setSheetId(currentId);
          setSheetUrl(currentUrl);
        } else {
          setSheetId(currentId);
          setSheetUrl(currentUrl);
        }

        // Sync existing local leads if any
        try {
          const localLeads: ContactLead[] = JSON.parse(
            localStorage.getItem('lexiia_contact_leads') || '[]'
          );
          if (localLeads.length > 0 && currentId) {
            for (const lead of localLeads) {
              await appendLeadToGoogleSheet(res.accessToken, currentId, lead);
            }
            setGoogleSyncMsg(`${localLeads.length} prospect(s) existants synchronisés dans Google Sheets.`);
          } else {
            setGoogleSyncMsg('Tableau Google Sheets connecté et prêt à recevoir les demandes.');
          }
        } catch (_) {}
      }
    } catch (err: unknown) {
      console.error('Google connect error:', err);
      setGoogleSyncMsg('Connexion à Google Sheets annulée.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setGoogleSyncMsg(null);
  };

  // Contact / RDV form state
  const [formData, setFormData] = useState({
    fullName: '',
    cabinet: '',
    email: '',
    practiceArea: 'Contentieux commercial & Arbitrage',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.includes('@') || !formData.cabinet.trim()) {
      setFormError('Veuillez renseigner votre nom, votre cabinet et une adresse e-mail professionnelle valide.');
      return;
    }
    setFormError('');

    const newLead: ContactLead = {
      ...formData,
      submittedAt: new Date().toISOString(),
    };

    // 1. Sauvegarde locale de sécurité
    try {
      const existingLeads = JSON.parse(localStorage.getItem('lexiia_contact_leads') || '[]');
      existingLeads.unshift({ ...newLead, id: Date.now().toString() });
      localStorage.setItem('lexiia_contact_leads', JSON.stringify(existingLeads));
    } catch (_) {}

    // 2. Ajout automatique dans Google Sheets si connecté
    if (googleUser && googleToken) {
      setIsSyncingLead(true);
      try {
        let currentId = sheetId || getStoredSpreadsheetId();
        if (!currentId) {
          const created = await createLeadsSpreadsheet(googleToken);
          currentId = created.spreadsheetId;
          setSheetId(currentId);
          setSheetUrl(created.spreadsheetUrl);
        }
        await appendLeadToGoogleSheet(googleToken, currentId, newLead);
        setLastSyncedToSheet(true);
      } catch (err) {
        console.error('Erreur ajout Google Sheets:', err);
        setLastSyncedToSheet(false);
      } finally {
        setIsSyncingLead(false);
      }
    } else {
      setLastSyncedToSheet(false);
    }

    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* =====================================================================
          1. COUVERTURE VIDÉO PLEIN ÉCRAN (Match 1:1 avec le screenshot)
      ===================================================================== */}
      <HeroVideoStage
        demoUrl={DEMO_URL}
        onOpenInteractiveModal={() => setShowVideoModal(true)}
      />

      {/* =====================================================================
          BANDEAU DE TRANSITION (Souveraineté & Pièces volumineuses)
      ===================================================================== */}
      <div className="bg-emerald-50/90 border-b border-emerald-200/80 py-2.5 px-4 text-center text-xs sm:text-sm text-emerald-950 font-medium flex items-center justify-center gap-2 flex-wrap">
        <span>
          Espace de travail souverain pour cabinets d’avocats · Traitement confidentiel des pièces volumineuses &amp; chronologie probatoire certifiée.
        </span>
        <a
          href={DEMO_URL}
          className="underline text-emerald-700 hover:text-emerald-950 font-bold inline-flex items-center gap-1 whitespace-nowrap"
        >
          <span>Tester la démo en direct</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* =====================================================================
          NAVIGATION FLOTTANTE DÉROULANTE (Apparaît au scroll sous le héros plein écran)
      ===================================================================== */}
      {isScrolled && (
        <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Brand Wordmark */}
            <a
              href="#"
              className="flex items-center group transition-opacity hover:opacity-90 shrink-0 py-1"
              aria-label="Accueil LexIIA"
            >
              <img
                src="/assets/aistudio/Logo_LexIIA_2_4503cc56.png"
                alt="Logo LexIIA"
                className="h-8 sm:h-10 w-auto object-contain bg-transparent mix-blend-multiply"
              />
            </a>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-slate-700 font-medium">
              <a
                href="#fonctionnalites"
                className="hover:text-slate-950 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
              >
                Produit
              </a>
              <a
                href="#workflow"
                className="hover:text-slate-950 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
              >
                Solutions
              </a>
              <a
                href="#securite"
                className="hover:text-slate-950 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
              >
                Sécurité
              </a>
              <a
                href="#temoignages"
                className="hover:text-slate-950 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
              >
                Clients
              </a>
              <a
                href="#contact"
                className="hover:text-slate-950 hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
              >
                Entreprise
              </a>
            </nav>

            {/* Zone 3: Action Buttons & Mobile Hamburger Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href={DEMO_URL}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#059669] hover:bg-[#10b981] text-white shadow-md shadow-emerald-500/25 transition-all whitespace-nowrap shrink-0"
              >
                Réserver une démo
              </a>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-950 transition cursor-pointer"
                aria-label="Ouvrir le menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-5 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
                <a
                  href="#fonctionnalites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  Produit
                </a>
                <a
                  href="#workflow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  Solutions
                </a>
                <a
                  href="#securite"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  Sécurité &amp; Secret
                </a>
                <a
                  href="#temoignages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  Clients
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  Entreprise &amp; Contact
                </a>
              </nav>

              <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                <a
                  href={DEMO_URL}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full text-sm font-bold bg-[#059669] hover:bg-[#10b981] text-white transition shadow-md shadow-emerald-500/25"
                >
                  Tester la Démo en Direct
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-950 hover:bg-emerald-100 transition"
                >
                  Réserver un Rendez-vous
                </a>
              </div>
            </div>
          )}
        </header>
      )}

      {/* =====================================================================
          RÉFÉRENCEMENT GEO & PREUVES DE CONFIANCE (Plusieurs cabinets nous font confiance)
      ===================================================================== */}
      <section className="py-14 sm:py-18 border-y border-slate-200 bg-slate-50/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Phrase d'introduction demandée */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 mb-2.5 font-mono-tabular">
              Système de référencement GEO · Barreaux &amp; Juridictions
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Ils nous font confiance
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Déployé auprès d’associés et directeurs juridiques en contentieux des affaires, arbitrage international et restructuration (Paris, Luxembourg, Bruxelles, Lyon, Genève).
            </p>

            {/* Badges géographiques */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 text-xs font-semibold text-slate-600">
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">Barreau de Paris</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">Barreau de Luxembourg</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">Barreau de Bruxelles</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">Barreau de Lyon</span>
              <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">Barreau de Genève</span>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold">51+ Cabinets Référencés</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          LE FIL ROUGE OPÉRATIONNEL (Méthodologie d'instruction : Comprendre, Appliquer, Animer)
      ===================================================================== */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 bg-white">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 mb-4 sm:mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="tracking-wider uppercase font-mono-tabular">Méthodologie d&apos;instruction</span>
          </div>

          {/* Main Title : Le fil rouge opérationnel */}
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif-editorial text-slate-950 tracking-tight leading-[1.15] mb-4 sm:mb-5"
            style={{ textWrap: 'balance' }}
          >
            Le fil rouge opérationnel
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-14 font-normal">
            La progression suit trois mouvements complémentaires pour transformer l’instruction et la stratégie contentieuse au sein de votre cabinet.
          </p>

          {/* Three Operational Movements (COMPRENDRE, APPLIQUER, ANIMER) matching slide */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 border border-slate-200 rounded-2xl sm:rounded-3xl bg-slate-50/50 shadow-sm text-left overflow-hidden">
            {/* Movement 1 : COMPRENDRE */}
            <div className="p-6 sm:p-7 flex flex-col justify-between bg-white hover:bg-slate-50/80 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-tabular font-bold text-emerald-700 tracking-wider uppercase">
                    01 · Mouvement
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase mb-2 sm:mb-3">
                  COMPRENDRE
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Distinguer l’assistance rédactionnelle des agents d’instruction autonomes. Évaluer les garanties d’étanchéité, l’absence de rétention et la stricte conformité au secret professionnel (article 66-5 de la loi du 31 décembre 1971).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-500">
                <span>Déontologie &amp; Discernement technologique</span>
              </div>
            </div>

            {/* Movement 2 : APPLIQUER */}
            <div className="p-6 sm:p-7 flex flex-col justify-between bg-white hover:bg-slate-50/80 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-tabular font-bold text-emerald-700 tracking-wider uppercase">
                    02 · Mouvement
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase mb-2 sm:mb-3">
                  APPLIQUER
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Cartographier les flux procéduraux du cabinet : dépouillement du bordereau de pièces, chronologie contradictoire certifiée, audit des conclusions adverses et calibrage selon les usages de votre Barreau.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-500">
                <span>Pratique contentieuse &amp; Rigueur probatoire</span>
              </div>
            </div>

            {/* Movement 3 : ANIMER */}
            <div className="p-6 sm:p-7 flex flex-col justify-between bg-white hover:bg-slate-50/80 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-tabular font-bold text-emerald-700 tracking-wider uppercase">
                    03 · Mouvement
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase mb-2 sm:mb-3">
                  ANIMER
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Accompagner associés et collaborateurs dans l’adoption pérenne : protocoles de contre-vérification, validation systématique des cotes et capitalisation souveraine du savoir-faire du cabinet.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-500">
                <span>Transmission &amp; Pérennité de l&apos;exercice</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION WORKFLOW INTERACTIF (Blanc & Perle Lumineuse)
      ===================================================================== */}
      <section id="workflow" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-14 gap-6">
          <div className="max-w-2xl">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Chaque jour nous sommes à votre écoute
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Du dossier brut aux conclusions sourcées en trois étapes vérifiables.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs sm:text-sm font-bold text-emerald-950 transition cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <PlayCircle className="w-4 h-4 text-emerald-700" />
              <span>Revoir la vidéo de démonstration</span>
            </button>
          </div>
        </div>

        {/* Interactive Segmented Filter Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-8 sm:mb-10">
          {WORKFLOW_TABS.map((tab) => {
            const isActive = activeWorkflowTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkflowTab(tab.id)}
                className={`text-left p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 border-2 border-[#10b981] ring-2 ring-emerald-500/20 shadow-md text-slate-950'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-tabular mb-2 text-slate-500">
                  <span className="font-semibold text-emerald-700">Étape {tab.index}</span>
                  <span className="truncate ml-2">{tab.subtitle}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  {tab.index}. {tab.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Interactive Stage Preview matching the selected workflow step */}
        <div className="rounded-2xl sm:rounded-3xl legora-studio-canvas p-5 sm:p-8 lg:p-10 text-slate-900 shadow-xl border border-slate-200">
          {activeWorkflowTab === 'tri' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 sm:pb-6 mb-6 border-b border-slate-300">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Classification automatique du bordereau de pièces
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    148 documents triés et indexés dans 5 répertoires thématiques
                  </p>
                </div>
                <a
                  href={DEMO_URL}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] text-slate-950 hover:bg-[#059669] hover:text-white text-xs font-bold transition whitespace-nowrap self-start sm:self-auto shadow-sm"
                >
                  <span>Tester sur vos propres pièces</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {WORKFLOW_TABS[0].folders?.map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl bg-white/95 border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-500 mb-1.5">
                        <span className="font-semibold text-emerald-800">Format : {f.code}</span>
                        <span className="font-medium text-slate-600">{f.count}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                        {f.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 pt-2.5 border-t border-slate-100 font-mono-tabular line-clamp-2">
                      {f.sample}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

              {activeWorkflowTab === 'chronologie' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 sm:pb-6 mb-6 border-b border-slate-300">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Reconstitution de la chronologie des faits · Frise contradictoire
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Chaque événement est extrait et relié à sa pièce justificative cotée au bordereau
                  </p>
                </div>
                <span className="text-xs font-mono-tabular text-slate-600 self-start sm:self-auto bg-white/80 px-2.5 py-1 rounded-md border border-slate-200">
                  Dossier : Affaire_Moreau_SARL_c_Delta_SA.lex
                </span>
              </div>

              {/* Mobile View: Vertical Timeline Cards */}
              <div className="sm:hidden space-y-3">
                {WORKFLOW_TABS[1].events?.map((ev, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-tabular">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {ev.date}
                      </span>
                      <span className="text-emerald-700 font-semibold">{ev.exhibit}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {ev.event}
                    </p>
                    <p className="text-xs text-slate-600 font-mono-tabular">
                      Partie : {ev.party}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tablet & Desktop View: Clean Table */}
              <div className="hidden sm:block rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-200 text-xs font-bold text-slate-600 bg-slate-50/75">
                  <div className="col-span-3 lg:col-span-2">Date certaine</div>
                  <div className="col-span-6 lg:col-span-6">Événement &amp; Fait générateur</div>
                  <div className="col-span-3 lg:col-span-2">Partie prenante</div>
                  <div className="hidden lg:block lg:col-span-2 text-right">Pièce cotée</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {WORKFLOW_TABS[1].events?.map((ev, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-center px-5 py-3.5 text-xs sm:text-sm hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="col-span-3 lg:col-span-2 font-mono-tabular font-bold text-slate-900">
                        {ev.date}
                      </div>
                      <div className="col-span-6 lg:col-span-6 font-medium text-slate-900 pr-3">
                        {ev.event}
                      </div>
                      <div className="col-span-3 lg:col-span-2 text-slate-600 text-xs sm:text-sm">
                        {ev.party}
                      </div>
                      <div className="hidden lg:block lg:col-span-2 text-right font-mono-tabular text-xs text-emerald-700 font-bold">
                        {ev.exhibit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeWorkflowTab === 'synthese' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 sm:pb-6 mb-6 border-b border-slate-300">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Matrice de confrontation des griefs &amp; preuves
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Analyse contradictoire certifiée avec citations textuelles vérifiables
                  </p>
                </div>
                <a
                  href={DEMO_URL}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] text-slate-950 hover:bg-[#059669] hover:text-white text-xs font-bold transition whitespace-nowrap self-start sm:self-auto shadow-sm"
                >
                  <span>Demander une analyse personnalisée</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {WORKFLOW_TABS[2].claims?.map((item, idx) => (
                  <div key={idx} className="rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
                    <p className="text-xs font-mono-tabular font-bold text-emerald-700 mb-2">
                      {item.assessment}
                    </p>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">
                      {item.claim}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          FONCTIONNALITÉS CLÉS (Fond Blanc & Cartes Subtiles)
      ===================================================================== */}
      <section id="fonctionnalites" className="py-16 sm:py-24 border-t border-slate-200 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 mb-2 sm:mb-3 font-mono-tabular">
              Capacités Dédiées au Barreau &amp; Directions Juridiques
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Conçu pour la rigueur du contentieux complexe, de l’arbitrage et des fusions-acquisitions.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Carte 1 */}
            <div className="md:col-span-2 p-6 sm:p-8 lg:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition duration-300 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono-tabular text-emerald-700 font-semibold mb-3 sm:mb-4">
                  01 · Dépouillement Massif &amp; Reconstitution Chronologique
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">
                  Instruction Multi-Pièces &amp; Détection des Incohérences
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                  LexIIA passe au crible des milliers de courriels, procès-verbaux, contrats, avenants et bordereaux pour dresser la chronologie probatoire intégrale de votre affaire. Chaque divergence de date, omission matérielle ou version contradictoire entre deux pièces est immédiatement isolée.
                </p>
              </div>
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 font-mono-tabular">
                <span>OCR Haute Fidélité</span>
                <span className="hidden sm:inline">·</span>
                <span>Bordereau conforme au RPVA</span>
                <span className="hidden sm:inline">·</span>
                <span>Export conclusions Word &amp; PDF sourcé</span>
              </div>
            </div>

            {/* Carte 2 */}
            <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition duration-300 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono-tabular text-emerald-700 font-semibold mb-3 sm:mb-4">
                  02 · Stratégie de Conclusions
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">
                  Audit Contradictoire des Prétentions Adverses
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Mise en miroir systématique des écritures adverses face à vos pièces cotées : identification instantanée des contradictions factuelles et failles juridiques.
                </p>
              </div>
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 text-xs text-emerald-700 font-mono-tabular font-bold">
                Gain moyen constaté : 14h par jeu de conclusions
              </div>
            </div>

            {/* Carte 3 */}
            <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition duration-300 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono-tabular text-emerald-700 font-semibold mb-3 sm:mb-4">
                  03 · Force Probante &amp; Traçabilité
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">
                  Rédaction Sourcée &amp; Visas Textuels
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Chaque paragraphe rédigé comporte des renvois directs et opposables vers la pièce exacte, le numéro de bordereau et la page correspondante.
                </p>
              </div>
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 text-xs text-emerald-700 font-mono-tabular font-bold">
                Contre-vérification immédiate en 1 clic
              </div>
            </div>

            {/* Carte 4 */}
            <div className="md:col-span-2 p-6 sm:p-8 lg:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition duration-300 flex flex-col justify-between">
              <div id="securite">
                <p className="text-xs font-mono-tabular text-emerald-700 font-semibold mb-3 sm:mb-4">
                  04 · Secret Professionnel &amp; Souveraineté
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">
                  Secret Professionnel Absolu (Art. 66-5) &amp; Hébergement Européen
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Vos pièces demeurent sous le sceau exclusif du secret professionnel de l’avocat. Aucune donnée client n’est conservée par les fournisseurs de modèles ni utilisée à des fins d’entraînement. Chiffrement de bout en bout AES-256 et infrastructure certifiée au sein de l’Union Européenne.
                </p>
              </div>
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 font-mono-tabular">
                <span>Cloisonnement étanche par dossier</span>
                <span className="hidden sm:inline">·</span>
                <span>Registre d&apos;audit infalsifiable</span>
                <span className="hidden sm:inline">·</span>
                <span>Conforme RGPD, CNB &amp; RIN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CAS D'USAGE & TÉMOIGNAGES ATTRIBUÉS (#temoignages)
      ===================================================================== */}
      <section
        id="temoignages"
        className="py-16 sm:py-24 border-t border-slate-200 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 mb-2 sm:mb-3 font-mono-tabular">
              Retours d&apos;Expérience &amp; Cas d&apos;Usage Cabinet
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Adopté par les équipes contentieux et corporate les plus exigeantes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700 font-mono-tabular font-bold mb-3 sm:mb-4">
                  <span>Contentieux des Affaires &amp; Arbitrage</span>
                  <span>·</span>
                  <span>2 350 pièces instruites en une matinée</span>
                </div>
                <blockquote className="text-slate-800 text-sm sm:text-base md:text-lg leading-relaxed mb-6 font-normal">
                  « Face à un litige post-acquisition particulièrement lourd comportant plus de deux mille annexes contractuelles et techniques, LexIIA a reconstitué la chronologie opposable des échanges et isolé la notification contradictoire décisive lors de l’audience de plaidoirie. »
                </blockquote>
              </div>
              <div className="pt-5 sm:pt-6 border-t border-slate-200 text-xs sm:text-sm">
                <p className="font-bold text-slate-900">Maître Marc-Antoine Vasseur</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Associé Contentieux &amp; Arbitrage · Cabinet Vasseur, Lemaire &amp; Associés (Barreau de Paris)
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700 font-mono-tabular font-bold mb-3 sm:mb-4">
                  <span>Audit Due Diligence M&amp;A</span>
                  <span>·</span>
                  <span>Temps de revue de la Data Room divisé par 5</span>
                </div>
                <blockquote className="text-slate-800 text-sm sm:text-base md:text-lg leading-relaxed mb-6 font-normal">
                  « Le dépouillement méthodique de la Data Room et l’identification automatique des clauses de changement de contrôle nous permettent de livrer un rapport d’audit entièrement sourcé en 48 heures, dans le respect scrupuleux de notre secret professionnel. »
                </blockquote>
              </div>
              <div className="pt-5 sm:pt-6 border-t border-slate-200 text-xs sm:text-sm">
                <p className="font-bold text-slate-900">Maître Claire-Hélène Rochefort</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Associée Corporate M&amp;A · Rochefort Avocats (Barreaux de Paris &amp; Bruxelles)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BANNIÈRE D'APPEL DIRECT À LA DÉMO + FORMULAIRE DE RDV (#contact)
      ===================================================================== */}
      <section id="contact" className="py-16 sm:py-24 border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* =====================================================================
              MODULE SYNCHRONISATION GOOGLE SHEETS
          ===================================================================== */}
          <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Table className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    Tableau Google Sheets des Prospects
                  </span>
                  {googleUser ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Connecté
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                      Non connecté
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                  {googleUser
                    ? `Compte actif : ${googleUser.email}. Chaque demande reçue est automatiquement insérée en temps réel.`
                    : 'Connectez votre compte Google pour créer et alimenter automatiquement le tableau de prospects.'}
                </p>
                {googleSyncMsg && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {googleSyncMsg}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
              {googleUser ? (
                <>
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-slate-950 hover:text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
                    >
                      <span>Ouvrir mon Google Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogleSheets}
                  disabled={isGoogleLoading}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Connexion...' : 'Activer Google Sheets'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Colonne Gauche : Accès direct à la démo en ligne */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 font-mono-tabular">
              Démonstration Privée &amp; Déploiement Cabinet
            </p>
            <h2
              className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Testez LexIIA sur vos dossiers en toute confidentialité.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
              Découvrez la puissance de l’espace de travail collaboratif conçu pour les avocats, juristes et directions juridiques. Évaluez la rapidité d’instruction de vos bordereaux, la rigueur de vos chronologies probatoires et la stricte conformité déontologique lors d’une session privée.
            </p>

            <div className="pt-2">
              <a
                href="#demo-form"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#10b981] hover:bg-[#059669] text-slate-950 hover:text-white font-bold shadow-xl shadow-emerald-500/30 transition transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span>Accéder au formulaire de démonstration</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-5 sm:pt-6 border-t border-slate-200 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Démonstration personnalisée sur vos typologies de contentieux ou d’audits</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Garantie d’étanchéité totale et respect du secret professionnel (Art. 66-5)</span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Accompagnement méthodologique des associés et collaborateurs inclus</span>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Formulaire de réservation de RDV validé */}
          <div id="demo-form" className="lg:col-span-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 lg:p-10 scroll-mt-24">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">
              Réserver une démonstration personnalisée
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">
              Échangez 30 minutes avec un juriste-consultant pour évaluer LexIIA sur vos dossiers et bordereaux types.
            </p>

            {formSubmitted ? (
              <div className="p-5 sm:p-6 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm sm:text-base">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Demande de rendez-vous confirmée</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Merci <strong>{formData.fullName}</strong>. Notre équipe dédiée aux cabinets d&apos;avocats a bien reçu votre demande pour <strong>{formData.cabinet}</strong> et vous transmettra deux créneaux de démonstration sous 2 heures ouvrées à l&apos;adresse <strong>{formData.email}</strong>.
                </p>

                {lastSyncedToSheet && sheetUrl ? (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-emerald-900 bg-white/90 px-3.5 py-2.5 rounded-xl border border-emerald-300">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ligne ajoutée instantanément dans Google Sheets</span>
                    </div>
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 font-bold underline"
                    >
                      <span>Ouvrir le tableur</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    (Données enregistrées localement dans votre session).
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setFormSubmitted(false)}
                  className="text-xs font-semibold text-emerald-700 underline cursor-pointer pt-1 block"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Titre, Nom &amp; Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Me Jean-Baptiste Moreau"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cabinet d’avocats / Barreau *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Moreau & Associés AARPI (Barreau de Paris)"
                      value={formData.cabinet}
                      onChange={(e) =>
                        setFormData({ ...formData, cabinet: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      E-mail professionnel (ou e-barreau) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jb.moreau@cabinet-moreau.fr"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pratique dominante du cabinet
                    </label>
                    <select
                      value={formData.practiceArea}
                      onChange={(e) =>
                        setFormData({ ...formData, practiceArea: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    >
                      <option>Contentieux des affaires &amp; Arbitrage</option>
                      <option>Corporate M&amp;A &amp; Private Equity</option>
                      <option>Droit pénal des affaires &amp; Compliance</option>
                      <option>Droit social &amp; Restructurations</option>
                      <option>Immobilier, Baux commerciaux &amp; Construction</option>
                      <option>Propriété intellectuelle &amp; Technologies</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Volume moyen de pièces ou attentes spécifiques (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex : Dossiers contentieux de 300 à 2 500 pièces, besoin de chronologies opposables et notes de synthèse..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-600 font-semibold">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#10b981] hover:bg-[#059669] text-slate-950 hover:text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                >
                  Planifier ma démonstration privée
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>

      {/* =====================================================================
          FOOTER SOBRE, ÉDITORIAL & CLAIR
      ===================================================================== */}
      <footer className="border-t border-slate-200 bg-white py-8 sm:py-12 text-slate-600 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <a href="#" className="inline-block transition-opacity hover:opacity-90">
              <img
                src="/assets/aistudio/Logo_LexIIA_2_4503cc56.png"
                alt="Logo LexIIA"
                className="h-7 sm:h-8 w-auto object-contain bg-transparent mix-blend-multiply"
              />
            </a>
            <span className="text-slate-300 font-light">|</span>
            <span>Tous droits réservés &copy; 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#securite" className="hover:text-slate-900 transition">
              Confidentialité &amp; RGPD
            </a>
            <a href="#securite" className="hover:text-slate-900 transition">
              Secret Professionnel
            </a>
            <a
              href={DEMO_URL}
              className="text-emerald-700 hover:text-emerald-900 font-semibold transition"
            >
              Réserver une Démo
            </a>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          MODALE LECTEUR VIDÉO DE RÉFÉRENCE
      ===================================================================== */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[80%]">
                Aperçu Vidéo LexIIA — Démonstration Complète
              </span>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black overflow-hidden flex items-center justify-center">
              <video
                src="/assets/aistudio/LexIIA_presentation_v2__1__4936769a.mp4"
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
