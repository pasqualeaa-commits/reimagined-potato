// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Configurazione del pool di connessioni PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configurazione Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Funzione ausiliaria per inviare l'email di conferma
const sendOrderConfirmationEmail = async (email, orderId, products) => {
  try {
    const productListHtml = products.map(item => `
      <li>${item.name} - ${item.quantity} x ${item.price} €</li>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Conferma Ordine #${orderId}`,
      html: `
        <h1>Grazie per il tuo ordine!</h1>
        <p>Il tuo ordine #${orderId} è stato confermato e verrà spedito a breve.</p>
        <h2>Riepilogo Ordine:</h2>
        <ul>${productListHtml}</ul>
        <p>Totale: ${products.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2)} €</p>
        <p>Se hai domande, rispondi a questa email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email di conferma ordine inviata a:', email);
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di conferma:', error);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use('/Maglie', express.static(__dirname + '/Maglie'));

// Middleware per la verifica del token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API per la registrazione
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, address, city, province, zipCode, country, phoneNumber } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "user" (first_name, last_name, email, password_hash, address, city, province, zip_code, country, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [firstName, lastName, email, hashedPassword, address, city, province, zipCode, country, phoneNumber]
    );

    const newUser = result.rows[0];
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'Utente registrato con successo!', user: newUser, token });
  } catch (err) {
    console.error('Errore nella registrazione:', err);
    res.status(500).json({ error: 'Errore nella registrazione. Riprova.' });
  }
});

// API per il login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login avvenuto con successo', user, token });
  } catch (err) {
    console.error('Errore nel login:', err);
    res.status(500).json({ error: 'Errore nel login. Riprova.' });
  }
});

// API per ottenere i dati dell'utente loggato
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "user" WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    res.json(user);
  } catch (err) {
    console.error('Errore nel recupero dei dati utente:', err);
    res.status(500).json({ error: 'Errore nel recupero dei dati utente' });
  }
});

// API per l'aggiornamento del profilo
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, address, city, province, zipCode, country, phoneNumber, password } = req.body;
    const { userId } = req.user;

    let updateQuery = 'UPDATE "user" SET first_name = $1, last_name = $2, address = $3, city = $4, province = $5, zip_code = $6, country = $7, phone_number = $8';
    let updateParams = [firstName, lastName, address, city, province, zipCode, country, phoneNumber];
    let paramIndex = 9;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $${paramIndex}`;
      updateParams.push(hashedPassword);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    updateParams.push(userId);

    const result = await pool.query(updateQuery, updateParams);
    const updatedUser = result.rows[0];

    res.json({ message: 'Profilo aggiornato con successo!', user: updatedUser });
  } catch (err) {
    console.error('Errore nell\'aggiornamento del profilo:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo' });
  }
});

// API per recupero password (richiesta di reset)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Email non registrata' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 ora
    await pool.query(
      'UPDATE "user" SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, new Date(expires), user.id]
    );

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reimposta la tua password',
      html: `<p>Clicca sul link per reimpostare la tua password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Link per il recupero password inviato all\'indirizzo email.' });
  } catch (err) {
    console.error('Errore nel recupero password:', err);
    res.status(500).json({ error: 'Errore nel recupero password' });
  }
});

// API per la reimpostazione della password
app.post('/api/password-reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await pool.query(
      'SELECT * FROM "user" WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ error: 'Token non valido o scaduto.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE "user" SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reimpostata con successo.' });
  } catch (err) {
    console.error('Errore nella reimpostazione della password:', err);
    res.status(500).json({ error: 'Errore nella reimpostazione della password' });
  }
});

// API per l'ordine (nuovo endpoint)
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { firstName, lastName, email, address, city, province, zipCode, country, phoneNumber, cartItems } = req.body;
    const userId = req.user ? req.user.userId : null;
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await client.query('BEGIN');

    // Inserisce l'ordine nella tabella `orders`
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, first_name, last_name, email, address, city, province, zip_code, country, phone_number, order_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id',
      [userId, totalAmount, firstName, lastName, email, address, city, province, zipCode, country, phoneNumber]
    );
    const orderId = orderResult.rows[0].id;

    // Inserisce ogni articolo del carrello nella tabella `order_items`
    for (const item of cartItems) {
      await client.query(
        'INSERT INTO order_item (order_id, product_id, quantity, size, language, price) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, item.productId, item.quantity, item.selectedSize, item.selectedLanguage, item.price]
      );
    }
    
    await client.query('COMMIT');
    
    // Invia l'email di conferma all'utente
    await sendOrderConfirmationEmail(email, orderId, cartItems);

    res.status(201).json({ message: 'Ordine confermato con successo!', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore durante la creazione dell\'ordine:', err);
    res.status(500).json({ error: 'Errore durante la creazione dell\'ordine. Riprova.' });
  } finally {
    client.release();
  }
});

// API per ottenere gli articoli di un ordine
app.get('/api/orders/:orderId/items', async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query(
      `SELECT oi.*, p.name, p.price, p.cover_image
       FROM order_item oi
       JOIN product p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Articoli non trovati per questo ordine' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero degli articoli dell\'ordine:', err);
    res.status(500).json({ error: 'Errore nel recupero degli articoli dell\'ordine' });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});