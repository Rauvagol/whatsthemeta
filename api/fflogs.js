const chromium = require('@sparticuz/chromium');
const playwrightChromium = require('playwright-core').chromium;

const GROUPS = {
  melee: ['viper', 'monk', 'dragoon', 'samurai', 'ninja'],
  caster: ['red mage', 'black mage', 'pictomancer', 'summoner'],
  ranged: ['dancer', 'machinist', 'bard'],
  tank: ['warrior', 'gunbreaker', 'dark knight', 'paladin'],
  healer: ['astrologian', 'scholar', 'white mage', 'sage'],
};

function groupJobs(jobs) {
  const result = {
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

module.exports = async (req, res) => {
  const { zone, boss } = req.query;

  if (!zone) {
    res.status(400).json({ error: 'Zone parameter is required' });
    return;
  }

  const zoneId = parseInt(zone);
  if (![65, 68].includes(zoneId)) {
    res.status(400).json({ error: 'Invalid zone ID. Only zones 65 and 68 are supported.' });
    return;
  }

  const url = zoneId === 68
    ? `https://www.fflogs.com/zone/statistics/68?class=Any&dataset=50${boss ? `&boss=${boss}` : ''}`
    : `https://www.fflogs.com/zone/statistics/65?class=Any&dataset=50${boss ? `&boss=${boss}` : ''}`;

  let browser;
  let page;
  try {
    const executablePath = await chromium.executablePath();
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
    page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table', { timeout: 10000 });
    await new Promise(res => setTimeout(res, 1000));
    const jobs = await page.evaluate(() => {
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
    const filteredJobs = jobs.filter(j => j && j.job);
    const groups = groupJobs(filteredJobs);
    res.status(200).json({
      zone: zoneId,
      zoneName,
      url,
      timestamp: new Date().toISOString(),
      groups,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to scrape FFLogs data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (page) {
      try { await page.close(); } catch (e) {}
    }
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
  }
}; 