// Copies the API contract from the backend repository into docs/openapi.yaml.
//   bun --bun run api:sync
//   BACKEND_DIR=/path/to/backend-nail-art-app bun --bun run api:sync
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const backendDir = resolve(process.env.BACKEND_DIR ?? '../backend-nail-art-app')
const source = resolve(backendDir, 'documents/openapi.yaml')
const target = resolve('docs/openapi.yaml')

if (!existsSync(source)) {
  console.error(`Contract not found: ${source}\nSet BACKEND_DIR to the backend checkout.`)
  process.exit(1)
}

const git = (...args) =>
  execFileSync('git', ['-C', backendDir, ...args], { encoding: 'utf8' }).trim()

// Do not snapshot a half-edited contract.
if (git('status', '--porcelain', '--', 'documents/openapi.yaml') !== '') {
  console.error(
    'The backend has uncommitted changes to documents/openapi.yaml; commit or stash them first.',
  )
  process.exit(1)
}

copyFileSync(source, target)

const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
const commit = git('log', '-1', '--format=%h (%ad) %s', '--date=short')
console.log(`Copied ${source} -> ${target}`)
console.log(`Backend branch: ${branch}`)
console.log(`Backend commit: ${commit}`)
if (branch !== 'develop') {
  console.warn(
    `Warning: the backend is on "${branch}", not "develop"; the contract may be unreleased.`,
  )
}
console.log(
  'Next: update the "Synced from" line in docs/API_GUIDE.md, then review `git diff docs/openapi.yaml`.',
)
