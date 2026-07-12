import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { store } from "../store"
import { queryClient } from "../lib/queryClient"
import { ThemeProvider } from "./ThemeProvider"
import { AuthProvider } from "./AuthProvider"
import { Toaster } from "sonner"

export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="assetflow-ui-theme">
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}