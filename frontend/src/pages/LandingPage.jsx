import React from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
  { name: 'Buy', description: 'Looking for a laptop or computer? We source quality devices at great prices.' },
  { name: 'Sell', description: 'Sell your old device to us quickly and hassle-free.' },
  { name: 'Upgrade', description: 'Boost your machine with RAM, SSD, or other hardware upgrades.' },
  { name: 'Repair', description: 'Screen replacements, motherboard repairs, virus removal, and more.' },
  { name: 'General Enquiry', description: 'Not sure what you need? Send us a message and we\'ll help.' },
];

function LandingPage() {
  return (
    <main>
      <header>
        <h1>TechFix Repair Shop</h1>
        <p>
          Your local experts for laptop and computer repairs, upgrades, and trade-ins.
          Whether you need a quick fix or a full system overhaul, we've got you covered.
        </p>
      </header>

      <section aria-label="Contact Information">
        <h2>Contact Us</h2>
        <p>Email: <a href="mailto:contact@techfixrepair.com">contact@techfixrepair.com</a></p>
        <p>Phone: <a href="tel:+441234567890">+44 1234 567890</a></p>
      </section>

      <section aria-label="Services">
        <h2>Our Services</h2>
        <ul>
          {SERVICES.map((service) => (
            <li key={service.name}>
              <strong>{service.name}</strong>: {service.description}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Account">
        <Link to="/register">Register</Link>
        {' | '}
        <Link to="/login">Login</Link>
      </nav>
    </main>
  );
}

export default LandingPage;
