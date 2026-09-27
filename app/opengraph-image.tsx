import { ImageResponse } from 'next/og';

export const alt = 'EverLens Weddings | Archival Wedding Photography & Cinematography';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
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
          backgroundColor: '#FAF7F2',
          padding: '44px',
          boxSizing: 'border-box',
        }}
      >
        {/* Editorial Frame */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(26, 26, 26, 0.15)',
            padding: '52px 60px',
            boxSizing: 'border-box',
            backgroundColor: '#FAF7F2',
          }}
        >
          {/* Top Label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#7C9082',
                fontWeight: 600,
                fontFamily: 'sans-serif',
              }}
            >
              Archival Wedding Studio • Carthage & Worldwide
            </div>
          </div>

          {/* Center Brand Lockup */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              margin: '20px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'serif',
                  fontSize: 88,
                  fontWeight: 600,
                  color: '#0D5C5A',
                  letterSpacing: '0.02em',
                }}
              >
                EverLens
              </div>
              <div
                style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: 76,
                  color: '#2AA88F',
                }}
              >
                Weddings
              </div>
            </div>

            {/* Terracotta Accent Line */}
            <div
              style={{
                width: '64px',
                height: '2px',
                backgroundColor: '#C46D4E',
                margin: '20px 0',
              }}
            />

            <div
              style={{
                fontSize: 24,
                color: '#1A1A1A',
                fontFamily: 'sans-serif',
                fontWeight: 500,
                letterSpacing: '0.03em',
                maxWidth: '750px',
                lineHeight: 1.4,
              }}
            >
              Archival Wedding Photography & Cinematography
            </div>

            <div
              style={{
                fontSize: 16,
                color: '#666666',
                fontFamily: 'sans-serif',
                marginTop: '12px',
                letterSpacing: '0.02em',
              }}
            >
              Documented like art. Preserved for generations.
            </div>
          </div>

          {/* Bottom Quiet Footer */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(26, 26, 26, 0.12)',
              paddingTop: '18px',
              fontSize: 14,
              color: '#666666',
              fontFamily: 'sans-serif',
            }}
          >
            <div>Carthage • Sidi Bou Said • Destination Commissions</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0D5C5A', fontWeight: 600 }}>
              everlensweddings.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
