import 'dotenv/config';

import { neon } from "@neondatabase/serverless";


export const db = () => {
    return neon(process.env.DATABASE_URL as string);
};