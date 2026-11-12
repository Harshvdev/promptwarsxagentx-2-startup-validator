"use client";

import React from "react";
import { History, Moon, Plus, Sun, Zap } from "lucide-react";
import type { UsageQuotaInfo } from "@/lib/types";

interface NavbarProps {
  quota: UsageQuotaInfo | null;
  historyCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  onResetToHero: () => void;
}

export function Navbar({
  quota,
  historyCount,
  theme,
  onToggleTheme,
  onOpenHistory,
  onResetToHero,
}: NavbarProps) {
  const liveRem = quota?.analysesRemaining ?? 8;
  const liveLimit = quota?.analysesLimit ?? 8;
  const scrapeRem = quota?.deepScrapesRemaining ?? 2;
  const scrapeLimit = quota?.deepScrapesLimit ?? 2;

  const livePct = Math.round((liveRem / Math.max(1, liveLimit)) * 100);
  const scrapePct = Math.round((scrapeRem / Math.max(1, scrapeLimit)) * 100);

  return (
    <header className="global-header no-print">
      <div className="header-inner">
        <button
          type="button"
          className="brand"
          onClick={onResetToHero}
          title="Return to Idea Submission"
        >
          <span className="brand-mark">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>SparkProof</span>
        </button>

        <div className="header-controls">
          <div
            className="usage-wrapper"
            tabIndex={0}
            aria-label="Daily quota"
          >
            <div className="usage-pill">
              <span className="usage-metric">
                <span className="usage-dot" aria-hidden="true" />
                <span>
                  <strong className="mono">{liveRem}</strong>/{liveLimit} runs
                </span>
              </span>
              <span className="usage-divider" aria-hidden="true" />
              <span className="usage-metric">
                <span className="usage-dot scrape" aria-hidden="true" />
                <span>
                  <strong className="mono">{scrapeRem}</strong>/{scrapeLimit} scrapes
                </span>
              </span>
            </div>

            <div className="usage-popover">
              <div className="usage-popover-title">
                <span>Daily Quota</span>
                <span className="mono">24h</span>
              </div>
              <div className="usage-bar-row">
                <div className="usage-bar-label">
                  <span>Live Runs</span>
                  <span className="mono">
                    {liveRem}/{liveLimit}
                  </span>
                </div>
                <div className="usage-track">
                  <div
                    className="usage-fill"
                    style={{ width: `${livePct}%` }}
                  />
                </div>
              </div>
              <div className="usage-bar-row">
                <div className="usage-bar-label">
                  <span>Deep Scrapes</span>
                  <span className="mono">
                    {scrapeRem}/{scrapeLimit}
                  </span>
                </div>
                <div className="usage-track">
                  <div
                    className="usage-fill scrape"
                    style={{ width: `${scrapePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="nav-btn"
            onClick={onOpenHistory}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            <span>History</span>
            <span className="count-badge">{historyCount}</span>
          </button>

          <button
            type="button"
            className="nav-btn nav-btn-primary"
            onClick={onResetToHero}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Idea</span>
          </button>

          <button
            type="button"
            className="theme-btn"
            onClick={onToggleTheme}
            title="Switch Light / Dark Theme"
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
