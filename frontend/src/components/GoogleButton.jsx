import { useEffect, useRef, useState } from 'react';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.querySelector('#google-identity-script') || document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded.')), { once: true });
    if (!script.isConnected) document.head.appendChild(script);
  });
}

function GoogleButton({ onCredential }) {
  const button = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState('');

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;

    let active = true;
    loadGoogleScript()
      .then(() => {
        if (!active || !button.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredentialRef.current(response.credential),
        });
        window.google.accounts.id.renderButton(button.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 300,
        });
      })
      .catch((loadError) => setError(loadError.message));

    return () => {
      active = false;
    };
  }, []);

  if (!clientId) {
    return (
      <div>
        <button className="google-disabled" type="button" disabled>Continue with Google</button>
        <p className="google-note">Set REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
      </div>
    );
  }

  return (
    <div className="google-button-wrap">
      <div ref={button} />
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

export default GoogleButton;
