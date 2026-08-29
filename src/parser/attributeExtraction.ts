import type { Domain } from './parseMessage'

type AttributeValue = string | number | boolean
type Attributes = Record<string, AttributeValue>

const measurementWords: Record<string, number> = {
  athais: 28,
  tees: 30,
  battis: 32,
  chautis: 34,
  chhattis: 36,
  aadtis: 38,
  chalis: 40,
  bayalis: 42,
  chavalis: 44,
  chhiyalis: 46,
  adtalis: 48,
  saath: 60,
  assi: 80,
  sau: 100,
  hazaar: 1000,
}

function findListedValue(
  text: string,
  values: string[],
): string | null {
  return (
    [...values]
      .sort((first, second) => second.length - first.length)
      .find((value) => text.includes(value)) ?? null
  )
}

function findNumberAfterLabel(
  text: string,
  labels: string[],
): number | null {
  const numberWordPattern = Object.keys(measurementWords).join('|')

  for (const label of labels) {
    const match = text.match(
      new RegExp(
        `${label}\\s*(\\d+(?:\\.\\d+)?|${numberWordPattern})\\b`,
      ),
    )

    if (!match) {
      continue
    }

    if (/^\d+(?:\.\d+)?$/.test(match[1])) {
      return Number(match[1])
    }

    return measurementWords[match[1]] ?? null
  }

  return null
}

function extractTailorAttributes(text: string): Attributes {
  const attributes: Attributes = {}

  const color = findListedValue(text, [
    'navy blue',
    'bottle green',
    'maroon',
    'pink',
    'mustard',
    'beige',
    'grey',
    'white',
  ])

  const fabric = findListedValue(text, [
    'rayon',
    'linen',
    'chiffon',
    'silk',
    'velvet',
    'khadi',
  ])

  const fit = findListedValue(text, [
    'regular fit',
    'slim fit',
    'loose fit',
    'regular',
    'slim',
    'loose',
  ])

  const chest = findNumberAfterLabel(text, ['chest'])
  const waist = findNumberAfterLabel(text, ['waist'])
  const length = findNumberAfterLabel(text, ['length', 'lambai'])

  const sizeMatch = text.match(/\bsize\s*(xxl|xl|l|m|s)\b/i)

  if (color) {
    attributes.color = color
  }

  if (fabric) {
    attributes.fabric = fabric
  }

  if (fit) {
    attributes.fit = fit.replace(' fit', '')
  }

  if (chest !== null) {
    attributes.chest = chest
  }

  if (waist !== null) {
    attributes.waist = waist
  }

  if (length !== null) {
    attributes.length = length
  }

  if (sizeMatch) {
    attributes.size = sizeMatch[1].toUpperCase()
  }

  if (
    text.includes('three-quarter sleeve') ||
    text.includes('three quarter sleeve')
  ) {
    attributes.sleeve = 'three-quarter'
  } else if (text.includes('full sleeve')) {
    attributes.sleeve = 'full'
  } else if (text.includes('half sleeve')) {
    attributes.sleeve = 'half'
  }

  return attributes
}

function extractTiffinAttributes(text: string): Attributes {
  const attributes: Attributes = {}

  const meal = findListedValue(text, [
    'breakfast',
    'lunch',
    'dinner',
  ])

  const portion = findListedValue(text, [
    'extra portion',
    'full portion',
    'half portion',
    'extra',
    'full',
    'half',
  ])

  const daysMatch = text.match(/(\d+)\s*din\b/)
  const rotiCountMatch = text.match(/roti\s*(\d+)\b/)

  if (meal) {
    attributes.meal = meal
  }

  if (portion) {
    attributes.portion = portion.replace(' portion', '')
  }

  if (
    text.includes('spicy') ||
    text.includes('teekha') ||
    text.includes('tez mirchi')
  ) {
    attributes.spice_level = 'spicy'
  } else if (
    text.includes('mild') ||
    text.includes('kam mirchi')
  ) {
    attributes.spice_level = 'mild'
  } else if (
    text.includes('medium') ||
    text.includes('normal')
  ) {
    attributes.spice_level = 'medium'
  }

  if (daysMatch) {
    attributes.days = Number(daysMatch[1])
  }

  if (rotiCountMatch) {
    attributes.roti_count = Number(rotiCountMatch[1])
  }

  if (text.includes('non-jain') || text.includes('non jain')) {
    attributes.jain = false
  } else if (text.includes('jain')) {
    attributes.jain = true
  }

  return attributes
}

