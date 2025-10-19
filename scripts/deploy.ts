import { spawn } from 'child_process'

const args = process.argv.slice(2)
const env = args[0] || 'production'

const validEnvs = ['dev', 'staging', 'production']
if (!validEnvs.includes(env)) {
    console.error(`Invalid environment: ${env}`)
    console.error(`Valid environments: ${validEnvs.join(', ')}`)
    process.exit(1)
}

console.log(`🚀 Deploying to ${env}...`)

const deployArgs = ['run', 'deploy']
if (env !== 'production') {
    deployArgs.push('--env', env)
}

const deploy = spawn('bun', deployArgs, { stdio: 'inherit' })

deploy.on('close', (code) => {
    if (code === 0) {
        console.log(`✅ Successfully deployed to ${env}`)
    } else {
        console.error(`❌ Deployment to ${env} failed`)
        process.exit(1)
    }
})
