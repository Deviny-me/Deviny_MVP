import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8ec',
          100: '#faefc8',
          200: '#f5df92',
          300: '#eecb54',
          400: '#e5b62e',
          500: '#D4A843',
          600: '#b8922e',
          700: '#946f22',
          800: '#7a5a21',
          900: '#654a1f',
        },
        user: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffc',
          300: '#7cc4fa',
          400: '#36a7f5',
          500: '#0c8de6',
          600: '#0070c4',
          700: '#01599f',
          800: '#064b83',
          900: '#0b3f6d',
        },
        trainer: {
          50: '#fff8f1',
          100: '#ffedd5',
          200: '#fdd8a8',
          300: '#fbb970',
          400: '#f99538',
          500: '#f07915',
          600: '#d4600b',
          700: '#b04a0b',
          800: '#8e3b10',
          900: '#743310',
        },
        nutritionist: {
          50: '#f0fdf6',
          100: '#ddfbe8',
          200: '#bdf5d3',
          300: '#8aebb2',
          400: '#50d889',
          500: '#28bf68',
          600: '#1c9e52',
          700: '#1a7c43',
          800: '#196239',
          900: '#175130',
        },
      },
    },
  },
  plugins: [],
}
export default config
