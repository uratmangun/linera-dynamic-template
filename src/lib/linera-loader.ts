// Dynamic loader for Linera WASM from public folder
// This avoids the file:// URL issue with @linera/client's bundled import.meta.url

let lineraModule: typeof import("@linera/client") | null = null;

export async function loadLinera(): Promise<typeof import("@linera/client")> {
    if (lineraModule) return lineraModule;

    // Dynamically import the JS module from public folder
    const module = await import(
    /* webpackIgnore: true */ "/linera/linera_web.js"
    );

    // Initialize with the WASM file from public folder
    await module.default("/linera/linera_web_bg.wasm");

    lineraModule = module;
    return module;
}
