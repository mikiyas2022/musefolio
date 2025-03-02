import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    experience: '',
    interests: [] as string[],
    portfolioType: '',
  });

  const roles = [
    { id: 'designer', label: 'Designer', icon: 'palette' },
    { id: 'developer', label: 'Developer', icon: 'code' },
    { id: 'photographer', label: 'Photographer', icon: 'camera' },
    { id: 'artist', label: 'Artist', icon: 'paint-brush' },
  ];

  const experiences = [
    { id: 'student', label: 'Student' },
    { id: 'junior', label: 'Junior (1-3 years)' },
    { id: 'mid', label: 'Mid-Level (3-5 years)' },
    { id: 'senior', label: 'Senior (5+ years)' },
  ];

  const interests = [
    { id: 'ui', label: 'UI Design', icon: 'desktop' },
    { id: 'web', label: 'Web Development', icon: 'globe' },
    { id: 'mobile', label: 'Mobile Apps', icon: 'mobile' },
    { id: 'branding', label: 'Branding', icon: 'brush' },
    { id: '3d', label: '3D Design', icon: 'cube' },
    { id: 'motion', label: 'Motion Design', icon: 'film' },
  ];

  const portfolioTypes = [
    {
      id: 'minimal',
      label: 'Minimal',
      description: 'Clean and simple design focused on your work',
      icon: 'sparkles',
    },
    {
      id: 'creative',
      label: 'Creative',
      description: 'Bold and artistic layout to showcase your creativity',
      icon: 'palette',
    },
    {
      id: 'professional',
      label: 'Professional',
      description: 'Traditional layout perfect for corporate portfolios',
      icon: 'briefcase',
    },
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // TODO: Save onboarding data
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleInterest = (interest: string) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    updateFormData('interests', newInterests);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-background">
        <div className="gradient-sphere"></div>
        <div className="mesh-grid"></div>
      </div>
      <div className="onboarding-content">
        <div className="onboarding-header">
          <div className="progress-bar">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`progress-step ${i <= step ? 'active' : ''} ${
                  i < step ? 'completed' : ''
                }`}
              >
                <div className="step-number">{i}</div>
                <div className="step-line"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-card">
          {step === 1 && (
            <div className="onboarding-step">
              <h2>What's your role?</h2>
              <p>Help us personalize your experience</p>
              <div className="role-grid">
                {roles.map(role => (
                  <button
                    key={role.id}
                    className={`role-button ${
                      formData.role === role.id ? 'selected' : ''
                    }`}
                    onClick={() => updateFormData('role', role.id)}
                  >
                    <i className={`fas fa-${role.icon}`}></i>
                    <span>{role.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>Your experience level</h2>
              <p>This helps us recommend the right templates</p>
              <div className="experience-grid">
                {experiences.map(exp => (
                  <button
                    key={exp.id}
                    className={`experience-button ${
                      formData.experience === exp.id ? 'selected' : ''
                    }`}
                    onClick={() => updateFormData('experience', exp.id)}
                  >
                    <span>{exp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2>What are you interested in?</h2>
              <p>Select all that apply</p>
              <div className="interests-grid">
                {interests.map(interest => (
                  <button
                    key={interest.id}
                    className={`interest-button ${
                      formData.interests.includes(interest.id) ? 'selected' : ''
                    }`}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    <i className={`fas fa-${interest.icon}`}></i>
                    <span>{interest.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-step">
              <h2>Choose your portfolio style</h2>
              <p>Don't worry, you can customize it later</p>
              <div className="portfolio-type-grid">
                {portfolioTypes.map(type => (
                  <button
                    key={type.id}
                    className={`portfolio-type-button ${
                      formData.portfolioType === type.id ? 'selected' : ''
                    }`}
                    onClick={() => updateFormData('portfolioType', type.id)}
                  >
                    <i className={`fas fa-${type.icon}`}></i>
                    <div className="type-content">
                      <span className="type-label">{type.label}</span>
                      <span className="type-description">{type.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="onboarding-actions">
            {step > 1 && (
              <button className="back-button" onClick={handleBack}>
                <i className="fas fa-arrow-left"></i>
                Back
              </button>
            )}
            <button
              className="next-button"
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.role) ||
                (step === 2 && !formData.experience) ||
                (step === 3 && formData.interests.length === 0) ||
                (step === 4 && !formData.portfolioType)
              }
            >
              {step === 4 ? 'Get Started' : 'Continue'}
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 