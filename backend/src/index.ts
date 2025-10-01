import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'colors';

import { errorHandler, notFoundHandler } from './core/middleware/error';
import routes from './core/routes/_index';
import { appBootstrap } from './shared/bootstrap/ApplicationBootstrap';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const corsOptions = {
    origin: FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
    try {
        await appBootstrap.initialize();
        app.listen(PORT, () => {
            console.log(` Server listening on port ${PORT}`.cyan.bold);
            console.log(` Frontend URL: ${FRONTEND_URL}`.cyan);
        });
    } catch (error) {
        console.error('Failed to start server:'.red, error);
        process.exit(1);
    }
}

startServer();
