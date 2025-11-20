import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand colors
        brand: {
          teal: { value: "#1bf2d9" },
          tealDark: { value: "#0d9488" },
          tealLight: { value: "#5eead4" },
        },

        // Background colors
        bg: {
          primary: { value: "#1e1e1e" }, // VS Code sidebar gray
          overlay: { value: "rgba(0, 0, 0, 0.8)" },
        },

        // Text colors
        text: {
          primary: { value: "#ffffff" },
          secondary: { value: "rgba(255, 255, 255, 0.7)" },
          tertiary: { value: "rgba(255, 255, 255, 0.6)" },
          muted: { value: "rgba(255, 255, 255, 0.5)" },
          disabled: { value: "rgba(255, 255, 255, 0.4)" },
          subtle: { value: "rgba(255, 255, 255, 0.1)" },
        },

        // Status colors
        status: {
          error: { value: "#ef4444" },
        },

        // Opacity variations for brand colors
        teal: {
          5: { value: "rgba(27, 242, 217, 0.05)" },
          10: { value: "rgba(27, 242, 217, 0.1)" },
          20: { value: "rgba(27, 242, 217, 0.2)" },
          30: { value: "rgba(27, 242, 217, 0.3)" },
          40: { value: "rgba(27, 242, 217, 0.4)" },
          50: { value: "rgba(27, 242, 217, 0.5)" },
          60: { value: "rgba(27, 242, 217, 0.6)" },
          70: { value: "rgba(27, 242, 217, 0.7)" },
          solid: { value: "#1bf2d9" },
          dark: { value: "#0d9488" },
        },

        // Error opacity variations
        error: {
          10: { value: "rgba(239, 68, 68, 0.1)" },
          30: { value: "rgba(239, 68, 68, 0.3)" },
          solid: { value: "#ef4444" },
        },
      },

      fonts: {
        body: {
          value:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        },
      },

      radii: {
        card: { value: "0.5rem" },
        input: { value: "0.375rem" },
      },
    },

    semanticTokens: {
      colors: {
        // Semantic color mappings for easy usage
        primary: { value: "{colors.brand.teal}" },
        "primary.hover": { value: "{colors.brand.tealDark}" },
        "primary.light": { value: "{colors.brand.tealLight}" },

        bg: { value: "{colors.bg.primary}" },
        "bg.overlay": { value: "{colors.bg.overlay}" },

        fg: { value: "{colors.text.primary}" },
        "fg.secondary": { value: "{colors.text.secondary}" },
        "fg.tertiary": { value: "{colors.text.tertiary}" },
        "fg.muted": { value: "{colors.text.muted}" },

        border: { value: "{colors.text.disabled}" },
        "border.primary": { value: "{colors.teal.30}" },
        "border.hover": { value: "{colors.teal.solid}" },
      },
    },
  },

  globalCss: {
    "html, body": {
      bg: "bg.primary",
      color: "fg",
      margin: 0,
      padding: 0,
    },
    body: {
      fontFamily: "body",
      lineHeight: 1.5,
      fontWeight: 400,
      colorScheme: "dark",
      fontSynthesis: "none",
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
  },
});

export const system = createSystem(defaultConfig, config);
