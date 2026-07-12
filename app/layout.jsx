import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/context/AuthContext"
import ScrollTop from "@/components/ScrollTop"

export const metadata = {
  title: "Greenfield Academy",
  description: "Greenfield Academy — Shaping futures since 1998",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("theme")
                if (theme === "dark") {
                  document.documentElement.classList.add("dark")
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "!text-sm !rounded-lg !px-4 !py-3 !shadow-lg",
              success: {
                className: "!bg-green-700 !text-white",
                iconTheme: {
                  primary: "#fff",
                  secondary: "#15803d",
                },
              },
              error: {
                className: "!bg-red-700 !text-white",
                iconTheme: {
                  primary: "#fff",
                  secondary: "#b91c1c",
                },
              },
            }}
          />
          {children}
          <ScrollTop />
        </AuthProvider>
      </body>
    </html>
  )
}