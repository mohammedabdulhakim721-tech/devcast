import { ImageResponse } from 'next/og';

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const file = (p.get('file') ?? 'snippet').slice(0, 60);
  const lines = (p.get('code') ?? '')
    .split('\n')
    .slice(0, 10)
    .map((l) => l.slice(0, 70) || ' ');

  const color = (l: string) =>
    l.startsWith('+') ? '#3fb950' : l.startsWith('-') ? '#f85149' : '#c9d1d9';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1117',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: '#161b22',
            borderRadius: 16,
            border: '1px solid #30363d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px' }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: '#ff5f56', marginRight: 10 }} />
            <div style={{ width: 16, height: 16, borderRadius: 8, background: '#ffbd2e', marginRight: 10 }} />
            <div style={{ width: 16, height: 16, borderRadius: 8, background: '#27c93f', marginRight: 20 }} />
            <div style={{ color: '#8b949e', fontSize: 22 }}>{file}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 28px' }}>
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', color: color(l), fontSize: 24, lineHeight: 1.5, whiteSpace: 'pre' }}>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#6e7681', fontSize: 20, marginTop: 14 }}>
          made with DevCast
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
