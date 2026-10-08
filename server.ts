import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize Gemini SDK client
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please set GEMINI_API_KEY in environment or secrets.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Route: Improve 'About' section
  app.post("/api/ai/improve-about", async (req, res) => {
    try {
      const { currentBio, name, title, researchKeywords, goal } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are an expert academic editor and personal brand strategist for researchers, scientists, and engineers.
Draft 3 high-quality, professional, and engaging "About Me / Bio" statements for an academic portfolio.

User Context:
- Name: ${name || 'Researcher'}
- Role/Title: ${title || 'Academic Researcher'}
- Current Bio Draft: ${currentBio || '(None provided)'}
- Research Keywords: ${Array.isArray(researchKeywords) ? researchKeywords.join(', ') : (researchKeywords || 'computer science, AI')}
- Desired Tone/Goal: ${goal || 'Professional and concise, highlighting research impact and academic vision'}

Instructions:
Provide 3 distinct options:
1. Concise & Direct (2-3 sentences, punchy and clear)
2. Narrative & Visionary (4-5 sentences, highlighting research motivation and scholarly impact)
3. Technical & Methodology-Focused (focusing on publications, techniques, and domain expertise)

Return strictly valid JSON with key "suggestions" containing an array of 3 strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 3 improved bio suggestions",
              },
            },
            required: ["suggestions"],
          },
        },
      });

      const json = JSON.parse(response.text || "{}");
      res.json({ suggestions: json.suggestions || [] });
    } catch (error: any) {
      console.error("Error generating bio suggestions:", error);
      res.status(500).json({ error: error.message || "Failed to generate bio suggestions" });
    }
  });

  // API Route: Auto-generate project description from user keywords
  app.post("/api/ai/generate-project-description", async (req, res) => {
    try {
      const { projectTitle, keywords, role, targetVenue, briefNotes } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are an academic project writer and technical communicator. Generate a polished, publication-ready description and key highlights for a portfolio project or research tool.

Context:
- Project Title: ${projectTitle || 'Research Project'}
- Key Concepts / Keywords: ${keywords || 'Machine Learning, User Interfaces'}
- Researcher Role: ${role || 'Lead Contributor'}
- Venue / Context: ${targetVenue || 'Academic Research / Open Source'}
- Additional Notes: ${briefNotes || 'N/A'}

Instructions:
Generate a clean summary paragraph (3-4 sentences) and 3 bullet highlights outlining novel contributions or technical features.
Return strictly valid JSON with "description" (string) and "highlights" (array of strings).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "Publication-ready project summary paragraph",
              },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 bullet highlights of key contributions",
              },
            },
            required: ["description", "highlights"],
          },
        },
      });

      const json = JSON.parse(response.text || "{}");
      res.json({
        description: json.description || "",
        highlights: json.highlights || [],
      });
    } catch (error: any) {
      console.error("Error generating project description:", error);
      res.status(500).json({ error: error.message || "Failed to generate project description" });
    }
  });

  // API Route: Generate project thumbnail
  app.post("/api/ai/generate-thumbnail", async (req, res) => {
    try {
      const { title, description } = req.body;
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{
            text: `Create a professional, abstract, high-quality portfolio thumbnail image for a research project titled "${title || 'Project'}". Description: ${description || 'Academic research project'}. Style: Modern, minimalistic, geometric, high contrast. No text in image.`,
          }],
        },
        config: {
          imageConfig: { aspectRatio: "4:3" },
        },
      });

      let imageUrl = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error("No image data returned from model");
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ error: error.message || "Failed to generate thumbnail" });
    }
  });

  // API Route: AI Theme Customizer
  app.post("/api/ai/customize-theme", async (req, res) => {
    try {
      const { prompt: userPrompt, userTitle, userKeywords } = req.body;
      const ai = getGeminiClient();

      const systemPrompt = `You are a world-class UI/UX designer and web theme architect specializing in academic, scientific, and portfolio web design.
The user wants to customize their portfolio website theme according to their description.

User Request: "${userPrompt || 'A clean, modern, high-contrast theme for an academic researcher'}"
User Context: Role "${userTitle || 'Researcher'}", Keywords "${userKeywords || 'AI, Science'}"

Generate a cohesive, highly accessible, visually distinct set of Tailwind CSS class strings that define the color scheme, typography style, borders, and UI tokens.

Requirements for generated Tailwind classes:
- bg: Page background color class (e.g. "bg-[#0f172a]" or "bg-[#FAF7F2]" or "bg-[#18181B]")
- navBg: Navigation header background class with opacity (e.g. "bg-[#0f172a]/90" or "bg-[#FAF7F2]/90")
- text: Main body text color class (e.g. "text-stone-800" or "text-slate-300")
- textMuted: Secondary text color class (e.g. "text-stone-500" or "text-slate-400")
- heading: Heading typography class combining font and text color (e.g. "font-serif text-amber-950 font-bold" or "font-mono text-cyan-400")
- subheading: Category eyebrow / tag style class (e.g. "text-amber-800 font-bold tracking-widest uppercase text-xs" or "text-cyan-500 font-mono text-xs uppercase")
- accent: Primary accent text/link color class (e.g. "text-amber-900" or "text-cyan-400")
- button: Button styling class (e.g. "bg-amber-900 text-white hover:bg-amber-800 rounded-full shadow-sm" or "bg-cyan-600 text-white rounded-md shadow")
- sectionPrimary: Primary content section background class (e.g. "bg-white" or "bg-[#0f172a]")
- sectionSecondary: Alternating section background class (e.g. "bg-[#F5F5F2]" or "bg-[#1e293b]")
- border: Border color class (e.g. "border-stone-200" or "border-slate-800")
- logo: Logo badge styling class (e.g. "bg-amber-900 text-white font-serif rounded-full" or "bg-slate-800 text-cyan-400 border border-cyan-500 rounded-md")
- name: A short creative name for this custom theme (e.g. "Oxford Wine & Gold", "Midnight Cyber-Teal", "Nordic Mint Minimal")
- description: A brief 1-sentence description of the visual atmosphere.

Return strictly valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bg: { type: Type.STRING },
              navBg: { type: Type.STRING },
              text: { type: Type.STRING },
              textMuted: { type: Type.STRING },
              heading: { type: Type.STRING },
              subheading: { type: Type.STRING },
              accent: { type: Type.STRING },
              button: { type: Type.STRING },
              sectionPrimary: { type: Type.STRING },
              sectionSecondary: { type: Type.STRING },
              border: { type: Type.STRING },
              logo: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["bg", "navBg", "text", "textMuted", "heading", "subheading", "accent", "button", "sectionPrimary", "sectionSecondary", "border", "logo", "name", "description"],
          },
        },
      });

      const json = JSON.parse(response.text || "{}");
      res.json(json);
    } catch (error: any) {
      console.error("Error customizing theme:", error);
      res.status(500).json({ error: error.message || "Failed to customize theme" });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
