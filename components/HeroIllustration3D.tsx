"use client";

import React from "react";

export function HeroIllustration3D() {
  return (
    <div className="hero-illustration-container" aria-hidden="true">
      {/* Intense warm orange ambient glow */}
      <div className="hero-glow-orb" />

      <div className="hero-3d-scene">
        {/* Floating Top-Left Panel: Bar Chart */}
        <div className="floating-card card-barchart">
          <div className="chart-bars">
            <div className="bar bar-1" />
            <div className="bar bar-2" />
            <div className="bar bar-3" />
            <div className="bar bar-4" />
          </div>
        </div>

        {/* Floating Top-Right Panel: Donut Chart */}
        <div className="floating-card card-donutchart">
          <svg viewBox="0 0 100 100" className="donut-svg">
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="14"
            />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="14"
              strokeDasharray="213"
              strokeDashoffset="75"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Floating Bottom-Left Panel: Checklist */}
        <div className="floating-card card-checklist">
          <div className="checklist-row">
            <div className="check-badge">
              <svg viewBox="0 0 14 14" className="check-icon">
                <path
                  d="M3 7.5L5.5 10L11 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="check-lines">
              <span className="check-line-long" />
              <span className="check-line-short" />
            </div>
          </div>

          <div className="checklist-row">
            <div className="check-badge">
              <svg viewBox="0 0 14 14" className="check-icon">
                <path
                  d="M3 7.5L5.5 10L11 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="check-lines">
              <span className="check-line-long" />
              <span className="check-line-short" />
            </div>
          </div>

          <div className="checklist-row">
            <div className="check-badge">
              <svg viewBox="0 0 14 14" className="check-icon">
                <path
                  d="M3 7.5L5.5 10L11 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="check-lines">
              <span className="check-line-long" />
              <span className="check-line-short" />
            </div>
          </div>
        </div>

        {/* Central 3D Frosted Glowing Plate */}
        <div className="main-3d-plate">
          {/* Glass plate top bevel reflection */}
          <div className="plate-glass-reflect" />

          {/* Central 3D Glowing Orange Lightning Bolt */}
          <div className="plate-bolt-wrap">
            <svg
              viewBox="0 0 100 120"
              className="bolt-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff7ed" />
                  <stop offset="25%" stopColor="#fed7aa" />
                  <stop offset="55%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur1" />
                  <feGaussianBlur stdDeviation="14" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M58 8L18 64H50L42 112L82 56H50L58 8Z"
                fill="url(#boltGrad)"
                filter="url(#boltGlow)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

