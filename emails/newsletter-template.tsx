import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Heading,
} from '@react-email/components';
import * as React from 'react';

interface NewsletterEmailProps {
  subject: string;
  previewText: string;
  content: {
    highlights: string[];
    details: string;
    whatsNext: string;
  };
  unsubscribeUrl: string;
  weekNumber?: number;
  year?: number;
}

export const NewsletterEmail = ({
  subject,
  previewText,
  content,
  unsubscribeUrl,
  weekNumber = new Date().getWeek(),
  year = new Date().getFullYear(),
}: NewsletterEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Dev Updates</Heading>
            <Text style={subtitle}>
              Week {weekNumber}, {year}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content_section}>
            <Heading style={h2}>📌 This Week's Highlights</Heading>
            <ul style={list}>
              {content.highlights.map((highlight, index) => (
                <li key={index} style={listItem}>
                  {highlight}
                </li>
              ))}
            </ul>

            <Hr style={hr} />

            <Heading style={h2}>📝 In Detail</Heading>
            <Text style={paragraph}>{content.details}</Text>

            <Hr style={hr} />

            <Heading style={h2}>🚀 What's Next</Heading>
            <Text style={paragraph}>{content.whatsNext}</Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/blog`}
            >
              Read Full Updates on Blog
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you subscribed to our development updates.
            </Text>
            <Link style={link} href={unsubscribeUrl}>
              Unsubscribe
            </Link>
            <Text style={footerText}>
              © {year} - Powered by GitHub Activity & AI
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Add getWeek extension to Date
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const header = {
  padding: '24px 0',
  textAlign: 'center' as const,
};

const h1 = {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  color: '#1a1a1a',
};

const subtitle = {
  fontSize: '16px',
  color: '#6b7280',
  margin: '8px 0 0',
};

const h2 = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '24px 0 16px',
  color: '#1a1a1a',
};

const content_section = {
  padding: '0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '16px 0',
};

const list = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  paddingLeft: '20px',
  margin: '16px 0',
};

const listItem = {
  margin: '8px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const buttonContainer = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '4px 0',
};

const link = {
  color: '#2563eb',
  fontSize: '14px',
  textDecoration: 'underline',
};

export default NewsletterEmail;