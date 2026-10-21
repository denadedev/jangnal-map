import { createSlackActionsHandler } from "../../../../lib/slack-actions-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createSlackActionsHandler();
