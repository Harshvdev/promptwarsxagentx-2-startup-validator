"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Lightbulb,
  MessageSquareText,
  Printer,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  CompetitorOutput,
  CustomerOutput,
  FramerOutput,
  MarketOutput,
  PlannerOutput,
  StartupReport,
  ValidatorOutput,
} from "@/lib/types";
import { reportToMarkdown } from "@/lib/export";

export interface PartialReportData {
  framer?: FramerOutput;
  market?: MarketOutput;
  competitors?: CompetitorOutput;
  customers?: CustomerOutput;
  validator?: ValidatorOutput;
  planner?: PlannerOutput;
}

interface ReportWorkspaceProps {
  report: StartupReport | null;
  partial: PartialReportData;
  isRunning: boolean;
  onOpenCopilot: () => void;
  onRerunLive: () => void;
  onBackToProgress?: () => void;
  onShowToast: (msg: string) => void;
}

const TABS = [
  { id: "overview", num: "01", label: "Overview" },
  { id: "market", num: "02", label: "Market" },
  { id: "competitors", num: "03", label: "Competitors" },
  { id: "customers", num: "04", label: "Customers" },
  { id: "planner", num: "05", label: "Plan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function VerdictGauge({ score, badge }: { score: number; badge: string }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const badgeClass =
    badge === "Strong Go"
      ? "score-high"
      : badge === "Promising Wedge" || badge === "Needs Pivot"
        ? "score-mid"
        : "score-low";

  return (
    <div className="score-showcase">
      <div className="gauge-wrap">
        <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth="12"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="url(#sparkGaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
          <defs>
            <linearGradient id="sparkGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
        <div className="gauge-center">
          <span className="gauge-number">{clamped}</span>
          <span className="gauge-max">/ 100</span>
        </div>
      </div>

      <span className={`verdict-pill ${badgeClass}`} style={{ border: "1px solid" }}>
        {badge}
      </span>
    </div>
  );
}

function LoadingBlock({ message }: { message: string }) {
  return (
    <div className="panel-card" style={{ textAlign: "center", padding: "48px 24px" }}>
      <div
        className="spinner-ring"
        style={{ width: "26px", height: "26px", margin: "0 auto 14px" }}
        aria-hidden="true"
      />
      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
}

export function ReportWorkspace({
  report,
  partial,
  isRunning,
  onOpenCopilot,
  onRerunLive,
  onBackToProgress,
  onShowToast,
}: ReportWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAllSections, setShowAllSections] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [copiedScript, setCopiedScript] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (showAllSections) return;
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (idx !== -1 && tabRefs.current[idx]) {
      tabRefs.current[idx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab, showAllSections]);

  const framer = report?.framer ?? partial.framer;
  const market = report?.market ?? partial.market;
  const competitors = report?.competitors ?? partial.competitors;
  const customers = report?.customers ?? partial.customers;
  const validator = report?.validator ?? partial.validator;
  const planner = report?.planner ?? partial.planner;

  if (!framer && !isRunning) return null;

  const isTabReady = (id: TabId) => {
    switch (id) {
      case "overview":
        return Boolean(validator);
      case "market":
        return Boolean(market);
      case "competitors":
        return Boolean(competitors);
      case "customers":
        return Boolean(customers);
      case "planner":
        return Boolean(planner);
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx = idx;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft")
      nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = TABS.length - 1;
    else return;

    e.preventDefault();
    setShowAllSections(false);
    setActiveTab(TABS[nextIdx].id);
    const btn = tabRefs.current[nextIdx];
    btn?.focus();
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const md = reportToMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.framer.startupTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-sparkproof.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast("Exported Markdown validation report");
  };

  const handleCopyScript = async () => {
    if (!customers) return;
    const text = customers.interviewQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1800);
      onShowToast("Copied interview script to clipboard");
    } catch {
      onShowToast("Could not access clipboard");
    }
  };

  const isSectionVisible = (id: TabId) => showAllSections || activeTab === id;

  return (
    <section className="view-enter report-workspace">
      {/* Preset Notice Banner */}
      {report?.isPreset && (
        <div className="preset-notice-banner">
          <div>
            <strong>Sample Report</strong> — Pre-computed example.
          </div>
          <button
            type="button"
            className="action-btn action-btn-rerun"
            onClick={onRerunLive}
            disabled={isRunning}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Re-run Live</span>
          </button>
        </div>
      )}

      {/* Report Summary Dossier Header */}
      {framer && (
        <div className="report-hero-card">
          <div className="report-top-bar">
            <div>
              <div className="report-badges">
                <span className="tag-pill badge-accent">{framer.category}</span>
                <span className="tag-pill">{framer.detectedModel}</span>
                <span className="tag-pill">{framer.targetGeography}</span>
              </div>
              <h1 className="report-title">{framer.startupTitle}</h1>
              <p className="report-oneliner">{framer.oneLiner}</p>
            </div>

            <div className="report-actions-bar">
              {isRunning && onBackToProgress && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={onBackToProgress}
                >
                  <span>← Progress</span>
                </button>
              )}
              {report && (
                <>
                  <button
                    type="button"
                    className="action-btn action-btn-copilot"
                    onClick={onOpenCopilot}
                  >
                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    <span>Co-Pilot</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleDownloadMarkdown}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Export .md</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn-print"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    <span>Print</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {report?.telemetry && (
            <div className="telemetry-strip">
              <div className="telemetry-item">
                <div className="telemetry-label">Model</div>
                <div className="telemetry-val">
                  {report.telemetry.llmProviderUsed}
                </div>
              </div>
              <div className="telemetry-item">
                <div className="telemetry-label">Searches</div>
                <div className="telemetry-val">
                  {report.telemetry.tinySearchCalls} queries
                </div>
              </div>
              <div className="telemetry-item">
                <div className="telemetry-label">Pages</div>
                <div className="telemetry-val">
                  {report.telemetry.tinyFetchCalls}
                  {report.telemetry.tinyAgentUsed ? " + Agent" : ""}
                </div>
              </div>
              <div className="telemetry-item">
                <div className="telemetry-label">Time</div>
                <div className="telemetry-val">
                  {(report.telemetry.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Section Tabs + Show All Toggle */}
      <div className="report-nav-bar no-print">
        <div
          className="section-tabs"
          role="tablist"
          aria-label="Startup validation sections"
        >
          {TABS.map((tab, idx) => {
            const selected = !showAllSections && activeTab === tab.id;
            const ready = isTabReady(tab.id);
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                tabIndex={selected || showAllSections ? 0 : -1}
                onClick={() => {
                  setShowAllSections(false);
                  setActiveTab(tab.id);
                }}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className="sec-tab"
              >
                <span className="tab-num">{tab.num}</span>
                <span>{tab.label}</span>
                {!ready && (
                  <span
                    className="spinner-ring"
                    style={{ width: "9px", height: "9px" }}
                    aria-label="Loading"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="expand-all-btn"
          onClick={() => setShowAllSections((v) => !v)}
        >
          {showAllSections ? "Tabs" : "Show All"}
        </button>
      </div>

      {/* ====================================================================
          SECTION 1: OVERVIEW & VALIDATION SCORE
          ==================================================================== */}
      <div
        role="tabpanel"
        id="panel-overview"
        aria-labelledby="tab-overview"
        hidden={!isSectionVisible("overview")}
        className="report-section"
      >
        {!validator ? (
          <LoadingBlock message="Devil's Advocate agent is calculating viability score and fatal risks..." />
        ) : (
          <div>
            <div className="section-grid-2">
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-kicker">Verdict</div>
                <VerdictGauge
                  score={validator.overallScore}
                  badge={validator.verdictBadge}
                />
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    textAlign: "center",
                  }}
                >
                  {validator.executiveVerdict}
                </p>
              </div>

              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <h3 className="panel-title">Score Breakdown</h3>
                </div>

                {(
                  [
                    ["Market Demand", validator.scoreBreakdown.demand],
                    ["Differentiation", validator.scoreBreakdown.differentiation],
                    ["Build Feasibility", validator.scoreBreakdown.feasibility],
                    ["Unit Economics", validator.scoreBreakdown.unitEconomics],
                    ["Defensibility", validator.scoreBreakdown.defensibility],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label} className="axis-row">
                    <div className="axis-top">
                      <span>{label}</span>
                      <span className="axis-score">{val} / 100</span>
                    </div>
                    <div className="axis-bar-bg">
                      <div
                        className="axis-bar-fill"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: "18px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--orange-50)",
                    border: "1px solid var(--orange-200)",
                  }}
                >
                  <div
                    className="panel-kicker"
                    style={{ marginBottom: "4px" }}
                  >
                    Unit Economics Reality Check
                  </div>
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.55,
                    }}
                  >
                    {validator.unitEconomicsNote}
                  </p>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">
                  <ShieldAlert
                    className="h-4 w-4"
                    style={{ color: "var(--orange-600)" }}
                    aria-hidden="true"
                  />
                  <span>Fatal Risks &amp; Mitigations</span>
                </h3>
              </div>

              {validator.fatalRisks.map((risk) => {
                const sevCls =
                  risk.severity === "Critical"
                    ? "sev-critical"
                    : risk.severity === "High"
                      ? "sev-high"
                      : "sev-medium";
                return (
                  <div key={risk.title} className="risk-item">
                    <div className="risk-top">
                      <span className="risk-title">{risk.title}</span>
                      <span className={`severity-badge ${sevCls}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.86rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {risk.explanation}
                    </p>
                    <div className="mitigation-box">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">
                  <Lightbulb
                    className="h-4 w-4"
                    style={{ color: "var(--orange-600)" }}
                    aria-hidden="true"
                  />
                  <span>Pivot Angles</span>
                </h3>
              </div>

              <div className="section-equal-2" style={{ marginBottom: 0 }}>
                {validator.pivotSuggestions.map((pivot, i) => (
                  <div key={pivot} className="pivot-card">
                    <span className="tag-pill mono" style={{ width: "fit-content" }}>
                      Option {i + 1}
                    </span>
                    <p
                      style={{
                        fontSize: "0.88rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.58,
                      }}
                    >
                      {pivot}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 2: MARKET & TAM
          ==================================================================== */}
      <div
        role="tabpanel"
        id="panel-market"
        aria-labelledby="tab-market"
        hidden={!isSectionVisible("market")}
        className="report-section"
      >
        {!market ? (
          <LoadingBlock message="Market Analyst agent is sizing TAM/SAM/SOM from live web sources..." />
        ) : (
          <div>
            <div className="section-grid-3">
              <div className="tam-card">
                <div className="tam-tier">TAM</div>
                <div className="tam-figure">{market.tam}</div>
                <p className="tam-desc">{market.tamDetail}</p>
              </div>
              <div className="tam-card">
                <div className="tam-tier">SAM</div>
                <div className="tam-figure">{market.sam}</div>
                <p className="tam-desc">{market.samDetail}</p>
              </div>
              <div className="tam-card highlight-som">
                <div className="tam-tier" style={{ color: "var(--orange-600)" }}>
                  SOM (3Y)
                </div>
                <div className="tam-figure">{market.som}</div>
                <p className="tam-desc">{market.somDetail}</p>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">Market Growth</div>
                  <h3 className="panel-title">{market.growthRate}</h3>
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.94rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {market.marketVerdict}
              </p>
            </div>

            <div className="section-equal-2">
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <h3 className="panel-title" style={{ color: "var(--emerald-text)" }}>
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span>Tailwinds</span>
                  </h3>
                </div>
                <ul className="wind-list">
                  {market.tailwinds.map((t) => (
                    <li key={t}>
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: "var(--emerald-text)" }}
                        aria-hidden="true"
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <h3 className="panel-title" style={{ color: "var(--rose-text)" }}>
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                    <span>Headwinds</span>
                  </h3>
                </div>
                <ul className="wind-list">
                  {market.headwinds.map((h) => (
                    <li key={h}>
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: "var(--amber-text)" }}
                        aria-hidden="true"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="panel-card" style={{ marginTop: "20px" }}>
              <div className="panel-kicker">Verified Market Citations</div>
              <div className="source-chips" style={{ marginTop: "10px" }}>
                {market.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link-chip"
                  >
                    <span>{src.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 3: COMPETITORS
          ==================================================================== */}
      <div
        role="tabpanel"
        id="panel-competitors"
        aria-labelledby="tab-competitors"
        hidden={!isSectionVisible("competitors")}
        className="report-section"
      >
        {!competitors ? (
          <LoadingBlock message="Competitor Intel agent is analyzing rival pricing and whitespace gaps..." />
        ) : (
          <div>
            <div className="whitespace-banner">
              <div className="panel-kicker">White-Space Opportunity</div>
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
              >
                {competitors.whiteSpaceOpportunity}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {competitors.landscapeSummary}
              </p>
              {competitors.deepScrapeNote && (
                <p
                  className="mono"
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--orange-700)",
                    marginTop: "10px",
                  }}
                >
                  Extraction status: {competitors.deepScrapeNote}
                </p>
              )}
            </div>

            <div className="competitor-grid">
              {competitors.competitors.map((comp) => {
                const threatCls =
                  comp.threatLevel === "High"
                    ? "sev-critical"
                    : comp.threatLevel === "Medium"
                      ? "sev-high"
                      : "sev-medium";
                return (
                  <article key={comp.name} className="comp-card">
                    <div className="comp-head">
                      <div>
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="comp-name-link"
                        >
                          <span>{comp.name}</span>
                          <ArrowUpRight
                            className="h-4 w-4"
                            style={{ color: "var(--orange-600)" }}
                            aria-hidden="true"
                          />
                        </a>
                        <div className="preset-meta-tags" style={{ marginTop: "6px", marginBottom: 0 }}>
                          <span className="tag-pill mono">{comp.extractionMethod}</span>
                        </div>
                      </div>

                      <span className={`severity-badge ${threatCls}`}>
                        {comp.threatLevel} Threat
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "0.86rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.55,
                      }}
                    >
                      {comp.positioning}
                    </p>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-subtle)",
                      }}
                    >
                      <strong style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                        Pricing:{" "}
                      </strong>
                      <span style={{ fontWeight: 600 }}>{comp.pricingModel}</span>
                    </div>

                    <div className="comp-cols">
                      <div className="comp-mini-box">
                        <h5 style={{ color: "var(--emerald-text)" }}>Strengths</h5>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {comp.strengths.map((s) => (
                            <li key={s}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="comp-mini-box">
                        <h5 style={{ color: "var(--orange-600)" }}>Gaps to Exploit</h5>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {comp.weaknessesOrGaps.map((g) => (
                            <li key={g}>→ {g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 4: CUSTOMERS & ICP
          ==================================================================== */}
      <div
        role="tabpanel"
        id="panel-customers"
        aria-labelledby="tab-customers"
        hidden={!isSectionVisible("customers")}
        className="report-section"
      >
        {!customers ? (
          <LoadingBlock message="Customer Profiler agent is building ICP personas and discovery scripts..." />
        ) : (
          <div>
            <div className="hook-callout">
              <div className="panel-kicker">High-Converting Early Adopter Hook</div>
              <p
                style={{
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                &ldquo;{customers.earlyAdopterHook}&rdquo;
              </p>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                {customers.targetSummary}
              </p>
            </div>

            <div className="persona-grid">
              {customers.personas.map((persona) => (
                <article key={persona.name} className="persona-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span className="tag-pill badge-accent">{persona.side}</span>
                      <h3
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          marginTop: "8px",
                        }}
                      >
                        {persona.name}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {persona.roleOrSegment}
                      </p>
                    </div>
                  </div>

                  <div className="persona-field">
                    <strong>Top Pain Points</strong>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                      {persona.topPainPoints.map((p) => (
                        <li key={p}>• {p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="persona-field">
                    <strong>Current Workaround</strong>
                    <span>{persona.currentWorkaround}</span>
                  </div>

                  <div className="persona-field">
                    <strong>Willingness to Pay</strong>
                    <span style={{ fontWeight: 700, color: "var(--orange-600)" }}>
                      {persona.willingnessToPay}
                    </span>
                  </div>

                  <div className="persona-field">
                    <strong>Acquisition Channels</strong>
                    <div className="source-chips" style={{ marginTop: "5px" }}>
                      {persona.acquisitionChannels.map((ch) => (
                        <span key={ch} className="tag-pill">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">Interview Script</h3>
                <button
                  type="button"
                  className="action-btn no-print"
                  onClick={handleCopyScript}
                >
                  {copiedScript ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                {customers.interviewQuestions.map((q, idx) => {
                  const checked = Boolean(checkedQuestions[idx]);
                  return (
                    <label
                      key={q}
                      className={`checklist-item ${checked ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCheckedQuestions((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="sr-only"
                      />
                      <span className="custom-checkbox" aria-hidden="true">
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="check-text" style={{ fontSize: "0.88rem" }}>
                        {q}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          SECTION 5: 90-DAY PLAN
          ==================================================================== */}
      <div
        role="tabpanel"
        id="panel-planner"
        aria-labelledby="tab-planner"
        hidden={!isSectionVisible("planner")}
        className="report-section"
      >
        {!planner ? (
          <LoadingBlock message="Execution Planner agent is compiling your 90-day MVP & GTM roadmap..." />
        ) : (
          <div>
            <div className="section-equal-2">
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-kicker">Recommended Launch Wedge</div>
                <p style={{ fontSize: "0.94rem", fontWeight: 600, lineHeight: 1.6 }}>
                  {planner.recommendedWedge}
                </p>
              </div>
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-kicker">Monetization Strategy</div>
                <p style={{ fontSize: "0.94rem", fontWeight: 600, lineHeight: 1.6 }}>
                  {planner.monetizationStrategy}
                </p>
              </div>
            </div>

            <div className="section-equal-2">
              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <h3 className="panel-title" style={{ color: "var(--emerald-text)" }}>
                    Must-Build
                  </h3>
                </div>
                <ul className="wind-list">
                  {planner.mvpFeatures.mustBuild.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>

              <div className="panel-card" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <h3 className="panel-title" style={{ color: "var(--text-muted)" }}>
                    Skip For Now
                  </h3>
                </div>
                <ul className="wind-list">
                  {planner.mvpFeatures.skipForNow.map((item) => (
                    <li key={item}>✕ {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="phases-grid">
              {planner.roadmap.map((phase) => (
                <article key={phase.phase} className="phase-card">
                  <div>
                    <span className="phase-badge">{phase.timeframe}</span>
                    <h3
                      style={{
                        fontSize: "1.02rem",
                        fontWeight: 800,
                        marginBottom: "6px",
                      }}
                    >
                      {phase.phase}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.84rem",
                        color: "var(--text-secondary)",
                        marginBottom: "12px",
                      }}
                    >
                      {phase.objective}
                    </p>
                    <ul
                      style={{
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                        fontSize: "0.82rem",
                      }}
                    >
                      {phase.actions.map((act) => (
                        <li key={act}>• {act}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--emerald-bg)",
                      color: "var(--emerald-text)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Goal: {phase.successMetric}
                  </div>
                </article>
              ))}
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3 className="panel-title">First 10 Customers Playbook</h3>
              </div>
              <div className="playbook-step" style={{ marginBottom: 0 }}>
                <div className="step-index">10</div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {planner.firstTenCustomersPlaybook}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Co-Pilot Pill while reading Report */}
      {report && (
        <button
          type="button"
          className="floating-copilot-fab no-print"
          onClick={onOpenCopilot}
        >
          <MessageSquareText
            className="h-4 w-4"
            style={{ color: "var(--orange-500)" }}
            aria-hidden="true"
          />
          <span>Ask Co-Pilot</span>
        </button>
      )}
    </section>
  );
}
