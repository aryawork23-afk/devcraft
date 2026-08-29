import {
  parsedOrderSchema,
  type ParsedOrder,
} from '../schemas/orderSchema'

export type Domain = 'tailor' | 'tiffin' | 'electrician' | 'baker'

type ItemDefinition = {
  description: string
  aliases: string[]
}

const itemVocabulary: Record<Domain, ItemDefinition[]> = {
  tailor: [
    { description: 'pant', aliases: ['pant', 'pent'] },
    { description: 'lehenga', aliases: ['lehenga'] },
    { description: 'pajama', aliases: ['pajama', 'pyjama'] },
    { description: 'suit', aliases: ['suit'] },
    { description: 'sherwani', aliases: ['sherwani'] },
    { description: 'dupatta', aliases: ['dupatta'] },
    { description: 'kurta', aliases: ['kurta', 'kurtha'] },
    { description: 'salwar', aliases: ['salwar'] },
    { description: 'blouse', aliases: ['blouse'] },
    { description: 'kameez', aliases: ['kameez'] },
    { description: 'waistcoat', aliases: ['waistcoat', 'koti'] },
    { description: 'shirt', aliases: ['shirt'] },
  ],

  tiffin: [
    { description: 'idli', aliases: ['idli'] },
    { description: 'thali', aliases: ['thali'] },
    { description: 'paratha', aliases: ['paratha'] },
    { description: 'rice', aliases: ['rice', 'chawal'] },
    { description: 'dal', aliases: ['dal', 'दाल'] },
    { description: 'khichdi', aliases: ['khichdi', 'खिचड़ी'] },
    { description: 'rajma', aliases: ['rajma', 'राजमा'] },
    { description: 'curd', aliases: ['curd', 'dahi', 'दही'] },
    {
      description: 'paneer sabzi',
      aliases: ['paneer sabzi', 'paneer sabji'],
    },
    { description: 'sabzi', aliases: ['sabzi', 'sabji', 'सब्जी'] },
    { description: 'chole', aliases: ['chole'] },
    { description: 'poha', aliases: ['poha'] },
    { description: 'roti', aliases: ['roti', 'रोटी'] },
  ],

  electrician: [
    { description: 'wiring', aliases: ['wiring'] },
    { description: 'geyser', aliases: ['geyser', 'gizer'] },
    { description: 'doorbell', aliases: ['doorbell', 'ghanti'] },
    { description: 'inverter', aliases: ['inverter'] },
    { description: 'water motor', aliases: ['water motor', 'motor'] },
    {
      description: 'switch board',
      aliases: ['switch board', 'switchboard'],
    },
    { description: 'tube light', aliases: ['tube light', 'tubelight'] },
    { description: 'exhaust fan', aliases: ['exhaust fan'] },
    { description: 'mcb', aliases: ['mcb'] },
    { description: 'ceiling fan', aliases: ['ceiling fan', 'fan'] },
    { description: 'socket', aliases: ['socket'] },
    { description: 'ac point', aliases: ['ac point'] },
  ],

  baker: [
    { description: 'bread loaf', aliases: ['bread loaf', 'bread'] },
    {
      description: 'birthday cake',
      aliases: ['birthday cake', 'bday cake'],
    },
    { description: 'pastry', aliases: ['pastry', 'पेस्ट्री'] },
    { description: 'cookies', aliases: ['cookies', 'cookie'] },
    {
      description: 'cheesecake',
      aliases: ['cheesecake', 'cheese cake'],
    },
    { description: 'donut', aliases: ['donut', 'doughnut'] },
    { description: 'cake', aliases: ['cake'] },
    { description: 'muffin', aliases: ['muffin'] },
    { description: 'brownie', aliases: ['brownie'] },
    { description: 'cupcake', aliases: ['cupcake', 'cup cake'] },
  ],
}

const numberWords: Record<string, number> = {
  ek: 1,
  one: 1,
  एक: 1,
  do: 2,
  two: 2,
  दो: 2,
  teen: 3,
  three: 3,
  तीन: 3,
  char: 4,
  chaar: 4,
  four: 4,
  चार: 4,
  paanch: 5,
  five: 5,
  पांच: 5,
  chhe: 6,
  che: 6,
  six: 6,
  छह: 6,
  saat: 7,
  seven: 7,
  सात: 7,
  aath: 8,
  eight: 8,
  आठ: 8,
  nau: 9,
  nine: 9,
  नौ: 9,
  das: 10,
  ten: 10,
  दस: 10,
}

