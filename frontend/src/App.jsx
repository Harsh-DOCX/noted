import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import About from './components/About';
import AddNote from './components/addnote';
import Contact from './components/Contact';
import Footer from './components/footer';
import ForgotPassword from './components/forgotpassword';
import Home from './components/home';
import Login from './components/login';
import Navbar from './components/navbar';
import Notes from './components/notes';
import Signup, { GoogleSignup } from './components/signup';

function PrivatePage({ token, children }) {
  const location = useLocation();
  return token ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function AppPages() {
  const [token, setToken] = useState(localStorage.getItem('noted-token') || '');

  function logIn(newToken) {
    localStorage.setItem('noted-token', newToken);
    setToken(newToken);
  }

  function logOut() {
    localStorage.removeItem('noted-token');
    setToken('');
  }

  return (
    <div className="app-shell">
      <Navbar isLoggedIn={Boolean(token)} onLogout={logOut} />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Home isLoggedIn={Boolean(token)} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<Signup onLogin={logIn} />} />
          <Route path="/signup/google" element={<GoogleSignup onLogin={logIn} />} />
          <Route path="/login" element={<Login onLogin={logIn} />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/addnote" element={
            <PrivatePage token={token}><AddNote token={token} /></PrivatePage>
          } />
          <Route path="/notes" element={
            <PrivatePage token={token}><Notes token={token} /></PrivatePage>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppPages />
    </BrowserRouter>
  );
}

export default App;
