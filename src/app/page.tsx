'use client';

import { useState } from 'react';
import React from 'react';
import Image from 'next/image';

interface FFLogsGroupData {
  zone: number;
  zoneName: string;
  bossName: string;
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

// Add this type above the RoleIconSelector component
interface RoleIconSelectorProps {
  role: string;
  jobs: { job: string }[];
  selected: string[];
  max: number;
  onSelect: (job: string) => void;
  className?: string;
}

function RoleIconSelector({ role, jobs, selected, max, onSelect, className = '' }: RoleIconSelectorProps) {
  // Capitalize job name for icon file
  const getIconPath = (jobName: string) => {
    // Remove spaces and capitalize each word for filename
    return `/assets/job-icons/${jobName.replace(/ /g, '').replace(/(^|\s)([a-z])/g, (m, p1, p2) => p2.toUpperCase())}.png`;
  };
  const isSelected = (job: { job: string }) => selected.includes(job.job);
  const isDisabled = (job: { job: string }) => !isSelected(job) && selected.filter(Boolean).length >= max;

  // Sort jobs alphabetically by job name
  const sortedJobs = [...jobs].sort((a, b) => a.job.localeCompare(b.job));

  // Layout logic
  let gridClass = 'flex flex-wrap justify-center gap-2';
  let isMelee = false;
  if (sortedJobs.length === 3) {
    // Triangle layout for 3 jobs (ranged)
    gridClass = 'grid grid-cols-2 gap-2 place-items-center'; // 2 on top, 1 below
  } else if (sortedJobs.length === 4) {
    // 2x2 grid for 4 jobs (caster, tank, healer)
    gridClass = 'grid grid-cols-2 gap-2';
  } else if (sortedJobs.length === 5) {
    // Use flex for melee, custom rows
    isMelee = true;
  }

  return (
    <div className={`flex flex-col items-center bg-gray-700 rounded-lg p-3 border border-gray-600 mb-4 h-full ${className}`}>
      <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">{GROUP_LABELS[role]} {max > 1 ? `(Select ${max})` : `(Select 1)`}</h4>
      {isMelee ? (
        <>
          <div className="flex flex-row justify-center gap-2 mb-2">
            {sortedJobs.slice(0, 3).map((job: { job: string }) => (
              <button
                key={job.job}
                type="button"
                title={job.job}
                onClick={() => !isDisabled(job) && onSelect(job.job)}
                className={`transition-all relative rounded-lg border-2
                  ${isSelected(job) ? 'border-blue-400 ring-2 ring-blue-400' : 'border-transparent'}
                  ${isDisabled(job) ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                  bg-gray-800 p-0 flex items-center justify-center`}
                style={{ width: 58, height: 58 }}
                tabIndex={isDisabled(job) ? -1 : 0}
              >
                <Image
                  src={getIconPath(job.job)}
                  alt={job.job}
                  width={56}
                  height={56}
                  className="block"
                  draggable={false}
                />
              </button>
            ))}
          </div>
          <div className="flex flex-row justify-center gap-2">
            {sortedJobs.slice(3).map((job: { job: string }) => (
              <button
                key={job.job}
                type="button"
                title={job.job}
                onClick={() => !isDisabled(job) && onSelect(job.job)}
                className={`transition-all relative rounded-lg border-2
                  ${isSelected(job) ? 'border-blue-400 ring-2 ring-blue-400' : 'border-transparent'}
                  ${isDisabled(job) ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                  bg-gray-800 p-0 flex items-center justify-center`}
                style={{ width: 58, height: 58 }}
                tabIndex={isDisabled(job) ? -1 : 0}
              >
                <Image
                  src={getIconPath(job.job)}
                  alt={job.job}
                  width={56}
                  height={56}
                  className="block"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className={gridClass} style={sortedJobs.length === 3 ? { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr', minHeight: 110 } : {}}>
          {sortedJobs?.map((job: { job: string }, idx: number) => {
            // For triangle layout, position the third icon in the center of the second row
            let triangleStyle = {};
            if (sortedJobs.length === 3) {
              if (idx === 2) triangleStyle = { gridColumn: '1 / span 2', justifySelf: 'center' };
            }
            return (
              <button
                key={job.job}
                type="button"
                title={job.job}
                onClick={() => !isDisabled(job) && onSelect(job.job)}
                className={`transition-all relative rounded-lg border-2
                  ${isSelected(job) ? 'border-blue-400 ring-2 ring-blue-400' : 'border-transparent'}
                  ${isDisabled(job) ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                  bg-gray-800 p-0 flex items-center justify-center`}
                style={{ width: 58, height: 58, ...(triangleStyle as React.CSSProperties) }}
                tabIndex={isDisabled(job) ? -1 : 0}
              >
                <Image
                  src={getIconPath(job.job)}
                  alt={job.job}
                  width={56}
                  height={56}
                  className="block"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SHOW_DEV_JSON = false;

export default function Home() {
  const [fflogsData, setFflogsData] = useState<FFLogsGroupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<number | null>(1);
  const [savageExpanded, setSavageExpanded] = useState(true);
  // Tooltip: hovered group and job index
  const [hoveredBar, setHoveredBar] = useState<{ group: string; idx: number } | null>(null);
  const [, setLastApiUrl] = useState<string | null>(null);
  const [, setRawApiResponse] = useState<string | null>(null);
  const [, setAllApiData] = useState<string[] | null>(null);

  // Damage check feature state
  const [partyComposition, setPartyComposition] = useState({
    melee1: '',
    melee2: '',
    ranged: '',
    caster: '',
    tank1: '',
    tank2: '',
    healer1: '',
    healer2: '',
  });

  // Zone and boss IDs as variables
  const savageId = 1;
  const boss1Id = 2;
  const boss2Id = 3;
  const boss3Id = 4;
  const boss4Id = 5;
  const ultimateId = 6;

  // Add new phase IDs
  const phase1Id = 7;
  const phase2Id = 8;
  const phase3Id = 9;
  const phase4Id = 10;
  const phase5Id = 11;

  // Add state for ultimateExpanded
  const [ultimateExpanded, setUltimateExpanded] = useState(false);

  // Helper function to get damage requirement for each boss
  const getDamageRequirement = (bossId: number) => {
    switch (bossId) {
      case boss1Id: return 175000;
      case boss2Id: return 185000;
      case boss3Id: return 185000;
      case boss4Id: return 177000;
      default: return 0;
    }
  };

  // Helper function to calculate total party damage
  const calculatePartyDamage = () => {
    if (!fflogsData) return 0;
    
    let totalDamage = 0;
    const selectedJobs = Object.values(partyComposition).filter(job => job !== '');
    
    selectedJobs.forEach(jobName => {
      // Find the job in the groups
      for (const [, jobs] of Object.entries(fflogsData.groups)) {
        const job = jobs.find(j => j.job === jobName);
        if (job) {
          const damage = parseInt(job.score.replace(/,/g, '')) || 0;
          totalDamage += damage;
          break;
        }
      }
    });
    
    return totalDamage;
  };

  const fetchFFLogsData = async (id: number) => {
    setLoading(true);
    setError(null);
    setActiveZone(id);
    setFflogsData(null);
    setLastApiUrl(null);
    setRawApiResponse(null);
    try {
      const apiUrl = `/api/fflogs?id=${id}`;
      setLastApiUrl(apiUrl);
      const response = await fetch(apiUrl);
      const text = await response.text();
      setRawApiResponse(text);
      if (!response.ok) throw new Error(`Failed to fetch data: ${text}`);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError('API did not return valid JSON.');
        return;
      }
      setFflogsData(data);
    } catch (err: unknown) {
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? String((err as unknown as { message: string }).message)
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

  // If boss page or phase page, find the max score across all jobs in all groups
  let maxBossScore = 100;
  const isIndividualBossOrPhase = activeZone && [boss1Id, boss2Id, boss3Id, boss4Id, phase1Id, phase2Id, phase3Id, phase4Id, phase5Id].includes(activeZone);
  if (isIndividualBossOrPhase && fflogsData) {
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

  React.useEffect(() => {
    if (!fflogsData && !loading && !error) {
      fetch('/api/fflogs')
        .then(res => res.json())
        .then(setAllApiData)
        .catch(() => setAllApiData(null));
    }
  }, [fflogsData, loading, error]);

  React.useEffect(() => {
    if (activeZone === savageId && !fflogsData && !loading && !error) {
      fetchFFLogsData(savageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a flag to hide the damage check feature for phase pages
  const isPhasePage = activeZone && [phase1Id, phase2Id, phase3Id, phase4Id, phase5Id].includes(activeZone);

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
                  fetchFFLogsData(savageId);
                  if (!savageExpanded) setSavageExpanded(true);
                  if (ultimateExpanded) setUltimateExpanded(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                style={{ zIndex: 2 }}
              >
                {loading && activeZone === savageId ? 'Loading...' : 'Savage'}
              </button>
              {/* Boss Buttons Slide In Between */}
              <div className={`flex flex-row space-x-1 transition-all duration-300 ${savageExpanded ? 'opacity-100 max-w-[500px]' : 'opacity-0 max-w-0'} overflow-hidden`} style={{ marginLeft: savageExpanded ? '4px' : '0', marginRight: savageExpanded ? '16px' : '0' }}>
                <button
                  onClick={() => fetchFFLogsData(boss1Id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 1</button>
                <button
                  onClick={() => fetchFFLogsData(boss2Id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 2</button>
                <button
                  onClick={() => fetchFFLogsData(boss3Id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 3</button>
                <button
                  onClick={() => fetchFFLogsData(boss4Id)}
                  disabled={loading}
                  className={bossBtnClass}
                >Boss 4</button>
              </div>
              {/* Ultimate Button */}
              <button
                onClick={() => {
                  fetchFFLogsData(ultimateId);
                  if (!ultimateExpanded) setUltimateExpanded(true);
                  if (savageExpanded) setSavageExpanded(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ zIndex: 2 }}
              >
                {loading && activeZone === ultimateId ? 'Loading...' : 'Ultimate'}
              </button>
              {/* Phase Selector */}
              <div className={`flex flex-row space-x-1 transition-all duration-300 ${ultimateExpanded ? 'opacity-100 max-w-[500px]' : 'opacity-0 max-w-0'} overflow-hidden`} style={{ marginLeft: ultimateExpanded ? '4px' : '0', marginRight: ultimateExpanded ? '16px' : '0' }}>
                <button onClick={() => fetchFFLogsData(phase1Id)} disabled={loading} className="px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Phase 1</button>
                <button onClick={() => fetchFFLogsData(phase2Id)} disabled={loading} className="px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Phase 2</button>
                <button onClick={() => fetchFFLogsData(phase3Id)} disabled={loading} className="px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Phase 3</button>
                <button onClick={() => fetchFFLogsData(phase4Id)} disabled={loading} className="px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Phase 4</button>
                <button onClick={() => fetchFFLogsData(phase5Id)} disabled={loading} className="px-2 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Phase 5</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '57.6rem' }}>
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
              {activeZone && [boss1Id, boss2Id, boss3Id, boss4Id, phase1Id, phase2Id, phase3Id, phase4Id, phase5Id].includes(activeZone) && fflogsData.bossName
                ? fflogsData.bossName.replace(/^.*?:\s*/, '')
                : fflogsData.zoneName || getZoneName(fflogsData.zone)}
            </h2>
            {Object.entries(fflogsData.groups).map(([group, jobs]) => {
              // Find the best job in this group
              let bestJob = jobs[0];
              let bestValue = 0;
              if (jobs.length === 0) {
                bestJob = { job: '', score: '0', count: '0' };
                bestValue = 0;
              } else if (activeZone && [boss1Id, boss2Id, boss3Id, boss4Id].includes(activeZone)) {
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
                      <div className="flex-1 text-xs uppercase tracking-wider text-gray-400">{activeZone && [boss1Id, boss2Id, boss3Id, boss4Id].includes(activeZone) ? 'Damage' : 'FFLogs Score'}</div>
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
                          if (activeZone && [boss1Id, boss2Id, boss3Id, boss4Id].includes(activeZone)) {
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
                          if (isIndividualBossOrPhase) {
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

      {/* Damage Check Feature */}
      {fflogsData && !loading && activeZone && [boss1Id, boss2Id, boss3Id, boss4Id].includes(activeZone) && !isPhasePage && (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '57.6rem' }}>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Damage check feature</h3>
              <div className="text-sm text-gray-400 mb-4">
                DPS requirement: <span className="font-semibold text-blue-400" title="Numbers are rounded up, and crowdsourced with help from the balance discord">
                  {getDamageRequirement(activeZone).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Party Composition Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* First row: Melee, Ranged, Caster */}
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="melee"
                  jobs={fflogsData.groups.melee}
                  selected={[partyComposition.melee1, partyComposition.melee2]}
                  max={2}
                  onSelect={(job) => {
                    if (partyComposition.melee1 === job) {
                      setPartyComposition(prev => ({ ...prev, melee1: '' }));
                    } else if (partyComposition.melee2 === job) {
                      setPartyComposition(prev => ({ ...prev, melee2: '' }));
                    } else if (!partyComposition.melee1) {
                      setPartyComposition(prev => ({ ...prev, melee1: job }));
                    } else if (!partyComposition.melee2) {
                      setPartyComposition(prev => ({ ...prev, melee2: job }));
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="ranged"
                  jobs={fflogsData.groups.ranged}
                  selected={[partyComposition.ranged]}
                  max={1}
                  onSelect={(job) => {
                    setPartyComposition(prev => ({ ...prev, ranged: prev.ranged === job ? '' : job }));
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="caster"
                  jobs={fflogsData.groups.caster}
                  selected={[partyComposition.caster]}
                  max={1}
                  onSelect={(job) => {
                    setPartyComposition(prev => ({ ...prev, caster: prev.caster === job ? '' : job }));
                  }}
                />
              </div>

              {/* Second row: Tanks, Healers, Damage Comparison */}
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="tank"
                  jobs={fflogsData.groups.tank}
                  selected={[partyComposition.tank1, partyComposition.tank2]}
                  max={2}
                  onSelect={(job) => {
                    if (partyComposition.tank1 === job) {
                      setPartyComposition(prev => ({ ...prev, tank1: '' }));
                    } else if (partyComposition.tank2 === job) {
                      setPartyComposition(prev => ({ ...prev, tank2: '' }));
                    } else if (!partyComposition.tank1) {
                      setPartyComposition(prev => ({ ...prev, tank1: job }));
                    } else if (!partyComposition.tank2) {
                      setPartyComposition(prev => ({ ...prev, tank2: job }));
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="healer"
                  jobs={fflogsData.groups.healer}
                  selected={[partyComposition.healer1, partyComposition.healer2]}
                  max={2}
                  onSelect={(job) => {
                    if (partyComposition.healer1 === job) {
                      setPartyComposition(prev => ({ ...prev, healer1: '' }));
                    } else if (partyComposition.healer2 === job) {
                      setPartyComposition(prev => ({ ...prev, healer2: '' }));
                    } else if (!partyComposition.healer1) {
                      setPartyComposition(prev => ({ ...prev, healer1: job }));
                    } else if (!partyComposition.healer2) {
                      setPartyComposition(prev => ({ ...prev, healer2: job }));
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 flex items-stretch h-full">
                <div className="w-full flex flex-col justify-center h-full">
                  <div className="bg-gray-700 rounded-lg p-3 h-full flex flex-col justify-center">
                    <div className="text-center flex flex-col justify-center h-full">
                      {(() => {
                        const selectedCount = Object.values(partyComposition).filter(job => job !== '').length;
                        const partyDamage = calculatePartyDamage();
                        const requirement = getDamageRequirement(activeZone);
                        const percentage = requirement > 0 ? (partyDamage / requirement) * 100 : 0;
                        if (selectedCount < 8) {
                          return (
                            <div className="text-gray-400 text-sm">
                              Select all 8 party members to see damage comparison
                            </div>
                          );
                        }
                        return (
                          <>
                            <div className="text-xl font-bold text-gray-200">
                              {partyDamage.toLocaleString()} / <span title="Numbers are rounded up, and crowdsourced with help from the balance discord">{requirement.toLocaleString()}</span>
                            </div>
                            <div className={`text-base font-semibold ${partyDamage >= requirement ? 'text-green-400' : 'text-red-400'}`}>
                              {partyDamage >= requirement ? '✓ Meets Requirement' : '✗ Below Requirement'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {partyDamage >= requirement 
                                ? `With this composition, if everyone is playing at an average level, you beat the damage check by ${(percentage - 100).toFixed(1)}%`
                                : `With this composition, if everyone is playing at an average level, you miss the damage check by ${(100 - percentage).toFixed(1)}%`
                              }
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add back the dev debug output at the bottom of the page */}
      {SHOW_DEV_JSON && (fflogsData || error) && (
        <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded border border-gray-700">
          <div className="font-bold mb-2">(dev) API Response:</div>
          {error && (
            <div className="mb-2 text-red-400">Error: {error}</div>
          )}
          {fflogsData && typeof fflogsData === 'object' && (!('groups' in fflogsData) || !('zoneName' in fflogsData)) && (
            <div className="mb-2 text-yellow-400">Warning: API response does not match expected FFLogsGroupData structure.</div>
          )}
          <details open>
            <summary className="cursor-pointer">Parsed JSON</summary>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
              {(() => {
                try {
                  return JSON.stringify(fflogsData || error, null, 2);
                } catch {
                  return String(fflogsData || error);
                }
              })()}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
