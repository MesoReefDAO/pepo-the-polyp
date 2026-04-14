import type { Express } from "express";
import { createServer, type Server } from "http";

const PEPO_API_KEY = process.env.PEPO_API_KEY || "";
const BONFIRES_BASE = "https://pepo.app.bonfires.ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Proxy: fetch knowledge graph data
  app.get("/api/graph", async (req, res) => {
    try {
      const response = await fetch(`${BONFIRES_BASE}/graph`, {
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Proxy: search knowledge graph
  app.post("/api/graph/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "query is required" });

      const response = await fetch(`${BONFIRES_BASE}/graph/search`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }
      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Chat endpoint: query Pepo AI
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "message is required" });

      const response = await fetch(`${BONFIRES_BASE}/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        // Fallback: simulate Pepo's response for demo
        const fallbackResponse = generatePepoResponse(message);
        return res.json({ response: fallbackResponse, source: "local" });
      }

      const data = await response.json();
      return res.json({ response: data.response || data.message || data.answer || JSON.stringify(data), source: "bonfires" });
    } catch (err: any) {
      const fallbackResponse = generatePepoResponse(req.body?.message || "");
      return res.json({ response: fallbackResponse, source: "local" });
    }
  });

  // Graph stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const response = await fetch(`${BONFIRES_BASE}/stats`, {
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "x-api-key": PEPO_API_KEY,
        },
      });
      if (!response.ok) {
        return res.json({ knowledgeDensity: "8.4 TB", networkHealth: "99.2%", nodeConnections: 3420 });
      }
      const data = await response.json();
      return res.json(data);
    } catch {
      return res.json({ knowledgeDensity: "8.4 TB", networkHealth: "99.2%", nodeConnections: 3420 });
    }
  });

  return httpServer;
}

function generatePepoResponse(userMessage: string): string {
  const lc = userMessage.toLowerCase();
  if (lc.includes("coral") || lc.includes("bleach")) {
    return "I've analyzed the coral bleaching data across the MesoAmerican Reef. Current data shows elevated thermal stress in Sectors 3, 7, and 12. The knowledge graph indicates an 87% correlation with sea surface temperature anomalies. Shall I pull the full node cluster for deeper analysis?";
  }
  if (lc.includes("dao") || lc.includes("governance") || lc.includes("proposal")) {
    return "The MesoReef DAO currently has 4 active governance proposals. Proposal #82 (Reef Guard Initiative) is gaining traction — it's linked to 340 knowledge nodes covering thermal monitoring data. I've mapped strong correlations with real-time sensor data from Sector 7.";
  }
  if (lc.includes("graph") || lc.includes("node") || lc.includes("knowledge")) {
    return "I've mapped 3,420 new node connections in the MesoAmerican Reef knowledge graph today. The highest-density clusters relate to coral spawning cycles and thermal stress corridors. Which quadrant shall we explore?";
  }
  if (lc.includes("temperature") || lc.includes("heat") || lc.includes("thermal")) {
    return "Sea surface temperatures in the MesoAmerican Reef corridor are currently 1.8°C above the 30-year average. My models suggest a 73% probability of a major bleaching event within 6 weeks if trends continue. I recommend activating the Reef Guard monitoring protocols.";
  }
  if (lc.includes("sector")) {
    const match = lc.match(/sector\s*(\d+)/);
    const sector = match ? match[1] : "7";
    return `Sector ${sector} data loaded. I'm detecting ${Math.floor(Math.random() * 500 + 200)} active monitoring nodes in this quadrant. Coral coverage is at 43%, down 8% from last quarter. Notable: high-density connection cluster between thermal anomaly data and recent DAO governance proposals for emergency reef protection.`;
  }
  return "Greetings, Explorer. I am Pepo, your guide to the MesoAmerican Reef knowledge network. I've mapped 3,420 new node connections today. I can help you analyze coral bleaching patterns, DAO governance data, thermal stress events, and species distribution across the reef system. What would you like to explore?";
}
