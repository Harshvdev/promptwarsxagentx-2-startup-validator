"use client";

import React, { useId, useRef, useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import type { AnalysisInput, StartupReport } from "@/lib/types";
import { DEMO_PRESETS } from "@/lib/presets";

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
  "Global",
  "United States",
  "India",
  "US & India Metro Cities",
  "Europe / UK",
];

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
    <section className="view-enter">
      <div className="hero-section">
        <h1 className="hero-title">
          Stress-test your startup idea{" "}
          <span className="accent-word">before writing code.</span>
        </h1>
        <p className="hero-subtitle">
          Live market, competitor, customer, risk, and 90-day roadmap validation.
        </p>
      </div>

      <form
        className={`composer-shell ${flashHighlight ? "flash-highlight" : ""}`}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Startup idea submission form"
      >
        <div className="composer-top">
          <div className="composer-label-row">
            <label htmlFor={ideaId} className="composer-label">
              <span>Startup Idea</span>
            </label>
            {idea.length > 0 && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => {
                  setIdea("");
                  setTouched(false);
                  setSubmitAttempted(false);
                  textareaRef.current?.focus();
                }}
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            id={ideaId}
            name="idea"
            className="idea-textarea"
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
        </div>

        <div className="composer-meta-row">
          <span
            id={errorId}
            role={showValidationError ? "alert" : undefined}
            style={{
              color: showValidationError ? "var(--rose-text)" : undefined,
              fontWeight: showValidationError ? 600 : undefined,
            }}
          >
            {showValidationError ? validationError : ""}
          </span>
          <span
            className={`char-status ${
              len === 0 ? "" : isValid ? "valid" : "invalid"
            }`}
          >
            {len.toLocaleString()} / 1,200
          </span>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              margin: "0 22px 12px",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--rose-bg)",
              border: "1px solid var(--rose-border)",
              color: "var(--rose-text)",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div className="composer-toolbar">
          <div className="composer-selectors">
            <div className="control-field">
              <label className="control-mini-label" htmlFor={regionId}>
                Region
              </label>
              <div className="select-wrap">
                <select
                  id={regionId}
                  name="region"
                  className="custom-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="select-chevron h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="control-field">
              <label className="control-mini-label" htmlFor={modelId}>
                Model
              </label>
              <div className="select-wrap">
                <select
                  id={modelId}
                  name="businessModel"
                  className="custom-select"
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
                <ChevronDown
                  className="select-chevron h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enableDeepScrape}
              className={`scrape-toggle-box ${enableDeepScrape ? "active" : ""}`}
              onClick={() => setEnableDeepScrape((v) => !v)}
              title="Scrape live competitor pages via TinyAgent"
            >
              <span className={`switch-track ${enableDeepScrape ? "on" : ""}`}>
                <span className="switch-thumb" />
              </span>
              <span className="scrape-label-text">
                <span>Deep Scrape</span>
              </span>
            </button>
          </div>

          <button
            type="submit"
            className="btn-validate"
            disabled={isRunning}
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>{isRunning ? "Running..." : "Validate Idea"}</span>
          </button>
        </div>
      </form>

      <div>
        <div className="presets-header">
          <div className="presets-title-group">
            <h2>Examples</h2>
          </div>
        </div>

        <div className="presets-grid">
          {DEMO_PRESETS.map((preset) => {
            const score = preset.validator.overallScore;
            const scoreCls =
              score >= 80
                ? "score-high"
                : score >= 65
                  ? "score-mid"
                  : "score-low";
            return (
              <article key={preset.id} className="preset-card">
                <div>
                  <div className="preset-card-top">
                    <div>
                      <div className="preset-meta-tags">
                        <span className="tag-pill">
                          {preset.framer.detectedModel}
                        </span>
                      </div>
                      <h3 className="preset-title">
                        {preset.framer.startupTitle}
                      </h3>
                    </div>

                    <div className={`score-ring-mini ${scoreCls}`}>
                      <span className="val">{score}</span>
                    </div>
                  </div>

                  <p className="preset-summary">{preset.framer.oneLiner}</p>
                </div>

                <div className="preset-actions">
                  <button
                    type="button"
                    className="btn-preset-view"
                    onClick={() => onLoadPreset(preset)}
                  >
                    View Report →
                  </button>
                  <button
                    type="button"
                    className="btn-preset-prompt"
                    onClick={() => handleUsePresetPrompt(preset)}
                  >
                    Use Prompt
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
