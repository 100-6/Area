// app.js
// Node.js backend equivalent to the Python FastAPI app

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { check, validationResult } = require('express-validator');

const SECRET_KEY = "SuperSecretKeyOfEpitech";
const ACCESS_TOKEN_EXPIRE_MINUTES = 60;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let db;

async function initDb() {
    db = await open({
        filename: './app.db',
        driver: sqlite3.Database
    });
    await db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

function createAccessToken(subject) {
    return jwt.sign({ sub: subject }, SECRET_KEY, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
}

function decodeAccessToken(token) {
    try {
        const payload = jwt.verify(token, SECRET_KEY);
        return payload.sub;
    } catch (err) {
        return null;
    }
}

app.post('/register', [
    check('username').isLength({ min: 1 }),
    check('email').isEmail(),
    check('password').isLength({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    const userExists = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', username, email);
    if (userExists) {
        return res.status(400).json({ detail: 'Username or email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', username, email, password_hash);
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ?', result.lastID);
    res.status(201).json(user);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const token = createAccessToken(user.id);
    res.json({ access_token: token, token_type: 'bearer' });
});

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ detail: 'Missing token' });
    const token = authHeader.split(' ')[1];
    const userId = decodeAccessToken(token);
    if (!userId) return res.status(401).json({ detail: 'Invalid token' });
    req.userId = userId;
    next();
}

app.get('/me', authMiddleware, async (req, res) => {
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(401).json({ detail: 'User not found' });
    res.json(user);
});

const PORT = 8000;
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
