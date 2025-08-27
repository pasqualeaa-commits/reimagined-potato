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

// Crea le tabelle se non esistono
async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tabella users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        province VARCHAR(100),
        zip_code VARCHAR(20),
        country VARCHAR(100),
        phone_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP
      );
    `);

    // Tabella orders
    await client.query(`
       CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_address VARCHAR(255) NOT NULL,
    customer_city VARCHAR(100) NOT NULL,
    customer_zip_code VARCHAR(20) NOT NULL,
    customer_country VARCHAR(100),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone_number VARCHAR(20),
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

    // Tabella order_items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(255),
        size VARCHAR(20) NOT NULL,
        language VARCHAR(20) NOT NULL,
        quantity INT NOT NULL,
        price NUMERIC(10, 2) NOT NULL
      );
    `);

    // Tabella product
    await client.query(`
      CREATE TABLE IF NOT EXISTS product (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        coverImage VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Tabelle create o già esistenti.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore nella creazione delle tabelle:', err);
  } finally {
    client.release();
  }
}

createTables();

// API per ottenere i dati dell'utente autenticato (nuovo endpoint)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const normalizedUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      address: user.address,
      city: user.city,
      province: user.province,
      zipCode: user.zip_code,
      country: user.country,
      phoneNumber: user.phone_number,
    };

    res.status(200).json({ user: normalizedUser });
  } catch (err) {
    console.error('Errore nel recupero dati utente:', err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});


// API di registrazione
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, phone_number;',
      [firstName, lastName, email, hashedPassword, phoneNumber]
    );

    res.status(201).json({ message: 'Registrazione avvenuta con successo!', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'L\'email è già registrata.' });
    }
    res.status(500).json({ error: 'Errore nella registrazione' });
  }
});

