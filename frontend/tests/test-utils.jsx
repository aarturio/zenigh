import { render } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

// Custom render function that wraps components with ChakraProvider
export function renderWithChakra(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    ),
    ...options,
  });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
