import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EverLens Cinematic Palette
        ink: {
          DEFAULT: '#0F1413',
          2: '#171D1C',
          3: '#1D2422',
          charcoal: '#1F2A32',
        },

        cream: {
          DEFAULT: '#EAE8DA',
          50: '#FAF9F4',
          100: '#EAE8DA',
          200: '#DFDCCB',
          300: '#D2CEB9',
          deep: '#DFDCCB',
        },
        teal: {
          DEFAULT: '#43B19F',
          glow: 'rgba(67, 177, 159, 0.45)',
          50: '#F0F9FA',
          100: '#D6F0F2',
          200: '#AFE1E5',
          300: '#7ECCD3',
          400: '#52C2B1',
          500: '#43B19F',
          600: '#349B8A',
          700: '#267D6F',
          800: '#1B5B51',
          900: '#123D37',
        },
        gray: {
          DEFAULT: '#7A7D7E',
          muted: '#7A7D7E',
        },
        salmon: {
          DEFAULT: '#C56852',
        },
        amber: {
          DEFAULT: '#E5A93C',
          400: '#E5A93C',
          500: '#D99828',
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", 'Georgia', 'serif'],
        display: ["'Playfair Display'", 'Georgia', 'serif'],
        sans: ["'Manrope'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ["'Manrope'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        script: ["'Yellowtail'", "'Beau Rivage'", 'cursive'],
      },

      boxShadow: {
        soft: '0 4px 20px -2px rgba(17, 68, 77, 0.06)',
        elevated: '0 12px 32px -4px rgba(17, 68, 77, 0.1)',
        modal: '0 24px 64px -12px rgba(7, 32, 37, 0.35)',
      },
      borderRadius: {
        none: '0px',
        xs: '8px',
        sm: '8px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '14px',
        '2xl': '14px',
        '3xl': '20px',
        full: '9999px',
        button: '8px',
        card: '14px',
        modal: '14px',
        hero: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
