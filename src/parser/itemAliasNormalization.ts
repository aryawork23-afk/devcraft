const aliasReplacements: Array<[RegExp, string]> = [
  // Tailor
  [/\bshart\b/g, 'shirt'],
  [/शर्ट/g, 'shirt'],
  [/\bwest\s+coat\b/g, 'waistcoat'],
  [/वेस्ट\s*कोट/g, 'waistcoat'],
  [/दुपट्टा/g, 'dupatta'],
  [/शेरवानी/g, 'sherwani'],
  [/कुर्ता/g, 'kurta'],
  [/सलवार/g, 'salwar'],

  // Tiffin
  [/इडली/g, 'idli'],
  [/थाली/g, 'thali'],
  [/पराठा/g, 'paratha'],
  [/\bdaal\b/g, 'dal'],
  [/दाल/g, 'dal'],
  [/चावल/g, 'rice'],
  [/छोले/g, 'chole'],
  [/पोहा/g, 'poha'],

  // Electrician
  [/\binvertor\b/g, 'inverter'],
  [/इन्वर्टर/g, 'inverter'],
  [/घंटी/g, 'doorbell'],
  [/\bexaust\s+fan\b/g, 'exhaust fan'],
  [/\bchimney\s+fan\b/g, 'exhaust fan'],
  [/\bfuse\s+box\b/g, 'mcb'],
  [/एमसीबी/g, 'mcb'],
  [/\bpankha\b/g, 'ceiling fan'],
  [/पंखा/g, 'ceiling fan'],
  [/सॉकेट/g, 'socket'],

  // Baker
  [/ब्रेड/g, 'bread'],
  [/कुकीज/g, 'cookies'],
  [/डोनट/g, 'donut'],
  [/केक/g, 'cake'],
  [/कपकेक/g, 'cupcake'],
]

export function normalizeItemAliases(text: string): string {
  let result = text

  for (const [pattern, replacement] of aliasReplacements) {
    result = result.replace(pattern, replacement)
  }

  // In the supplied electrician data, "fan wala" describes the
  // appliance attached to another item. It is not a second order item.
  result = result.replace(/\bfan\s+wala\b/g, 'appliance')

  // This dataset treats the geyser in this construction as the
  // appliance attribute of the water motor, not a second item.
  result = result.replace(
    /\bmotor\s+aur\s+geyser\s+dono\b/g,
    'motor aur appliance dono',
  )

  return result
}