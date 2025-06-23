'use client';

import { useState } from 'react';
import React from 'react';

interface FFLogsGroupData {
  zone: number;
  zoneName: string;
  url: string;
  timestamp: string;
  groups: Record<string, { job: string; score: string; count: string }[]>;
}

const GROUP_LABELS: Record<string, string> = {
  melee: 'Melee',
  caster: 'Caster',
  ranged: 'Ranged',
  tank: 'Tank',
  healer: 'Healer',
};

const JOB_COLORS: Record<string, string> = {
  viper: '#108210',
  dragoon: '#4164CD',
  monk: '#D69C00',
  'black mage': '#A579D6',
  samurai: '#E46D04',
  reaper: '#965A90',
  pictomancer: '#FC92E1',
  ninja: '#AF1964',
  'red mage': '#E87B7B',
  summoner: '#2D9B78',
  bard: '#91BA5E',
  dancer: '#E2B0AF',
  machinist: '#6EE1D6',
  gunbreaker: '#796D30',
  paladin: '#A8D2E6',
  'dark knight': '#D126CC',
  warrior: '#CF2621',
  astrologian: '#FFE74A',
  'white mage': '#FFF0DC',
  sage: '#80A0F0',
  scholar: '#8657FF',
};

// Utility to determine if a hex color is light
function isColorLight(hex: string) {
  // Remove # if present
  hex = hex.replace('#', '');
  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.2;
}

// Pie chart component for a group with tooltip
function GroupPieChart({ jobs }: { jobs: { job: string; count: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Calculate total count
  const total = jobs.reduce((sum, job) => sum + (parseInt(job.count.replace(/,/g, '')) || 0), 0);
  // Calculate angles
  let startAngle = 0;
  const slices = jobs.map((job, i) => {
    const count = parseInt(job.count.replace(/,/g, '')) || 0;
    const percent = total > 0 ? count / total : 0;
    const angle = percent * 360;
    const color = JOB_COLORS[job.job.trim().toLowerCase()] || '#3B82F6';
    // Calculate coordinates for arc
    const largeArc = angle > 180 ? 1 : 0;
    const endAngle = startAngle + angle;
    const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const path = `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`;
    const slice = (
      <path
        key={job.job}
        d={path}
        fill={color}
        stroke="#18181b"
        strokeWidth="1"
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: 'pointer' }}
      />
    );
    startAngle += angle;
    return slice;
  });
  // Tooltip
  let tooltip = null;
  if (hovered !== null && jobs[hovered]) {
    const job = jobs[hovered];
    const count = parseInt(job.count.replace(/,/g, '')) || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    tooltip = (
      <div
        className="fixed z-50 px-3 py-1 rounded bg-zinc-900 text-white text-xs border border-gray-700 pointer-events-none"
        style={{ left: 'calc(var(--mouse-x, 0px) + 20px)', top: 'calc(var(--mouse-y, 0px) - 10px)' }}
      >
        <span className="font-semibold">{job.job}</span>: {percent}%
      </div>
    );
  }
  // Mouse move handler for tooltip position
  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    }
    if (hovered !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [hovered]);
  return (
    <div className="relative flex items-center justify-center">
      <svg width={100} height={100} viewBox="0 0 100 100" className="mb-2">
        {slices}
        <circle cx={50} cy={50} r={40} fill="none" stroke="#18181b" strokeWidth="2" />
      </svg>
      {tooltip}
    </div>
  );
}

