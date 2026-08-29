import type { Domain } from './parseMessage'
import type { ParsedItem } from '../schemas/orderSchema'

type AttributeValue = string | number | boolean
type Attributes = Record<string, AttributeValue>

const quantityWords = [
  'ek',
  'do',
  'teen',
  'char',
  'chaar',
  'paanch',
  'chhe',
  'che',
  'saat',
  'aath',
  'nau',
  'das',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
]

export function extractAmount(text: string): number | null {
  const rupeeBeforeMatch = text.match(
    /₹\s*(\d+(?:\.\d+)?)/,
  )

  if (rupeeBeforeMatch) {
    return Number(rupeeBeforeMatch[1])
  }

  const currencyAfterMatch = text.match(
    /\b(\d+(?:\.\d+)?)\s*(?:rs|rupees|rupaye|रुपये)\b/,
  )

  if (currencyAfterMatch) {
    return Number(currencyAfterMatch[1])
  }

  const budgetPhraseMatch = text.match(
    /\b(?:total|amount|budget)\s*(?:is|hai|ka|ki|:)?\s*₹?\s*(\d+(?:\.\d+)?)/,
  )

  if (budgetPhraseMatch) {
    return Number(budgetPhraseMatch[1])
  }

  const amountWithMeMatch = text.match(
    /\b(\d{2,})\s*(?:me|mein)\b/,
  )

  if (amountWithMeMatch) {
    return Number(amountWithMeMatch[1])
  }

  const wordAmountPatterns: Array<[RegExp, number]> = [
    [/\bdedh hazaar\s*(?:rs|rupaye|me|mein)?\b/, 1500],
    [/\bdo hazaar\s*(?:rs|rupaye|me|mein)\b/, 2000],
    [/\bek hazaar\s*(?:rs|rupaye|me|mein)\b/, 1000],
  ]

  for (const [pattern, amount] of wordAmountPatterns) {
    if (pattern.test(text)) {
      return amount
    }
  }

  return null
}

export function extractPriorOrderReference(text: string): boolean {
  const negativePriorPatterns = [
    'pichli baar jaisa nahi',
    'pichli baar wala nahi',
    'last time jaisa nahi',
    'pehle jaisa nahi',
    'is baar naya',
  ]

  if (
    negativePriorPatterns.some((pattern) =>
      text.includes(pattern),
    )
  ) {
    return false
  }

  const positivePriorPatterns = [
    'last time jaisa',
    'last time wala',
    'pichli baar jaisa',
    'pichli baar wala',
    'pehle jaisa',
    'same as before',
  ]

  return positivePriorPatterns.some((pattern) =>
    text.includes(pattern),
  )
}

export function hasContradictoryQuantity(
  text: string,
): boolean {
  const quantityPattern = [
    '\\d+',
    ...quantityWords,
  ].join('|')

  const contradictionPattern = new RegExp(
    `\\b(?:${quantityPattern})\\s+(?:ya|or)\\s+(?:${quantityPattern})\\b`,
  )

  return contradictionPattern.test(text)
}

type ClarificationInput = {
  text: string
  domain: Domain
  items: ParsedItem[]
  extractedAttributes: Attributes
  deadlineMentioned: boolean
  dueDate: string | null
}

export function shouldNeedClarification({
  text,
  domain,
  items,
  extractedAttributes,
  deadlineMentioned,
  dueDate,
}: ClarificationInput): boolean {
  // Rule A: No identifiable item.
  if (items.length === 0) {
    return true
  }

  // Rule B: Contradictory quantity, such as "do ya teen".
  if (hasContradictoryQuantity(text)) {
    return true
  }

  // Rule C: A deadline was mentioned but has no exact date.
  if (deadlineMentioned && dueDate === null) {
    return true
  }

  // Rule D1: A baker cannot begin without a flavour.
  if (
    domain === 'baker' &&
    !('flavour' in extractedAttributes)
  ) {
    return true
  }

  // Rule D2: An electrician needs to know the issue.
  if (
    domain === 'electrician' &&
    !('issue' in extractedAttributes)
  ) {
    return true
  }

  return false
}