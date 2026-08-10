import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function health(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: "equilibre-api",
    version: "0.1.0",
    integrations: {
      huggingFace: Boolean(process.env.HF_TOKEN),
      airtable: Boolean(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID),
    },
    date: new Date().toISOString(),
  });
}
