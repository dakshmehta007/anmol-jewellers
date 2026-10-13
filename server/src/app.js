import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import selectionRoutes from "./routes/selections.js";
import catalogRoutes from "./routes/catalog.js";
import adminRoutes from "./routes/admin.js";
import { allowedOrigins } from "./config/origins.js";
import { originCheck } from "./middleware/originCheck.js";
import { notFound, errorHandler } from "./middleware/errors.js";

export const app = express();

app.set("trust proxy", 1); // needed behind Render/Railway/Heroku so rate limiting and secure cookies work
app.use(
  helmet({
    // Helmet blocks outside images and uploads by default. Allow Cloudinary (design photos and the admin photo upload).
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
        "connect-src": ["'self'", "https://api.cloudinary.com"],
      },
    },
  }),
);
app.use(cors({ origin: allowedOrigins(), credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// General safety net: 300 requests per minute per IP.
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  originCheck,
);

// Slows down password guessing: 50 login/signup requests per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/selections", selectionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", catalogRoutes); // public: /api/catalog and /api/designs

// When the website has been built (client/dist exists), this same server also serves it.
// So the website and the API live at one address, and no extra hosting or settings are needed.
const DIST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../client/dist",
);
if (fs.existsSync(path.join(DIST, "index.html"))) {
  app.use(
    express.static(DIST, {
      setHeaders: (res, file) => {
        const long = file.includes(`${path.sep}assets${path.sep}`); // built files have a fingerprint in the name
        res.setHeader(
          "Cache-Control",
          file.endsWith(".html")
            ? "no-cache"
            : long
              ? "public, max-age=31536000, immutable"
              : "public, max-age=3600",
        );
      },
    }),
  );
  // Any other page address (for example /collection/gold/ring on refresh) opens the website, which then shows that page.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);
