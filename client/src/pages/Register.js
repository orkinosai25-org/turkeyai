import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'TR', name: 'Turkey' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'CA', name: 'Canada' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'RU', name: 'Russia' },
];

const TRAVEL_INTERESTS = [
  { id: 'beach', label: 'Beach & Sun', icon: '🏖️' },
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure & Outdoors', icon: '🧗' },
  { id: 'wellness', label: 'Wellness & Spa', icon: '💆' },
  { id: 'food', label: 'Food & Cuisine', icon: '🍽️' },
  { id: 'luxury', label: 'Luxury Stays', icon: '✨' },
  { id: 'family', label: 'Family Travel', icon: '👨‍👩‍👧‍👦' },
  { id: 'nightlife', label: 'Nightlife', icon: '🎉' },
  { id: 'nature', label: 'Nature & Scenery', icon: '🌿' },
  { id: 'sailing', label: 'Sailing & Cruising', icon: '⛵' },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Address' },
    { n: 3, label: 'Preferences' },
  ];
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: '2rem' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', margin: '0 auto 0.4rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem',
              background: current >= s.n ? 'var(--aegean-blue)' : 'var(--warm-sand)',
              color: current >= s.n ? 'white' : 'var(--warm-slate-500)',
              border: current === s.n ? '3px solid var(--azure-turquoise)' : '3px solid transparent',
              transition: 'all 0.3s',
            }}>
              {current > s.n ? '✓' : s.n}
            </div>
            <div style={{ fontSize: '0.75rem', color: current >= s.n ? 'var(--aegean-blue)' : 'var(--warm-slate-500)', fontWeight: current === s.n ? 700 : 400 }}>
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 0.3, display: 'flex', alignItems: 'center', paddingBottom: '1.2rem' }}>
              <div style={{ flex: 1, height: 2, background: current > s.n ? 'var(--aegean-blue)' : 'var(--warm-sand)', transition: 'all 0.3s' }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Social Login Buttons ─────────────────────────────────────────────────────
function SocialButtons({ onSocial, loading }) {
  const providers = [
    { id: 'google', label: 'Google', icon: 'G', bg: '#4285F4', color: 'white' },
    { id: 'facebook', label: 'Facebook', icon: 'f', bg: '#1877F2', color: 'white' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'in', bg: '#0A66C2', color: 'white' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
      {providers.map(p => (
        <button
          key={p.id}
          disabled={loading}
          onClick={() => onSocial(p.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #ddd',
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
            background: 'white', color: 'var(--warm-charcoal)', width: '100%',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#f8f8f8'; e.currentTarget.style.borderColor = p.bg; }}
          onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd'; }}
        >
          <span style={{ width: 28, height: 28, borderRadius: '4px', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{p.icon}</span>
          Continue with {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Registration Component ──────────────────────────────────────────────
function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1 state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('GB');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');

  // Step 3 state
  const [interests, setInterests] = useState([]);
  const [newsletter, setNewsletter] = useState(true);
  const [terms, setTerms] = useState(false);

  function toggleInterest(id) {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  // Password strength indicator
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  const pwStrength = getPasswordStrength(password);
  const pwColors = ['#ddd', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#2fa4a9'];
  const pwLabels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

  function validateStep1() {
    if (!firstName.trim() || firstName.trim().length < 2) return 'First name must be at least 2 characters.';
    if (!email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.]+\.[a-zA-Z]{2,}$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  function validateStep2() {
    if (!address.trim()) return 'Please enter your address.';
    if (!postcode.trim()) return 'Please enter your postcode / ZIP.';
    return null;
  }

  function handleNextStep() {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
    window.scrollTo(0, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!terms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        first_name: firstName, last_name: lastName,
        email, password, confirm_password: confirmPassword,
        phone, country_code: countryCode, address, postcode,
        travel_interests: interests,
        newsletter_opt_in: newsletter,
        terms_accepted: terms,
      });

      localStorage.setItem('turkiyeai_token', res.data.token);
      localStorage.setItem('turkiyeai_user', JSON.stringify(res.data.user));
      setSuccess(res.data.message);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider) {
    setError('');
    setLoading(true);
    try {
      // In production, trigger the OAuth flow here.
      // For demo/development, show what would happen.
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth requires configuration. In production, this initiates the OAuth 2.0 flow. Please use email registration for now.`);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid var(--warm-sand)',
    borderRadius: '8px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s',
    background: 'white',
  };

  const labelStyle = {
    display: 'block', marginBottom: '0.4rem', fontWeight: 600,
    fontSize: '0.875rem', color: 'var(--warm-slate-700)',
  };

  const fieldStyle = { marginBottom: '1.1rem' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--aegean-blue) 0%, var(--azure-turquoise) 100%)', padding: '2rem', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🇹🇷</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Join TürkiyeAI</h1>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: 0 }}>Your AI travel companion for Türkiye</p>
        </div>

        <div style={{ padding: '2rem' }}>
          <StepIndicator current={step} />

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#c53030', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fff4', border: '1px solid #68d391', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#276749', fontSize: '0.875rem' }}>
              ✅ {success}
            </div>
          )}

          {/* ── STEP 1: Account Details ── */}
          {step === 1 && (
            <>
              <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>Account Details</h2>
              <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Create your TürkiyeAI account</p>

              <SocialButtons onSocial={handleSocial} loading={loading} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--warm-sand)' }} />
                <span style={{ color: 'var(--warm-slate-500)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or continue with email</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--warm-sand)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Emma" required />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Wilson" />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="emma@example.com" required />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: '3rem' }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-slate-500)', padding: 0 }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(pwStrength / 5) * 100}%`, height: '100%', background: pwColors[pwStrength], transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                  </div>
                )}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#fc8181' : undefined }}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
                {confirmPassword && confirmPassword !== password && (
                  <span style={{ fontSize: '0.75rem', color: '#e53e3e' }}>Passwords do not match</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                style={{ width: '100%', padding: '0.85rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Continue to Address Details →
              </button>
            </>
          )}

          {/* ── STEP 2: Contact & Address ── */}
          {step === 2 && (
            <>
              <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>Contact & Address</h2>
              <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Used for booking confirmation and support</p>

              <div style={fieldStyle}>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Country *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Address *</label>
                <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="12 High Street, London" required />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Postcode / ZIP *</label>
                <input style={inputStyle} value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="SW1A 1AA" required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(1); }}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--soft-beige)', color: 'var(--warm-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{ flex: 2, padding: '0.75rem', background: 'var(--aegean-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Continue to Preferences →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Travel Preferences ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ color: 'var(--aegean-blue)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>Travel Preferences</h2>
              <p style={{ color: 'var(--warm-slate-500)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Help us personalise your AI travel experience</p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>What are you interested in? (select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {TRAVEL_INTERESTS.map(interest => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      style={{
                        padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1.5px solid',
                        cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        borderColor: interests.includes(interest.id) ? 'var(--aegean-blue)' : 'var(--warm-sand)',
                        background: interests.includes(interest.id) ? 'rgba(31,111,175,0.08)' : 'white',
                        color: interests.includes(interest.id) ? 'var(--aegean-blue)' : 'var(--warm-slate-700)',
                        fontWeight: interests.includes(interest.id) ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{interest.icon}</span> {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--warm-slate-700)' }}>
                  <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                  Send me inspiration, travel deals, and TürkiyeAI updates (unsubscribe any time)
                </label>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--warm-slate-700)' }}>
                  <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: '0.15rem', flexShrink: 0 }} required />
                  <span>
                    I agree to the{' '}
                    <a href="#terms" style={{ color: 'var(--aegean-blue)' }}>Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#privacy" style={{ color: 'var(--aegean-blue)' }}>Privacy Policy</a>
                    {' '}*
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(2); }}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--soft-beige)', color: 'var(--warm-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !terms}
                  style={{
                    flex: 2, padding: '0.85rem',
                    background: terms ? 'var(--aegean-blue)' : 'var(--warm-sand)',
                    color: terms ? 'white' : 'var(--warm-slate-500)',
                    border: 'none', borderRadius: '8px', fontWeight: 700, cursor: terms ? 'pointer' : 'not-allowed',
                    fontSize: '0.95rem',
                  }}
                >
                  {loading ? '⏳ Creating account...' : '🇹🇷 Create My Account'}
                </button>
              </div>
            </form>
          )}

          {/* Sign-in Link */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--warm-slate-500)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--aegean-blue)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
