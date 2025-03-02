import React, { useRef, MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/shared.css';
import './Landing.css';

const Landing: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (elementRef: MutableRefObject<HTMLDivElement | null>) => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fullscreen-container">
      <nav className="landing-nav">
        <div className="content-container">
          <div className="nav-content">
            <h1 className="logo">Musefolio</h1>
            <div className="nav-links">
              <button onClick={() => scrollToSection(featuresRef)} className="nav-link">Features</button>
              <button onClick={() => scrollToSection(pricingRef)} className="nav-link">Pricing</button>
              <Link to="/login" className="modern-button secondary">Sign in</Link>
              <Link to="/register" className="modern-button glow">Start free →</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-background">
            <div className="gradient-sphere"></div>
            <div className="floating-elements"></div>
            <div className="hero-grid"></div>
          </div>
          <div className="content-container">
            <div className="hero-content">
              <div className="hero-badges">
                <span className="badge">
                  <span className="badge-pulse"></span>
                  AI-Powered Portfolio Builder
                </span>
                <span className="badge highlight">
                  <i className="fas fa-star"></i>
                  Trusted by 50K+ creators
                </span>
              </div>
              <h1 className="hero-title">
                Build Your Dream<br/>Portfolio Today
              </h1>
              <p className="hero-subtitle">
                Create stunning portfolios in minutes with AI-powered design tools. Stand out from
                the crowd with beautiful, professional showcases of your work.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="modern-button glow">
                  <i className="fas fa-rocket"></i>
                  Get started for free
                </Link>
                <Link to="/showcase" className="modern-button secondary">
                  <i className="fas fa-eye"></i>
                  View gallery
                </Link>
              </div>
              <div className="hero-features">
                <div className="hero-feature">
                  <i className="fas fa-wand-magic-sparkles"></i>
                  <span>AI-Powered Design</span>
                </div>
                <div className="hero-feature">
                  <i className="fas fa-bolt"></i>
                  <span>Deploy in Minutes</span>
                </div>
                <div className="hero-feature">
                  <i className="fas fa-chart-line"></i>
                  <span>Built-in Analytics</span>
                </div>
              </div>
              <div className="tech-stack">
                <span>Powered by cutting-edge tech</span>
                <div className="tech-icons">
                  <i className="fab fa-react" title="React"></i>
                  <i className="fab fa-node-js" title="Node.js"></i>
                  <i className="fas fa-database" title="MongoDB"></i>
                  <i className="fas fa-robot" title="AI Integration"></i>
                  <i className="fas fa-cloud" title="Cloud Infrastructure"></i>
                </div>
              </div>
              <div className="metrics">
                <div className="metric">
                  <span className="metric-value">50K+</span>
                  <span className="metric-label">Active Users</span>
                </div>
                <div className="metric-divider"></div>
                <div className="metric">
                  <span className="metric-value">100K+</span>
                  <span className="metric-label">Portfolios</span>
                </div>
                <div className="metric-divider"></div>
                <div className="metric">
                  <span className="metric-value">99%</span>
                  <span className="metric-label">Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="integrations-section">
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Integrations</span>
              <h2>Integrate with your tech stack</h2>
              <p>Connect seamlessly with your favorite tools and platforms</p>
            </div>
            <div className="integration-logos">
              <div className="logo-grid">
                <img src="/logos/github.svg" alt="GitHub" />
                <img src="/logos/gitlab.svg" alt="GitLab" />
                <img src="/logos/bitbucket.svg" alt="Bitbucket" />
                <img src="/logos/vercel.svg" alt="Vercel" />
                <img src="/logos/netlify.svg" alt="Netlify" />
                <img src="/logos/aws.svg" alt="AWS" />
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-section">
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Workflow</span>
              <h2>Build experiences blazingly fast</h2>
              <p>Create, customize, and deploy your portfolio in three simple steps</p>
            </div>
            <div className="workflow-steps">
              <div className="workflow-step">
                <span className="step-number">01</span>
                <div className="step-content">
                  <h3>Choose your template</h3>
                  <p>Select from our curated collection of professional templates or let AI generate one for you.</p>
                  <div className="step-image">
                    <img src="/images/step1.png" alt="Template Selection" />
                  </div>
                </div>
              </div>
              <div className="workflow-step">
                <span className="step-number">02</span>
                <div className="step-content">
                  <h3>Customize your design</h3>
                  <p>Use our intuitive editor to personalize your portfolio with AI-powered suggestions.</p>
                  <div className="step-image">
                    <img src="/images/step2.png" alt="Customization" />
                  </div>
                </div>
              </div>
              <div className="workflow-step">
                <span className="step-number">03</span>
                <div className="step-content">
                  <h3>Deploy and share</h3>
                  <p>Launch your portfolio with one click and share it with the world.</p>
                  <div className="step-image">
                    <img src="/images/step3.png" alt="Deployment" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="section-background">
            <div className="gradient-sphere"></div>
            <div className="mesh-grid"></div>
          </div>
        </section>

        <section ref={featuresRef} className="features-section">
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Features</span>
              <h2>Design experiences your users will love</h2>
              <p>Powerful tools and features to help you create exceptional portfolios</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-wand-magic-sparkles"></i>
                </div>
                <h3>AI-Powered Design</h3>
                <p>Let AI help you create stunning layouts and optimize your content</p>
                <ul className="feature-list">
                  <li>Smart layout suggestions</li>
                  <li>Content optimization</li>
                  <li>SEO recommendations</li>
                  <li>Design consistency</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-code"></i>
                </div>
                <h3>Code Export</h3>
                <p>Export your portfolio as clean, production-ready code</p>
                <ul className="feature-list">
                  <li>Multiple frameworks</li>
                  <li>Clean code output</li>
                  <li>Custom domains</li>
                  <li>Version control</li>
                </ul>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>Analytics & Insights</h3>
                <p>Track your portfolio's performance with detailed analytics</p>
                <ul className="feature-list">
                  <li>Real-time tracking</li>
                  <li>Visitor insights</li>
                  <li>Engagement metrics</li>
                  <li>Performance data</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="section-background">
            <div className="mesh-grid"></div>
          </div>
        </section>

        <section className="showcase-section">
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Showcase</span>
              <h2>Built by creators, for creators</h2>
              <p>See what others have built with Musefolio</p>
            </div>
            <div className="showcase-grid">
              <div className="showcase-item">
                <img src="/showcase/portfolio1.png" alt="Portfolio Example" />
                <div className="showcase-overlay">
                  <h4>Sarah's Design Portfolio</h4>
                  <p>UX Designer</p>
                  <a href="#" className="view-link">View Live Site →</a>
                </div>
              </div>
              <div className="showcase-item">
                <img src="/showcase/portfolio2.png" alt="Portfolio Example" />
                <div className="showcase-overlay">
                  <h4>Mark's Dev Portfolio</h4>
                  <p>Full Stack Developer</p>
                  <a href="#" className="view-link">View Live Site →</a>
                </div>
              </div>
              <div className="showcase-item">
                <img src="/showcase/portfolio3.png" alt="Portfolio Example" />
                <div className="showcase-overlay">
                  <h4>Emma's Art Portfolio</h4>
                  <p>Digital Artist</p>
                  <a href="#" className="view-link">View Live Site →</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pricing-section" ref={pricingRef}>
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Pricing</span>
              <h2>Scale without limits</h2>
              <p>Choose the plan that's right for you</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-header">
                  <h3>Starter</h3>
                  <p>Perfect for personal portfolios</p>
                </div>
                <div className="price">
                  <span className="amount">$0</span>
                  <span className="period">/month</span>
                </div>
                <ul className="pricing-features">
                  <li>1 Portfolio Site</li>
                  <li>Basic Analytics</li>
                  <li>Custom Domain</li>
                  <li>Community Support</li>
                </ul>
                <Link to="/register" className="modern-button secondary full-width">Get Started →</Link>
              </div>
              <div className="pricing-card featured">
                <div className="pricing-header">
                  <h3>Pro</h3>
                  <p>For professional creators</p>
                </div>
                <div className="price">
                  <span className="amount">$12</span>
                  <span className="period">/month</span>
                </div>
                <ul className="pricing-features">
                  <li>5 Portfolio Sites</li>
                  <li>Advanced Analytics</li>
                  <li>Custom Domains</li>
                  <li>Priority Support</li>
                  <li>AI Design Assistant</li>
                  <li>Code Export</li>
                </ul>
                <Link to="/register" className="modern-button glow full-width">Upgrade Now →</Link>
              </div>
            </div>
          </div>
          <div className="section-background">
            <div className="gradient-sphere"></div>
            <div className="mesh-grid"></div>
          </div>
        </section>

        <section className="testimonials-section">
          <div className="content-container">
            <div className="section-header">
              <span className="section-badge">Testimonials</span>
              <h2>Our customers ❤️ us</h2>
              <p>See what creators are saying about Musefolio</p>
            </div>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Musefolio has completely transformed how I showcase my work. The AI-powered features are truly game-changing!"</p>
                </div>
                <div className="testimonial-author">
                  <img src="/avatars/user1.jpg" alt="User" />
                  <div>
                    <h4>Sarah Chen</h4>
                    <p>UX Designer @ Google</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"The best portfolio platform I've used. Clean, modern, and incredibly powerful. The code export feature is a game-changer."</p>
                </div>
                <div className="testimonial-author">
                  <img src="/avatars/user2.jpg" alt="User" />
                  <div>
                    <h4>Mark Thompson</h4>
                    <p>Senior Developer @ Spotify</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Finally, a portfolio platform that understands designers. The AI suggestions are spot-on and save me hours of work."</p>
                </div>
                <div className="testimonial-author">
                  <img src="/avatars/user3.jpg" alt="User" />
                  <div>
                    <h4>Emma Rodriguez</h4>
                    <p>Freelance Designer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="content-container">
            <div className="cta-content">
              <span className="section-badge">Ready for take-off?</span>
              <h2>Start building your dream portfolio today</h2>
              <p>Join thousands of creators who trust Musefolio</p>
              <div className="cta-buttons">
                <Link to="/register" className="modern-button glow">Get started for free →</Link>
                <p className="cta-note">No credit card required</p>
              </div>
            </div>
          </div>
          <div className="cta-background">
            <div className="gradient-sphere"></div>
            <div className="floating-elements"></div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="content-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h2 className="logo">Musefolio</h2>
              <p>Create. Share. Inspire.</p>
              <div className="social-links">
                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <i className="fab fa-github"></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h3>Product</h3>
                <Link to="/features">Features</Link>
                <Link to="/pricing">Pricing</Link>
                <Link to="/showcase">Gallery</Link>
                <Link to="/roadmap">Roadmap</Link>
              </div>
              <div className="footer-section">
                <h3>Resources</h3>
                <Link to="/docs">Documentation</Link>
                <Link to="/blog">Blog</Link>
                <Link to="/changelog">Changelog</Link>
                <Link to="/status">Status</Link>
              </div>
              <div className="footer-section">
                <h3>Company</h3>
                <Link to="/about">About</Link>
                <Link to="/careers">Careers</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/legal">Legal</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Musefolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 