// API di login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Credenziali non valide.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenziali non valide.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const normalizedUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      address: user.address,
      city: user.city,
      province: user.province,
      zipCode: user.zip_code,
      country: user.country,
      phoneNumber: user.phone_number,
    };

    res.status(200).json({ message: 'Login avvenuto con successo', user: normalizedUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// API per aggiornare il profilo utente
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, address, city, province, zipCode, country, password, phoneNumber } = req.body;
    let query, params;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE users SET
          first_name = $1,
          last_name = $2,
          email = $3,
          address = $4,
          city = $5,
          province = $6,
          zip_code = $7,
          country = $8,
          password = $9,
          phone_number = $10
        WHERE id = $11
        RETURNING *`;
      params = [firstName, lastName, email, address, city, province, zipCode, country, hashedPassword, phoneNumber, id];
    } else {
      query = `
        UPDATE users SET
          first_name = $1,
          last_name = $2,
          email = $3,
          address = $4,
          city = $5,
          province = $6,
          zip_code = $7,
          country = $8,
          phone_number = $9
        WHERE id = $10
        RETURNING *`;
      params = [firstName, lastName, email, address, city, province, zipCode, country, phoneNumber, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const dbUser = result.rows[0];
    const normalizedUser = {
      id: dbUser.id,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      email: dbUser.email,
      address: dbUser.address,
      city: dbUser.city,
      province: dbUser.province,
      zipCode: dbUser.zip_code,
      country: dbUser.country,
      phoneNumber: dbUser.phone_number,
    };

    res.status(200).json({ message: "Profilo aggiornato con successo!", user: normalizedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// API per la richiesta di reset password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link per reimpostare la password.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 900000); // Scadenza tra 15 minuti

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    const resetUrl = `http://192.168.31.208:5173/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reimposta la tua password',
      text: `Hai richiesto di reimpostare la tua password. Clicca sul seguente link per procedere: ${resetUrl}\n\nSe non hai richiesto tu il cambio della password, ignora questa email.`,
      html: `<p>Hai richiesto di reimpostare la tua password. Clicca sul seguente link per procedere:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Se non hai richiesto tu il cambio della password, ignora questa email.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Errore invio email:', error);
      } else {
        console.log('Email inviata:', info.response);
      }
    });

    res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link per reimpostare la password.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// Nuova API: Reimposta la password con il token
app.post('/api/password-reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token non valido o scaduto.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Aggiorna la password e pulisci il token
    await pool.query(
      'UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password reimpostata con successo.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// API per salvare un ordine
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { customerData, items, totalAmount, userId, saveInfo } = req.body;
    
    console.log("Dati di spedizione ricevuti:", customerData); // LOG di DEBUG per visualizzare i dati ricevuti
    console.log("Stato di saveInfo:", saveInfo); // LOG di DEBUG per visualizzare il flag saveInfo
    
    if (userId && saveInfo) {
      await client.query(
        `UPDATE users SET
         address = $1,
         city = $2,
         province = $3,
         zip_code = $4,
         country = $5,
         phone_number = $6
         WHERE id = $7`,
        [
          customerData.address,
          customerData.city,
          customerData.province,
          customerData.zipCode,
          customerData.country,
          customerData.phoneNumber,
          userId
        ]
      );
      console.log(`Dati di spedizione aggiornati per l'utente ${userId}`);
    }

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, customer_first_name, customer_last_name, 
        customer_address, customer_city, customer_zip_code, 
        customer_country, customer_email, customer_phone_number, total_amount, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending') RETURNING id;`,
      [
        userId || null,
        customerData.firstName,
        customerData.lastName,
        customerData.address,
        customerData.city,
        customerData.zipCode,
        customerData.country,
        customerData.email,
        customerData.phoneNumber,
        totalAmount
      ]
    );

    const orderId = orderResult.rows[0].id;
    
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, 
          product_image, size, language, quantity, price
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          orderId,
          item.id,
          item.name,
          item.image,
          item.size,
          item.language,
          item.quantity,
          item.price
        ]
      );
    }
    
    await client.query('COMMIT');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerData.email,
      subject: 'Conferma Ordine',
      html: `
        <h1>Grazie per il tuo ordine, ${customerData.firstName}!</h1>
        <p>Il tuo ordine è stato ricevuto e sarà spedito al più presto.</p>
        <h2>Riepilogo Ordine:</h2>
        <ul>
          ${items.map(item => `<li>${item.name} (${item.size}, ${item.language}): ${item.quantity} x ${item.price}€</li>`).join('')}
        </ul>
        <h3>Totale: ${totalAmount.toFixed(2)}€</h3>
        <p>I dettagli di spedizione sono:</p>
        <p>Nome: ${customerData.firstName} ${customerData.lastName}</p>
        <p>Indirizzo: ${customerData.address}, ${customerData.zipCode} ${customerData.city} (${customerData.province}), ${customerData.country}</p>
        <p>Telefono: ${customerData.phoneNumber}</p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Errore invio email di conferma ordine:', error);
      } else {
        console.log('Email di conferma ordine inviata:', info.response);
      }
    });

    res.status(201).json({ message: 'Ordine salvato e email inviata!', orderId: orderId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore nel salvataggio dell\'ordine:', err);
    res.status(500).json({ error: 'Errore nel salvataggio dell\'ordine', details: err.message });
  } finally {
    client.release();
  }
});

// API per ottenere tutti i prodotti
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product'); // <-- usa la tabella product
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero prodotti:', err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// API per ottenere un prodotto per ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM product WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Prodotto non trovato' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore nel recupero prodotto:', err);
    res.status(500).json({ error: 'Errore nel server' });
  }
});

// API per aggiungere un nuovo prodotto
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, coverImage } = req.body;
    const result = await pool.query(
      'INSERT INTO product (name, description, price, coverImage) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, coverImage]
    );

    res.status(201).json({ message: 'Prodotto aggiunto con successo!', product: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiunta del prodotto:', err);
    res.status(500).json({ error: 'Errore nel salvataggio del prodotto' });
  }
});

// API per aggiornare un prodotto
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, coverImage } = req.body;
    const result = await pool.query(
      'UPDATE product SET name = $1, description = $2, price = $3, coverImage = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, description, price, coverImage, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }

    res.json({ message: 'Prodotto aggiornato con successo!', product: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento del prodotto:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del prodotto' });
  }
});

// API per eliminare un prodotto
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM product WHERE id = $1', [id]);
    res.json({ message: 'Prodotto eliminato con successo' });
  } catch (err) {
    console.error('Errore nell\'eliminazione del prodotto:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione del prodotto' });
  }
});

// API per ottenere gli articoli di un ordine
app.get('/api/orders/:orderId/items', async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query(
      `SELECT oi.*, p.name, p.price, p.cover_image
       FROM order_items oi
       JOIN product p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero degli articoli dell\'ordine' });
  }
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server backend in ascolto su http://192.168.31.208:${port}`);
});