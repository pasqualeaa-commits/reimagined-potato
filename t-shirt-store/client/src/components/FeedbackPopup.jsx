// FeedbackPopup.jsx
import React from 'react';

const FeedbackPopup = ({ message, type, onClose }) => {
  const isSuccess = type === 'success';
  
  const icon = isSuccess ? (
    <svg style={{width: '20px', height: '20px', color: '#16a34a'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
  ) : (
    <svg style={{width: '20px', height: '20px', color: '#dc2626'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );

  const title = isSuccess ? 'Successo!' : 'Errore!';
  const iconBgColor = isSuccess ? '#dcfce7' : '#fee2e2';
  const borderColor = isSuccess ? '#bbf7d0' : '#fecaca';
  const buttonColor = isSuccess ? '#15803d' : '#dc2626';

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const popupStyle = {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    border: `2px solid ${borderColor}`,
    padding: '16px',
    margin: '16px',
    minWidth: '320px',
    maxWidth: '400px',
    width: '90%'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  };

  const iconContainerStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: iconBgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    flexGrow: 1
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s'
  };

  const messageStyle = {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '16px',
    margin: 0
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end'
  };

  const confirmButtonStyle = {
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '4px',
    border: 'none',
    background: 'none',
    color: buttonColor,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  };

  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        {/* Header con icona e titolo */}
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            {icon}
          </div>
          <h3 style={titleStyle}>{title}</h3>
          {/* Pulsante X per chiudere */}
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => e.target.style.color = '#6b7280'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Messaggio */}
        <p style={messageStyle}>{message}</p>
        
        {/* Pulsante di conferma */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={confirmButtonStyle}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {isSuccess ? 'OK' : 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPopup;