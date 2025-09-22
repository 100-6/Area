// benchmark.js
// Node.js benchmark script for the backend

const axios = require('axios');
const BASE_URL = 'http://localhost:8000';
const USERNAME = 'alice';
const EMAIL = 'alice@example.com';
const PASSWORD = 'secret';

const stats = {};

async function benchRegister() {
    const url = `${BASE_URL}/register`;
    const payload = { username: USERNAME, email: EMAIL, password: PASSWORD };
    const start = Date.now();
    try {
        const resp = await axios.post(url, payload);
        stats['register'] = { status: resp.status, elapsed: (Date.now() - start) / 1000, body: JSON.stringify(resp.data) };
        return resp;
    } catch (err) {
        stats['register'] = { status: err.response?.status || 500, elapsed: (Date.now() - start) / 1000, body: err.response?.data || err.message };
        return null;
    }
}

async function benchLogin() {
    const url = `${BASE_URL}/login`;
    const data = { username: USERNAME, password: PASSWORD };
    const start = Date.now();
    try {
        const resp = await axios.post(url, data);
        stats['login'] = { status: resp.status, elapsed: (Date.now() - start) / 1000, body: JSON.stringify(resp.data) };
        return resp.data.access_token;
    } catch (err) {
        stats['login'] = { status: err.response?.status || 500, elapsed: (Date.now() - start) / 1000, body: err.response?.data || err.message };
        return null;
    }
}

async function benchMe(token) {
    const url = `${BASE_URL}/me`;
    const start = Date.now();
    try {
        const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        stats['me'] = { status: resp.status, elapsed: (Date.now() - start) / 1000, body: JSON.stringify(resp.data) };
        return resp;
    } catch (err) {
        stats['me'] = { status: err.response?.status || 500, elapsed: (Date.now() - start) / 1000, body: err.response?.data || err.message };
        return null;
    }
}

async function main() {
    console.log('Benchmarking /register...');
    await benchRegister();
    console.log('Benchmarking /login...');
    const token = await benchLogin();
    console.log('Benchmarking /me...');
    if (token) {
        await benchMe(token);
    } else {
        console.log('Login failed, cannot test /me');
    }
    console.log('\n--- Benchmark Results ---');
    for (const [k, v] of Object.entries(stats)) {
        console.log(`${k.toUpperCase()}: status=${v.status}, time=${v.elapsed.toFixed(4)}s`);
        console.log(`Response: ${typeof v.body === 'string' ? v.body.substring(0, 200) : JSON.stringify(v.body).substring(0, 200)}`);
        console.log();
    }
}

main();
