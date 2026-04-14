import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import ScrollTop from "@/components/ScrollTop"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
          {children}
          <ScrollTop />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}