export default function Home() {
  const [fflogsData, setFflogsData] = useState<FFLogsGroupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [savageExpanded, setSavageExpanded] = useState(false);
  // Tooltip: hovered group and job index
  const [hoveredBar, setHoveredBar] = useState<{ group: string; idx: number } | null>(null);

  // Zone and boss IDs as variables
  const savagezone = 68;
  const boss1id = 97;
  const boss2id = 98;
  const boss3id = 99;
  const boss4id = 100;
  const ultimatezone = 65;

  const fetchFFLogsData = async (zoneId: number, bossId?: number) => {
    setLoading(true);
    setError(null);
    setActiveZone(zoneId);
    setFflogsData(null);
    try {
      let url = `/api/fflogs?zone=${zoneId}`;
      if (bossId) url += `&boss=${bossId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setFflogsData(data);
    } catch (err: unknown) {
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? String(err.message)
        : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getZoneName = (zoneId: number) => {
    switch (zoneId) {
      case 68:
        return 'Zone 68 (Endwalker Raid)';
      case 65:
        return 'Zone 65 (Endwalker Raid)';
      default:
        return `Zone ${zoneId}`;
    }
  };

  // Boss button style
  const bossBtnClass = "px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  // Determine if this is a boss-specific page by checking if the url includes 'boss'
  const isBossPage = fflogsData && fflogsData.url && fflogsData.url.includes('boss');

  // If boss page, find the max score across all jobs in all groups
  let maxBossScore = 100;
  if (isBossPage && fflogsData) {
    maxBossScore = Math.max(
      ...Object.values(fflogsData.groups).flat().map(job => parseInt(job.score.replace(/,/g, '')) || 0)
    );
    if (maxBossScore < 1) maxBossScore = 1; // avoid divide by zero
  }

  // Mouse move handler for tooltip position (global, once)
  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header with buttons */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1
              className="text-xl font-semibold text-gray-900 dark:text-white relative group cursor-pointer"
            >
              What&apos;s the Meta?
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded bg-zinc-900 text-white text-xs border border-gray-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Nothing, what&apos;s the meta with you?
              </span>
            </h1>
            <div className="flex space-x-4 relative min-h-[48px] items-center">
              {/* Savage Button */}
              <button
                onClick={() => {
                  fetchFFLogsData(savagezone);
                  if (!savageExpanded) setSavageExpanded(true);
                }}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                style={{ zIndex: 2 }}
              >
                {loading && activeZone === savagezone ? 'Loading...' : 'Savage'}
              </button>
              {/* Boss Buttons Slide In Between */}
              <div className={`flex flex-row space-x-1 transition-all duration-300 ${savageExpanded ? 'opacity-100 max-w-[500px]' : 'opacity-0 max-w-0'} overflow-hidden`} style={{ marginLeft: savageExpanded ? '4px' : '0', marginRight: savageExpanded ? '16px' : '0' }}>
                <button
                  onClick={() => fetchFFLogsData(savagezone, boss1id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 1</button>
                <button
                  onClick={() => fetchFFLogsData(savagezone, boss2id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 2</button>
                <button
                  onClick={() => fetchFFLogsData(savagezone, boss3id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 3</button>
                <button
                  onClick={() => fetchFFLogsData(savagezone, boss4id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 4</button>
              </div>
              {/* Ultimate Button */}
              <button
                onClick={() => {
                  fetchFFLogsData(ultimatezone);
                  if (savageExpanded) setSavageExpanded(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ zIndex: 2 }}
              >
                {loading && activeZone === ultimatezone ? 'Loading...' : 'Ultimate'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
          </div>
        )}
        {fflogsData && !loading && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
              {fflogsData.zoneName || getZoneName(fflogsData.zone)}
            </h2>
            {Object.entries(fflogsData.groups).map(([group, jobs]) => {
              // Find the best job in this group
              let bestJob = jobs[0];
              let bestValue = 0;
              if (isBossPage) {
                bestJob = jobs.reduce((a, b) => (parseInt(a.score.replace(/,/g, '')) > parseInt(b.score.replace(/,/g, '')) ? a : b));
                bestValue = parseInt(bestJob.score.replace(/,/g, ''));
              } else {
                bestJob = jobs.reduce((a, b) => (parseFloat(a.score) > parseFloat(b.score) ? a : b));
                bestValue = parseFloat(bestJob.score);
              }
              return (
                <div key={group} className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">
                    {GROUP_LABELS[group] || group}
                  </h3>
                  {/* Header Row: Damage | Popularity */}
                  <div className="flex flex-row items-end md:space-x-8 mb-1">
                    <div className="flex-1 flex items-center space-x-4">
                      <div className="w-32 pr-2"></div>
                      <div className="flex-1 text-xs uppercase tracking-wider text-gray-400">Damage</div>
                    </div>
                    <div className="flex flex-col items-center justify-end ml-4" style={{ width: 100 }}>
                      <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Popularity</div>
                    </div>
                  </div>
                  {/* Content Row: Bars | Pie Chart */}
                  <div className="flex flex-row items-start md:space-x-8">
                    <div className="flex-1">
                      <div className="space-y-2">
                        {jobs.length === 0 && (
                          <div className="text-gray-400 italic">No data</div>
                        )}
                        {jobs.map((job, idx) => {
                          let percentOfBest = 0;
                          if (isBossPage) {
                            const val = parseInt(job.score.replace(/,/g, ''));
                            percentOfBest = bestValue > 0 ? (val / bestValue) * 100 : 0;
                          } else {
                            const val = parseFloat(job.score);
                            percentOfBest = bestValue > 0 ? (val / bestValue) * 100 : 0;
                          }
                          let barWidth = 0;
                          let barLabel = '';
                          const color = JOB_COLORS[job.job.trim().toLowerCase()] || '#3B82F6';
                          const scoreTextColor = isColorLight(color) ? '#18181b' : '#fff';
                          if (isBossPage) {
                            // Boss-specific: use damage number
                            const damage = parseInt(job.score.replace(/,/g, ''));
                            barWidth = isNaN(damage) ? 0 : Math.max(0, Math.min((damage / maxBossScore) * 100, 100));
                            barLabel = job.score && job.score !== 'NaN' ? job.score : '-';
                          } else {
                            // Not boss-specific: use score out of 100, show full number
                            const score = parseFloat(job.score);
                            barWidth = isNaN(score) ? 0 : Math.max(0, Math.min(score, 100)); // clamp between 0 and 100
                            barLabel = job.score && job.score !== 'NaN' ? job.score : '-';
                          }
                          return (
                            <div key={job.job} className="flex items-center space-x-4">
                              <div className="w-32 text-right pr-2 text-gray-300">
                                {job.job}
                              </div>
                              <div className="flex-1">
                                <div className="relative h-6 bg-gray-700 rounded"
                                  onMouseEnter={() => setHoveredBar({ group, idx })}
                                  onMouseLeave={() => setHoveredBar(null)}
                                >
                                  <div
                                    className="absolute left-0 top-0 h-6 rounded"
                                    style={{ width: `${barWidth}%`, minWidth: '2px', background: color }}
                                  ></div>
                                  <div
                                    className="absolute left-2 top-0 h-6 flex items-center font-semibold text-sm"
                                    style={{ color: scoreTextColor }}
                                  >
                                    {barLabel}
                                  </div>
                                  {hoveredBar && hoveredBar.group === group && hoveredBar.idx === idx && (
                                    <div className="fixed z-50 px-3 py-1 rounded bg-zinc-900 text-white text-xs border border-gray-700 pointer-events-none"
                                      style={{ left: 'calc(var(--mouse-x, 0px) + 20px)', top: 'calc(var(--mouse-y, 0px) - 10px)' }}
                                    >
                                      {`${job.job} is ${percentOfBest.toFixed(1)}% of ${bestJob.job}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-start ml-4" style={{ width: 100 }}>
                      <GroupPieChart jobs={jobs} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!fflogsData && !loading && !error && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Click one of the buttons above to load FFLogs data.
          </div>
        )}
      </main>
    </div>
  );
}
