import { DenonConfig } from 'https://deno.land/x/denon@2.5.0/mod.ts'

const config: DenonConfig = {
  scripts: {
    start: {
      cmd: 'deno run src/main.ts',
      desc: 'Start server',
      importMap: 'importmap.json',
      allow: ['all'],
      unstable: true
    }
  },
  watcher: {
    interval: 0,
    paths: [''],
    exts: ['ts'],
    skip: ['**/.git/**', '**/logs/**', '**/example/**', '**/.vscode/***']
  }
}

export default config
