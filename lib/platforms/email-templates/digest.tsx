import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DigestItem {
  title: string;
  excerpt: string;
  url: string;
  date?: string;
}

interface DigestEmailProps {
  title: string;
  introduction?: string;
  items: DigestItem[];
  unsubscribeUrl?: string;
}

export const DigestEmail = ({
  title,
  introduction,
  items,
  unsubscribeUrl,
}: DigestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          {introduction && <Text style={intro}>{introduction}</Text>}

          <Section style={content}>
            {items.map((item, index) => (
              <div key={index}>
                <Heading as="h2" style={h2}>
                  <Link href={item.url} style={itemLink}>{item.title}</Link>
                </Heading>
                <Text style={excerpt}>{item.excerpt}</Text>
                {item.date && <Text style={date}>{item.date}</Text>}
                {index < items.length - 1 && <Hr style={hr} />}
              </div>
            ))}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This digest contains {items.length} item{items.length !== 1 ? 's' : ''}.
            </Text>
            {unsubscribeUrl && (
              <Text style={footerText}>
                <Link href={unsubscribeUrl} style={link}>Unsubscribe</Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DigestEmail;

const main = {
  backgroundColor: '#fafafa',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 32px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a202c',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const intro = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px',
};

const content = {
  padding: '0',
};

const h2 = {
  color: '#2d3748',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const itemLink = {
  color: '#3182ce',
  textDecoration: 'none',
};

const excerpt = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const date = {
  color: '#718096',
  fontSize: '13px',
  margin: '0 0 16px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '24px 0',
};

const footer = {
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
  marginTop: '32px',
};

const footerText = {
  color: '#718096',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const link = {
  color: '#3182ce',
  textDecoration: 'none',
};