function extractElectricianAttributes(text: string): Attributes {
  const attributes: Attributes = {}

  const rooms = [
    'kitchen',
    'hall',
    'balcony',
    'bedroom',
    'terrace',
    'bathroom',
  ]

  const room = findListedValue(text, rooms)

  const brandMap: Record<string, string> = {
    havells: 'Havells',
    anchor: 'Anchor',
    polycab: 'Polycab',
    orient: 'Orient',
    usha: 'Usha',
    crompton: 'Crompton',
    bajaj: 'Bajaj',
  }

  const brandKey = findListedValue(text, Object.keys(brandMap))

  const appliance = findListedValue(text, [
    'fridge point',
    'geyser',
    'motor',
    'light',
    'fan',
    'ac',
  ])

  const wattageMatch = text.match(
    /(\d+)\s*(?:watt|watts|w)\b/,
  )

  if (room) {
    attributes.room = room
  }

  if (brandKey) {
    attributes.brand = brandMap[brandKey]
  }

  if (appliance) {
    attributes.appliance = appliance
  }

  if (wattageMatch) {
    attributes.wattage = Number(wattageMatch[1])
  } else {
    const wordWattage = findNumberAfterLabel(text, [
      '',
    ])

    if (
      wordWattage !== null &&
      text.includes('watt')
    ) {
      attributes.wattage = wordWattage
    }
  }

  if (
    text.includes('fuse blown') ||
    text.includes('fuse ud') ||
    text.includes('fuse uda')
  ) {
    attributes.issue = 'fuse blown'
  } else if (
    text.includes('leaking current') ||
    text.includes('current aa') ||
    text.includes('jhatka')
  ) {
    attributes.issue = 'leaking current'
  } else if (
    text.includes('short circuit') ||
    text.includes('short ho')
  ) {
    attributes.issue = 'short circuit'
  } else if (
    text.includes('spark') ||
    text.includes('chingari')
  ) {
    attributes.issue = 'spark'
  } else if (
    text.includes('noise') ||
    text.includes('awaaz')
  ) {
    attributes.issue = 'noise'
  } else if (
    text.includes('slow') ||
    text.includes('dheema')
  ) {
    attributes.issue = 'slow'
  } else if (
    text.includes('not working') ||
    text.includes('nahi chal') ||
    text.includes('band hai')
  ) {
    attributes.issue = 'not working'
  }

  return attributes
}

function extractBakerAttributes(text: string): Attributes {
  const attributes: Attributes = {}

  const flavour = findListedValue(text, [
    'red velvet',
    'black forest',
    'butterscotch',
    'pineapple',
    'strawberry',
    'chocolate',
    'vanilla',
    'coffee',
    'mango',
  ])

  const shape = findListedValue(text, [
    'round',
    'square',
    'heart',
  ])

  const weightMatch = text.match(
    /(\d+(?:\.\d+)?)\s*kg\b/,
  )

  const tierMatch = text.match(/(\d+)\s*tier\b/)

  if (flavour) {
    attributes.flavour = flavour
  }

  if (shape) {
    attributes.shape = shape
  }

  if (weightMatch) {
    attributes.weight_kg = Number(weightMatch[1])
  }

  if (tierMatch) {
    attributes.tier = Number(tierMatch[1])
  }

  if (
    text.includes('eggless') ||
    text.includes('egg free') ||
    text.includes('without egg')
  ) {
    attributes.egg_free = true
  } else if (
    text.includes('with egg') ||
    text.includes('anda wala')
  ) {
    attributes.egg_free = false
  }

  return attributes
}

export function extractAttributes(
  text: string,
  domain: Domain,
): Attributes {
  if (domain === 'tailor') {
    return extractTailorAttributes(text)
  }

  if (domain === 'tiffin') {
    return extractTiffinAttributes(text)
  }

  if (domain === 'electrician') {
    return extractElectricianAttributes(text)
  }

  return extractBakerAttributes(text)
}