import express, { type Express, type Request, type Response } from 'express';
import { db } from './db.ts';
import 'dotenv/config';
import { generateShortUrl, generateShortCode } from './utils.ts';
const app: Express = express();
// 1. MUST ADD: Middleware to parse incoming request data
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true }));
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});
app.get('/db', async (req, res) => {
    try {
        const result = await db().query('SELECT version()');
        const version = result?.[0]?.version || 'No version found';
        res.json({ version });
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Failed to connect to the database.' });
    }
});

app.post('/shorten', createShortUrl);
app.get('/original/:shortCode', getOriginalUrlByShortCode);
app.get('/:shortCode', redirectToOriginalUrl);


app.listen(3000);


async function createShortUrl(req: Request, res: Response) {
    if (!req.body || !req.body.url) {
        res.status(400).json({ error: 'URL is required' });
        console.log('Request body:', req.body.url);
        return;
    }
    console.log('Request body:', req.body);
    const originalUrl = req.body.url;
    const shortCode = generateShortCode(20);

    const result = await db().query('INSERT INTO url (original_url, short_code) VALUES ($1, $2) RETURNING *', [originalUrl, shortCode]);
    if (result && result.length > 0) {

        res.json({ data: result, message: 'Short URL created successfully' });
    } else {
        res.status(500).json({ error: 'Failed to create short URL' });
    }
}

async function getOriginalUrlByShortCode(req: Request, res: Response) {
    if (!req.params || !req.params.shortCode) {
        res.status(400).json({ error: 'Short code is required' });
        return;
    }
    const shortCode = req.params.shortCode;
    const result = await db().query('SELECT original_url FROM url WHERE short_code =$1', [shortCode]);
    if (result && result.length > 0) {
        const originalUrl = result[0]?.original_url;
        res.json({ originalUrl });
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }
}


async function redirectToOriginalUrl(req: Request, res: Response) {
    if (!req.params || !req.params.shortCode) {
        res.status(400).json({ error: 'Short code is required' });
        return;
    }
    const shortCode = req.params.shortCode;
    const result = await db().query('SELECT original_url FROM url WHERE short_code =$1', [shortCode]);
    if (result && result.length > 0) {
        const originalUrl = result[0]?.original_url;
        res.redirect(originalUrl);
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }
}