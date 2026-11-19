import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

function AddNote({ token }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF file to continue.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF files must be 10 MB or smaller.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read this file.'));
        reader.readAsDataURL(file);
      });
      const document = fileData.replace(/^data:[^;]+;base64,/, 'data:application/pdf;base64,');
      await apiRequest('/notes/upload', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: title || file.name.replace(/\.pdf$/i, ''), document }),
      });
      navigate('/notes');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-card" aria-labelledby="addnote-title">
      <p className="page-eyebrow">ADD A PDF</p>
      <h1 id="addnote-title">Add a note</h1>
      <p className="page-description">Choose a PDF file to add it to your notes.</p>
      <form className="page-form" onSubmit={handleSubmit}>
        <label>
          Note title
          <input
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength="100"
          />
        </label>
        <label>
          PDF file
          <input
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const selectedFile = event.target.files[0] || null;
              if (selectedFile && selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
                setError('Only PDF files can be added as notes.');
                setFile(null);
                return;
              }
              setFile(selectedFile);
              setError('');
            }}
          />
        </label>
        {file && <p className="selected-file">Selected: {file.name}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Add PDF note'}
        </button>
      </form>
    </section>
  );
}

export default AddNote;
