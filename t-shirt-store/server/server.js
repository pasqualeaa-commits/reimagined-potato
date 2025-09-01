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

// Funzione per impostare le tabelle del database all'avvio
const setupDatabase = async () => {
  let client; // Dichiarazione della variabile qui
  try {
    client = await pool.connect(); // Assegnazione della variabile all'interno del try
    console.log('Database tables verified and created if not exist.');
    
    // Creazione tabella 'users'
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(255),
        province VARCHAR(255),
        zip_code VARCHAR(10),
        country VARCHAR(255),
        phone_number VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITH TIME ZONE
      );
    `);

    // Creazione tabella 'product'
    await client.query(`
      CREATE TABLE IF NOT EXISTS product (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        sizes TEXT[],
        languages TEXT[],
        coverimage VARCHAR(255),
        images JSONB
      );
    `);

    // Creazione tabella 'orders'
    await client.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount NUMERIC(10, 2) NOT NULL,
        customer_first_name VARCHAR(255),
        customer_last_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_address VARCHAR(255),
        customer_city VARCHAR(255),
        customer_province VARCHAR(255),
        customer_zip_code VARCHAR(10),
        customer_country VARCHAR(255),
        customer_phone_number VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Creazione tabella 'order_items'
    await client.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES product(id),
        quantity INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        size VARCHAR(50),
        language VARCHAR(50),
        product_image VARCHAR(255)
      );
    `);

    console.log('Database tables verified and created if not exist.');
  } catch (err) {
    console.error('Errore durante la configurazione del database:', err);
  } finally {
    if (client) { // Controllo aggiuntivo per sicurezza
      client.release();
    }
  }
};

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
      'SELECT id, first_name, last_name, email, address, city, province, zip_code, country, phone_number FROM "users" WHERE id = $1',
      [userId]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
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
      });
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
    const existingUser = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Un utente con questa email è già registrato." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO "users" (first_name, last_name, email, password, address, city, province, zip_code, country, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [firstName, lastName, email, hashedPassword, address, city, province, zipCode, country, phoneNumber]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Utente registrato con successo',
      user: {
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
    const result = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
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
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        address: user.address,
        city: user.city,
        province: user.province,
        zipCode: user.zip_code,
        country: user.country,
        phoneNumber: user.phone_number,
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
    `first_name = $1`,
    `last_name = $2`,
    `email = $3`,
    `address = $4`,
    `city = $5`,
    `province = $6`,
    `zip_code = $7`,
    `country = $8`,
    `phone_number = $9`
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
  const updateQuery = `UPDATE "users" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, first_name, last_name, email, address, city, province, zip_code, country, phone_number`;

  try {
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    const user = result.rows[0];
    res.json({
      message: 'Profilo aggiornato con successo',
      user: {
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
      },
    });
  } catch (err) {
    console.error('Errore nell\'aggiornamento del profilo:', err);
    res.status(500).json({ error: err.message });
  }
});

// API per il recupero della password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.json({ message: "Se l'email è registrata, riceverai un link per reimpostare la password." });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiration = Date.now() + 3600000; // 1 ora

    await pool.query(
      'UPDATE "users" SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
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
      'SELECT * FROM "users" WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token non valido o scaduto.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE "users" SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reimpostata con successo.' });

  } catch (err) {
    console.error('Errore nella reimpostazione della password:', err);
    res.status(500).json({ error: 'Errore nella reimpostazione della password.' });
  }
});

// API per l'inserimento di un prodotto (protetta per admin)
app.post('/api/products', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono aggiungere prodotti.' });
  }
  try {
    const { name, description, price, sizes, languages, coverimage, images } = req.body;
    
    // Check if the price is a valid number
    if (isNaN(price)) {
      return res.status(400).json({ error: 'Il prezzo deve essere un numero valido.' });
    }
    
    const result = await pool.query(
      'INSERT INTO product (name, description, price, sizes, languages, coverimage, images) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, sizes, languages, coverimage, images]
    );
    res.status(201).json({ message: 'Prodotto inserito con successo!', product: result.rows[0] });
  } catch (err) {
    console.error('Errore nell\'inserimento del prodotto:', err);
    res.status(500).json({ error: 'Errore nell\'inserimento del prodotto', details: err.message });
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

// API per l'aggiornamento di un prodotto (protetta per admin)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono aggiornare prodotti.' });
  }
  try {
    const { id } = req.params;
    const { name, description, price, sizes, languages, coverimage, images } = req.body;
    const result = await pool.query(
      'UPDATE product SET name = $1, description = $2, price = $3, sizes = $4, languages = $5, coverimage = $6, images = $7 WHERE id = $8 RETURNING *',
      [name, description, price, sizes, languages, coverimage, images, id]
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

// API per eliminare un prodotto (protetta per admin)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono eliminare prodotti.' });
  }
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
    const { customerData, items, totalAmount, userId } = req.body;

    if (!customerData || !items || !totalAmount) {
      return res.status(400).json({ error: "Dati dell'ordine mancanti." });
    }

    await client.query('BEGIN');

    // Inserisci l'ordine nella tabella 'orders'
    const orderResult = await client.query(
      'INSERT INTO "orders" (user_id, total_amount, customer_first_name, customer_last_name, customer_email, customer_address, customer_city, customer_province, customer_zip_code, customer_country, customer_phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
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

    // Inserisci gli articoli dell'ordine nella tabella 'order_items'
    for (const item of items) {
      await client.query(
        'INSERT INTO "order_items" (order_id, product_id, quantity, price, size, language, product_image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
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
      `SELECT oi.*, p.name, p.price, p.coverimage
       FROM "order_items" oi
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

// Nuova API per ottenere tutti gli ordini (solo per admin)
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono visualizzare gli ordini.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        o.id AS order_id, 
        o.user_id,
        o.total_amount, 
        o.status, 
        o.created_at,
        o.customer_first_name,
        o.customer_last_name,
        o.customer_email,
        o.customer_address,
        o.customer_city,
        o.customer_province,
        o.customer_zip_code,
        o.customer_country,
        o.customer_phone_number,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'size', oi.size,
            'language', oi.language,
            'product_image', oi.product_image
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recupero degli ordini:', err);
    res.status(500).json({ error: 'Errore nel recupero degli ordini' });
  }
});

// Nuova API per eliminare un ordine (solo per admin)
app.delete('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono eliminare gli ordini.' });
  }

  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    const orderResult = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    await client.query('COMMIT');

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ error: 'Ordine non trovato.' });
    }

    res.json({ message: 'Ordine e articoli correlati eliminati con successo.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore durante l\'eliminazione dell\'ordine:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'ordine' });
  } finally {
    client.release();
  }
});

// API per aggiornare lo stato di un ordine (solo per admin)
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono aggiornare lo stato degli ordini.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ordine non trovato.' });
    }

    res.json({ message: 'Stato dell\'ordine aggiornato con successo.', order: result.rows[0] });
  } catch (err) {
    console.error('Errore durante l\'aggiornamento dello stato dell\'ordine:', err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dello stato dell\'ordine' });
  }
});

// Aggiungi un endpoint per il controllo dello stato del server
app.get('/api/status', (req, res) => {
  res.status(200).json({ message: 'Server is running successfully.' });
});

app.listen(port, () => {
  setupDatabase(); // Avvia la configurazione del database prima di avviare il server
  console.log(`Server is running on http://localhost:${port}`);
});