/**
 * Chat component — only rendered when USE_LLM = True in routes.py.
 *
 * Shows a message history and a chat input bar at the bottom.
 * When the backend returns a search_term event, it calls onSearchTerm
 * to update the search bar and results above.
 */
import { useState, useRef, useEffect } from 'react'
import SearchIcon from './assets/mag.png'
import { WineResult } from './types'
import ReactMarkdown from 'react-markdown'

interface Message {
  text: string
  isUser: boolean
}

interface ChatProps {
  onSearchTerm: (term: string) => void
  currentSearchTerm?: string
  currentResults?: WineResult[]
  pendingMessage: string | null
  clearPendingMessage: () => void
  selectedWine: WineResult | null
}

function Chat({
  onSearchTerm,
  currentSearchTerm,
  currentResults,
  pendingMessage,
  clearPendingMessage,
  selectedWine,
}: ChatProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! 👋 I'm your personal POURFECT wine assistant. Ask me anything about wine!",
      isUser: false,
    },
  ])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (pendingMessage) {
      void sendTextMessage(pendingMessage)
      clearPendingMessage()
    }
  }, [pendingMessage])

  /*const sendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { text, isUser: true }])
    setInput('')
    setLoading(true)
    inputRef.current?.focus()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentSearchTerm,
          currentResults,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setMessages(prev => [
          ...prev,
          { text: 'Error: ' + (data.error || response.status), isUser: false },
        ])
        setLoading(false)
        return
      }

      let assistantText = ''
      setMessages(prev => [...prev, { text: '', isUser: false }])
      setLoading(false)

      const reader = response.body?.getReader()
      if (!reader) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { text: 'Error: No response body found.', isUser: false },
        ])
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.search_term !== undefined) {
              onSearchTerm(data.search_term)
            }

            if (data.error) {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { text: 'Error: ' + data.error, isUser: false },
              ])
              return
            }

            if (data.content !== undefined) {
              assistantText += data.content
              setMessages(prev => [
                ...prev.slice(0, -1),
                { text: assistantText, isUser: false },
              ])
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { text: 'Something went wrong. Check the console.', isUser: false },
      ])
      setLoading(false)
    }
  }*/

  const sendTextMessage = async (text: string): Promise<void> => {
    if (!text || loading) return

    setMessages(prev => [...prev, { text, isUser: true }])
    setInput('')
    setLoading(true)
    inputRef.current?.focus()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentSearchTerm,
          currentResults,
          selectedWine,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setMessages(prev => [
          ...prev,
          { text: 'Error: ' + (data.error || response.status), isUser: false },
        ])
        setLoading(false)
        return
      }

      let assistantText = ''
      setMessages(prev => [...prev, { text: '', isUser: false }])
      setLoading(false)

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.search_term !== undefined) {
              onSearchTerm(data.search_term)
            }

            if (data.content !== undefined) {
              assistantText += data.content
              setMessages(prev => [
                ...prev.slice(0, -1),
                { text: assistantText, isUser: false },
              ])
            }
          } catch { }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { text: 'Something went wrong.', isUser: false },
      ])
      setLoading(false)
    }
  }

  const sendMessage = (e: React.FormEvent): void => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    void sendTextMessage(text)
  }

  return (
    <>
      <div id="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.isUser ? 'user' : 'assistant'}`}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {loading && (
          <div className="loading-indicator visible">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-bar">
        <form className="input-row" onSubmit={sendMessage}>
          <img src={SearchIcon} alt="" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything about wine..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={false}
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>Send</button>
        </form>
      </div>
    </>
  )
}

export default Chat