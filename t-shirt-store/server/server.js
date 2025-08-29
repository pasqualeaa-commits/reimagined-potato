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

// API per ottenere i dati dell'utente autenticato
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, "firstName", "lastName", email, address, city, province, "zipCode", country, "phoneNumber" FROM "user" WHERE id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Utente non trovato' });
    }
  } catch (err) {
    console.error('Errore nel recupero dei dati dell\'utente:', err);
    res.status(500).json({ error: 'Errore nel recupero dei dati dell\'utente' });
  }
});

// API per la registrazione
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, address, city, province, zipCode, country, phoneNumber } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Nome, cognome, email e password sono richiesti." });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Un utente con questa email è già registrato." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO "user" ("firstName", "lastName", email, password, address, city, province, "zipCode", country, "phoneNumber") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [firstName, lastName, email, hashedPassword, address, city, province, zipCode, country, phoneNumber]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ 
      message: 'Utente registrato con successo',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        city: user.city,
        province: user.province,
        zipCode: user.zipCode,
        country: user.country,
        phoneNumber: user.phoneNumber,
      },
      token: token
    });
  } catch (err) {
    console.error('Errore nella registrazione:', err);
    res.status(500).json({ error: 'Errore nella registrazione' });
  }
});

// API per l'autenticazione
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        city: user.city,
        province: user.province,
        zipCode: user.zipCode,
        country: user.country,
        phoneNumber: user.phoneNumber,
      },
      token: token
    });

  } catch (err) {
    console.error('Errore nel login:', err);
    res.status(500).json({ error: 'Errore nel login' });
  }
});

// API per l'aggiornamento del profilo utente
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, address, city, province, zipCode, country, phoneNumber, password } = req.body;

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Accesso negato: non puoi modificare il profilo di un altro utente.' });
  }

  let updateFields = [
    `"firstName" = $1`,
    `"lastName" = $2`,
    `email = $3`,
    `address = $4`,
    `city = $5`,
    `province = $6`,
    `"zipCode" = $7`,
    `country = $8`,
    `"phoneNumber" = $9`
  ];
  let values = [firstName, lastName, email, address, city, province, zipCode, country, phoneNumber];
  let paramIndex = 10;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateFields.push(`password = $${paramIndex}`);
    values.push(hashedPassword);
    paramIndex++;
  }

  values.push(id);
  const updateQuery = `UPDATE "user" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, "firstName", "lastName", email, address, city, province, "zipCode", country, "phoneNumber"`;

  try {
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json({ message: 'Profilo aggiornato con successo', user: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'aggiornamento del profilo:', err);
    res.status(500).json({ error: err.message });
  }
});

// API per il recupero della password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.json({ message: "Se l'email è registrata, riceverai un link per reimpostare la password." });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiration = Date.now() + 3600000; // 1 ora

    await pool.query(
      'UPDATE "user" SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 WHERE id = $3',
      [token, new Date(expiration), user.id]
    );

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Reimposta la tua password',
      text: `Hai richiesto di reimpostare la password per il tuo account.\n\n` +
            `Per procedere, clicca su questo link o incollalo nel tuo browser:\n\n` +
            `${resetUrl}\n\n` +
            `Se non hai richiesto tu questa operazione, ignora questa email e la tua password rimarrà invariata.\n`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error('Errore invio email:', err);
        return res.status(500).json({ error: 'Errore nell\'invio dell\'email.' });
      }
      res.json({ message: "Se l'email è registrata, riceverai un link per reimpostare la password." });
    });

  } catch (err) {
    console.error('Errore durante il recupero della password:', err);
    res.status(500).json({ error: 'Errore durante la richiesta.' });
  }
});

// API per la reimpostazione della password
app.post('/api/password-reset', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM "user" WHERE "resetPasswordToken" = $1 AND "resetPasswordExpires" > NOW()',
      [token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token non valido o scaduto.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE "user" SET password = $1, "resetPasswordToken" = NULL, "resetPasswordExpires" = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reimpostata con successo.' });

  } catch (err) {
    console.error('Errore nella reimpostazione della password:', err);
    res.status(500).json({ error: 'Errore nella reimpostazione della password.' });
  }
});

// API per l'inserimento di un prodotto
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, sizes, languages, coverImage } = req.body;
    const result = await pool.query(
      'INSERT INTO product (name, description, price, sizes, languages, cover_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, sizes, languages, coverImage]
    );
    res.status(201).json({ message: 'Prodotto inserito con successo!', product: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'inserimento del prodotto:', err);
    res.status(500).json({ error: 'Errore nell\'inserimento del prodotto' });
  }
});

// API per ottenere un prodotto specifico
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM product WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Errore nel recupero del prodotto:', err);
    res.status(500).json({ error: 'Errore nel recupero del prodotto' });
  }
});

// API per ottenere tutti i prodotti
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero dei prodotti:', err);
    res.status(500).json({ error: 'Errore nel recupero dei prodotti' });
  }
});

// API per l'aggiornamento di un prodotto
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, sizes, languages, coverImage } = req.body;
    const result = await pool.query(
      'UPDATE product SET name = $1, description = $2, price = $3, sizes = $4, languages = $5, cover_image = $6 WHERE id = $7 RETURNING *',
      [name, description, price, sizes, languages, coverImage, id]
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

// API per la creazione di un ordine con transazione
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const { customerData, items, totalAmount, userId, saveInfo } = req.body;

    if (!customerData || !items || !totalAmount) {
      return res.status(400).json({ error: "Dati dell'ordine mancanti." });
    }

    await client.query('BEGIN');

    // Inserisci l'ordine nella tabella 'order'
    const orderResult = await client.query(
      'INSERT INTO "order" (user_id, total_amount, "customerFirstName", "customerLastName", "customerEmail", "customerAddress", "customerCity", "customerProvince", "customerZipCode", "customerCountry", "customerPhoneNumber") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [
        userId,
        totalAmount,
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        customerData.address,
        customerData.city,
        customerData.province,
        customerData.zipCode,
        customerData.country,
        customerData.phoneNumber,
      ]
    );
    const orderId = orderResult.rows[0].id;

    // Inserisci gli articoli dell'ordine nella tabella 'order_item'
    for (const item of items) {
      await client.query(
        'INSERT INTO order_item (order_id, product_id, quantity, price, size, language, image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [orderId, item.id, item.quantity, item.price, item.size, item.language, item.image]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ message: 'Ordine creato con successo!', orderId: orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore nella creazione dell\'ordine:', err);
    res.status(500).json({ error: 'Errore nella creazione dell\'ordine' });
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
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero degli articoli dell\'ordine:', err);
    res.status(500).json({ error: 'Errore nel recupero degli articoli dell\'ordine' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});