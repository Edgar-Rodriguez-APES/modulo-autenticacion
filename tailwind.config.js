module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        secondary: {
          500: '#64748b'
        },
        success: {
          600: '#059669'
        },
        danger: {
          600: '#dc2626'
        },
        warning: {
          600: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'draw-check': 'drawCheck 0.5s ease-out 0.2s both',
        'draw-path': 'drawPath 0.5s ease-out 0.2s both',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'confetti-fall': 'confettiFall 3s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        drawCheck: {
          '0%': { strokeDasharray: '0 50', strokeDashoffset: '0' },
          '100%': { strokeDasharray: '50 50', strokeDashoffset: '0' }
        },
        drawPath: {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: '100 100' }
        },
        fadeInUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        confettiFall: {
          '0%': { 
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0'
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}