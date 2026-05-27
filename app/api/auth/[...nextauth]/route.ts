/**
 * Auth.js route handler — handles all /api/auth/* requests
 * (sign-in, sign-out, callback, session, csrf token, etc.)
 *
 * `handlers` is { GET, POST } — destructure so Next.js receives plain
 * functions, not the wrapper object (required by Next.js 16 route types).
 */
import { handlers } from "@/auth";

export const GET = handlers.GET;
export const POST = handlers.POST;
