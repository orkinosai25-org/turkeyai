import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const SOURCE_LABELS = { file: '📄 File', url: '🔗 URL', note: '📝 Note' };
const SOURCE_COLORS = { file: '#e8f5e9', url: '#e3f2fd', note: '#fff8e1' };
const SOURCE_TEXT_COLORS = { file: '#2e7d32', url: '#1565c0', note: '#f57f17' };

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'hotel_info', label: 'Hotel / Resort Info' },
  { value: 'local_news', label: 'Local News' },
  { value: 'area_guide', label: 'Area Guide' },
  { value: 'proximity_info', label: 'Proximity Info (bars, restaurants, etc.)' },
  { value: 'weather_event', label: 'Weather / Event Alert' },
];

const LOCATION_SUGGESTIONS = [
  'Bodrum', 'Gumbet', 'Marmaris', 'Fethiye', 'Antalya', 'Cappadocia',
  'Istanbul', 'Kusadasi', 'Izmir', 'Oludeniz', 'Kalkan', 'Alanya',
];

function TagInput({ value, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('');

  function addTag(tag) {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInputVal('');
  }

  function removeTag(tag) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.4rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', background: 'white', cursor: 'text' }}>
      {value.map(tag => (
        <span key={tag} style={{ background: 'var(--aegean-blue)', color: 'white', borderRadius: '12px', padding: '0.15rem 0.55rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {tag}
          <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.85rem' }}>×</button>
        </span>
      ))}
      <input
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputVal); }
          if (e.key === 'Backspace' && !inputVal && value.length) removeTag(value[value.length - 1]);
        }}
        onBlur={() => inputVal.trim() && addTag(inputVal)}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{ border: 'none', outline: 'none', minWidth: 120, fontSize: '0.875rem', flex: 1 }}
        list="location-suggestions"
      />
      <datalist id="location-suggestions">
        {LOCATION_SUGGESTIONS.map(l => <option key={l} value={l} />)}
      </datalist>
    </div>
  );
}

