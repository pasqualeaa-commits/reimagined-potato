import React from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const stars = [...Array(5)].map((_, index) => {
    const ratingValue = index + 1;
    return (
      <label key={index}>
        <input
          type="radio"
          name="rating"
          value={ratingValue}
          onClick={() => !readOnly && onRatingChange(ratingValue)}
          className="star-input"
        />
        <FaStar
          className={`star-icon ${!readOnly ? 'star-icon-interactive' : ''}`}
          color={ratingValue <= rating ? "#facc15" : "#e4e5e9"}
          size={24}
        />
      </label>
    );
  });

  return <div className="star-rating-container">{stars}</div>;
};

export default StarRating;