import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface NewsletterEmailProps {
  title: string;
  content: string;
  author?: string;
  date?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const NewsletterEmail = ({
  title,
  content,
  author = 'Newsletter Team',
  date,
  unsubscribeUrl,
  preferencesUrl,
}: NewsletterEmailProps) => {
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{title}</Heading>
            {author && (
              <Text style={meta}>
                By {author} {formattedDate && `• ${formattedDate}`}
              </Text>
            )}
          </Section>

          <Section style={content_section}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This newsletter was sent to you because you subscribed to our mailing list.
            </Text>
            <Text style={footerLinks}>
              {preferencesUrl && (
                <>
                  <Link href={preferencesUrl} style={link}>
                    Update preferences
                  </Link>
                  {' • '}
                </>
              )}
              {unsubscribeUrl && (
                <Link href={unsubscribeUrl} style={link}>
                  Unsubscribe
                </Link>
              )}
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NewsletterEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  borderBottom: '1px solid #e2e8f0',
};

const h1 = {
  color: '#1a202c',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '1.3',
};

const meta = {
  color: '#718096',
  fontSize: '14px',
  margin: '0',
};

const content_section = {
  padding: '32px 20px',
};

const footer = {
  padding: '0 20px 32px',
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  color: '#718096',
  fontSize: '12px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  color: '#718096',
  fontSize: '12px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#3182ce',
  textDecoration: 'none',
};
