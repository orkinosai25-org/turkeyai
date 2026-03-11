import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Merhaba 👋 I\'m TürkiyeAI. Tell me what kind of trip you\'re dreaming of to Türkiye, and I\'ll help you plan the perfect adventure!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await axios.post('/api/chat', {
        message: input,
        conversationHistory
      });

      const aiMessage = {
        role: 'ai',
        content: response.data.response
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const responseData = error.response?.data;
      let errorContent;
      if (responseData?.error === 'Azure OpenAI not configured') {
        const hint = responseData?.hint || 'Please contact the site administrator to configure Azure OpenAI credentials.';
        errorContent = `The AI travel agent is not yet configured. ${hint}`;
      } else {
        const errorDetail = responseData?.details || error.message || 'Unknown error';
        errorContent = `Sorry, I encountered an error: ${errorDetail}. Please make sure the Azure OpenAI configuration is set up correctly.`;
      }
      const errorMessage = {
        role: 'ai',
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page">
      <h1 style={{ color: 'var(--aegean-blue)', marginBottom: '1rem' }}>
        🤖 AI Travel Agent
      </h1>
      <p style={{ color: 'var(--warm-slate-500)', marginBottom: '2rem' }}>
        Chat with our AI assistant to plan your Turkish vacation
      </p>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                {message.role === 'user' ? 'You' : 'TürkiyeAI'}
              </strong>
              {message.content}
            </div>
          ))}
          {loading && (
            <div className="message ai">
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                TürkiyeAI
              </strong>
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about Turkey..."
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--soft-beige)', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>💡 Try asking:</h4>
        <ul style={{ color: 'var(--warm-slate-700)', lineHeight: '1.8' }}>
          <li>"What's the best time to visit Bodrum?"</li>
          <li>"Recommend a 5-day itinerary for Cappadocia"</li>
          <li>"What are the must-see attractions in Antalya?"</li>
          <li>"How do I get from Istanbul to Fethiye?"</li>
        </ul>
      </div>
    </div>
  );
}

export default Chat;
