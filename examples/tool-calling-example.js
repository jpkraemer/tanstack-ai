#!/usr/bin/env node

/**
 * TanStack AI - Tool Calling Example
 *
 * This demonstrates how to use function calling with streaming
 */

import { AI } from "../packages/ai/dist/index.js";
import { OpenAIAdapter } from "../packages/ai-openai/dist/index.js";

// Define a simple calculator tool
const tools = [
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression like '2 + 2' or '10 * 5'",
          },
        },
        required: ["expression"],
      },
    },
  },
];

// Simple calculator implementation
async function calculate(expression) {
  try {
    // eslint-disable-next-line no-eval
    const result = eval(expression.replace(/[^0-9+\-*/().\s]/g, ""));
    return JSON.stringify({ result, expression });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

async function demo() {
  console.log("🛠️  TanStack AI - Tool Calling Demo\n");

  const ai = new AI(
    new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || "demo-key",
    })
  );

  const messages = [
    { role: "user", content: "What is 847 multiplied by 392?" },
  ];

  console.log("📝 User: What is 847 multiplied by 392?\n");

  try {
    let iteration = 0;
    const maxIterations = 2;

    while (iteration < maxIterations) {
      iteration++;

      const toolCalls = [];
      const toolCallsMap = new Map();
      let content = "";

      console.log("🔄 Streaming response...\n");

      for await (const chunk of ai.streamChat({
        model: "gpt-3.5-turbo",
        messages,
        tools,
        toolChoice: "auto",
      })) {
        if (chunk.type === "content") {
          content = chunk.content;
          process.stdout.write(chunk.delta);
        } else if (chunk.type === "tool_call") {
          const existing = toolCallsMap.get(chunk.index) || {
            id: chunk.toolCall.id,
            name: "",
            args: "",
          };

          if (chunk.toolCall.function.name) {
            existing.name = chunk.toolCall.function.name;
          }
          existing.args += chunk.toolCall.function.arguments;
          toolCallsMap.set(chunk.index, existing);
        } else if (chunk.type === "done") {
          if (chunk.finishReason === "tool_calls") {
            console.log("\n");
            toolCallsMap.forEach((call) => {
              toolCalls.push({
                id: call.id,
                type: "function",
                function: {
                  name: call.name,
                  arguments: call.args,
                },
              });
            });
          }

          if (chunk.usage) {
            console.log(`\n[Tokens used: ${chunk.usage.totalTokens}]\n`);
          }
        }
      }

      if (toolCalls.length > 0) {
        // Add assistant message with tool calls
        messages.push({
          role: "assistant",
          content: content || null,
          toolCalls,
        });

        console.log(`🔧 AI wants to call ${toolCalls.length} tool(s):\n`);

        // Execute tools
        for (const call of toolCalls) {
          console.log(`  → ${call.function.name}(${call.function.arguments})`);

          const result = await calculate(
            JSON.parse(call.function.arguments).expression
          );
          console.log(`  ✓ Result: ${result}\n`);

          // Add tool result to messages
          messages.push({
            role: "tool",
            content: result,
            toolCallId: call.id,
            name: call.function.name,
          });
        }

        // Continue to get final response
        console.log("🔄 Getting final response...\n");
      } else {
        console.log("\n✅ Conversation complete!\n");
        break;
      }
    }
  } catch (error) {
    console.error("❌ Error (expected without API key):", error.message);
  }

  console.log("\n📚 What happened:");
  console.log("  1. User asked a math question");
  console.log("  2. AI decided to use the 'calculate' tool");
  console.log("  3. Tool was executed with the expression");
  console.log("  4. Result was sent back to AI");
  console.log("  5. AI provided the final answer to user");

  console.log("\n🎯 Try it yourself:");
  console.log("  pnpm cli tools --provider openai");
}

demo();
