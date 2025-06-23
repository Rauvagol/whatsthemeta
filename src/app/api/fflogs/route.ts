import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const GROUPS: Record<string, string[]> = {
  melee: ['viper', 'monk', 'dragoon', 'samurai', 'ninja'],
  caster: ['red mage', 'black mage', 'pictomancer', 'summoner'],
  ranged: ['dancer', 'machinist', 'bard'],
  tank: ['warrior', 'gunbreaker', 'dark knight', 'paladin'],
  healer: ['astrologian', 'scholar', 'white mage', 'sage'],
};

function groupJobs(jobs: { job: string; score: string; count: string }[]) {
  const result: Record<string, typeof jobs> = {
    melee: [],
    caster: [],
    ranged: [],
    tank: [],
    healer: [],
  };
  for (const job of jobs) {
    const jobName = job.job.trim().toLowerCase();
    for (const [group, names] of Object.entries(GROUPS)) {
      if (names.includes(jobName)) {
        result[group].push(job);
        break;
      }
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get('zone');
  const boss = searchParams.get('boss');

  if (!zone) {
    return NextResponse.json({ error: 'Zone parameter is required' }, { status: 400 });
  }

  const zoneId = parseInt(zone);
  
  if (![65, 68].includes(zoneId)) {
    return NextResponse.json({ error: 'Invalid zone ID. Only zones 65 and 68 are supported.' }, { status: 400 });
  }

  // Use Puppeteer to scrape the data
  const url = zoneId === 68
    ? `https://www.fflogs.com/zone/statistics/68?class=Any&dataset=50${boss ? `&boss=${boss}` : ''}`
    : `https://www.fflogs.com/zone/statistics/65?class=Any&dataset=50${boss ? `&boss=${boss}` : ''}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the main statistics table to appear
    await page.waitForSelector('table');

    // Extract the data from the table rows
    const jobs = await page.evaluate(() => {
      // Find all rows with a class (odd/even)
      const rows = Array.from(document.querySelectorAll('tr.odd, tr.even'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;
        return {
          job: cells[0].textContent?.trim() || '',
          score: cells[1].textContent?.trim() || '',
          count: cells[3].textContent?.trim() || '',
        };
      }).filter(Boolean);
    });

    // Extract the boss name if boss is specified, otherwise use the zone name
    let zoneName = '';
    if (boss) {
      zoneName = await page.evaluate(() => {
        const el = document.querySelector('#filter-boss-text');
        return el && el.textContent ? el.textContent.trim() : '';
      }) || '';
    }
    if (!zoneName) {
      zoneName = await page.evaluate(() => {
        const el = document.querySelector('a.zone-name');
        return el && el.textContent ? el.textContent.trim() : '';
      }) || '';
    }

    await browser.close();
    // Fix: filter out nulls and assert type
    const filteredJobs = (jobs as Array<{ job: string; score: string; count: string }>).filter(j => j && j.job);
    const groups = groupJobs(filteredJobs);
    return NextResponse.json({
      zone: zoneId,
      zoneName,
      url,
      timestamp: new Date().toISOString(),
      groups,
    });
  } catch (error) {
    if (browser) await browser.close();
    console.error('Error scraping FFLogs data:', error);
    return NextResponse.json(
      { error: 'Failed to scrape FFLogs data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 