/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_webhook from "../api/webhook.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as courses from "../courses.js";
import type * as credits from "../credits.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as passwordReset from "../passwordReset.js";
import type * as progress from "../progress.js";
import type * as resendOTP from "../resendOTP.js";
import type * as resendPasswordOTP from "../resendPasswordOTP.js";
import type * as router from "../router.js";
import type * as students from "../students.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "api/webhook": typeof api_webhook;
  auth: typeof auth;
  conversations: typeof conversations;
  courses: typeof courses;
  credits: typeof credits;
  http: typeof http;
  lessons: typeof lessons;
  passwordReset: typeof passwordReset;
  progress: typeof progress;
  resendOTP: typeof resendOTP;
  resendPasswordOTP: typeof resendPasswordOTP;
  router: typeof router;
  students: typeof students;
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
