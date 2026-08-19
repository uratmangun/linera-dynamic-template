import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

async function main() {
  const targetUrl = process.argv[2];
  const outputPath = process.argv[3];
  const apiKey = process.env.BROWSER_USE_API_KEY;

  if (!apiKey) {
    throw new Error("BROWSER_USE_API_KEY is not set");
  }

  if (!targetUrl) {
    throw new Error("Usage: bun browser-use-fetch.ts <url> [outputPath]");
  }

  const createResponse = await fetch(
    "https://api.browser-use.com/api/v3/browsers",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Browser-Use-API-Key": apiKey,
      },
      body: JSON.stringify({ proxyCountryCode: "us" }),
    },
  );

  if (!createResponse.ok) {
    throw new Error(
      `Failed to create browser: ${createResponse.status} ${await createResponse.text()}`,
    );
  }

  const browserSession = (await createResponse.json()) as {
    id: string;
    cdpUrl: string;
  };

  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

  try {
    browser = await chromium.connectOverCDP(browserSession.cdpUrl, {
      timeout: 120000,
    });

    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());

    await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle").catch(() => undefined);

    const html = await page.content();
    const title = await page.title();
    const text = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    if (outputPath) {
      await writeFile(outputPath, html, "utf8");
      process.stdout.write(
        `${JSON.stringify(
          {
            requestedUrl: targetUrl,
            finalUrl: page.url(),
            title,
            outputPath,
            htmlLength: html.length,
            textPreview: text.slice(0, 2000),
            browserSessionId: browserSession.id,
          },
          null,
          2,
        )}\n`,
      );
    } else {
      process.stdout.write(html);
    }
  } finally {
    await browser?.close().catch(() => undefined);
    await fetch(
      `https://api.browser-use.com/api/v3/browsers/${browserSession.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Browser-Use-API-Key": apiKey,
        },
        body: JSON.stringify({ action: "stop" }),
      },
    ).catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