const supportedColors = [
  'navy blue',
  'black',
  'white',
  'red',
  'blue',
  'green',
  'maroon',
  'cream',
]

function convertDevanagariDigits(value: string): string {
  const devanagariDigits = '०१२३४५६७८९'

  return value.replace(/[०-९]/g, (digit) =>
    String(devanagariDigits.indexOf(digit)),
  )
}

function normalizeMessage(message: string): string {
  return convertDevanagariDigits(message)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function quantityValue(value: string | undefined): number {
  if (!value) {
    return 1
  }

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  return numberWords[value] ?? 1
}

function findQuantity(
  text: string,
  itemStart: number,
  itemAlias: string,
): number {
  const quantityWords = Object.keys(numberWords).join('|')
  const quantityPattern = `\\d+|${quantityWords}`

  const beforeItem = text.slice(0, itemStart)
  const afterItem = text.slice(itemStart + itemAlias.length)

  const beforeMatch = beforeItem.match(
    new RegExp(`(?:^|\\s)(${quantityPattern})\\s*$`),
  )

  if (beforeMatch) {
    return quantityValue(beforeMatch[1])
  }

  const afterMatch = afterItem.match(
    new RegExp(`^\\s*(${quantityPattern})(?:\\s|$)`),
  )

  return quantityValue(afterMatch?.[1])
}

function extractCustomer(originalMessage: string): string | null {
  const cleaned = originalMessage.trim()

  const customerPatterns = [
    /^([a-zA-Z]+(?:\s+(?:ji|didi|bhai|aunty))?)\s+ke\s+liye\b/i,
    /^([a-zA-Z]+(?:\s+(?:ji|didi|bhai|aunty))?)\s+bol\s+rah[ai]\b/i,
  ]

  for (const pattern of customerPatterns) {
    const match = cleaned.match(pattern)

    if (match) {
      return match[1].trim()
    }
  }

  return null
}

function findItems(text: string, domain: Domain) {
  const candidates = itemVocabulary[domain].flatMap((definition) => {
    const aliases = [...definition.aliases].sort(
      (first, second) => second.length - first.length,
    )

    for (const alias of aliases) {
      const index = text.indexOf(alias)

      if (index !== -1) {
        return [
          {
            description: definition.description,
            alias,
            index,
            end: index + alias.length,
          },
        ]
      }
    }

    return []
  })

  candidates.sort((first, second) => {
    if (first.index === second.index) {
      return second.alias.length - first.alias.length
    }

    return first.index - second.index
  })

  const accepted: typeof candidates = []

  for (const candidate of candidates) {
    const overlapsExistingItem = accepted.some(
      (existing) =>
        candidate.index < existing.end &&
        candidate.end > existing.index,
    )

    if (!overlapsExistingItem) {
      accepted.push(candidate)
    }
  }

  return accepted.map((candidate) => {
    const attributes: Record<string, string | number | boolean> = {}

    return {
      description: candidate.description,
      quantity: findQuantity(text, candidate.index, candidate.alias),
      attributes,
    }
  })
}

export function parseMessage(
  rawMessage: string,
  domain: Domain,
): ParsedOrder {
  const text = normalizeMessage(rawMessage)
  const items = findItems(text, domain)

  if (items.length === 1 && domain === 'tailor') {
    const color = supportedColors.find((possibleColor) =>
      text.includes(possibleColor),
    )

    const chestMatch = text.match(/chest\s*(\d+)/)
    const chest = chestMatch ? Number(chestMatch[1]) : null

    if (color) {
      items[0].attributes.color = color
    }

    if (chest !== null) {
      items[0].attributes.chest = chest
    }
  }

  const referencesPriorOrder =
    text.includes('last time') ||
    text.includes('pichli baar') ||
    text.includes('pehle jaisa')

  const result = {
    customer: extractCustomer(rawMessage),
    items,
    due_date: null,
    amount: null,
    references_prior_order: referencesPriorOrder,
    confidence: items.length > 0 ? 0.72 : 0.2,
    needs_clarification: items.length === 0,
  }

  return parsedOrderSchema.parse(result)
}