"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRightIcon, FileCheck2Icon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

const LINKS = [
  { href: "/", label: "Guide" },
  { href: "/editor", label: "Audit editor" },
  { href: "/examples", label: "Examples" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileCheck2Icon className="size-4" />
          </span>
          <span className="hidden font-heading text-sm font-semibold tracking-tight sm:inline">
            Audit Assembler
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({
                    variant: active ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "px-2.5"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <ThemeToggle />

        <Link
          href="/editor"
          className={cn(
            buttonVariants({ size: "sm" }),
            "hidden sm:inline-flex"
          )}
        >
          Open editor
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>
    </header>
  )
}
