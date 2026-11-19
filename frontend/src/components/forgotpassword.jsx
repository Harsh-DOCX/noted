import { Link } from 'react-router-dom';

function ForgotPassword() {
  return (
    <section className="page-card" aria-labelledby="forgotpassword-title">
      <p className="page-eyebrow">ACCOUNT RECOVERY</p>
      <h1 id="forgotpassword-title">Forgot password?</h1>
      <p className="page-description">Password recovery is not available yet. Please contact the site administrator for help.</p>
      <p className="form-note"><Link to="/login">Back to log in</Link></p>
    </section>
  );
}

export default ForgotPassword;
