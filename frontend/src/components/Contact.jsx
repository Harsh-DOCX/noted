function Contact() {
  return (
    <section className="page-card" aria-labelledby="contact-title">
      <p className="page-eyebrow">GET IN TOUCH</p>
      <h1 id="contact-title">Contact us</h1>
      <p className="page-description">Have a question or an idea? Send us a message.</p>
      <form className="page-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Your name
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Message
          <textarea name="message" rows="5" required />
        </label>
        <button className="primary-button" type="submit">Send message</button>
      </form>
      <p className="about-tip">This demo form does not send data to a server yet.</p>
    </section>
  );
}

export default Contact;
