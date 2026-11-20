import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import GoogleButton from './GoogleButton';

function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkCredential, setLinkCredential] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      onLogin(result.token);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credential) {
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest('/login/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      onLogin(result.token);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      if (requestError.status === 404) {
        navigate('/signup/google', { state: { credential } });
      } else if (requestError.status === 409) {
        setLinkCredential(credential);
      } else {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLink(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/login/google/link', {
        method: 'POST',
        body: JSON.stringify({
          credential: linkCredential,
          password: form.get('password'),
        }),
      });
      onLogin(result.token);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-card" aria-labelledby="login-title">
      <p className="page-eyebrow">WELCOME BACK</p>
      <h1 id="login-title">Log in</h1>
      <p className="page-description">Pick up where you left off.</p>
      <form className="page-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="form-note"><Link to="/forgotpassword">Forgot your password?</Link></p>
      <p className="form-note">New to Noted? <Link to="/signup">Create an account</Link></p>
      {linkCredential && (
        <form className="page-form google-link-form" onSubmit={handleGoogleLink}>
          <p className="page-description">
            This Google email already has an account. Enter its password to securely link Google sign-in.
          </p>
          <label>
            Account password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Linking…' : 'Link Google account'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLinkCredential('');
              setError('');
            }}
          >
            Cancel
          </button>
        </form>
      )}
      <div className="auth-divider">or</div>
      <GoogleButton onCredential={handleGoogleLogin} />
      {loading && <p className="google-note">Signing in…</p>}
    </section>
  );
}

export default Login;
