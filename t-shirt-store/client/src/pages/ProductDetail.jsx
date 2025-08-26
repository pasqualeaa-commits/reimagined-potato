import React, { useState, useEffect  } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import ReactCountryFlag from "react-country-flag";

const ProductDetail = ({ onAddToCart }) => {
    const { productId } = useParams();
    const product = products.find(p => p.id === parseInt(productId));

  if (!product) {
    return <h2>Prodotto non trovato!</h2>;
  }

  const [selectedLanguage, setSelectedLanguage] = useState(product.languages?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [displayedImage, setDisplayedImage] = useState(product.images[product.languages?.[0]] || "");

  useEffect(() => {
    if (product && product.images && product.images[selectedLanguage]) {
      setDisplayedImage(product.images[selectedLanguage]);
    }
  }, [selectedLanguage, product]);

  const langFlags = {
    English: "GB",
    Français: "FR",
    Español: "ES",
    Deutsch: "DE",
    Italiano: "IT",
  };

  const handleAddToCartWithOptions = () => {
    onAddToCart(product, { size: selectedSize, language: selectedLanguage });
  };

  return (
    <div className="product-detail-container">
      <Link to="/" className="back-button">← Torna alla Home</Link>
      <div className="product-detail-content">
        <img src={displayedImage} alt={product.name} className="product-detail-image" />
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-price">€{product.price.toFixed(2)}</p>
          
          <div className="options">
            {product.sizes?.length > 0 && (
              <div>
                <label htmlFor="size-select">Taglia:</label>
                <select 
                  id="size-select" 
                  value={selectedSize} 
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  {product.sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {product.languages?.length > 0 && (
              <div>
                <label htmlFor="lang-select">Lingua:</label>
                <select 
                  id="lang-select" 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {product.languages.map(lang => (
                    <option key={lang} value={lang}>
                      {langFlags[lang] && (
                        <ReactCountryFlag
                          countryCode={langFlags[lang]}
                          svg
                          style={{ marginRight: "8px" }}
                        />
                      )}
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="product-detail-description">{product.description}</p>
          <button onClick={handleAddToCartWithOptions} className="add-to-cart-button">
            Aggiungi al carrello
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;