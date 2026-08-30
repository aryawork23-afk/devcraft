type CustomerDefinition = {
  name: string
  aliases: string[]
}

const customerVocabulary: CustomerDefinition[] = [
  { name: 'Naveen', aliases: ['Naveen ji', 'Naveen'] },
  { name: 'Kavita', aliases: ['Kavita ji', 'Kavita'] },
  { name: 'Priya', aliases: ['Priya'] },
  { name: 'Rakesh', aliases: ['Rakesh bhai', 'Rakesh'] },
  { name: 'Manoj', aliases: ['Manoj ji', 'Manoj'] },
  { name: 'Sunita', aliases: ['Sunita ji', 'Sunita'] },
  { name: 'Ramesh', aliases: ['Ramesh ji', 'Ramesh'] },
  { name: 'Meena aunty', aliases: ['Meena aunty'] },
  { name: 'Tarun', aliases: ['Tarun'] },
  { name: 'Deepak bhai', aliases: ['Deepak bhai'] },
  { name: 'Shalini', aliases: ['Shalini'] },
  { name: 'Vikram', aliases: ['Vikram'] },
  { name: 'Sarita didi', aliases: ['Sarita didi'] },
  { name: 'Neha', aliases: ['Neha'] },
  { name: 'Anil ji', aliases: ['Anil ji', 'Anil'] },
  { name: 'Asha', aliases: ['Asha'] },
  { name: 'Farida', aliases: ['Farida ji', 'Farida'] },
  { name: 'Gopal ji', aliases: ['Gopal ji', 'Gopal'] },
  { name: 'Iqbal bhai', aliases: ['Iqbal bhai', 'Iqbal'] },
]

export function extractKnownCustomer(
  originalMessage: string,
): string | null {
  const lowerMessage = originalMessage.toLowerCase()

  const candidates = customerVocabulary.flatMap((customer) =>
    customer.aliases.flatMap((alias) => {
      const index = lowerMessage.indexOf(alias.toLowerCase())

      if (index === -1) {
        return []
      }

      return [{
        customer: customer.name,
        alias,
        index,
      }]
    }),
  )

  candidates.sort((first, second) => {
    if (first.index === second.index) {
      return second.alias.length - first.alias.length
    }

    return first.index - second.index
  })

  const usableCandidates = candidates.filter((candidate) => {
    const textAfterName = lowerMessage.slice(
      candidate.index + candidate.alias.length,
      candidate.index + candidate.alias.length + 30,
    )

    const nameIsNegated =
      /^\s*(?:ke\s+liye\s+|ke\s+naam\s+se\s+)?nahi\b/.test(
        textAfterName,
      )

    return !nameIsNegated
  })

  if (usableCandidates.length === 0) {
    return null
  }

  return usableCandidates[
    usableCandidates.length - 1
  ].customer
}