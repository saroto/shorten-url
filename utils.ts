export function generateShortCode(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        shortCode += characters[randomIndex];
    }
    return shortCode;
}


export function generateShortUrl(baseUrl: string, length: number): string {
    const shortCode = generateShortCode(length);
    return `${baseUrl}/${shortCode}`;
}