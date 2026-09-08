import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { HISTORICAL_MARKERS, PRESET_ROUTES } from './src/data/markersData.js';
import { getRouteCorridorMarkers } from './src/utils/geoUtils.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Initialize Gemini API client if key exists
  const getGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all historical markers
  app.get('/api/markers', (req, res) => {
    const { category, routeId, search } = req.query;

    let filtered = [...HISTORICAL_MARKERS];

    if (category && typeof category === 'string' && category !== 'All') {
      filtered = filtered.filter((m) => m.category === category);
    }

    if (routeId && typeof routeId === 'string') {
      filtered = filtered.filter((m) => m.routeIds?.includes(routeId));
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.plaqueText.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          m.state.toLowerCase().includes(q) ||
          m.locationName.toLowerCase().includes(q)
      );
    }

    res.json({ markers: filtered, count: filtered.length });
  });

  // Get all preset routes
  app.get('/api/routes', (_req, res) => {
    res.json({ routes: PRESET_ROUTES });
  });

  // Find markers along a route corridor
  app.post('/api/route-markers', (req, res) => {
    const { routeId, bufferMiles = 3.0 } = req.body;

    const route = PRESET_ROUTES.find((r) => r.id === routeId) || PRESET_ROUTES[0];
    const corridorMarkers = getRouteCorridorMarkers(route, HISTORICAL_MARKERS, bufferMiles);

    res.json({
      route,
      corridorMarkers: corridorMarkers.map((c, index) => ({
        sequenceIndex: index + 1,
        marker: c.marker,
        distanceAlongRouteMiles: Math.round(c.distanceAlongRouteMiles * 10) / 10,
        bufferOffsetMiles: Math.round(c.bufferOffsetMiles * 10) / 10,
        estimatedArrivalMinutes: Math.round((c.distanceAlongRouteMiles / 45) * 60),
      })),
      totalMarkersCount: corridorMarkers.length,
    });
  });

  // Generate AI Story / Expanded Context for a Historical Marker
  app.post('/api/marker-story', async (req, res) => {
    const { markerId, title, plaqueText, locationName, city, state, era } = req.body;

    const ai = getGemini();

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured
      return res.json({
        markerId,
        title: title || 'Historical Landmark',
        expandedHistory: `This historical plaque marks an important milestone in ${city || 'local'}, ${state || 'US'} history around ${era || 'the 18th century'}. Located at ${locationName || 'the site'}, it captures key events and figures that shaped the cultural and social landscape of the area.`,
        oralStories: [
          `Local residents recounted gathering near ${locationName || 'this site'} during historical milestones.`,
          `Archival documents show the original structure stood as a central community hub for travelers and citizens alike.`,
        ],
        keyFigures: ['Historical Citizens', 'Local Pioneers', 'Regional Leaders'],
        audioPrompt: `Welcome to ${title || 'this historical marker'}. ${plaqueText || ''}`,
      });
    }

    try {
      const prompt = `You are an expert American history podcast narrator and tour guide creating an engaging audio tour for drivers approaching a historical marker plaque.

Marker Details:
- Title: ${title}
- Location: ${locationName}, ${city}, ${state}
- Era/Year: ${era}
- Plaque Text: "${plaqueText}"

Please provide a structured JSON response with:
1. "expandedHistory": A captivating 2-paragraph narrative story expanding on the history behind this plaque for a traveling audio tour.
2. "oralStories": An array of 2 short historical anecdotes or lesser-known fun facts.
3. "keyFigures": An array of 2-3 prominent historical people associated with this site.
4. "audioPrompt": A warm, spoken-word introduction script ideal for text-to-speech auto-announce when approaching the site in a car.

Return valid JSON without markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonStr = response.text || '{}';
      const parsed = JSON.parse(jsonStr);

      res.json({
        markerId,
        title,
        expandedHistory: parsed.expandedHistory || plaqueText,
        oralStories: parsed.oralStories || [],
        keyFigures: parsed.keyFigures || [],
        audioPrompt: parsed.audioPrompt || plaqueText,
      });
    } catch (err: any) {
      console.error('Error generating marker story:', err);
      res.status(500).json({
        error: 'Failed to generate story',
        details: err?.message,
      });
    }
  });

  // Serve Vite in development mode or dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build files not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rusty's Historical Marker App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
