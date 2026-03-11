import React, { useState } from 'react';

function HighlightCarousel({ highlights }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  if (!highlights || highlights.length === 0) return null;

  const current = highlights[currentIndex];

  const goToPrev = (e) => {
    e.stopPropagation();
    setImgError(false);
    setCurrentIndex((prev) => (prev === 0 ? highlights.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setImgError(false);
    setCurrentIndex((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (idx, e) => {
    e.stopPropagation();
    setImgError(false);
    setCurrentIndex(idx);
  };

  return (
    <div className="highlight-carousel">
      <div className="carousel-image-wrapper">
        {!imgError ? (
          <img
            key={current.image}
            src={current.image}
            alt={current.title}
            className="carousel-image"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="carousel-image-fallback">
            <span>{current.title}</span>
          </div>
        )}
        {highlights.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrev}
              aria-label="Previous highlight"
            >
              &#8249;
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNext}
              aria-label="Next highlight"
            >
              &#8250;
            </button>
          </>
        )}
      </div>

      <div className="carousel-caption">
        <h4 className="carousel-title">{current.title}</h4>
        <p className="carousel-description">{current.description}</p>
      </div>

      {highlights.length > 1 && (
        <div className="carousel-dots">
          {highlights.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot${idx === currentIndex ? ' active' : ''}`}
              onClick={(e) => goToSlide(idx, e)}
              aria-label={`Go to highlight ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HighlightCarousel;
