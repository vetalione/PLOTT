"use client";

import { anonymousClient, inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [anonymousClient(), magicLinkClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession } = authClient;
