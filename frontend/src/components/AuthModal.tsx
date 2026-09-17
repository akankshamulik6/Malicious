import React, { useState } from 'react';
import {
  X,
  Sprout,
  Lock,
  Mail,
  User as UserIcon,
  Globe,
  AlertTriangle,
} from 'lucide-react';

import { loginUser, registerUser } from '../services/api';
import type { User, ApiError } from '../types/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.8rem 0.65rem 2.4rem',
    borderRadius: '10px',
    border: '1px solid var(--border-light)',
    fontSize: '0.85rem',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.35rem',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw { message: 'Name is required.' };
        }

        if (!email.trim()) {
          throw { message: 'Email is required.' };
        }

        if (!password.trim()) {
          throw { message: 'Password is required.' };
        }

        const res = await registerUser(
          name.trim(),
          email.trim(),
          password,
          language
        );

        onAuthSuccess(res.user);
      } else {
        if (!email.trim()) {
          throw { message: 'Email is required.' };
        }

        if (!password.trim()) {
          throw { message: 'Password is required.' };
        }

        const res = await loginUser(email.trim(), password);

        onAuthSuccess(res.user);
      }

      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);

      const apiErr = err as ApiError;

      setError(
        apiErr?.message ||
          err?.response?.data?.detail ||
          'Authentication failed. Please check your credentials.'
      );
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setPassword('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 36, 24, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="card-surface animate-fade-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          backgroundColor: '#ffffff',
          color: '#111111',
          borderRadius: '18px',
          boxSizing: 'border-box',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.4rem',
            borderRadius: '50%',
            backgroundColor: '#f1f5f2',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color="#4b5563" />
        </button>

        {/* Brand Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-sage)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(45, 90, 39, 0.25)',
            }}
          >
            <Sprout size={26} />
          </div>

          <h3
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--primary-deep)',
              margin: 0,
            }}
          >
            {isRegister
              ? 'Create Farmer Account'
              : 'Welcome to GreenMind'}
          </h3>

          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              marginTop: '0.35rem',
              marginBottom: 0,
            }}
          >
            {isRegister
              ? 'Access AI diagnostics & regional advisory'
              : 'Sign in to view field scans & dashboard'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--status-diseased-bg)',
              color: 'var(--status-diseased-text)',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Name */}
          {isRegister && (
            <div>
              <label style={labelStyle}>Full Name</label>

              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={17}
                  color="#6b7280"
                  style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                />

                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>

            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                color="#6b7280"
                style={{
                  position: 'absolute',
                  left: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              />

              <input
                type="email"
                required
                placeholder="farmer@agri.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>

            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                color="#6b7280"
                style={{
                  position: 'absolute',
                  left: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              />

              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  isRegister ? 'new-password' : 'current-password'
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Language */}
          {isRegister && (
            <div>
              <label style={labelStyle}>Preferred Language</label>

              <div style={{ position: 'relative' }}>
                <Globe
                  size={17}
                  color="#6b7280"
                  style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'auto',
                    cursor: 'pointer',
                  }}
                >
                  <option value="en" style={{ color: '#111111' }}>
                    English (en)
                  </option>

                  <option value="hi" style={{ color: '#111111' }}>
                    Hindi (hi)
                  </option>

                  <option value="mr" style={{ color: '#111111' }}>
                    Marathi (mr)
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '0.5rem',
              padding: '0.8rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Processing...'
              : isRegister
                ? 'Register Account'
                : 'Sign In'}
          </button>
        </form>

        {/* Switch Login/Register */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          {isRegister
            ? 'Already have an account?'
            : "Don't have an account yet?"}{' '}

          <button
            type="button"
            onClick={switchMode}
            style={{
              fontWeight: 700,
              color: 'var(--primary-sage)',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};