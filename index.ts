import express, { type Express, type Request, type Response } from 'express';
import { db } from './db.ts';
import 'dotenv/config';
import morgan from 'morgan';
import { generateShortUrl, generateShortCode } from './utils.ts';
const app: Express = express();
// 1. MUST ADD: Middleware to parse incoming request data
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true }));
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});
app.use(morgan('short')); // Logging middleware
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
app.get('/shorten/:shortCode', getOriginalUrlByShortCode);
app.get('/:shortCode', redirectToOriginalUrl);
app.put('/shorten/:shortCode', update);
app.delete('/shorten/:shortCode', deleteShortUrl);
app.get('/shorten/:shortCode/access-count', getAccessCount);
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
    const result = await db().query('SELECT * FROM url WHERE short_code =$1', [shortCode]);
    if (result && result.length > 0) {

        res.json({ data: result, message: 'Short URL retrieved successfully' });
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
        await incrementAccessCount(shortCode as string);
        res.redirect(originalUrl);
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }

}

async function update(req: Request, res: Response) {
    if (!req.params) {
        res.status(400).json({ error: 'Short code is required' });
        return;
    }

    const query = 'SELECT EXISTS(SELECT 1 FROM url WHERE short_code = $1) AS exists';
    const existsResult = await db().query(query, [req.params.shortCode]);
    if (!existsResult[0]?.exists) {
        res.status(400).json({ error: 'Not found' });
        return;
    }

    if (!req.body || !req.body.url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    const updateQuery = 'UPDATE url SET original_url = $1 WHERE short_code = $2 RETURNING *';
    const updateResult = await db().query(updateQuery, [req.body.url, req.params.shortCode]);

    if (updateResult && updateResult.length > 0) {
        res.json({ data: updateResult, message: 'Short URL updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to update short URL' });
    }
}


async function deleteShortUrl(req: Request, res: Response) {
    if (!req.params || !req.params.shortCode) {
        res.status(400).json({ error: 'Short code is required' });
        return;
    }

    const deleteQuery = 'DELETE FROM url WHERE short_code = $1 RETURNING *';
    const deleteResult = await db().query(deleteQuery, [req.params.shortCode]);
    if (deleteResult && deleteResult.length > 0) {
        res.json({ data: deleteResult, message: 'Short URL deleted successfully' });
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }
}

async function getAccessCount(req: Request, res: Response) {
    if (!req.params || !req.params.shortCode) {
        res.status(400).json({ error: 'Short code is required' });
        return;
    }
    const shortCode = req.params.shortCode;
    const countQuery = 'SELECT * FROM url WHERE short_code = $1';
    const countResult = await db().query(countQuery, [shortCode]);
    if (countResult && countResult.length > 0) {
        res.json({ data: countResult, message: 'Access count retrieved successfully' });
    } else {
        res.status(404).json({ error: 'Short URL not found' });
    }

}

async function incrementAccessCount(shortCode: string) {
    console.log('Incrementing access count for short code:', shortCode);
    const incrementQuery = 'UPDATE url SET access_count = access_count + 1 WHERE short_code = $1';
    const incrementResult = await db().query(incrementQuery, [shortCode]);
    console.log('Increment result:', incrementResult);
}
