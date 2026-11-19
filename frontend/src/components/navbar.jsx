import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'Home'],
  ['/about', 'About us'],
  ['/contact', 'Contact us'],
  ['/signup', 'Sign up'],
  ['/login', 'Log in'],
];

function Navbar({ isLoggedIn, onLogout }) {
  return (
    <header className="site-header">
      <nav className="page-nav" aria-label="Main navigation">
        {links.map(([path, label]) => (
          <NavLink
            key={path}
            className={({ isActive }) => (isActive ? 'page-nav-link is-active' : 'page-nav-link')}
            to={path}
            end={path === '/'}
          >
            {label}
          </NavLink>
        ))}
        {isLoggedIn && (
          <>
            <NavLink className="page-nav-link" to="/notes">Notes</NavLink>
            <NavLink className="page-nav-link" to="/addnote">Add PDF</NavLink>
            <button className="logout-button" type="button" onClick={onLogout}>Log out</button>
          </>
        )}
      </nav>
      <NavLink className="logo-link" to="/" aria-label="Noted home">
        <img className="site-logo" src="/noted-logo.svg" alt="Noted" />
      </NavLink>
    </header>
  );
}

export default Navbar;
