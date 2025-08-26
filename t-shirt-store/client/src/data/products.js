import nera from '../Maglie/images.jpg';
import verde from '../Maglie/verde.jpg';
import rosa from '../Maglie/Rosa.jpg';
import rossa from '../Maglie/rossa.jpg';

export const products = [
  {
    id: 1,
    name: "Maglietta Nera",
    price: 19.99,
    coverImage: nera,
    images: {
      Italiano: nera,
      English: nera,
      Français: rosa,
      Español: rossa,
      Deutsch: verde,
    },
    description: "Maglietta nera di alta qualità, realizzata in cotone 100%.",
    sizes: ["S", "M", "L", "XL"],
    languages: ["Italiano", "English", "Français", "Español", "Deutsch"],
  },
  {
    id: 2,
    name: "Maglietta Verde",
    price: 24.99,
    coverImage: verde,
    images: {
      Italiano: verde,
      English: verde,
      Français: verde,
      Español: verde,
      Deutsch: verde,
    },
    description: "Maglietta verde elegante, perfetta per ogni occasione.",
    sizes: ["S", "M", "L", "XL"],
    languages: ["Italiano", "English", "Français", "Español", "Deutsch"],
  },
  {
    id: 3,
    name: "Maglietta Rosa",
    price: 29.99,
    coverImage: rosa,
    images: {
      Italiano: rosa,
      English: rosa,
      Français: rosa,
      Español: rosa,
      Deutsch: rosa,
    },
    description: "Maglietta rosa vivace, realizzata in tessuto morbido e traspirante.",
    sizes: ["S", "M", "L", "XL"],
    languages: ["Italiano", "English", "Français", "Español", "Deutsch"],
  },
  {
    id: 4,
    name: "Maglietta Rossa",
    price: 29.99,
    coverImage: rossa,
    images: {
      Italiano: rossa,
      English: rossa,
      Français: rossa,
      Español: rossa,
      Deutsch: rossa,
    },
    description: "Maglietta rossa classica, un must-have per ogni guardaroba.",
    sizes: ["S", "M", "L", "XL"],
    languages: ["Italiano", "English", "Français", "Español", "Deutsch"],
  },
];