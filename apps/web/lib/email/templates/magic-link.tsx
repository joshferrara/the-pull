import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function MagicLinkEmail(props: {
  url: string;
  code: string;
  expiresInMinutes: number;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Sign in to The Pull — link inside (expires in 15 min)</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Sign in to The Pull</Heading>
          <Text style={p}>Click below to verify this email.</Text>
          <Section style={{ textAlign: "center" as const, padding: "8px 0 24px" }}>
            <Link href={props.url} style={button}>
              Verify email
            </Link>
          </Section>
          <Text style={pSmall}>
            Or copy the code: <strong>{props.code}</strong>
          </Text>
          <Hr style={hr} />
          <Text style={pSmall}>
            This link expires in {props.expiresInMinutes} minutes. If you
            didn&apos;t request this, ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  background: "#f7f7fa",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
  color: "#11111b",
};
const container: React.CSSProperties = {
  margin: "32px auto",
  padding: "24px",
  maxWidth: 520,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const h1: React.CSSProperties = { fontSize: 20, margin: "0 0 12px" };
const p: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.5,
  color: "#1e1e2e",
};
const pSmall: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  color: "#7f849c",
};
const button: React.CSSProperties = {
  display: "inline-block",
  background: "#cba6f7",
  color: "#11111b",
  padding: "12px 18px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 600,
};
const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
};
