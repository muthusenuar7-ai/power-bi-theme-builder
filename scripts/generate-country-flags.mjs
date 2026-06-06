import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(rootDir, 'node_modules', 'flag-icons', 'flags', '4x3')
const targetDir = path.join(rootDir, 'public', 'icon-library', 'countries')

async function listSvgFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function main() {
  const files = await listSvgFiles(sourceDir)
  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.mkdir(targetDir, { recursive: true })

  for (const file of files) {
    const source = path.join(sourceDir, file)
    const target = path.join(targetDir, file)
    const svg = await fs.readFile(source, 'utf8')
    await fs.writeFile(target, svg.trim() + '\n', 'utf8')
  }

  console.log(JSON.stringify({
    source: 'flag-icons',
    target: 'public/icon-library/countries',
    copied: files.length,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
