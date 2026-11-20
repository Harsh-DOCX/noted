import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

function Notes({ token }) {
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const pdfObjectUrls = useRef(new Set());

  useEffect(() => {
    Promise.all([
      apiRequest('/notes/get-notes', { token }),
      apiRequest('/login/me', { token }),
    ])
      .then(([loadedNotes, profile]) => {
        setNotes(loadedNotes);
        setUser(profile.user);
      })
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  useEffect(() => () => {
    pdfObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function openPdf(noteId) {
    setError('');
    const pdfWindow = window.open('about:blank', '_blank');
    if (!pdfWindow) {
      setError('Allow pop-ups to open this PDF.');
      return;
    }

    try {
      const pdf = await apiRequest(`/notes/${noteId}/document`, { token, responseType: 'blob' });
      const objectUrl = URL.createObjectURL(pdf);
      pdfObjectUrls.current.add(objectUrl);
      pdfWindow.opener = null;
      pdfWindow.location.href = objectUrl;
    } catch (openError) {
      pdfWindow.close();
      setError(openError.message);
    }
  }

  async function deleteNote(noteId) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;

    setError('');
    setDeletingId(noteId);
    try {
      await apiRequest(`/notes/${noteId}`, { token, method: 'DELETE' });
      setNotes((currentNotes) => currentNotes.filter((note) => note._id !== noteId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="page-card notes-page" aria-labelledby="notes-title">
      <h1 id="notes-title">Notes</h1>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notes.length ? (
        <ul className="pdf-list">
          {notes.map((note) => (
            <li className="pdf-item" key={note._id}>
              <span className="pdf-type" aria-hidden="true">PDF</span>
              <span className="pdf-name">{note.title || 'Untitled PDF'}</span>
              <button className="pdf-open" type="button" onClick={() => openPdf(note._id)}>
                Open PDF
              </button>
              {(user?.isAdmin || String(note.uploadedBy?._id || note.uploadedBy) === String(user?.id)) && (
                <button
                  className="note-delete"
                  type="button"
                  onClick={() => deleteNote(note._id)}
                  disabled={Boolean(deletingId)}
                >
                  {deletingId === note._id ? 'Deleting…' : 'Delete'}
                </button>
              )}
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
