import {
  parsedOrderSchema,
  type ParsedOrder,
} from '../schemas/orderSchema'

const supportedItems = [
  'kurta',
  'shirt',
  'pant',
  'pajama',
  'cake',
  'tiffin',
  'fan',
  'socket',
]

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

export function parseMessage(rawMessage: string): ParsedOrder {
  const text = rawMessage.toLowerCase().trim()

  const item = supportedItems.find((possibleItem) =>
    text.includes(possibleItem),
  )

  if (!item) {
    return parsedOrderSchema.parse({
      customer: null,
      items: [],
      due_date: null,
      amount: null,
      references_prior_order: false,
      confidence: 0.2,
      needs_clarification: true,
    })
  }

  const beforeItemPattern = new RegExp(`(\\d+)\\s+${item}`)
  const afterItemPattern = new RegExp(`${item}\\s+(\\d+)`)

  const beforeItemMatch = text.match(beforeItemPattern)
  const afterItemMatch = text.match(afterItemPattern)

  const quantityText = beforeItemMatch?.[1] ?? afterItemMatch?.[1]
  const quantity = quantityText ? Number(quantityText) : 1

  const color = supportedColors.find((possibleColor) =>
    text.includes(possibleColor),
  )

  const chestMatch = text.match(/chest\s*(\d+)/)
  const chest = chestMatch ? Number(chestMatch[1]) : null

  const attributes: Record<string, string | number | boolean> = {}

  if (color) {
    attributes.color = color
  }

  if (chest !== null) {
    attributes.chest = chest
  }

  const referencesPriorOrder =
    text.includes('last time') ||
    text.includes('pichli baar') ||
    text.includes('pehle jaisa')

  const result = {
    customer: null,
    items: [
      {
        description: item,
        quantity,
        attributes,
      },
    ],
    due_date: null,
    amount: null,
    references_prior_order: referencesPriorOrder,
    confidence: 0.7,
    needs_clarification: false,
  }

  return parsedOrderSchema.parse(result)
}