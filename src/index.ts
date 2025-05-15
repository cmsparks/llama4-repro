import { generateText, tool } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createWorkersAI } from "workers-ai-provider";
import z from "zod";
import type { Variables } from "./types/hono";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());
//app.get("/", (c) => c.json("ok"));

app.get("/", async (c) => {
	//const { prompt } = (await c.req.json()) as { prompt: string };
	const workersai = createWorkersAI({ binding: c.env.AI });

	const result = await generateText({
		model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
		messages: [
			{ role: "system", content: "You are a helpful AI assistant" },
			{ role: "user", content: "Call the weather tool multiple times" },
		],
		tools: {
			weather: tool({
				description: "Get the weather in a location",
				parameters: z.object({
					location: z.string().describe("The location to get the weather for"),
				}),
				execute: async ({ location }) => ({
					location,
					weather: location === "London" ? "Raining" : "Sunny",
				}),
			}),
		},
		maxSteps: 5,
		onStepFinish: (r) => {
			console.log(r.response.messages)
		}
	});

	return c.json(result);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
