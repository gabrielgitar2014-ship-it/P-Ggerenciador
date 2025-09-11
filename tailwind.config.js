/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        // Sua animação existente (mantida)
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        // ✅ ANIMAÇÕES ADICIONADAS PARA O NOVO MODAL
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        // Sua animação existente (mantida)
        'fade-in-down': 'fade-in-down 0.2s ease-out',
        // ✅ ANIMAÇÕES ADICIONADAS PARA O NOVO MODAL
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
};