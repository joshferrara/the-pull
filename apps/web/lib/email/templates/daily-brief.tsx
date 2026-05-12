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
import type { Brief } from "@the-pull/schema";

export function DailyBriefEmail(props: {
  brief: Brief;
  webUrl: string;
  unsubscribeUrl: string;
}) {
  const { brief, webUrl, unsubscribeUrl } = props;
  return (
    <Html lang="en">
      <Head />
      <Preview>{brief.editor_note ?? `Edition #${brief.edition}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={masthead}>
            <Text style={mastheadKicker}>The Pull · Edition #{brief.edition}</Text>
            <Heading style={mastheadTitle}>{formatDate(brief.date)}</Heading>
            {brief.editor_note && (
              <Text style={editorNote}>{brief.editor_note}</Text>
            )}
          </Section>

          {brief.items.map((item, i) => (
            <Section key={item.id} style={itemBlock}>
              <Text style={itemMeta}>
                <span style={itemNumber}>
                  {String(i + 1).padStart(2, "0")}
                </span>{" "}
                · {item.category} · {item.importance}
              </Text>
              <Heading as="h2" style={itemTitle}>
                {item.title}
              </Heading>
              {item.summary && <Text style={summary}>{item.summary}</Text>}
              {item.commentary && (
                <Text style={commentary}>{item.commentary}</Text>
              )}
              {item.links && item.links.length > 0 && (
                <Text style={links}>
                  {item.links.map((l, idx) => (
                    <span key={l.url}>
                      {idx > 0 && " · "}
                      <Link href={l.url} style={link}>
                        {l.label}
                      </Link>
                    </span>
                  ))}
                </Text>
              )}
            </Section>
          ))}

          <Hr style={hr} />
          <Section>
            <Text style={footer}>
              Get this in your terminal:{" "}
              <code style={code}>
                curl -fsSL https://thepull.dev/install | sh
              </code>
            </Text>
            <Text style={footerSmall}>
              <Link href={webUrl} style={footerLink}>
                Open the web brief
              </Link>{" "}
              ·{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
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
  margin: "24px auto",
  padding: "24px",
  maxWidth: 640,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const masthead: React.CSSProperties = { marginBottom: 16 };
const mastheadKicker: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  color: "#7f849c",
  margin: 0,
};
const mastheadTitle: React.CSSProperties = { fontSize: 22, margin: "6px 0" };
const editorNote: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: "#1e1e2e",
  borderLeft: "3px solid #cba6f7",
  padding: "4px 12px",
  margin: "10px 0",
  fontStyle: "italic" as const,
};
const itemBlock: React.CSSProperties = {
  padding: "16px 0",
  borderBottom: "1px solid #ececf4",
};
const itemMeta: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  color: "#7f849c",
  margin: 0,
};
const itemNumber: React.CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  color: "#1e1e2e",
};
const itemTitle: React.CSSProperties = {
  fontSize: 17,
  margin: "6px 0 8px",
  color: "#11111b",
};
const summary: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: "#1e1e2e",
  margin: "6px 0",
};
const commentary: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: "#1e1e2e",
  borderLeft: "3px solid #cba6f7",
  padding: "4px 12px",
  margin: "10px 0",
  fontStyle: "italic" as const,
};
const links: React.CSSProperties = {
  fontSize: 12,
  color: "#7f849c",
  margin: "8px 0 0",
};
const link: React.CSSProperties = {
  color: "#1d4ed8",
  textDecoration: "underline",
};
const hr: React.CSSProperties = { borderColor: "#e5e7eb", margin: "16px 0" };
const footer: React.CSSProperties = {
  fontSize: 12,
  color: "#7f849c",
  margin: "8px 0",
};
const footerSmall: React.CSSProperties = {
  fontSize: 11,
  color: "#7f849c",
  margin: "4px 0",
};
const footerLink: React.CSSProperties = {
  color: "#7f849c",
  textDecoration: "underline",
};
const code: React.CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  background: "#f3f4f6",
  padding: "1px 4px",
  borderRadius: 4,
};
