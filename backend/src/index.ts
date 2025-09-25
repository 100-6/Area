import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'colors';

// Import routes
import systemRoutes from './core/routes/system';
import authRoutes from './core/routes/auth';
import userRoutes from './core/routes/users';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/areas', areaRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('ERROR:'.red, err.message);
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

app.use((req, res) => {
    console.log('404 - Redirecting to frontend:'.yellow, req.originalUrl.cyan);
    res.redirect(`${FRONTEND_URL}/404`);
});

app.listen(PORT, () => {
    console.log('AREA Backend Server running on'.green.bold, `http://localhost:${PORT}`.cyan);
    console.log('Frontend URL:'.blue, FRONTEND_URL.cyan);
    console.log('404 redirects to:'.yellow, `${FRONTEND_URL}/404`.cyan);
    console.log('Architecture: Modular AREA Platform'.magenta);
});
