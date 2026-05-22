import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        gray: {
          ...colors.gray,
          DEFAULT: "#8B8D98",
          light: "#D8D9E0",
          dark: "#2C2D33",
        },
        "primary-text": "#1E1F24",
        "secondary-text": "#62636C",
        "tertiary-text": "#80828D",
        "dark-gray": "#2C2D33",
        "light-gray": "#D8D9E0",
        "gray-light": "#D8D9E0",
        "gray-dark": "#2C2D33",
        "teal-dark": "#0F766E",
        "teal-light": "#E6FFFB",
        green: "#1B3D1F",
        "green-light": "#E6F8E7",
        red: "#63192B",
        "red-light": "#FEEAEC",
        orange: "#483B1C",
        "orange-light": "#FFF5DA",
        blue: "#13296F",
        "blue-light": "#F6F9FF",
        error: "#E53838",
      },
    },
  },
  plugins: [],
};

