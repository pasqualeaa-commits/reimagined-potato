import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAddToCart }) => {
  const defaultSize = product.sizes?.[0] || '';
  const defaultLanguage = product.languages?.[0] || '';

  const handleAddToCartClick = () => {
    onAddToCart(product, {
      size: defaultSize,
      language: defaultLanguage,
    });
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <img src={product.coverImage} alt={product.name} className="product-image" />
      </Link>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>€{product.price.toFixed(2)}</p>
        <button onClick={handleAddToCartClick}>Aggiungi al carrello</button>
      </div>
    </div>
  );
};

export default ProductCard;