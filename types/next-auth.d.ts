/**
 * Augment Auth.js (next-auth v5) types so that `session.user.id` is available
 * on the default session object in Server Components and Server Actions.
 *
 * Docs: https://authjs.dev/getting-started/typescript
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
