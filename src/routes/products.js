import { Router } from 'express';
import Product from '../models/Product.js';
import { auth, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const filter = {};

    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category.trim()) {
      filter.category = category.trim();
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch {
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.sort((a, b) => a.localeCompare(b)));
  } catch {
    res.status(500).json({ message: 'Erro ao buscar categorias.' });
  }
});

router.post('/', auth, authorize('ADMIN', 'EDITOR'), async (req, res) => {
  try {
    const { name, category, price, links = {} } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'Nome, categoria e valor são obrigatórios.' });
    }

    const product = await Product.create({
      name,
      category,
      price,
      links: {
        shopee: links.shopee || '',
        amazon: links.amazon || '',
        mercadoLivre: links.mercadoLivre || ''
      },
      createdBy: req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Não foi possível cadastrar o produto.', error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN', 'EDITOR'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(product);
  } catch {
    res.status(400).json({ message: 'Não foi possível atualizar o produto.' });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch {
    res.status(400).json({ message: 'Não foi possível excluir o produto.' });
  }
});

export default router;