function KnowledgeManager() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'upload' | 'url' | 'note'
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // Upload file state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('general');
  const fileInputRef = useRef(null);

  // URL state
  const [urlValue, setUrlValue] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlTags, setUrlTags] = useState([]);
  const [urlCategory, setUrlCategory] = useState('local_news');

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState([]);
  const [noteCategory, setNoteCategory] = useState('general');

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await axios.get(`${API_BASE}/api/knowledge`);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      if (err.response?.status !== 404) {
        showFeedback('error', 'Failed to load knowledge items. Is the server running?');
      }
    } finally {
      setLoadingItems(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (activeTab === 'list') fetchItems();
  }, [activeTab, fetchItems]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) return showFeedback('error', 'Please select a file.');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle || uploadFile.name);
    formData.append('location_tags', uploadTags.join(','));
    formData.append('content_category', uploadCategory);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/knowledge/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showFeedback('success', `✅ File "${res.data.item?.title || uploadFile.name}" uploaded${res.data.indexed ? ' and indexed in Azure Search' : ' (Azure Search indexing unavailable)'}.`);
      setUploadFile(null);
      setUploadTitle('');
      setUploadTags([]);
      setUploadCategory('general');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('list');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlIngest(e) {
    e.preventDefault();
    if (!urlValue.trim()) return showFeedback('error', 'Please enter a URL.');

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/knowledge/url`, {
        url: urlValue.trim(),
        title: urlTitle || urlValue,
        location_tags: urlTags,
        content_category: urlCategory
      });
      showFeedback('success', `✅ URL content fetched${res.data.indexed ? ' and indexed in Azure Search' : ''}.`);
      setUrlValue('');
      setUrlTitle('');
      setUrlTags([]);
      setUrlCategory('local_news');
      setActiveTab('list');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to fetch URL content.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNoteAdd(e) {
    e.preventDefault();
    if (!noteContent.trim()) return showFeedback('error', 'Note content is required.');

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/knowledge/note`, {
        title: noteTitle || noteContent.slice(0, 80),
        content: noteContent.trim(),
        location_tags: noteTags,
        content_category: noteCategory
      });
      showFeedback('success', `✅ Note added${res.data.indexed ? ' and indexed in Azure Search' : ''}.`);
      setNoteTitle('');
      setNoteContent('');
      setNoteTags([]);
      setNoteCategory('general');
      setActiveTab('list');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to add note.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete knowledge item "${title}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/knowledge/${id}`);
      showFeedback('success', `🗑️ "${title}" deleted.`);
      fetchItems();
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Delete failed.');
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px',
    border: '1px solid #d1d5db', fontSize: '0.875rem', boxSizing: 'border-box',
    outline: 'none'
  };
  const labelStyle = { display: 'block', fontWeight: 600, color: 'var(--warm-slate-700)', marginBottom: '0.35rem', fontSize: '0.85rem' };
  const formGroupStyle = { marginBottom: '1rem' };
  const tabBtn = (tab) => ({
    padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
    background: activeTab === tab ? 'var(--aegean-blue)' : 'white',
    color: activeTab === tab ? 'white' : 'var(--warm-slate-700)',
    boxShadow: activeTab === tab ? '0 2px 8px rgba(31,111,175,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'all 0.15s'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.9rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
            🧠 Knowledge Manager
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1rem' }}>
            Teach the AI agent about Turkish destinations, local news, and hotel insights.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '0.9rem 1.2rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem',
            background: feedback.type === 'success' ? '#f0fdf4' : '#fff5f5',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fc8181'}`,
            color: feedback.type === 'success' ? '#166534' : '#c53030'
          }}>
            {feedback.message}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <button style={tabBtn('list')} onClick={() => setActiveTab('list')}>📋 Knowledge Items ({total})</button>
          <button style={tabBtn('upload')} onClick={() => setActiveTab('upload')}>📄 Upload File</button>
          <button style={tabBtn('url')} onClick={() => setActiveTab('url')}>🔗 Add URL</button>
          <button style={tabBtn('note')} onClick={() => setActiveTab('note')}>📝 Add Note</button>
        </div>

        {/* ── List tab ──────────────────────────────────────────── */}
        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--aegean-blue)', fontSize: '1.1rem', margin: 0 }}>
                Indexed Knowledge Items
              </h2>
              <button
                onClick={fetchItems}
                disabled={loadingItems}
                style={{ padding: '0.45rem 1rem', background: 'white', border: '1.5px solid var(--aegean-blue)', borderRadius: '6px', color: 'var(--aegean-blue)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {loadingItems ? '⏳ Loading…' : '🔄 Refresh'}
              </button>
            </div>

            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warm-slate-500)' }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧠</div>
                <h3 style={{ color: 'var(--aegean-blue)', marginBottom: '0.5rem' }}>No knowledge items yet</h3>
                <p style={{ color: 'var(--warm-slate-500)', marginBottom: '1.5rem' }}>
                  Upload files, add URLs, or write notes to teach the AI agent about Turkish destinations.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['upload', 'url', 'note'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.6rem 1.2rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                      {tab === 'upload' ? '📄 Upload File' : tab === 'url' ? '🔗 Add URL' : '📝 Add Note'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map(item => (
                  <div key={item.id} style={{ background: 'white', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ background: SOURCE_COLORS[item.source_type], color: SOURCE_TEXT_COLORS[item.source_type], borderRadius: '12px', padding: '0.15rem 0.55rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          {SOURCE_LABELS[item.source_type] || item.source_type}
                        </span>
                        {item.is_indexed && (
                          <span style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: '12px', padding: '0.15rem 0.55rem', fontSize: '0.75rem', fontWeight: 600 }}>✓ Indexed</span>
                        )}
                        {item.content_category && item.content_category !== 'general' && (
                          <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: '12px', padding: '0.15rem 0.55rem', fontSize: '0.75rem' }}>
                            {CATEGORY_OPTIONS.find(c => c.value === item.content_category)?.label || item.content_category}
                          </span>
                        )}
                      </div>
                      <h4 style={{ color: 'var(--aegean-blue)', margin: '0 0 0.25rem', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </h4>
                      {item.content_preview && (
                        <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                          {item.content_preview}{item.content_preview?.length >= 200 ? '…' : ''}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(item.location_tags || []).map(tag => (
                          <span key={tag} style={{ background: 'rgba(31,111,175,0.08)', color: 'var(--aegean-blue)', borderRadius: '10px', padding: '0.1rem 0.45rem', fontSize: '0.73rem', fontWeight: 500 }}>
                            📍 {tag}
                          </span>
                        ))}
                        <span style={{ color: 'var(--warm-slate-400)', fontSize: '0.73rem', marginLeft: 'auto' }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aegean-blue)', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                          🔗 {item.source_url.slice(0, 60)}{item.source_url.length > 60 ? '…' : ''}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.1rem', padding: '0.2rem', flexShrink: 0 }}
                      onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upload file tab ───────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.25rem' }}>📄 Upload a Document</h2>
            <p style={{ color: 'var(--warm-slate-500)', marginTop: 0, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Upload a text file (.txt, .md, .csv, .json, .html) about a Turkish destination. The content will be indexed so the AI agent can use it.
            </p>
            <form onSubmit={handleUpload}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>File *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.html,.htm"
                  onChange={e => setUploadFile(e.target.files[0] || null)}
                  style={{ ...inputStyle, padding: '0.5rem' }}
                />
                <p style={{ color: 'var(--warm-slate-400)', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>
                  Supported formats: .txt, .md, .csv, .json, .html (max 10 MB)
                </p>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Title (optional)</label>
                <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Leave blank to use file name" style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Location Tags</label>
                <TagInput value={uploadTags} onChange={setUploadTags} placeholder="e.g. Bodrum, Gumbet (press Enter)" />
                <p style={{ color: 'var(--warm-slate-400)', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>Tag with destination names so the AI uses this when answering questions about those places.</p>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Category</label>
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} style={inputStyle}>
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !uploadFile} style={{ padding: '0.7rem 1.5rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: uploadFile ? 'pointer' : 'not-allowed', opacity: uploadFile ? 1 : 0.6, fontSize: '0.9rem' }}>
                {loading ? '⏳ Uploading…' : '📤 Upload & Index'}
              </button>
            </form>
          </div>
        )}

        {/* ── URL tab ───────────────────────────────────────────── */}
        {activeTab === 'url' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.25rem' }}>🔗 Add URL</h2>
            <p style={{ color: 'var(--warm-slate-500)', marginTop: 0, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Paste a URL (news article, guide, blog post). The page content will be fetched and indexed.
            </p>
            <form onSubmit={handleUrlIngest}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>URL *</label>
                <input type="url" value={urlValue} onChange={e => setUrlValue(e.target.value)} placeholder="https://www.example.com/bodrum-flood-news" style={inputStyle} required />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Title (optional)</label>
                <input type="text" value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="Leave blank to use URL" style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Location Tags</label>
                <TagInput value={urlTags} onChange={setUrlTags} placeholder="e.g. Bodrum, Marmaris (press Enter)" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Category</label>
                <select value={urlCategory} onChange={e => setUrlCategory(e.target.value)} style={inputStyle}>
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !urlValue.trim()} style={{ padding: '0.7rem 1.5rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: urlValue.trim() ? 'pointer' : 'not-allowed', opacity: urlValue.trim() ? 1 : 0.6, fontSize: '0.9rem' }}>
                {loading ? '⏳ Fetching…' : '🔗 Fetch & Index'}
              </button>
            </form>
          </div>
        )}

        {/* ── Note tab ─────────────────────────────────────────── */}
        {activeTab === 'note' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.25rem' }}>📝 Add a Note</h2>
            <p style={{ color: 'var(--warm-slate-500)', marginTop: 0, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Quickly pass knowledge to the AI agent: recent events, venue changes, local tips, etc.
            </p>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e' }}>
              💡 <strong>Examples:</strong> "There was a bad flood in Bodrum yesterday, some beach roads are closed."  ·  "The famous La Luna beach bar near Gumbet is now closed."  ·  "Hotel Bodrum Bay has a new rooftop bar with Aegean views."
            </div>
            <form onSubmit={handleNoteAdd}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Title (optional)</label>
                <input type="text" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Short summary (auto-generated if blank)" style={inputStyle} />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Content *</label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Write what you know about this destination, event, or change…"
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Location Tags</label>
                <TagInput value={noteTags} onChange={setNoteTags} placeholder="e.g. Bodrum, Gumbet (press Enter)" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Category</label>
                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)} style={inputStyle}>
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !noteContent.trim()} style={{ padding: '0.7rem 1.5rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: noteContent.trim() ? 'pointer' : 'not-allowed', opacity: noteContent.trim() ? 1 : 0.6, fontSize: '0.9rem' }}>
                {loading ? '⏳ Saving…' : '💾 Save & Index'}
              </button>
            </form>
          </div>
        )}

        {/* Info box */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          <h4 style={{ color: 'var(--aegean-blue)', marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            ℹ️ How Learning Works
          </h4>
          <ul style={{ color: 'var(--warm-slate-600)', fontSize: '0.85rem', lineHeight: 2, margin: 0, paddingLeft: '1.25rem' }}>
            <li><strong>File Upload</strong> – Upload .txt or .md guides about hotels, neighbourhoods, and experiences.</li>
            <li><strong>URL Ingestion</strong> – Paste a news article or web page; the text is extracted and indexed.</li>
            <li><strong>Notes</strong> – Type any update directly (flood alerts, venue closures, special events).</li>
            <li>All items are stored in the database and indexed in <strong>Azure AI Search</strong> for semantic retrieval.</li>
            <li>The AI agent's <code>searchKnowledgeBase</code> tool queries this index when answering destination questions.</li>
            <li>Requires <code>AZURE_SEARCH_ENDPOINT</code> and <code>AZURE_SEARCH_API_KEY</code> to be configured, and the knowledge index created (<code>npm run knowledge:create-index</code>).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeManager;
