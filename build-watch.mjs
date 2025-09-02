// -*- Mode: js -*-
import * as esbuild from 'esbuild'
import fs from 'fs/promises'
import pkgJson from './package.json' with { type: 'json' }

const CSSMinifyPlugin = {
    name: "CSSMinifyPlugin",
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const f = await fs.readFile(args.path)
            const css = await esbuild.transform(f, { loader: "css", minify: true })
            return { loader: "text", contents: css.code }
        })
    }
}

async function watch_build() {
    const context = await esbuild.context({
        entryPoints: [`${pkgJson.main}`],
        bundle: true,
        minify: false,
        outExtension: { '.js': '.js' },
        outdir: 'dist',
        format: 'esm',
        plugins: [
            CSSMinifyPlugin,
        ],
        external: ['@babylonjs/core', '@highlite/plugin-api'],
        loader: {
            '.html': 'text',
            '.png': 'dataurl',
            '.jpg': 'dataurl',
            '.jpeg': 'dataurl',
            '.gif': 'dataurl',
            '.svg': 'dataurl',
            '.webp': 'dataurl',
            '.wav': 'dataurl',
            '.mp3': 'dataurl',
        },
    });

    await context.watch();
    console.log('^C to terminate');
}

watch_build();
