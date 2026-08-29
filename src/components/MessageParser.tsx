import { useState } from 'react'
import { parseMessage } from '../parser/parseMessage'
import type { ParsedOrder } from '../schemas/orderSchema'

export function MessageParser() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<ParsedOrder | null>(null)

  function handleParse() {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      setResult(null)
      return
    }

    setResult(parseMessage(trimmedMessage))
  }

  return (
    <section className="parser-card">
      <div className="parser-heading">
        <div>
          <p className="eyebrow">MESSAGE PARSER</p>
          <h2>Create an order</h2>
        </div>
      </div>

      <label className="message-label" htmlFor="customer-message">
        Customer’s WhatsApp message
      </label>

      <textarea
        id="customer-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Example: 2 kurta navy blue chest 40"
        rows={4}
      />

      <button
        className="parse-button"
        type="button"
        onClick={handleParse}
      >
        Parse message
      </button>

      {result && (
        <div className="parser-result">
          <div className="result-heading">
            <h3>Structured result</h3>

            <span
              className={
                result.needs_clarification
                  ? 'clarification warning'
                  : 'clarification success'
              }
            >
              {result.needs_clarification
                ? 'Needs clarification'
                : 'Ready'}
            </span>
          </div>

          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  )
}