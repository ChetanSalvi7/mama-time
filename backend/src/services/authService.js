import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb, mutateStore } from '../db.js';
import { nowIso } from '../utils/helpers.js';

export async function findAdminByEmail(email) {
  const db = await getDb();
  return db.admins.find((admin) => admin.active && admin.email === String(email).toLowerCase()) || null;
}

export async function findAdminById(id) {
  const db = await getDb();
  const admin = db.admins.find((row) => row.active && row.id === Number(id));
  if (!admin) return null;
  const { password_hash: _password, ...safe } = admin;
  return safe;
}

export async function authenticateAdmin(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return null;
  const now = nowIso();
  await mutateStore((data) => {
    const row = data.admins.find((item) => item.id === admin.id);
    row.last_login_at = now;
    row.updated_at = now;
  });
  return { ...admin, last_login_at: now };
}

export function createAuthToken(admin) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign(
    { sub: String(admin.id), email: admin.email, name: admin.display_name, role: admin.role, ver: Number(admin.auth_version || 1), csrf },
    config.auth.jwtSecret,
    { expiresIn: `${config.auth.tokenHours}h`, issuer: 'mama-time-api', audience: 'mama-time-admin' }
  );
  return { token, csrf };
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.auth.jwtSecret, { issuer: 'mama-time-api', audience: 'mama-time-admin' });
}

export function setAuthCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true, secure: config.isProduction, sameSite: 'lax', path: '/',
    maxAge: config.auth.tokenHours * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.auth.cookieName, { httpOnly: true, secure: config.isProduction, sameSite: 'lax', path: '/' });
}

export async function isDefaultPasswordActive(adminId) {
  if (!config.auth.showDefaultPasswordWarning) return false;
  const db = await getDb();
  const admin = db.admins.find((row) => row.active && row.id === Number(adminId));
  return Boolean(admin && bcrypt.compareSync('ChangeMe-Now-2026!', admin.password_hash));
}

export async function changePassword(adminId, currentPassword, newPassword) {
  const db = await getDb();
  const admin = db.admins.find((row) => row.active && row.id === Number(adminId));
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) return false;
  await mutateStore((data) => {
    const row = data.admins.find((item) => item.id === Number(adminId));
    row.password_hash = bcrypt.hashSync(newPassword, 12);
    row.auth_version = Number(row.auth_version || 1) + 1;
    row.updated_at = nowIso();
  });
  return true;
}
