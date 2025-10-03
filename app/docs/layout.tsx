import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Link>
          </Button>
          <div className="ml-4">
            <Link href="/docs" className="font-semibold">
              Documentation
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
