/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as auth from "../auth.js";
import type * as bookmarks from "../bookmarks.js";
import type * as briefs from "../briefs.js";
import type * as candidates from "../candidates.js";
import type * as crons from "../crons.js";
import type * as crons_actions from "../crons_actions.js";
import type * as email from "../email.js";
import type * as events from "../events.js";
import type * as prompts_v1 from "../prompts/v1.js";
import type * as publish from "../publish.js";
import type * as shared_email_payload from "../shared/email_payload.js";
import type * as stats from "../stats.js";
import type * as tokens from "../tokens.js";
import type * as twitter_auth from "../twitter_auth.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  auth: typeof auth;
  bookmarks: typeof bookmarks;
  briefs: typeof briefs;
  candidates: typeof candidates;
  crons: typeof crons;
  crons_actions: typeof crons_actions;
  email: typeof email;
  events: typeof events;
  "prompts/v1": typeof prompts_v1;
  publish: typeof publish;
  "shared/email_payload": typeof shared_email_payload;
  stats: typeof stats;
  tokens: typeof tokens;
  twitter_auth: typeof twitter_auth;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
