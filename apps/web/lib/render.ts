import type { Brief, BriefResponse } from "@the-pull/schema";
import { toPreview } from "@the-pull/schema";
import {
  renderBriefMarkdown,
  renderBriefsRss,
} from "@the-pull/shared/markdown";

export function shapeBrief(brief: Brief, hasToken: boolean): BriefResponse {
  return hasToken ? brief : toPreview(brief);
}

export function brieftoMarkdown(brief: Brief): string {
  return renderBriefMarkdown(brief);
}

export function briefsToRss(briefs: Brief[], opts: {
  feedUrl: string;
  siteUrl: string;
}): string {
  return renderBriefsRss({
    briefs,
    feedUrl: opts.feedUrl,
    siteUrl: opts.siteUrl,
  });
}
