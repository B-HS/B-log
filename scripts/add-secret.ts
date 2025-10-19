import { spawn } from 'child_process'

const args = process.argv.slice(2)

if (args.length !== 1) {
    console.error('Usage: bun run secret:add <KEY>')
    console.error('You will be prompted to enter the value securely')
    process.exit(1)
}

const [key] = args

console.log(`🔒 Adding secret: ${key}`)
console.log('You will be prompted to enter the value...')

const addSecret = spawn('wrangler', ['secret', 'put', key], { stdio: 'inherit' })

addSecret.on('close', (code) => {
    if (code === 0) {
        console.log(`✅ Successfully added secret: ${key}`)
    } else {
        console.error(`❌ Failed to add secret: ${key}`)
        process.exit(1)
    }
})
