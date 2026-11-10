import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { loadCatalog } from "../../../lib/catalog/load";
import { createMcpServer } from "../../../lib/mcp-server";

export const dynamic = "force-dynamic";

// Claude·ChatGPT 같은 AI가 장날 데이터를 읽는 공개 MCP 서버(Streamable HTTP). 읽기 전용이라 세션 없이 요청마다 새로 연다.
async function handle(request: Request): Promise<Response> {
  const server = createMcpServer(loadCatalog);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
