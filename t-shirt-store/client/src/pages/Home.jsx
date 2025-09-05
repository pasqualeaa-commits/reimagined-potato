import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CommentForm from '../components/CommentForm';
import StarRating from '../components/StarRating';
import { FaStar } from 'react-icons/fa';

const Home = ({ user }) => {
  const [comments, setComments] = useState([]);

  // Fetch dei commenti dal backend all'avvio del componente
  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch('https://reimagined-potato-1.onrender.com/api/comments');
      if (!response.ok) {
        throw new Error('Errore durante il recupero dei commenti');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  const addComment = async (newComment) => {
    try {
      const response = await fetch('https://reimagined-potato-1.onrender.com/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComment),
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'invio del commento');
      }
      const savedComment = await response.json();
      setComments([savedComment, ...comments]);
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  return (
    <div className="home-container min-h-screen bg-gray-50 flex flex-col items-center pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
        {user
          ? `Benvenuto in Lost in Translation, ${user.firstName}!`
          : 'Benvenuto in Lost in Translation!'}
      </h2>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl">
        Scopri la nostra selezione curata di prodotti unici e di alta qualità.
      </p>

      <div className="w-full max-w-4xl mb-12 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 ease-in-out transform hover:scale-102">
        <video className="w-full h-auto" controls autoPlay loop muted>
          <source src="https://res.cloudinary.com/dezd83teo/video/upload/v1756455525/samples/dance-2.mp4" type="video/mp4" />
          Il tuo browser non supporta il tag video.
        </video>
      </div>

      <Link
        to="/products"
        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 mb-10"
      >
        Esplora i Prodotti
      </Link>

      <div className="mt-6 flex space-x-4">
        {!user && (
          <>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium transition duration-200">
              Accedi
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium transition duration-200">
              Registrati
            </Link>
          </>
        )}
      </div>

      {/* Sezione Commenti e Recensioni */}
      <div className="comments-section">
        <h2 className="comments-title">
          Cosa dicono i nostri clienti
        </h2>
        
        {/* Componente per l'aggiunta di un commento */}
        <div className="comment-form-container">
          <CommentForm onAddComment={addComment} />
        </div>
        
        {/* Lista dei commenti esistenti */}
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <div className="comment-header">
                  <div className="comment-author">
                    <span className="mr-2">{comment.author}</span>
                    {comment.is_anonymous && (
                        <span className="comment-anonymous-tag">Anonimo</span>
                    )}
                  </div>
                  <div className="comment-date">{new Date(comment.created_at).toLocaleDateString('it-IT')}</div>
                </div>
                <div className="comment-rating">
                  <StarRating rating={comment.rating} readOnly={true} />
                </div>
                <p className="comment-text">
                  "{comment.comment}"
                </p>
              </div>
            ))
          ) : (
            <p className="no-comments">
              Ancora nessuna recensione. Sii il primo a condividere la tua esperienza!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;