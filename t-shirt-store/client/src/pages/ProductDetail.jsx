import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const ProductDetail = ({ onAddToCart }) => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("IT");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:3001/api/products/${productId}`)
      .then(res => {
        setProduct(res.data);
        const langs = typeof res.data.languages === "string"
          ? res.data.languages.split(",").map(l => l.trim())
          : res.data.languages;
        setSelectedLanguage(langs[0]);
        setSelectedSize(res.data.sizes?.split(",")[0] || "");
      })
      .catch(err => console.error('Errore caricamento prodotto:', err));
  }, [productId]);

  if (!product) return <h2>Prodotto non trovato!</h2>;

  const langs = typeof product.languages === "string"
    ? product.languages.split(",").map(l => l.trim())
    : product.languages;

  const sizes = typeof product.sizes === "string"
    ? product.sizes.split(",").map(s => s.trim())
    : product.sizes;

  // Cambia solo l'immagine in base alla lingua selezionata
  const description = product.description; 
  const image = product.images[selectedLanguage] || product.images.IT;

  return (
    <div className="product-detail-container">
      <Link to="/products" className="back-button">← Indietro</Link>
      <div className="product-detail-content">
        <img src={image} alt={product.name} className="product-detail-image" />
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-price">
            <span>
              {Number(product.price).toFixed(2) + " €"}
            </span>
          </p>
          <div className="options">
            <div>
              <label htmlFor="size-select">Taglia:</label>
              <select
                id="size-select"
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                className="modern-select"
              >
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="language-select">Lingua:</label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="modern-select"
              >
                {langs.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="product-detail-description">{description}</p>
          <button onClick={() => onAddToCart(product, { size: selectedSize, language: selectedLanguage })} className="add-to-cart-button">
            Aggiungi al carrello
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;