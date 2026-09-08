import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, authorize('ADMIN'), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role = 'VIEWER' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return res.status(400).json({ message: 'Permissão inválida.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Este email já está cadastrado.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(400).json({ message: 'Não foi possível cadastrar o usuário.', error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    return res.status(400).json({ message: 'Você não pode excluir o próprio usuário.' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

  res.json({ message: 'Usuário excluído.' });
});

export default router;
