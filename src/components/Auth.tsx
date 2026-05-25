import { useState, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { auth } from '../firebase';
import { LayoutDashboard, Phone, Mail } from 'lucide-react';
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en.json';
import 'react-phone-number-input/style.css';

// Add the calling code to each country name in the dropdown
const customLabels = { ...en } as Record<string, string>;
for (const country in customLabels) {
  if (country !== 'ZZ') {
    try {
      customLabels[country] = `${customLabels[country]} (+${getCountryCallingCode(country as any)})`;
    } catch (e) {
      // Ignore regions without calling codes
    }
  }
}

const CustomCountrySelect = ({ value, onChange, options, iconComponent: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', height: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '0 0.5rem'
        }}
      >
        {Icon && <Icon country={value} label={selectedOption?.label || ''} />}
        <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>▼</span>
      </button>

      {isOpen && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          maxHeight: '250px',
          overflowY: 'auto',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0',
          margin: 0,
          listStyle: 'none',
          zIndex: 1000,
          width: '320px',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)'
        }}>
          {options.map((option: any, index: number) => {
            if (option.divider) {
              return <li key={`divider-${index}`} style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />;
            }
            return (
              <li 
                key={option.value || 'ZZ'}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                style={{
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  background: option.value === value ? 'var(--surface-hover)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
                onMouseOut={(e) => e.currentTarget.style.background = option.value === value ? 'var(--surface-hover)' : 'transparent'}
              >
                {Icon && <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}><Icon country={option.value} label={option.label} /></div>}
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {option.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Auth state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clean up recaptcha if component unmounts
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  // If Firebase is not configured yet
  if (!auth) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-xl)', maxWidth: '500px', textAlign: 'center' }}>
          <LayoutDashboard size={48} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Firebase Not Configured</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please update <code style={{color: 'var(--accent-pink)'}}>src/firebase.ts</code> with your Firebase project configuration to enable multi-tenant authentication and database sync.
          </p>
        </div>
      </div>
    );
  }

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("Recaptcha not initialized");

      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your phone number format (e.g. +1 555-555-5555).');
      // Reset recaptcha so the user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError('');
    setLoading(true);

    try {
      await confirmationResult.confirm(otpCode);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setConfirmationResult(null);
    setOtpCode('');
    setError('');
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <LayoutDashboard size={40} style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }} />
          <h2>{authMode === 'email' ? (isLogin ? 'Welcome Back' : 'Create Account') : 'Phone Sign In'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {authMode === 'email' 
              ? (isLogin ? 'Sign in to access your workspace' : 'Sign up to create a new workspace')
              : 'Enter your phone number to continue'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-pink)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: authMode === 'email' ? 'var(--surface-primary)' : 'transparent', color: authMode === 'email' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => { setAuthMode('email'); setError(''); }}
          >
            <Mail size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Email
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: authMode === 'phone' ? 'var(--surface-primary)' : 'transparent', color: authMode === 'phone' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => { setAuthMode('phone'); setError(''); }}
          >
            <Phone size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }}/> Phone
          </button>
        </div>

        {authMode === 'email' ? (
          <>
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '0.6rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>OR CONTINUE WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                style={{ color: 'var(--accent-blue)', fontWeight: 500 }}
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </>
        ) : (
          <>
            {!confirmationResult ? (
              <form onSubmit={requestOTP}>
                <div className="form-group custom-phone-wrapper">
                  <label className="form-label">Phone Number</label>
                  <PhoneInput
                    countrySelectComponent={CustomCountrySelect}
                    placeholder="Enter phone number"
                    defaultCountry="US"
                    value={phoneNumber}
                    labels={customLabels}
                    onChange={(val) => setPhoneNumber(val || '')}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? 'Sending SMS...' : 'Send Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOTP}>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '0.2rem', fontSize: '1.2rem' }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                    onClick={resetPhoneAuth}
                  >
                    Use a different phone number
                  </button>
                </div>
              </form>
            )}
            {/* Required div for reCAPTCHA to attach to */}
            <div id="recaptcha-container"></div>
          </>
        )}
      </div>
    </div>
  );
}
