import { defineConfig, type UserConfig } from 'tsdown'

const hostConfig: UserConfig = {
  entry: { index: 'src/index.ts', typert: 'src/typert.ts', remote: 'src/remote.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: true,
  fixedExtension: false,
}

const clientConfig: UserConfig = {
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: ['cjs'],
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
    alwaysBundle: (id: string) => id !== 'react' && id !== 'react/jsx-runtime' && id !== '@deepseek-ai/dsh-client-ui-primitives',
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: "dsh-northstar", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default defineConfig([hostConfig, clientConfig])
