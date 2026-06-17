import React, { useState, useEffect } from 'react';
import './AnimatedHeroTitle.css';

const AnimatedHeroTitle = () => {
  const [language, setLanguage] = useState('arabic');

  useEffect(() => {
    const interval = setInterval(() => {
      setLanguage(prev => prev === 'arabic' ? 'english' : 'arabic');
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const arabicText = 'نيومارت بيوتي';
  const englishText = 'Neomart Beauty';

  return (
    <div className="animated-hero-title-container">
      <div className="animated-hero-title-wrapper">
        <h1
          className="animated-hero-title"
          key={language}
        >
          <span
            className={`animated-hero-text text-gradient ${language === 'arabic' ? 'active' : 'inactive'}`}
            dir="rtl"
          >
            {arabicText}
          </span>
          <span
            className={`animated-hero-text text-gradient ${language === 'english' ? 'active' : 'inactive'}`}
            dir="ltr"
          >
            {englishText}
          </span>
        </h1>
      </div>
    </div>
  );
};

export default AnimatedHeroTitle;
