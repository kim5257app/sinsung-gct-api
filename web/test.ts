import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    res.status(200).json({ result: 'success' });
});

export default router;
