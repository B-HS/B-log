import { spawn } from 'child_process'

const args = process.argv.slice(2)

if (args.length < 1 || args.length > 2) {
    console.error('Usage:')
    console.error('  Plain text var: bun run var:add <KEY> <VALUE>')
    console.error('  Secret: bun run var:add <KEY>')
    process.exit(1)
}

const [key, value] = args

if (value) {
    console.log(`⚠️  Adding ${key} as plain text variable`)
    console.log('For sensitive data, use: bun run var:add ${key} (without value)')

    const addVar = spawn('wrangler', ['deploy', '--var', `${key}:${value}`, '--dry-run'], { stdio: 'inherit' })

    addVar.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ Added ${key} as plain text variable`)
        } else {
            console.error('❌ Failed to add variable')
            process.exit(1)
        }
    })
} else {
    console.log(`🔒 Adding ${key} as secret...`)

    const addSecret = spawn('wrangler', ['secret', 'put', key], { stdio: 'inherit' })

    addSecret.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ Added ${key} as secret`)
        } else {
            console.error('❌ Failed to add secret')
            process.exit(1)
        }
    })
}
