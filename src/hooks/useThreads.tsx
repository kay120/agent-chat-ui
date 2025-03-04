import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Client, Thread } from "@langchain/langgraph-sdk";
import { useQueryParam, StringParam } from "use-query-params";

function createClient(apiUrl: string, apiKey: string | undefined) {
  return new Client({
    apiKey,
    apiUrl,
  });
}

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  // Assume if the ID is a UUID, it's an assistant ID. Otherwise, it's a graph ID.
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function useThreads() {
  const [apiUrl] = useQueryParam("apiUrl", StringParam);
  const [assistantId] = useQueryParam("assistantId", StringParam);

  const getThreads = async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];

    const client = createClient(apiUrl, getApiKey() ?? undefined);

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(assistantId),
      },
      limit: 100,
    });

    return threads;
  };

  return {
    getThreads,
  };
}
