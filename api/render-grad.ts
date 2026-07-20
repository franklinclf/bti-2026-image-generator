import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

type RequestBody = {
  html: string;
  width: number;
  height: number;
  pixelRatio: number;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { html, width, height, pixelRatio } = req.body as RequestBody;

    if (!html) {
      return res.status(400).json({ error: 'Missing HTML' });
    }

    // Launch Puppeteer with chromium (Vercel-optimized)
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: width * pixelRatio,
        height: height * pixelRatio,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set viewport for accurate rendering
    await page.setViewport({
      width: width * pixelRatio,
      height: height * pixelRatio,
      deviceScaleFactor: 1,
    });

    // Set content and wait for fonts to load
    await page.setContent(html, { waitUntil: 'networkidle2' });
    await page.evaluateHandle('document.fonts.ready');

    // Wait a bit for images to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Screenshot as PNG
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: width * pixelRatio,
        height: height * pixelRatio,
      },
    });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(screenshotBuffer);
  } catch (error) {
    console.error('Render error:', error);
    return res.status(500).json({
      error: 'Failed to render',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
