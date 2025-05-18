import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Health check route with defined types
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API is running successfully!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
