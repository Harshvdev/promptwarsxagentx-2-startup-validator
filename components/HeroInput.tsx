"use client";

import React, { useId, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart2,
  Box,
  Building2,
  ChevronDown,
  FileText,
  Globe,
  Info,
  Layers,
  MapPin,
  Megaphone,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import type { AnalysisInput, StartupReport } from "@/lib/types";
import { DEMO_PRESETS } from "@/lib/presets";
import { HeroIllustration3D } from "./HeroIllustration3D";

interface HeroInputProps {
  isRunning: boolean;
  errorMessage: string | null;
  onSubmitIdea: (input: AnalysisInput) => void;
  onLoadPreset: (preset: StartupReport) => void;
  onShowToast: (msg: string) => void;
}

const BUSINESS_MODELS: AnalysisInput["businessModel"][] = [
  "Auto-detect",
  "Marketplace",
  "B2B SaaS",
  "B2C App",
  "AI Tool / API",
  "Hardware / Climate",
];

const REGIONS = [
  "United States",
  "Global",
  "India",
  "US & India Metro Cities",
  "Europe / UK",
];

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4C4.5 4 3 6.5 3 9.5C3 13 4.5 16 6 18C7.5 20 8.5 21 9.5 21C10.5 21 11 19 11 16.5C11 15 11.5 14 12 14C12.5 14 13 15 13 16.5C13 19 13.5 21 14.5 21C15.5 21 16.5 20 18 18C19.5 16 21 13 21 9.5C21 6.5 19.5 4 17 4C14.5 4 13.5 6 12 6C10.5 6 9.5 4 7 4Z" />
    </svg>
  );
}

