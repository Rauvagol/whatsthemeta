import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GROUPS: Record<string, string[]> = {
  melee: ['viper', 'monk', 'dragoon', 'samurai', 'ninja'],
  caster: ['red mage', 'black mage', 'pictomancer', 'summoner'],
  ranged: ['dancer', 'machinist', 'bard'],
  tank: ['warrior', 'gunbreaker', 'dark knight', 'paladin'],
  healer: ['astrologian', 'scholar', 'white mage', 'sage'],
};

function groupJobs(jobs: { jobName: string; score: string; count: string }[]) {
  const result: Record<string, { job: string; score: string; count: string }[]> = {
    melee: [],
    caster: [],
    ranged: [],
    tank: [],
    healer: [],
  };
  for (const job of jobs) {
    const jobName = job.jobName.trim().toLowerCase();
    for (const [group, names] of Object.entries(GROUPS)) {
      if (names.includes(jobName)) {
        result[group].push({
          job: job.jobName,
          score: job.score,
          count: job.count,
        });
        break;
      }
    }
  }
  return result;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    // No id param: return the whole table
    const { data, error } = await supabase.from('api_data').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('api_data')
    .select('data')
    .eq('id', Number(id))
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No data found' }, { status: 404 });
  }

  // Parse the data field
  const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
  const jobs = parsed.data?.tableRows || [];
  const groups = groupJobs(jobs);

  return NextResponse.json({
    zoneName: parsed.data?.zoneName || '',
    bossName: parsed.data?.bossName || '',
    id: Number(id),
    timestamp: parsed.data?.timestamp || '',
    groups,
  });
} 