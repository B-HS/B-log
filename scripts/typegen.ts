import { spawn } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

const secrets = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'CONVERT_SERVER_URL']

const variables = [{ name: 'userId', type: 'string' }]

console.log('🔄 Generating types...')

const typegen = spawn('wrangler', ['types', '--env-interface', 'CloudflareBindings'], { stdio: 'pipe' })

let output = ''
let errorOutput = ''

typegen.stdout?.on('data', (data) => {
    output += data.toString()
    process.stdout.write(data)
})

typegen.stderr?.on('data', (data) => {
    errorOutput += data.toString()
    process.stderr.write(data)
})

typegen.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Type generation failed')
        process.exit(1)
    }

    try {
        const typeFilePath = './worker-configuration.d.ts'
        let content = readFileSync(typeFilePath, 'utf-8')

        const envInterfaceRegex = /(interface Env \{[^}]*)(}\n\})/
        const match = content.match(envInterfaceRegex)

        if (match) {
            const secretTypes = secrets.map((secret) => `\t\t${secret}: string;`).join('\n')
            const updatedEnv = `${match[1]}\n${secretTypes}\n\t${match[2]}`
            content = content.replace(envInterfaceRegex, updatedEnv)

            console.log('✅ Secrets injected')
            secrets.forEach((secret) => console.log(`   - ${secret}: string`))
        } else {
            console.warn('⚠️  Could not find Env interface to inject secrets')
        }

        const bindingsInterfaceRegex = /interface CloudflareBindings extends Cloudflare\.Env \{\}/
        if (bindingsInterfaceRegex.test(content)) {
            const variableTypes = variables.map((v) => `\t${v.name}: ${v.type}`).join('\n')
            const variablesInterface = `\n\ninterface CloudflareVariables {\n${variableTypes}\n}`

            content = content.replace(bindingsInterfaceRegex, `interface CloudflareBindings extends Cloudflare.Env {}${variablesInterface}`)

            console.log('✅ Variables injected')
            variables.forEach((v) => console.log(`   - ${v.name}: ${v.type}`))
        } else {
            console.warn('⚠️  Could not find CloudflareBindings interface to inject variables')
        }

        writeFileSync(typeFilePath, content)
        console.log('✅ Types generated successfully')
    } catch (error) {
        console.error('❌ Failed to inject types:', error)
        process.exit(1)
    }
})
