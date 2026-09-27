import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 88,
          background: '#0D5C5A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAF7F2',
          fontFamily: 'serif',
          fontWeight: 600,
          borderRadius: 36,
          letterSpacing: '-0.02em',
        }}
      >
        EL
      </div>
    ),
    {
      ...size,
    }
  );
}
