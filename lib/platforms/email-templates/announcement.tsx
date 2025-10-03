import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AnnouncementEmailProps {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

export const AnnouncementEmail = ({
  title,
  content,
  ctaText,
  ctaUrl,
  unsubscribeUrl,
}: AnnouncementEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={h1}>{title}</Heading>
            <div dangerouslySetInnerHTML={{ __html: content }} style={contentStyle} />
            {ctaText && ctaUrl && (
              <Button style={button} href={ctaUrl}>
                {ctaText}
              </Button>
            )}
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              {unsubscribeUrl && (
                <a href={unsubscribeUrl} style={link}>Unsubscribe</a>
              )}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AnnouncementEmail;

const main = {
  backgroundColor: '#f0f4f8',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const box = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '48px 32px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const h1 = {
  color: '#1a202c',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const contentStyle = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px',
};

const button = {
  backgroundColor: '#3182ce',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '14px 24px',
  margin: '0 auto',
  width: 'fit-content',
};

const footer = {
  padding: '24px 0 0',
};

const footerText = {
  color: '#718096',
  fontSize: '12px',
  textAlign: 'center' as const,
};

const link = {
  color: '#718096',
  textDecoration: 'underline',
};
