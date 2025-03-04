import { AIMessage } from "@langchain/langgraph-sdk";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-4">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, any>;
        if (!tc.args || Object.keys(args).length === 0) return null;

        return (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{tc.name}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {Object.entries(args).map(([key, value], argIdx) => (
                  <tr key={argIdx}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {isComplexValue(value) ? (
                        <code className="bg-gray-50 rounded px-2 py-1 font-mono text-sm">
                          {JSON.stringify(value, null, 2)}
                        </code>
                      ) : (
                        String(value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
