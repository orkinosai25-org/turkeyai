/**
 * TurkiyAI Holidays - Tailwind CSS Configuration
 * 
 * Mediterranean-inspired design system for AI-powered Turkish travel platform
 * Powered by OrkinosAI
 * 
 * This configuration extends Tailwind with TurkiyAI Holidays brand tokens.
 * Usage: Import this config in your tailwind.config.js
 */

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Trust & Identity
        'aegean-blue': '#1F6FAF',
        'azure-turquoise': '#2FA4A9',
        
        // Secondary Colors - Emotional Warmth
        'soft-coral': '#F2A38A',
        'blush-pink': '#F4D4D8',
        'sunset-rose': '#E89BA5',
        
        // Nature Colors
        'olive-green': '#6F7F4C',
        'sage-green': '#A8B7A0',
        
        // Accent Colors
        'bougainvillea-pink': '#C93A6A',
        'terracotta-clay': '#C56A3A',
        'warm-sand': '#E6D3B1',
        'orange-blossom': '#F4C430',
        
        // Base Colors
        'limestone-white': '#F8F9F7',
        'soft-beige': '#F5F1E8',
        
        // Neutral Colors - Warm Slate Scale
        'warm-slate': {
          50: '#FAF9F8',
          100: '#F7F5F3',
          200: '#E8E4DF',
          300: '#D4CEC5',
          400: '#A39A8E',
          500: '#7A7267',
          600: '#5C5550',
          700: '#423E3A',
          800: '#2D2926',
          900: '#1F1D1B',
        },
        
        // Semantic Colors
        success: {
          DEFAULT: '#4A9B6F',
          light: '#E8F5EE',
        },
        warning: {
          DEFAULT: '#D89E3F',
          light: '#FFF4E5',
        },
        error: {
          DEFAULT: '#D4594A',
          light: '#FCEEED',
        },
        info: {
          DEFAULT: '#2FA4A9',
          light: '#E8F7F8',
        },
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
      },
      
      spacing: {
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px
        '32': '8rem',     // 128px
        '40': '10rem',    // 160px
        '48': '12rem',    // 192px
        '56': '14rem',    // 224px
        '64': '16rem',    // 256px
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',    // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem',    // 12px
        'lg': '1rem',       // 16px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        'full': '9999px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(42, 38, 35, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(42, 38, 35, 0.1), 0 1px 2px 0 rgba(42, 38, 35, 0.06)',
        'md': '0 4px 6px -1px rgba(42, 38, 35, 0.1), 0 2px 4px -1px rgba(42, 38, 35, 0.06)',
        'lg': '0 10px 15px -3px rgba(42, 38, 35, 0.1), 0 4px 6px -2px rgba(42, 38, 35, 0.05)',
        'xl': '0 20px 25px -5px rgba(42, 38, 35, 0.1), 0 10px 10px -5px rgba(42, 38, 35, 0.04)',
        '2xl': '0 25px 50px -12px rgba(42, 38, 35, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(42, 38, 35, 0.06)',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      
      transitionTimingFunction: {
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Custom gradients for Mediterranean feel
      backgroundImage: {
        'aegean-gradient': 'linear-gradient(135deg, #1F6FAF 0%, #2FA4A9 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #F2A38A 0%, #E89BA5 100%)',
        'sand-gradient': 'linear-gradient(180deg, #F8F9F7 0%, #E6D3B1 100%)',
      },
      
      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here
  ],
}
