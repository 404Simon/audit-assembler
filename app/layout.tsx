import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { AuditProvider } from "@/lib/audit/store"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Audit Assembler — interactive reproducibility audit",
    template: "%s · Audit Assembler",
  },
  description:
    "A guided, local-first editor for manual reproducibility reviews. Write findings in a form, get a parseable audit.md with the YAML generated for you.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "scroll-smooth antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          <AuditProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>
                  A local-first companion for the ISMB manual reproducibility
                  study. Nothing leaves your browser.
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Examples are held-out NeurIPS audits.</span>
                  <span aria-hidden="true">·</span>
                  <span>No data leaves this device.</span>
                </p>
              </div>
            </footer>
          </AuditProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
