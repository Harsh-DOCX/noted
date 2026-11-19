import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import GoogleButton from './GoogleButton';

function Signup({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function continueWithGoogle(credential) {
    navigate('/signup/google', { state: { credential } });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/login/new-user', {
        method: 'POST',
        body: JSON.stringify({
          username: form.get('username'),
          fullName: form.get('fullName'),
          email: form.get('email'),
          password: form.get('password'),
          recoveryQuestion: form.get('recoveryQuestion'),
          recoveryAnswer: form.get('recoveryAnswer'),
        }),
      });
      onLogin(result.token);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-card" aria-labelledby="signup-title">
      <p className="page-eyebrow">GET STARTED</p>
      <h1 id="signup-title">Create an account</h1>
      <p className="page-description">Sign up to start collecting and sharing your notes.</p>
      <form className="page-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" type="text" autoComplete="username" required />
        </label>
        <label>
          Name
          <input name="fullName" type="text" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength="8" required />
        </label>
        <label>
          Recovery question
          <input name="recoveryQuestion" type="text" required />
        </label>
        <label>
          Recovery answer
          <input name="recoveryAnswer" type="text" required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="form-note">Already have an account? <Link to="/login">Log in</Link></p>
      <div className="auth-divider">or</div>
      <GoogleButton onCredential={continueWithGoogle} />
    </section>
  );
}

export default Signup;

export function GoogleSignup({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const credential = location.state?.credential;

  if (!credential) return <Navigate to="/signup" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/login/google/new-user', {
        method: 'POST',
        body: JSON.stringify({
          credential,
          username: form.get('username'),
          password: form.get('password'),
          recoveryQuestion: form.get('recoveryQuestion'),
          recoveryAnswer: form.get('recoveryAnswer'),
        }),
      });
      onLogin(result.token);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-card" aria-labelledby="google-signup-title">
      <p className="page-eyebrow">FINISH SIGNING UP</p>
      <h1 id="google-signup-title">Complete your account</h1>
      <p className="page-description">
        Your Google account provides your verified email. Choose a username,
        password, and recovery question to finish.
      </p>
      <form className="page-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" type="text" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength="8" required />
        </label>
        <label>
          Recovery question
          <input name="recoveryQuestion" type="text" required />
        </label>
        <label>
          Recovery answer
          <input name="recoveryAnswer" type="text" required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Finish sign up'}
        </button>
      </form>
      <p className="form-note">Already registered? <Link to="/login">Log in</Link></p>
    </section>
  );
}
