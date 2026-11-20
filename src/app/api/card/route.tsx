import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';


const S = 2; // render at 2x for a sharp image
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'import', 'from', 'export',
  'default', 'async', 'await', 'if', 'else', 'new', 'type', 'interface',
  'throw', 'try', 'catch', 'for', 'of', 'in', 'class', 'def', 'true', 'false', 'null',
]);

type Tok = { t: string; c: string };

function tokenize(code: string): Tok[] {
  const re =
    /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+\b)|(\b[A-Za-z_]\w*\b)|(\s+|.)/g;
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) out.push({ t: m[1], c: '#8b949e' });
    else if (m[2]) out.push({ t: m[2], c: '#a5d6ff' });
    else if (m[3]) out.push({ t: m[3], c: '#79c0ff' });
    else if (m[4]) out.push({ t: m[4], c: KEYWORDS.has(m[4]) ? '#ff7b72' : '#e6edf3' });
    else out.push({ t: m[5], c: '#e6edf3' });
  }
  return out;
}

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const file = (p.get('file') ?? 'snippet').slice(0, 60);
  const lines = (p.get('code') ?? '')
    .split('\n')
    .slice(0, 10)
    .map((l) => l.slice(0, 68));

  let fonts: { name: string; data: Buffer; style: 'normal'; weight: 400 }[] = [];
  try {
    const data = await readFile(
      path.join(process.cwd(), 'src/assets/JetBrainsMono-Regular.woff')
    );
    fonts = [{ name: 'JetBrains Mono', data, style: 'normal', weight: 400 }];
  } catch {
    // falls back to the default font
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1f2937, #0d1117)',
          padding: 70 * S,
          fontFamily: 'JetBrains Mono',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: '#0d1117',
            borderRadius: 16 * S,
            border: `${S}px solid #30363d`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: `${16 * S}px ${24 * S}px` }}>
            <div style={{ width: 14 * S, height: 14 * S, borderRadius: 7 * S, background: '#ff5f56', marginRight: 9 * S }} />
            <div style={{ width: 14 * S, height: 14 * S, borderRadius: 7 * S, background: '#ffbd2e', marginRight: 9 * S }} />
            <div style={{ width: 14 * S, height: 14 * S, borderRadius: 7 * S, background: '#27c93f', marginRight: 18 * S }} />
            <div style={{ display: 'flex', color: '#8b949e', fontSize: 20 * S }}>{file}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: `${6 * S}px 0` }}>
            {lines.map((l, i) => {
              const marker = l[0] === '+' || l[0] === '-' ? l[0] : ' ';
              const code = marker === ' ' ? l : l.slice(1);
              const bg =
                marker === '+' ? 'rgba(63,185,80,0.18)' : marker === '-' ? 'rgba(248,81,73,0.18)' : 'transparent';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    background: bg,
                    padding: `0 ${28 * S}px`,
                    fontSize: 21 * S,
                    lineHeight: 1.55,
                    whiteSpace: 'pre',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: 24 * S,
                      color: marker === '+' ? '#3fb950' : marker === '-' ? '#f85149' : '#484f58',
                    }}
                  >
                    {marker}
                  </div>
                  {tokenize(code).map((tk, j) => (
                    <div key={j} style={{ display: 'flex', color: tk.c, whiteSpace: 'pre' }}>
                      {tk.t}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#8b949e', fontSize: 18 * S, marginTop: 14 * S }}>
          made with DevCast
        </div>
      </div>
    ),
    { width: 1200 * S, height: 630 * S, fonts }
  );
}
