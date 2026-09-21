// Check if we're in development mode (watch mode or explicitly set build mode)
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import typescript from "rollup-plugin-typescript2";

const isDev = process.env.ROLLUP_WATCH === 'true' || process.env.BUILD_MODE === 'dev';

export default {
    input: 'src/index.ts',               // Entry point for the bundle (main TypeScript file)
    output: {
        file: 'dist/index.js',             // Output file location and name
        format: 'esm',                     // Output format: ES module
        sourcemap: true                    // Generate sourcemaps for easier debugging
    },
    plugins: [
        terser(),                          // Use terser for minification to make the bundle smaller
        typescript(),
        ...(isDev ? [                      // Development-only plugins (enabled when in dev mode)
            serve({
                open: true,                    // Automatically open the browser when the server starts
                contentBase: ['dist', 'src'],  // Folders to serve static files from
                port: 8080                     // Port to run the dev server on
            })
        ] : [])
    ]
};