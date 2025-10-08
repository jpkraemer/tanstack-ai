import type { Tool } from "@tanstack/ai";

/**
 * Tool Definitions
 */
export const AVAILABLE_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The temperature unit to use",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description:
        "Perform a mathematical calculation. Supports basic arithmetic operations.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description:
              "The mathematical expression to evaluate, e.g. '2 + 2' or '10 * 5'",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search",
      description: "Search for information on a topic",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (1-10)",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "Get the current date and time",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "The timezone to use, e.g. 'America/New_York' or 'UTC'",
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Tool Implementations
 */

export async function executeGetWeather(args: {
  location: string;
  unit?: string;
}): Promise<string> {
  // Mock implementation - in a real app, this would call a weather API
  const { location, unit = "fahrenheit" } = args;

  const temps = {
    fahrenheit: Math.floor(Math.random() * 40) + 50, // 50-90°F
    celsius: Math.floor(Math.random() * 25) + 10, // 10-35°C
  };

  const conditions = ["sunny", "cloudy", "rainy", "partly cloudy", "clear"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  const temp = temps[unit as keyof typeof temps] || temps.fahrenheit;

  return JSON.stringify({
    location,
    temperature: temp,
    unit,
    condition,
    humidity: Math.floor(Math.random() * 50) + 30,
    wind_speed: Math.floor(Math.random() * 20) + 5,
  });
}

export async function executeCalculate(args: {
  expression: string;
}): Promise<string> {
  try {
    const { expression } = args;

    // Simple safe evaluation - only allows basic math
    // In production, use a proper math parser library
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");

    if (sanitized !== expression) {
      throw new Error("Invalid characters in expression");
    }

    // eslint-disable-next-line no-eval
    const result = eval(sanitized);

    return JSON.stringify({
      expression,
      result,
      formatted: `${expression} = ${result}`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: true,
      message: `Failed to calculate: ${error.message}`,
    });
  }
}

export async function executeSearch(args: {
  query: string;
  max_results?: number;
}): Promise<string> {
  // Mock implementation - in a real app, this would call a search API
  const { query, max_results = 3 } = args;

  const mockResults = [
    {
      title: `Understanding ${query}`,
      snippet: `Comprehensive guide to ${query} with examples and best practices.`,
      url: `https://example.com/${query.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      title: `${query} - Complete Tutorial`,
      snippet: `Learn everything about ${query} from basics to advanced concepts.`,
      url: `https://tutorial.com/${query.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      title: `Top 10 ${query} Tips`,
      snippet: `Expert tips and tricks for working with ${query}.`,
      url: `https://tips.com/${query.toLowerCase().replace(/\s+/g, "-")}`,
    },
  ];

  return JSON.stringify({
    query,
    results: mockResults.slice(0, max_results),
    total_found: mockResults.length,
  });
}

export async function executeGetCurrentTime(args: {
  timezone?: string;
}): Promise<string> {
  const { timezone = "UTC" } = args;

  try {
    const now = new Date();
    const formatted =
      timezone === "UTC"
        ? now.toUTCString()
        : now.toLocaleString("en-US", { timeZone: timezone });

    return JSON.stringify({
      timezone,
      datetime: formatted,
      timestamp: now.getTime(),
      iso: now.toISOString(),
    });
  } catch (error: any) {
    return JSON.stringify({
      error: true,
      message: `Invalid timezone: ${timezone}`,
    });
  }
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  argsJson: string
): Promise<string> {
  try {
    const args = JSON.parse(argsJson);

    switch (toolName) {
      case "get_weather":
        return await executeGetWeather(args);
      case "calculate":
        return await executeCalculate(args);
      case "search":
        return await executeSearch(args);
      case "get_current_time":
        return await executeGetCurrentTime(args);
      default:
        return JSON.stringify({
          error: true,
          message: `Unknown tool: ${toolName}`,
        });
    }
  } catch (error: any) {
    return JSON.stringify({
      error: true,
      message: `Tool execution failed: ${error.message}`,
    });
  }
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): Tool | undefined {
  return AVAILABLE_TOOLS.find((t) => t.function.name === name);
}

/**
 * List all available tools
 */
export function listTools(): string {
  return AVAILABLE_TOOLS.map(
    (t) => `- ${t.function.name}: ${t.function.description}`
  ).join("\n");
}
