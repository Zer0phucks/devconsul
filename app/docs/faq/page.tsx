import { Metadata } from "next"
import { FAQSection } from "@/components/help/faq-section"

export const metadata: Metadata = {
  title: "FAQ | Full Self Publishing",
  description: "Frequently asked questions about Full Self Publishing",
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <FAQSection />
    </div>
  )
}
