"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Search, ExternalLink } from "lucide-react"
import { faqCategories, faqData, searchFAQs, getFAQsByCategory } from "@/lib/help/faq-data"

export function FAQSection() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<typeof faqData>([])

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchFAQs(searchQuery))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">
          Find answers to common questions about Full Self Publishing
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results or Categories */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          <h3 className="font-semibold">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {searchResults.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                    {faq.relatedLinks && faq.relatedLinks.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Related Links:</p>
                        <ul className="space-y-1">
                          {faq.relatedLinks.map((link, i) => (
                            <li key={i}>
                              <Button variant="link" size="sm" asChild className="h-auto p-0">
                                <a href={link.href} className="flex items-center gap-1">
                                  {link.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        <Tabs defaultValue={faqCategories[0].id} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {faqCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {faqCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Accordion type="single" collapsible className="w-full">
                {getFAQsByCategory(category.id).map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="whitespace-pre-line">{faq.answer}</p>
                        {faq.relatedLinks && faq.relatedLinks.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Related Links:</p>
                            <ul className="space-y-1">
                              {faq.relatedLinks.map((link, i) => (
                                <li key={i}>
                                  <Button variant="link" size="sm" asChild className="h-auto p-0">
                                    <a href={link.href} className="flex items-center gap-1">
                                      {link.title}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
