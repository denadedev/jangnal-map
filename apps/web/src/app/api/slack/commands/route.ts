import { createSlackCommandsHandler } from "../../../../lib/slack-commands-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createSlackCommandsHandler();
