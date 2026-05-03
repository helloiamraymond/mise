import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

import followupsHandler from "./api/followups.js";
import generateHandler from "./api/generate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const envFile = path.join(__dirname, ".env.local");
const port = Number(process.env.PORT || 3000);

loadEnvFile(envFile);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const routes = {
  "/api/followups": followupsHandler,
  "/api/generate": generateHandler,
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname in routes) {
    await handleApiRequest(req, res, routes[url.pathname]);
    return;
  }

  await serveStaticAsset(url.pathname, res);
});

server.listen(port, () => {
  console.log(`Mise local server running at http://localhost:${port}`);
  if (!hasAnthropicApiKey()) {
    console.log("ANTHROPIC_API_KEY is not set. Add it to .env.local before testing the API routes.");
  }
});

async function handleApiRequest(req, res, handler) {
  try {
    req.body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const localRes = {
    status(code) {
      res.statusCode = code;
      return localRes;
    },
    json(payload) {
      sendJson(res, res.statusCode || 200, payload);
    },
  };

  try {
    await handler(req, localRes);
  } catch (error) {
    sendJson(res, 500, { error: "Server error", detail: String(error) });
  }
}

async function serveStaticAsset(requestPath, res) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const assetPath = path.normalize(path.join(publicDir, normalizedPath));

  if (!assetPath.startsWith(publicDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(assetPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendText(res, 404, "Not found");
        return;
      }

      sendText(res, 500, "Internal server error");
      return;
    }

    const extension = path.extname(assetPath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    res.end(content);
  });
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && value && !isPlaceholderValue(value) && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hasAnthropicApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY && !isPlaceholderValue(process.env.ANTHROPIC_API_KEY));
}

function isPlaceholderValue(value) {
  return value === "replace-with-your-anthropic-api-key";
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === "GET" || req.method === "HEAD") {
      resolve({});
      return;
    }

    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}