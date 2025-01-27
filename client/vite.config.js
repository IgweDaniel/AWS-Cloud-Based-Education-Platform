import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "window", // Inject the global object
  },
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import { global } from "global";

// export default defineConfig({
//   plugins: [react()],
//   define: {
//     global: "window", // Inject the global object
//   },
// });
