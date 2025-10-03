import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PlainEmailProps {
  content: string;
  unsubscribeUrl?: string;
}

export const PlainEmail = ({
  content,
  unsubscribeUrl,
}: PlainEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{content.substring(0, 100)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>
          {unsubscribeUrl && (
            <Section style={footer}>
              <Text style={footerText}>
                <Link href={unsubscribeUrl} style={link}>Unsubscribe</Link>
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
};

export default PlainEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const contentSection = {
  color: '#1a202c',
  fontSize: '16px',
  lineHeight: '1.6',
};

const footer = {
  borderTop: '1px solid #e2e8f0',
  marginTop: '32px',
  paddingTop: '16px',
};

const footerText = {
  color: '#718096',
  fontSize: '12px',
  textAlign: 'center' as const,
};

const link = {
  color: '#3182ce',
  textDecoration: 'none',
};
