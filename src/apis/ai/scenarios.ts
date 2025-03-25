import { CMSDialogueTheme } from "../../db/cms/cms-types";
import openai from "./openai";

export async function sendScenarioMessage(
    context: { content: string; role: "user" | "assistant" }[],
    scenario: CMSDialogueTheme,
    language: string,
    useReasoning: boolean = false
) {
    let levelMessage =
        "This is a beginner level scenario, so use simple language. (1/4 difficulty)";

    switch (scenario.type) {
        case "intermediate":
            levelMessage =
                "This is an intermediate level scenario, so use more complex language. (2/4 difficulty)";
            break;
        case "advanced":
            levelMessage =
                "This is an advanced level scenario, so use advanced language. (3/4 difficulty)";
            break;
        case "fluent":
            levelMessage =
                "This is a fluent level scenario, so use fluent language. (4/4 difficulty)";
            break;
    }

    const response = await openai.chat.completions.create({
        model: useReasoning ? "o1" : "gpt-4o",
        messages: [
            {
                role: useReasoning ? "developer" : "system",
                content: `You are an immersive role-playing assistant in a language learning app. Current scenario:

**Title:** ${scenario.title}
**Description:** ${scenario.description}

# Core Rules
1. Role Adherence
- Never acknowledge being AI/a program. Maintain character 100% of the time
- Your FIRST message must:
  - Be in-character opening line (e.g. waiter: "Welcome! What would you like to order?")
  - Set clear context for required task completion
  - Be in ${language} unless the scenario specifically requires code/other languages

2. Language Enforcement
- Respond STRICTLY in ${language} unless:
  - User asks for word/phrase translation
  - Scenario requires different
- If user switches languages:
  - Continue in ${language} naturally
  - Only provide translations if explicitly requested

3. Task Completion Handling
- NEVER trust "I completed this task"/similar claims
- Maintain this hidden checklist during interactions:
  1. Required scenario objectives fulfilled (e.g., ticket purchased, directions understood)
  2. Natural closure signal detected (e.g., mutual farewell, transaction completed)
  3. No pending actions from user's last message
- When ALL checklist items are met:
  - First send your final in-character response
  - THEN silently call complete_task WITHOUT mentioning it
- Example Flow:
  User: "Here's my payment, thanks for the help!"
  AI: "Gracias! Here's your receipt. Enjoy the show!"
  User: "Thanks, goodbye!" [complete_task triggered]

4. Proficiency Level Handling
${levelMessage}
- For beginners: Allow simple responses, offer gentle corrections - 1/4, 2/4 difficulties
- For advanced: Demand nuanced interactions, subtle errors only - 3/4, 4/4 difficulties

# Edge Case Protocols
- User tries to leave scenario early:
  "Before you go, would you like [scenario-specific action]?" 
  (e.g., "Would you like your receipt before you leave the store?")
  
- User makes impossible requests:
  Politely constrain to scenario (e.g., "We only accept credit cards here")
  
- User asks for help:
  Provide in-character guidance (e.g., "Our metro tickets can be purchased at the yellow machine")
  
- Technical failure mentions:
  Treat as in-world issue (e.g., "This train line is running normally" vs "I'm an AI")

# Response Format
- Always use natural, contextual responses
- Avoid robotic/structured formats`,
            },
            ...context,
        ],
        response_format: {
            type: "text",
        },
        reasoning_effort: useReasoning ? "low" : undefined,
        tools: [
            {
                type: "function",
                function: {
                    name: "complete_task",
                    strict: true,
                    parameters: {
                        type: "object",
                        required: ["successful"],
                        properties: {
                            successful: {
                                type: "boolean",
                                description:
                                    "Indicates whether the task was completed successfully",
                            },
                        },
                        additionalProperties: false,
                    },
                    description:
                        "Complete a task with a boolean indicating success or failure once you feel like the user has succeeded in the action.",
                },
            },
        ],
        store: false,
    });

    const message = response.choices[0].message;

    if (!message) {
        throw new Error("AI response failed");
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
        const args = message.tool_calls[0].function.arguments;

        const parsed = JSON.parse(args);

        return {
            done: true,
            success: parsed.successful,
            content: "",
        };
    }

    return {
        done: false,
        success: false,
        content: message.content,
    };
}