export function HeroInput({
  isRunning,
  errorMessage,
  onSubmitIdea,
  onLoadPreset,
  onShowToast,
}: HeroInputProps) {
  const ideaId = useId();
  const errorId = useId();
  const regionId = useId();
  const modelId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [idea, setIdea] = useState("");
  const [region, setRegion] = useState("United States");
  const [businessModel, setBusinessModel] =
    useState<AnalysisInput["businessModel"]>("Auto-detect");
  const [enableDeepScrape, setEnableDeepScrape] = useState(true);
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [flashHighlight, setFlashHighlight] = useState(false);

  const trimmed = idea.trim();
  const len = trimmed.length;
  const isValid = len >= 10 && len <= 1200;
  const validationError =
    len === 0
      ? "Describe your startup idea so the agents know what to research."
      : len < 10
        ? "Add a little more detail (minimum 10 characters) for accurate research."
        : null;
  const showValidationError = Boolean(
    validationError && (touched || submitAttempted)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!isValid || isRunning) {
      textareaRef.current?.focus();
      return;
    }
    onSubmitIdea({
      idea: trimmed,
      region,
      businessModel,
      enableDeepScrape,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleUsePresetPrompt = (preset: StartupReport) => {
    setIdea(preset.input.idea);
    setRegion(preset.input.region);
    setBusinessModel(preset.input.businessModel);
    setEnableDeepScrape(preset.input.enableDeepScrape);
    setTouched(false);
    setSubmitAttempted(false);
    setFlashHighlight(true);
    setTimeout(() => setFlashHighlight(false), 900);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => textareaRef.current?.focus(), 250);
    onShowToast(`Loaded "${preset.framer.startupTitle}" prompt into editor`);
  };

  return (
    <div className="view-enter">
      {/* ====================================================================
          TOP HERO SECTION (Dark background with glowing 3D illustration)
          ==================================================================== */}
      <section className="hero-split-grid">
        <div className="hero-left-content">
          {/* Eyebrow Tag */}
          <div className="eyebrow-pill-hero">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
            <span>Startup Idea Validator</span>
          </div>

          {/* Heading */}
          <h1 className="hero-main-heading">
            Stress-test your<br />
            startup idea before<br />
            <span className="accent-solid-orange">writing code.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-main-subtext">
            Live market, competitor, customer, risk, and 90-day roadmap validation in ~60s (deep research run).
          </p>

          {/* 5 Feature Pills Row */}
          <div className="hero-feature-pills">
            <div className="feat-pill">
              <BarChart2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>Market size</span>
            </div>
            <div className="feat-pill">
              <Network className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
              <span>Competitors</span>
            </div>
            <div className="feat-pill">
              <Users className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              <span>Customer fit</span>
            </div>
            <div className="feat-pill">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Risks</span>
            </div>
            <div className="feat-pill">
              <MapPin className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>Roadmap</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Illustration Scene */}
        <div className="hero-right-visual">
          <HeroIllustration3D />
        </div>
      </section>

      {/* ====================================================================
          FLOATING COMPOSER CARD (White glowing card at transition)
          ==================================================================== */}
      <div className="composer-wrapper-anchor">
        <form
          className={`composer-card-white ${flashHighlight ? "flash-highlight" : ""}`}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Startup idea submission form"
        >
          {/* Inner Recessed Text Box with Left Orange Accent Bar */}
          <div className="composer-recessed-box">
            <div className="composer-orange-accent-bar" aria-hidden="true" />
            <div className="composer-textarea-body">
              <label htmlFor={ideaId} className="composer-inner-heading">
                Describe your startup idea...
              </label>

              <textarea
                ref={textareaRef}
                id={ideaId}
                name="idea"
                className="composer-textarea-native"
                minLength={10}
                maxLength={1200}
                required
                enterKeyHint="send"
                value={idea}
                aria-invalid={showValidationError ? "true" : undefined}
                aria-describedby={showValidationError ? errorId : undefined}
                onChange={(e) => setIdea(e.target.value)}
                onBlur={() => setTouched(true)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Startup that lets people hire vetted local professionals temporarily to inspect secondhand items before buying..."
              />

              <div className="composer-char-row">
                <span
                  id={errorId}
                  className="composer-err-msg"
                  role={showValidationError ? "alert" : undefined}
                >
                  {showValidationError ? validationError : ""}
                </span>
                <span className="composer-char-count mono">
                  {len.toLocaleString()} / 1,200
                </span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="composer-form-error" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Bottom Toolbar: Region, Model, Deep Scrape, Validate Idea Button */}
          <div className="composer-bottom-toolbar">
            <div className="composer-controls-left">
              {/* Region Select */}
              <div className="selector-group">
                <div className="selector-group-label">
                  <Globe className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <span>Region</span>
                </div>
                <div className="custom-pill-select-wrap">
                  <label htmlFor={regionId} className="sr-only">
                    Select target region
                  </label>
                  <select
                    id={regionId}
                    name="region"
                    className="custom-pill-select"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pill-select-arrow" aria-hidden="true" />
                </div>
              </div>

              {/* Model Select */}
              <div className="selector-group">
                <div className="selector-group-label">
                  <Box className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <span>Model</span>
                </div>
                <div className="custom-pill-select-wrap">
                  <label htmlFor={modelId} className="sr-only">
                    Select business model
                  </label>
                  <select
                    id={modelId}
                    name="businessModel"
                    className="custom-pill-select"
                    value={businessModel}
                    onChange={(e) =>
                      setBusinessModel(
                        e.target.value as AnalysisInput["businessModel"]
                      )
                    }
                  >
                    {BUSINESS_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pill-select-arrow" aria-hidden="true" />
                </div>
              </div>

              {/* Deep Scrape Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={enableDeepScrape}
                className="deep-scrape-pill-toggle"
                onClick={() => setEnableDeepScrape((v) => !v)}
                title="Scrape live competitor pages via TinyAgent"
              >
                <span className={`pill-switch-track ${enableDeepScrape ? "on" : ""}`}>
                  <span className="pill-switch-thumb" />
                </span>
                <span className="deep-scrape-text">Deep Scrape</span>
                <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden="true" />
              </button>
            </div>

            {/* Validate Idea Primary Orange Button */}
            <button
              type="submit"
              className="btn-validate-gradient"
              disabled={isRunning}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isRunning ? "Running..." : "Validate Idea"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      {/* ====================================================================
          BOTTOM SECTION: EXAMPLE REPORTS
          ==================================================================== */}
      <section id="example-reports-section" className="examples-section">
        <div className="examples-section-header">
          <div className="examples-header-left">
            <div className="examples-layers-icon">
              <Layers className="h-5 w-5 text-gray-900" aria-hidden="true" />
            </div>
            <div>
              <h2 className="examples-title">Example Reports</h2>
              <p className="examples-subtitle">
                See what a full validation report looks like.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-view-all-pill"
            onClick={() => onLoadPreset(DEMO_PRESETS[0])}
          >
            <span>View All Examples</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="examples-cards-grid">
          {/* Card 1: InspectMint */}
          {DEMO_PRESETS[0] && (
            <article className="example-report-card">
              <div className="example-card-top-row">
                <div className="example-icon-container icon-orange">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="example-card-meta">
                  <div className="example-card-tag-row">
                    <span className="example-tag-pill">
                      <Users className="h-3 w-3 text-gray-600" aria-hidden="true" />
                      <span>Two-Sided Service Marketplace</span>
                    </span>
                    <span className="score-badge-yellow">73</span>
                  </div>
                  <h3 className="example-card-title">
                    {DEMO_PRESETS[0].framer.startupTitle}
                  </h3>
                </div>
              </div>

              <p className="example-card-summary">
                {DEMO_PRESETS[0].framer.oneLiner}
              </p>

              <div className="example-card-actions">
                <button
                  type="button"
                  className="btn-card-view-report"
                  onClick={() => onLoadPreset(DEMO_PRESETS[0])}
                >
                  <span>View Report</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-card-use-prompt"
                  onClick={() => handleUsePresetPrompt(DEMO_PRESETS[0])}
                >
                  <FileText className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  <span>Use Prompt</span>
                </button>
              </div>
            </article>
          )}

          {/* Card 2: DentShield AI */}
          {DEMO_PRESETS[1] && (
            <article className="example-report-card">
              <div className="example-card-top-row">
                <div className="example-icon-container icon-mint">
                  <ToothIcon className="h-5 w-5" />
                </div>
                <div className="example-card-meta">
                  <div className="example-card-tag-row">
                    <span className="example-tag-pill">
                      <Building2 className="h-3 w-3 text-gray-600" aria-hidden="true" />
                      <span>B2B SaaS</span>
                    </span>
                    <span className="score-badge-green">82</span>
                  </div>
                  <h3 className="example-card-title">
                    {DEMO_PRESETS[1].framer.startupTitle}
                  </h3>
                </div>
              </div>

              <p className="example-card-summary">
                {DEMO_PRESETS[1].framer.oneLiner}
              </p>

              <div className="example-card-actions">
                <button
                  type="button"
                  className="btn-card-view-report"
                  onClick={() => onLoadPreset(DEMO_PRESETS[1])}
                >
                  <span>View Report</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-card-use-prompt"
                  onClick={() => handleUsePresetPrompt(DEMO_PRESETS[1])}
                >
                  <FileText className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  <span>Use Prompt</span>
                </button>
              </div>
            </article>
          )}

          {/* Card 3: DealPulse */}
          {DEMO_PRESETS[2] && (
            <article className="example-report-card">
              <div className="example-card-top-row">
                <div className="example-icon-container icon-purple">
                  <Megaphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="example-card-meta">
                  <div className="example-card-tag-row">
                    <span className="example-tag-pill">
                      <Zap className="h-3 w-3 text-purple-600" aria-hidden="true" />
                      <span>B2B/Prosumer AI SaaS</span>
                    </span>
                    <span className="score-badge-yellow">69</span>
                  </div>
                  <h3 className="example-card-title">
                    {DEMO_PRESETS[2].framer.startupTitle}
                  </h3>
                </div>
              </div>

              <p className="example-card-summary">
                {DEMO_PRESETS[2].framer.oneLiner}
              </p>

              <div className="example-card-actions">
                <button
                  type="button"
                  className="btn-card-view-report"
                  onClick={() => onLoadPreset(DEMO_PRESETS[2])}
                >
                  <span>View Report</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-card-use-prompt"
                  onClick={() => handleUsePresetPrompt(DEMO_PRESETS[2])}
                >
                  <FileText className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                  <span>Use Prompt</span>
                </button>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
