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

// Utility to abbreviate boss names (e.g., "Firstname Lastname" becomes "F. Lastname")
// function abbreviateBossName(name: string, maxLength: number = 12): string {
//   if (name.length <= maxLength) return name;
  
//   const words = name.trim().split(' ');
//   if (words.length <= 1) return name;
  
//   const firstWords = words.slice(0, -1).map(word => word.charAt(0) + '.');
//   const lastWord = words[words.length - 1];
  
//   const abbreviated = [...firstWords, lastWord].join(' ');
//   return abbreviated.length <= maxLength ? abbreviated : name;
//}

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
  isFreeform?: boolean;
}

function RoleIconSelector({ role, jobs, selected, max, onSelect, className = '', isFreeform = false }: RoleIconSelectorProps) {
  // Capitalize job name for icon file
  const getIconPath = (jobName: string) => {
    // Remove spaces and capitalize each word for filename
    return `/assets/job-icons/${jobName.replace(/ /g, '').replace(/(^|\s)([a-z])/g, (m, p1, p2) => p2.toUpperCase())}.png`;
  };
  const isSelected = (job: { job: string }) => selected.includes(job.job);
  const isDisabled = (job: { job: string }) => {
    if (isFreeform) {
      // In freeform mode, only disable if we have 8 total jobs and this job isn't selected
      return selected.length >= 8 && !isSelected(job);
    } else {
      // Normal mode: disable if not selected and we've reached the max for this role
      return !isSelected(job) && selected.filter(Boolean).length >= max;
    }
  };

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
      <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">
        {GROUP_LABELS[role]} (Select {Math.max(0, max - selected.filter(Boolean).length)})
      </h4>
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
                {/* Freeform count badge */}
                {isFreeform && selected.filter(j => j === job.job).length > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow" style={{ transform: 'translate(35%,-35%)' }}>
                    {selected.filter(j => j === job.job).length}
                  </span>
                )}
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
                {/* Freeform count badge */}
                {isFreeform && selected.filter(j => j === job.job).length > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow" style={{ transform: 'translate(35%,-35%)' }}>
                    {selected.filter(j => j === job.job).length}
                  </span>
                )}
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
                {/* Freeform count badge */}
                {isFreeform && selected.filter(j => j === job.job).length > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow" style={{ transform: 'translate(35%,-35%)' }}>
                    {selected.filter(j => j === job.job).length}
                  </span>
                )}
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
  const [loading, ] = useState(false);
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

  // Freeform party composition state
  const [freeformParty, setFreeformParty] = useState<string[]>([]);

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

  // Add new party composition page ID
  const partyCompositionId = 12;

  // Add state for ultimateExpanded
  const [ultimateExpanded, setUltimateExpanded] = useState(false);
  // Add state for party composition expanded
  const [partyCompositionExpanded, setPartyCompositionExpanded] = useState(false);

  // Add state for party composition data
  const [partyCompositionData, setPartyCompositionData] = useState<Record<number, FFLogsGroupData | null>>({});

  // Add state for warning notification
  const [showPhase5Warning, setShowPhase5Warning] = useState(false);
  const [showPhase3Warning, setShowPhase3Warning] = useState(false);

  // Add state for about dropdown
  const [aboutExpanded, setAboutExpanded] = useState(false);
  
  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Add state for checkbox selections
  const [checkboxSelections, setCheckboxSelections] = useState({
    boss1: false,
    boss2: false,
    boss3: false,
    boss4: false,
    ultimate: false,
    freeform: false,
  });
  
  // Add state for collapsible sections in about popup
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    howToUse: true,
    dataSource: false,
    whyMedian: false,
    whyNotMean: false,
    whyName: false,
    contact: false,
  });

  // Helper function to toggle section expansion
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Helper function to toggle checkbox selections
  const toggleCheckbox = (key: keyof typeof checkboxSelections) => {
    setCheckboxSelections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper function to handle freeform job selection
  const handleFreeformJobSelect = (jobName: string) => {
    if (checkboxSelections.freeform) {
      setFreeformParty(prev => {
        const jobCount = prev.filter(job => job === jobName).length;
        const totalCount = prev.length;
        
        if (totalCount < 8) {
          // If we have room, add another copy
          return [...prev, jobName];
        } else if (jobCount > 0) {
          // If we're at max capacity and this job is already selected, remove all instances
          return prev.filter(job => job !== jobName);
        } else {
          // If we're at max capacity and this job isn't selected, don't add it
          return prev;
        }
      });
    }
  };

  // Helper function to get damage requirement for each boss
  const getDamageRequirement = (bossId: number) => {
    switch (bossId) {
      case boss1Id: return 175000;
      case boss2Id: return 185000;
      case boss3Id: return 185000;
      case boss4Id: return 177000;
      case phase1Id: return 140000;
      case phase2Id: return 160000;
      case phase3Id: return 170000;
      case phase4Id: return 145000;
      case phase5Id: return 185000;
      default: return 0;
    }
  };

  // Add state for pending zone
  const [, setPendingZone] = useState<number | null>(null);

  // Update fetchFFLogsData to not clear fflogsData or set loading immediately
  const fetchFFLogsData = async (id: number) => {
    setPendingZone(id);
    setError(null);
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
        setPendingZone(null);
        return;
      }
      setFflogsData(data);
      setActiveZone(id); // Only swap after data is loaded
      setPendingZone(null);
    } catch (err: unknown) {
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? String((err as unknown as { message: string }).message)
        : 'An error occurred');
      setPendingZone(null);
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
  // const isPhasePage = activeZone && [phase1Id, phase2Id, phase3Id, phase4Id, phase5Id].includes(activeZone);

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header with buttons */}
      <header className="sticky top-0 z-50 bg-gray-800 shadow-sm border-b border-gray-700 h-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center space-x-4">
              <h1
                className="text-xl font-semibold text-white relative group cursor-pointer leading-tight my-0"
              >
                What&apos;s the Meta?
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded bg-zinc-900 text-white text-xs border border-gray-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  Nothing, what&apos;s the meta with you?
                </span>
              </h1>
              
              {/* About Button */}
              <div className="relative">
                <button
                  onClick={() => setAboutExpanded(!aboutExpanded)}
                  className="text-gray-300 hover:text-white text-sm px-2 py-1 rounded transition-colors"
                >
                  About
                </button>
                {/* About Dropdown */}
                <div className={`absolute top-full left-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ${aboutExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="p-4 space-y-2">
                    {/* How to Use */}
                    <div>
                      <button
                        onClick={() => toggleSection('howToUse')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.howToUse ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>How to Use</span>
                        <span className={`transition-transform duration-200 ${expandedSections.howToUse ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.howToUse && (
                        <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                          Click Savage or Ultimate to see job performance data. Use the Party Composition tool to build your party and see how they could be expected to perform across all encounters. The damage requirements show what your party needs to meet each check.<br />
                          Hover over job bars to see detailed comparisons, and use the pie charts to understand job popularity in the current meta.
                        </p>
                      )}
                    </div>
                    
                    {/* Data Source */}
                    <div>
                      <button
                        onClick={() => toggleSection('dataSource')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.dataSource ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>Data Source</span>
                        <span className={`transition-transform duration-200 ${expandedSections.dataSource ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.dataSource && (
                        <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                          All data comes from FFLogs and is based on median performance. This means 50% of players do more DPS than shown, and 50% do less. These are realistic expectations for average players.<br />
                          The boss DPS requirement numbers were calculated by taking the boss&apos;s HP and dividing by the time you have to kill it. There is some variance due to instance speeds, and the requirement is rounded up to the nearest 1000 DPS.<br />
                          This means it is possible to kill the boss with less than the listed requirement here, since it is just a tool and I cannot simulate Square Enix servers.
                        </p>
                      )}
                    </div>
                    
                    {/* Why Median? */}
                    <div>
                      <button
                        onClick={() => toggleSection('whyMedian')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.whyMedian ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>Why Median?</span>
                        <span className={`transition-transform duration-200 ${expandedSections.whyMedian ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.whyMedian && (
                        <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                          Median isn&apos;t exactly the &quot;average&quot; damage - it&apos;s the middle value where half of players perform better and half perform worse. While not a true average, it&apos;s close enough for most purposes and keeps the data collection lightweight for FFLogs.
                        </p>
                      )}
                    </div>

                    {/* Why Not Mean? */}
                    <div>
                      <button
                        onClick={() => toggleSection('whyNotMean')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.whyNotMean ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>Why Not Mean?</span>
                        <span className={`transition-transform duration-200 ${expandedSections.whyNotMean ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.whyNotMean && (
                        <>
                          <p className="text-xs text-gray-100 leading-relaxed mb-2 px-2 pb-2">
                            The image below shows the difference between a calculated estimated mean (using all percentiles) vs just using the simple median:
                          </p>
                          <Image 
                            src="/assets/medianvsmean.png" 
                            alt="Median vs Mean comparison" 
                            width={400}
                            height={300}
                            className="w-full rounded border border-gray-600 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowImageModal(true)}
                          />
                          <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                            Note that this data is from Phase 5 of FRU, which has the most variance and the most stringent DPS check.<br />
                            I don&apos;t think a difference of less than 350 DPS at most is worth the extra math. <br />
                            Also note that the average dps is below the median dps for all jobs except BLM and MCH.
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Why "What's the Meta?" */}
                    <div>
                      <button
                        onClick={() => toggleSection('whyName')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.whyName ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>Why&apos;s &quot;What&apos;s the Meta?&quot;?</span>
                        <span className={`transition-transform duration-200 ${expandedSections.whyName ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.whyName && (
                        <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                          This site was made to show that party composition and class choice really don&apos;t matter as much as players think. Any class played at an average level is good enough for almost anything. Even in ultimates where you need to overperform, it&apos;s your performance that matters more than class choice.<br />
                          The name is a play on the common question &quot;What&apos;s the meta?&quot; - the answer is usually &quot;play what you enjoy and perform well with.&quot;
                        </p>
                      )}
                    </div>
                    
                    {/* Contact */}
                    <div>
                      <button
                        onClick={() => toggleSection('contact')}
                        className={`flex items-center justify-between w-full text-left text-sm font-semibold mb-2 transition-colors rounded-md px-3 py-2
                          ${expandedSections.contact ? 'bg-[#46608A] text-white' : 'bg-[#384D6B] text-blue-100'}
                          hover:bg-[#46608A] hover:text-white cursor-pointer shadow-sm`}
                        style={{ outline: 'none', border: 'none' }}
                      >
                        <span>Contact</span>
                        <span className={`transition-transform duration-200 ${expandedSections.contact ? 'rotate-90' : ''}`}
                          style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 6L13 10L7 14V6Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      {expandedSections.contact && (
                        <p className="text-xs text-gray-100 leading-relaxed px-2 pb-2">
                          Adam Rauvagol @ Jenova<br />
                          EmailTheMeta@gmail.com
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 relative min-h-[48px] items-center mt-[2px]" style={{ position: 'relative', zIndex: 2 }}>
              {/* Savage Button and Boss Buttons */}
              <div className="relative">
                <button
                  onClick={() => {
                    fetchFFLogsData(savageId);
                    if (ultimateExpanded) {
                      setUltimateExpanded(false);
                      // Wait for the close animation to finish before opening Savage
                      setTimeout(() => {
                        if (!savageExpanded) setSavageExpanded(true);
                      }, 300); // Match the transition duration
                    } else {
                      if (!savageExpanded) setSavageExpanded(true);
                    }
                    if (aboutExpanded) setAboutExpanded(false);
                  }}
                  disabled={loading}
                  className={`px-2 py-1 font-semibold text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
                    activeZone === savageId ? 'bg-blue-700 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800' : 'bg-blue-600'
                  }`}
                  style={{ zIndex: 2 }}
                >
                  Savage
                </button>
                {/* Boss Buttons Drop Down */}
                <div className={`fade-dropdown absolute top-full left-1/2 transform -translate-x-1/2 ${savageExpanded ? 'opacity-100' : 'opacity-0 fade-out'} bg-gray-800 border border-gray-700 border-t-0 rounded-b-lg shadow-lg mt-[6px] py-[6px] px-[6px]`} style={{ zIndex: savageExpanded ? 10 : 1, pointerEvents: savageExpanded ? 'auto' : 'none' }}>
                  <div className="flex flex-row space-x-1 -mt-[2px]">
                    <button
                      onClick={() => fetchFFLogsData(boss1Id)}
                      disabled={loading}
                      className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                        activeZone === boss1Id ? 'bg-blue-700 border-blue-300' : 'bg-blue-500 border-transparent'
                      }`}
                    >Boss 1</button>
                    <button
                      onClick={() => fetchFFLogsData(boss2Id)}
                      disabled={loading}
                      className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                        activeZone === boss2Id ? 'bg-blue-700 border-blue-300' : 'bg-blue-500 border-transparent'
                      }`}
                      data-button-id="boss2"
                    >Boss 2</button>
                    <button
                      onClick={() => fetchFFLogsData(boss3Id)}
                      disabled={loading}
                      className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                        activeZone === boss3Id ? 'bg-blue-700 border-blue-300' : 'bg-blue-500 border-transparent'
                      }`}
                    >Boss 3</button>
                    <button
                      onClick={() => fetchFFLogsData(boss4Id)}
                      disabled={loading}
                      className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                        activeZone === boss4Id ? 'bg-blue-700 border-blue-300' : 'bg-blue-500 border-transparent'
                      }`}
                    >Boss 4</button>
                  </div>
                </div>
              </div>
              
              {/* Ultimate Button and Phase Buttons */}
              <div className="relative">
                <button
                  onClick={() => {
                    fetchFFLogsData(ultimateId);
                    if (savageExpanded) {
                      setSavageExpanded(false);
                      // Wait for the close animation to finish before opening Ultimate
                      setTimeout(() => {
                        if (!ultimateExpanded) setUltimateExpanded(true);
                      }, 300); // Match the transition duration
                    } else {
                      if (!ultimateExpanded) setUltimateExpanded(true);
                    }
                    if (partyCompositionExpanded) setPartyCompositionExpanded(false);
                    if (aboutExpanded) setAboutExpanded(false);
                  }}
                  disabled={loading}
                  className={`px-2 py-1 font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    activeZone === ultimateId ? 'bg-green-700 ring-2 ring-green-400 ring-offset-2 ring-offset-gray-800' : 'bg-green-600'
                  }`}
                  style={{ zIndex: 2 }}
                >
                  Ultimate
                </button>
                {/* Phase Buttons Drop Down */}
                <div className={`fade-dropdown absolute top-full left-1/2 transform -translate-x-1/2 ${ultimateExpanded ? 'opacity-100' : 'opacity-0 fade-out'} bg-gray-800 border border-gray-700 border-t-0 rounded-b-lg shadow-lg mt-[6px] py-[6px] px-[6px]`} style={{ zIndex: ultimateExpanded ? 10 : 1, pointerEvents: ultimateExpanded ? 'auto' : 'none' }}>
                  <div className="flex flex-row space-x-1 -mt-[2px]">
                    <button onClick={() => fetchFFLogsData(phase1Id)} disabled={loading} className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                      activeZone === phase1Id ? 'bg-green-700 border-green-300' : 'bg-green-600 border-transparent'
                    }`} data-button-id="phase1">Phase 1</button>
                    <button onClick={() => fetchFFLogsData(phase2Id)} disabled={loading} className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                      activeZone === phase2Id ? 'bg-green-700 border-green-300' : 'bg-green-600 border-transparent'
                    }`}>Phase 2</button>
                    <button onClick={() => fetchFFLogsData(phase3Id)} disabled={loading} className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                      activeZone === phase3Id ? 'bg-green-700 border-green-300' : 'bg-green-600 border-transparent'
                    }`}>Phase 3</button>
                    <button onClick={() => fetchFFLogsData(phase4Id)} disabled={loading} className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                      activeZone === phase4Id ? 'bg-green-700 border-green-300' : 'bg-green-600 border-transparent'
                    }`}>Phase 4</button>
                    <button onClick={() => fetchFFLogsData(phase5Id)} disabled={loading} className={`pt-0.5 pb-1 px-1 text-sm font-semibold text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 whitespace-nowrap flex-shrink-0 ${
                      activeZone === phase5Id ? 'bg-green-700 border-green-300' : 'bg-green-600 border-transparent'
                    }`}>Phase 5</button>
                  </div>
                </div>
              </div>

              {/* Party Composition Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveZone(partyCompositionId);
                    if (!partyCompositionExpanded) setPartyCompositionExpanded(true);
                    if (savageExpanded) setSavageExpanded(false);
                    if (ultimateExpanded) setUltimateExpanded(false);
                    if (aboutExpanded) setAboutExpanded(false);
                    // Load all boss/phase data
                    const allIds = [boss1Id, boss2Id, boss3Id, boss4Id, phase1Id, phase2Id, phase3Id, phase4Id, phase5Id];
                    allIds.forEach(id => {
                      fetch(`/api/fflogs?id=${id}`)
                        .then(res => res.json())
                        .then(data => {
                          setPartyCompositionData(prev => ({ ...prev, [id]: data }));
                        })
                        .catch(() => {
                          setPartyCompositionData(prev => ({ ...prev, [id]: null }));
                        });
                    });
                  }}
                  disabled={loading}
                  className={`px-2 py-1 font-semibold text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    activeZone === partyCompositionId ? 'bg-purple-700 ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-800' : 'bg-purple-600'
                  }`}
                  style={{ zIndex: 2 }}
                >
                  Party Composition
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close about dropdown */}
      {aboutExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setAboutExpanded(false)}
        />
      )}

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
            <span className="ml-3 text-gray-600">Loading data...</span>
          </div>
        )}
        {fflogsData && !loading && activeZone !== partyCompositionId && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">
              {activeZone && [boss1Id, boss2Id, boss3Id, boss4Id, phase1Id, phase2Id, phase3Id, phase4Id, phase5Id].includes(activeZone) && fflogsData.bossName
                ? fflogsData.bossName.replace(/^.*?-\s*/, '')
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
          <div className="text-center py-12 text-gray-500">
            Click one of the buttons above to load FFLogs data.
          </div>
        )}
      </main>

      {/* Party Composition Page */}
      {activeZone === partyCompositionId && (
        <div style={{ maxWidth: '57.6rem', margin: '0 auto' }}>
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Party Composition Analysis
          </h2>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8 relative">
            <button
              onClick={() => {
                setPartyComposition({
                  melee1: '',
                  melee2: '',
                  ranged: '',
                  caster: '',
                  tank1: '',
                  tank2: '',
                  healer1: '',
                  healer2: '',
                });
                setFreeformParty([]);
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              title="Reset party selection"
            >
              Reset
            </button>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Party Builder</h3>
              <div className="text-sm text-gray-400 mb-4">
                Build your party composition to see damage comparisons across all bosses/phases
              </div>
            </div>

            {/* Party Composition Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* First row: Melee, Ranged, Caster */}
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="melee"
                  jobs={fflogsData?.groups.melee || []}
                  selected={checkboxSelections.freeform ? freeformParty : [partyComposition.melee1, partyComposition.melee2]}
                  max={checkboxSelections.freeform ? 8 : 2}
                  isFreeform={checkboxSelections.freeform}
                  onSelect={(job) => {
                    if (checkboxSelections.freeform) {
                      handleFreeformJobSelect(job);
                    } else {
                      if (partyComposition.melee1 === job) {
                        setPartyComposition(prev => ({ ...prev, melee1: '' }));
                      } else if (partyComposition.melee2 === job) {
                        setPartyComposition(prev => ({ ...prev, melee2: '' }));
                      } else if (!partyComposition.melee1) {
                        setPartyComposition(prev => ({ ...prev, melee1: job }));
                      } else if (!partyComposition.melee2) {
                        setPartyComposition(prev => ({ ...prev, melee2: job }));
                      }
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="ranged"
                  jobs={fflogsData?.groups.ranged || []}
                  selected={checkboxSelections.freeform ? freeformParty : [partyComposition.ranged]}
                  max={checkboxSelections.freeform ? 8 : 1}
                  isFreeform={checkboxSelections.freeform}
                  onSelect={(job) => {
                    if (checkboxSelections.freeform) {
                      handleFreeformJobSelect(job);
                    } else {
                      setPartyComposition(prev => ({ ...prev, ranged: prev.ranged === job ? '' : job }));
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="caster"
                  jobs={fflogsData?.groups.caster || []}
                  selected={checkboxSelections.freeform ? freeformParty : [partyComposition.caster]}
                  max={checkboxSelections.freeform ? 8 : 1}
                  isFreeform={checkboxSelections.freeform}
                  onSelect={(job) => {
                    if (checkboxSelections.freeform) {
                      handleFreeformJobSelect(job);
                    } else {
                      setPartyComposition(prev => ({ ...prev, caster: prev.caster === job ? '' : job }));
                    }
                  }}
                />
              </div>

              {/* Second row: Tanks, Healers, Damage Comparison */}
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="tank"
                  jobs={fflogsData?.groups.tank || []}
                  selected={checkboxSelections.freeform ? freeformParty : [partyComposition.tank1, partyComposition.tank2]}
                  max={checkboxSelections.freeform ? 8 : 2}
                  isFreeform={checkboxSelections.freeform}
                  onSelect={(job) => {
                    if (checkboxSelections.freeform) {
                      handleFreeformJobSelect(job);
                    } else {
                      if (partyComposition.tank1 === job) {
                        setPartyComposition(prev => ({ ...prev, tank1: '' }));
                      } else if (partyComposition.tank2 === job) {
                        setPartyComposition(prev => ({ ...prev, tank2: '' }));
                      } else if (!partyComposition.tank1) {
                        setPartyComposition(prev => ({ ...prev, tank1: job }));
                      } else if (!partyComposition.tank2) {
                        setPartyComposition(prev => ({ ...prev, tank2: job }));
                      }
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 h-full">
                <RoleIconSelector
                  role="healer"
                  jobs={fflogsData?.groups.healer || []}
                  selected={checkboxSelections.freeform ? freeformParty : [partyComposition.healer1, partyComposition.healer2]}
                  max={checkboxSelections.freeform ? 8 : 2}
                  isFreeform={checkboxSelections.freeform}
                  onSelect={(job) => {
                    if (checkboxSelections.freeform) {
                      handleFreeformJobSelect(job);
                    } else {
                      if (partyComposition.healer1 === job) {
                        setPartyComposition(prev => ({ ...prev, healer1: '' }));
                      } else if (partyComposition.healer2 === job) {
                        setPartyComposition(prev => ({ ...prev, healer2: '' }));
                      } else if (!partyComposition.healer1) {
                        setPartyComposition(prev => ({ ...prev, healer1: job }));
                      } else if (!partyComposition.healer2) {
                        setPartyComposition(prev => ({ ...prev, healer2: job }));
                      }
                    }
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1 flex items-stretch h-full">
                <div className="w-full flex flex-col justify-center h-full">
                  <div className="bg-gray-700 rounded-lg p-3 h-full flex flex-col justify-center">
                    <div className="text-center flex flex-col justify-center h-full">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => toggleCheckbox('boss1')}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.boss1 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {partyCompositionData[boss1Id]?.bossName?.replace(/^.*?-\s*/, '') || 'Boss 1'}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleCheckbox('boss2')}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.boss2 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {partyCompositionData[boss2Id]?.bossName?.replace(/^.*?-\s*/, '') || 'Boss 2'}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleCheckbox('boss3')}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.boss3 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {partyCompositionData[boss3Id]?.bossName?.replace(/^.*?-\s*/, '') || 'Boss 3'}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleCheckbox('boss4')}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.boss4 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {partyCompositionData[boss4Id]?.bossName?.replace(/^.*?-\s*/, '') || 'Boss 4'}
                          </span>
                        </button>
                        <button 
                          onClick={() => toggleCheckbox('ultimate')}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.ultimate 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">
                            {partyCompositionData[phase1Id]?.zoneName || 'Ultimate'}
                          </span>
                        </button>
                        <button 
                          onClick={() => {
                            toggleCheckbox('freeform');
                            setPartyComposition({
                              melee1: '',
                              melee2: '',
                              ranged: '',
                              caster: '',
                              tank1: '',
                              tank2: '',
                              healer1: '',
                              healer2: '',
                            });
                            setFreeformParty([]);
                          }}
                          className={`flex items-center justify-center gap-2 text-gray-200 text-base py-2 px-3 rounded-md transition-colors border-2 whitespace-nowrap ${
                            checkboxSelections.freeform 
                              ? 'bg-blue-600 border-blue-400' 
                              : 'bg-gray-600 hover:bg-gray-500 border-transparent hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">Freeform</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning message for freeform mode */}
            {checkboxSelections.freeform && (
              <div className="mt-4 bg-amber-700 text-white text-xs px-4 py-2 rounded shadow font-semibold flex items-center gap-2 justify-center">
                <span className="text-lg">⚠️</span>
                Numbers may be inaccurate in freeform mode, as this allows party compositions that are not realistic.
              </div>
            )}
          </div>

          <div className="space-y-6">
            {[boss1Id, boss2Id, boss3Id, boss4Id, phase1Id, phase2Id, phase3Id, phase4Id, phase5Id]
              .filter((id) => {
                // Show boss elements only if their specific checkbox is selected
                if (id === boss1Id) return checkboxSelections.boss1;
                if (id === boss2Id) return checkboxSelections.boss2;
                if (id === boss3Id) return checkboxSelections.boss3;
                if (id === boss4Id) return checkboxSelections.boss4;
                // Show phase elements only if Ultimate checkbox is selected
                else return checkboxSelections.ultimate;
              })
              .map((id) => {
              const data = partyCompositionData[id];
              const requirement = getDamageRequirement(id);
              const bossName = data?.bossName?.replace(/^.*?-\s*/, '') || (id <= 5 ? `Boss ${id}` : `Phase ${id - 6}`);
              const zoneName = id <= 5 ? 'Savage' : 'Ultimate';
              
              // Calculate party damage for this specific boss/phase
              const calculatePartyDamageForBoss = () => {
                if (!data) return 0;
                
                let totalDamage = 0;
                const selectedJobs = checkboxSelections.freeform 
                  ? freeformParty 
                  : Object.values(partyComposition).filter(job => job !== '');
                
                selectedJobs.forEach(jobName => {
                  // Find the job in the groups
                  for (const [, jobs] of Object.entries(data.groups)) {
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
              
              const partyDamage = calculatePartyDamageForBoss();
              const percentage = requirement > 0 ? (partyDamage / requirement) * 100 : 0;
              const selectedCount = checkboxSelections.freeform 
                ? freeformParty.length 
                : Object.values(partyComposition).filter(job => job !== '').length;
              
              // Before the return (
              const showP3WarningIcon = id === phase3Id && selectedCount === 8 && partyDamage < requirement;
              const showP5WarningIcon = id === phase5Id && selectedCount === 8 && partyDamage < requirement;

              return (
                <div key={id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-200">{bossName}</h3>
                      <p className="text-sm text-gray-400">{zoneName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">DPS Requirement</p>
                      <p className="text-lg font-bold text-blue-400">{requirement.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {data ? (
                    <div className="space-y-4">
                      {selectedCount > 0 ? (
                        <div className="flex gap-4">
                          <div className="bg-gray-700 rounded p-3 flex-1">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Selected Jobs:</h4>
                            <div className="text-xs text-gray-300">
                              {(() => {
                                // Show only selected jobs and their damage
                                const selectedJobs = checkboxSelections.freeform 
                                  ? freeformParty 
                                  : Object.values(partyComposition).filter(job => job !== '');
                                const jobData = selectedJobs.map(jobName => {
                                  // Find the job's damage across all groups
                                  for (const [, jobs] of Object.entries(data.groups)) {
                                    const job = jobs.find(j => j.job === jobName);
                                    if (job) {
                                      return { job: jobName, damage: job.score };
                                    }
                                  }
                                  return { job: jobName, damage: '0' };
                                });
                                
                                return (
                                  <ul className="space-y-1">
                                    {jobData.map((job, index) => (
                                      <li key={index} className="flex justify-between items-center">
                                        <span className="text-gray-300">{job.job}:</span>
                                        <span className="text-blue-400 font-semibold">{job.damage} DPS</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded p-3 flex-1 relative">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                              Party DPS vs Requirement:
                            </h4>
                            <div className="w-full flex flex-col items-center">
                              <div className="relative w-full h-8 bg-gray-600 rounded overflow-hidden mb-2" style={{ maxWidth: 340 }}>
                                <div
                                  className={`absolute left-0 top-0 h-full rounded ${partyDamage >= requirement ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, (partyDamage / requirement) * 100)}%`, transition: 'width 0.3s' }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                                  {partyDamage.toLocaleString()} / {requirement.toLocaleString()} DPS
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 text-center"
                                style={{ minHeight: 20 }}>
                                {partyDamage >= requirement 
                                  ? `With this composition, if everyone is playing at an average level, you beat the damage check by ${(percentage - 100).toFixed(1)}% without LB`
                                  : `With this composition, if everyone is playing at an average level, you miss the damage check by ${(100 - percentage).toFixed(1)}% without LB`
                                }
                              </div>
                              {/* Damage Warning Button for P3/P5 - only show if freeform mode is off */}
                              {!checkboxSelections.freeform && (showP3WarningIcon || showP5WarningIcon) && (
                                <button
                                  onClick={() => {
                                    if (id === phase3Id) {
                                      setShowPhase3Warning(true);
                                      setShowPhase5Warning(false);
                                    }
                                    if (id === phase5Id) {
                                      setShowPhase5Warning(true);
                                      setShowPhase3Warning(false);
                                    }
                                  }}
                                  className="mt-4 flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                                  style={{ minHeight: 0, minWidth: 0, lineHeight: '1.2' }}
                                  title="This phase's damage check is mathematically impossible with median DPS. Click for details."
                                >
                                  <span className="text-base leading-none">⚠️</span>
                                  <span>Damage Warning</span>
                                </button>
                              )}
                              {/* Local overlay/modal for warning */}
                              {((id === phase3Id && showPhase3Warning) || (id === phase5Id && showPhase5Warning)) && (
                                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10 p-4">
                                  <div className="w-full max-w-full max-h-full bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col justify-center">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center">
                                        <div className="text-yellow-400 text-2xl mr-3 mt-1">⚠️</div>
                                        <h4 className="text-sm font-semibold text-gray-100">
                                          {id === phase3Id ? 'Phase 3' : 'Phase 5'} Damage Check Warning
                                        </h4>
                                      </div>
                                      <button
                                        onClick={() => {
                                          if (id === phase3Id) setShowPhase3Warning(false);
                                          if (id === phase5Id) setShowPhase5Warning(false);
                                        }}
                                        className="ml-4 px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                      >
                                        Understood
                                      </button>
                                    </div>
                                    <p className="break-words whitespace-normal text-sm text-gray-200 leading-relaxed">
                                      There is no party composition that meets the {id === phase3Id ? 'Phase 3' : 'Phase 5'} damage check ({getDamageRequirement(id).toLocaleString()} DPS) with everyone performing at median DPS levels for their class. Even the most optimal composition falls short of this requirement.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center py-4">
                          Select jobs to see damage comparison
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-400">Loading data...</p>
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors z-10"
            >
              ×
            </button>
            <Image 
              src="/assets/medianvsmean.png" 
              alt="Median vs Mean comparison (Full size)" 
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
