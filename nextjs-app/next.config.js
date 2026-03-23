/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.compilation.tap("StripSwaggerUiCssSourceMapUrl", (compilation) => {
          compilation.hooks.processAssets.tap(
            {
              name: "StripSwaggerUiCssSourceMapUrl",
              stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            },
            () => {
              const re = /\s*\/\*# sourceMappingURL=swagger-ui\.css\.map\*\//g;
              for (const name of compilation.getAssets().map((a) => a.name)) {
                if (!name.endsWith(".css")) continue;
                const asset = compilation.getAsset(name);
                if (!asset) continue;
                const text = asset.source.source();
                if (typeof text !== "string" || !text.includes("swagger-ui.css.map")) continue;
                compilation.updateAsset(
                  name,
                  new compiler.webpack.sources.RawSource(text.replace(re, "")),
                );
              }
            },
          );
        });
      },
    });
    return config;
  },
};

module.exports = nextConfig;

