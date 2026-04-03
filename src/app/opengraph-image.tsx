import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MarketMind - AI Business Research';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 64 }}>💡</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#fff' }}>MarketMind</div>
        </div>
        <div style={{ fontSize: 28, color: '#f59e0b', marginBottom: 16, fontWeight: 600 }}>
          AI-Powered Business Idea Research
        </div>
        <div style={{ fontSize: 20, color: '#a3a3a3', maxWidth: 600, textAlign: 'center' }}>
          Turn any business idea into actionable market research with AI-generated frameworks, SWOT analysis, and competitive intelligence.
        </div>
      </div>
    ),
    { ...size }
  );
}
