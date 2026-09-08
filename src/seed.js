import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

await mongoose.connect(process.env.MONGO_URI);

const email = process.env.ADMIN_EMAIL || 'admin@exemplo.com';
const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
const name = process.env.ADMIN_NAME || 'Administrador';

const existing = await User.findOne({ email });
if (!existing) {
  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'ADMIN'
  });
  console.log(`Administrador criado: ${email}`);
} else {
  console.log('Administrador já existe.');
}

await mongoose.disconnect();
