import { readFileSync, writeFileSync } from 'fs'
import { parse, stringify } from '@iarna/toml'
import { spawn } from 'child_process'

const args = process.argv.slice(2)

if (args.length !== 1) {
    console.error('Usage: bun run var:remove <KEY>')
    process.exit(1)
}

const [key] = args
const tomlPath = 'wrangler.toml'

const tomlContent = readFileSync(tomlPath, 'utf-8')
const config = parse(tomlContent) as Record<string, Record<string, string>>

if (!config.vars || !config.vars[key]) {
    console.error(`❌ Key "${key}" not found in wrangler.toml`)
    process.exit(1)
}

delete config.vars[key]

const newTomlContent = stringify(config)
writeFileSync(tomlPath, newTomlContent)

console.log(`✅ Removed ${key} from wrangler.toml`)

const typegen = spawn('bun', ['run', 'cf-typegen'], { stdio: 'inherit' })

typegen.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Types generated successfully')
    } else {
        console.error('❌ Type generation failed')
        process.exit(1)
    }
})
