import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 16,
          background: '#0D5C5A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAF7F2',
          fontFamily: 'serif',
          fontWeight: 600,
          borderRadius: 4,
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
