import React, { useState } from 'react';
import StarRating from './StarRating';

const CommentForm = ({ onAddComment }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim() || rating === 0) {
      alert("Per favore, inserisci un commento e una valutazione.");
      return;
    }

    const newComment = {
      rating,
      comment,
      is_anonymous: isAnonymous,
      author: isAnonymous ? 'Utente Anonimo' : authorName.trim() || 'Utente Sconosciuto',
    };

    onAddComment(newComment);
    // Reset form fields
    setRating(0);
    setComment('');
    setIsAnonymous(false);
    setAuthorName('');
  };

  return (
    <div className="comment-form-card">
      <h3 className="comment-form-title">Lascia una recensione</h3>
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form-group">
          <label className="comment-form-label">La tua valutazione:</label>
          <div className="comment-form-center">
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
        </div>
        <div className="comment-form-group">
          <label htmlFor="comment" className="comment-form-label">Il tuo commento:</label>
          <textarea
            id="comment"
            rows="5"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="comment-form-textarea"
            placeholder="Scrivi qui la tua recensione..."
            required
          />
        </div>
        <div className="comment-form-checkbox-container">
          <input
            type="checkbox"
            id="isAnonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="comment-form-checkbox"
          />
          <label htmlFor="isAnonymous" className="comment-form-checkbox-label">Pubblica in forma anonima</label>
        </div>
        {!isAnonymous && (
          <div className="comment-form-group">
            <label htmlFor="authorName" className="comment-form-label">Il tuo nome (opzionale):</label>
            <input
              type="text"
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="comment-form-input"
              placeholder="Es: Mario Rossi"
            />
          </div>
        )}
        <button
          type="submit"
          className="comment-form-submit-button"
        >
          Invia Recensione
        </button>
      </form>
    </div>
  );
};

export default CommentForm;