import { NextRequest, NextResponse } from 'next/server';
import { fetchCleanedCommit } from '@/lib/github';
import { generateContent, Platform, Vibe } from '@/lib/gemini';
import { allow } from '@/lib/rateLimit';

const PLATFORMS: Platform[] = ['x', 'linkedin', 'threads'];
const VIBES: Vibe[] = ['casual', 'technical', 'witty'];

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!allow(ip)) {
    return NextResponse.json(
      { error: 'Limit reached: 10 generations per hour. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const { url, platform, vibe } = await req.json();
    if (!PLATFORMS.includes(platform) || !VIBES.includes(vibe)) {
      return NextResponse.json({ error: 'Invalid platform or vibe.' }, { status: 400 });
    }

    const commit = await fetchCleanedCommit(String(url));
    const content = await generateContent(commit, platform, vibe);

    const posts = content.posts.map((p) => ({
      style: p.style,
      text: `${p.text.trim()}\n\n${String(url).trim()}`,
    }));

    return NextResponse.json({
      commit: { repo: `${commit.owner}/${commit.repo}`, shortSha: commit.shortSha },
      posts,
      snippet: content.snippet,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
