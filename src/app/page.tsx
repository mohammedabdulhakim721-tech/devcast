'use client';

import { useState } from 'react';

type Result = {
  commit: { repo: string; shortSha: string };
  posts: { style: string; text: string }[];
  snippet: { file: string; lines: string[] };
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('x');
  const [vibe, setVibe] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform, vibe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      setResult(data);
      setTab(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const post = result?.posts[tab];
  const cardUrl = result
    ? `/api/card?file=${encodeURIComponent(result.snippet.file)}&code=${encodeURIComponent(result.snippet.lines.join('\n'))}`
    : '';

  async function copy() {
    if (!post) return;
    await navigator.clipboard.writeText(post.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const select = 'rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">DevCast</h1>
          <p className="text-zinc-400">Paste a public GitHub commit. Get posts and a code card.</p>
        </header>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/commit/abc1234"
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm"
        />

        <div className="flex gap-3 flex-wrap">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={select}>
            <option value="x">X / Bluesky</option>
            <option value="linkedin">LinkedIn</option>
            <option value="threads">Threads</option>
          </select>
          <select value={vibe} onChange={(e) => setVibe(e.target.value)} className={select}>
            <option value="casual">Casual Builder</option>
            <option value="technical">Technical Deep-Dive</option>
            <option value="witty">Witty</option>
          </select>
          <button
            onClick={generate}
            disabled={loading || !url.trim()}
            className="rounded-lg bg-emerald-500 text-black font-semibold px-5 py-2 text-sm disabled:opacity-40"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {result && post && (
          <section className="space-y-4">
            <div className="flex gap-2">
              {result.posts.map((p, i) => (
                <button
                  key={p.style}
                  onClick={() => setTab(i)}
                  className={`rounded-full px-3 py-1 text-sm border ${
                    i === tab ? 'bg-zinc-100 text-black' : 'border-zinc-700 text-zinc-300'
                  }`}
                >
                  {p.style}
                </button>
              ))}
            </div>

            <textarea
              readOnly
              value={post.text}
              rows={8}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-4 text-sm"
            />

            <div className="flex gap-3 flex-wrap">
              <button onClick={copy} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">
                {copied ? 'Copied!' : 'Copy text'}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.text)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
              >
                Post on X
              </a>
              <a href={cardUrl} download="DevCast-card.png" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">
                Download image
              </a>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt="Code card" className="w-full rounded-lg border border-zinc-800" />
          </section>
        )}
      </div>
    </main>
  );
}
