// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Add .ts and .tsx for TypeScript
    "./public/index.html", // Include index.html if classes are present there
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
