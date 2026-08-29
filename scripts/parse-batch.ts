import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import {
  parseMessage,
  type Domain,
} from '../src/parser/parseMessage'

type InputMessage = {
  id: string
  domain: Domain
  received_at: string
  message: string
  expected?: unknown
}

const validDomains = new Set<Domain>([
  'tailor',
  'tiffin',
  'electrician',
  'baker',
])

function readRows(value: unknown): InputMessage[] {
  if (Array.isArray(value)) {
    return value as InputMessage[]
  }

  if (
    value &&
    typeof value === 'object' &&
    'messages' in value &&
    Array.isArray(value.messages)
  ) {
    return value.messages as InputMessage[]
  }

  throw new Error(
    'Input must be a JSON list or an object containing a messages list.',
  )
}

const inputArgument = process.argv[2]
const outputArgument = process.argv[3]

if (!inputArgument || !outputArgument) {
  console.error(
    'Usage: npm run parse-batch -- INPUT_FILE OUTPUT_FILE',
  )
  process.exit(1)
}

const inputPath = resolve(process.cwd(), inputArgument)
const outputPath = resolve(process.cwd(), outputArgument)

const inputText = await readFile(inputPath, 'utf8')
const inputData: unknown = JSON.parse(inputText)
const messages = readRows(inputData)

const predictions = messages.map((message) => {
  if (!message.id) {
    throw new Error('Every input message must contain an id.')
  }

  if (!validDomains.has(message.domain)) {
    throw new Error(
      `Message ${message.id} has invalid domain: ${message.domain}`,
    )
  }

  if (!message.received_at) {
    throw new Error(
      `Message ${message.id} is missing received_at.`,
    )
  }

  if (typeof message.message !== 'string') {
    throw new Error(
      `Message ${message.id} has no valid message text.`,
    )
  }

  const result = parseMessage(
    message.message,
    message.domain,
    message.received_at,
  )

  return {
    id: message.id,
    ...result,
  }
})

await mkdir(dirname(outputPath), { recursive: true })

await writeFile(
  outputPath,
  JSON.stringify(predictions, null, 2),
  'utf8',
)

console.log(`Parsed ${predictions.length} messages.`)
console.log(`Predictions written to: ${outputPath}`)