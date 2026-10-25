import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(["Power Apps", "Power Automate", "Copilot agents", "Other"]),
    date: z.coerce.date(),
    draft: z.boolean().default(true),
    readingMinutes: z.number().int().positive(),
  }),
});
export const collections = { blog };

