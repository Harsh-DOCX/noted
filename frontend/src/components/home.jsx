import { Link } from 'react-router-dom';

function Home({ isLoggedIn }) {
  return (
    <section className="welcome-panel">
      <p className="page-eyebrow">YOUR SPACE FOR IDEAS</p>
      <h1>Good thoughts<br />belong somewhere.</h1>
      <p className="page-description">Keep the PDF notes you want to remember, all in one place.</p>
      <div className="welcome-actions">
        {isLoggedIn ? (
          <>
            <Link className="primary-button" to="/addnote">Add a PDF</Link>
            <Link className="secondary-button" to="/notes">Browse notes</Link>
          </>
        ) : (
          <Link className="primary-button" to="/login">Log in to get started</Link>
        )}
      </div>
    </section>
  );
}

export default Home;
