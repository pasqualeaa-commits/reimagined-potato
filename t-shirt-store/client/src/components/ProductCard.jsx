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

  const price = Number(product.price);

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <img src={product.cover_image} alt={product.name} className="product-image" />
      </Link>
      <div className="product-info">
        <h3>{product.name}</h3>
        <span className="product-price">
          {price ? price.toFixed(2) + ' €' : 'N/A'}
        </span>
        {/* <button onClick={handleAddToCartClick}>Aggiungi al carrello</button> */}
      </div>
    </div>
  );
};

export default ProductCard;