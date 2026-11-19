import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

function Notes({ token }) {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/notes/get-notes', { token })
      .then(setNotes)
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  return (
    <section className="page-card notes-page" aria-labelledby="notes-title">
      <p className="page-eyebrow">YOUR COLLECTION</p>
      <h1 id="notes-title">Notes</h1>
      <p className="page-description">Your saved PDF notes.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notes.length ? (
        <ul className="pdf-list">
          {notes.map((note) => (
            <li className="pdf-item" key={note._id}>
              <span className="pdf-type" aria-hidden="true">PDF</span>
              <span className="pdf-name">{note.title || 'Untitled PDF'}</span>
              <a className="pdf-open" href={note.document} target="_blank" rel="noreferrer">Open PDF</a>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="empty-notes">You haven’t added a PDF yet.</p>
      )}
      <Link className="primary-button" to="/addnote">Add a PDF</Link>
    </section>
  );
}

export default Notes;
