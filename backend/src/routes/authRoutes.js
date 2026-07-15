import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginSchema, changePasswordSchema, zodFields } from '../validation.js';
import { authenticateAdmin, changePassword, clearAuthCookie, createAuthToken, isDefaultPasswordActive, setAuthCookie } from '../services/authService.js';
import { requireAdmin, requireCsrf } from '../middleware/auth.js';

export const authRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Zu viele Login-Versuche. Bitte warte einige Minuten.' }
});

authRouter.post('/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ ok: false, message: 'Bitte E-Mail und Passwort prüfen.' });
  const admin = authenticateAdmin(parsed.data.email, parsed.data.password);
  if (!admin) return res.status(401).json({ ok: false, message: 'E-Mail oder Passwort ist falsch.' });
  const { token, csrf } = createAuthToken(admin);
  setAuthCookie(res, token);
  res.json({
    ok: true,
    csrf,
    user: { id: admin.id, email: admin.email, displayName: admin.display_name, role: admin.role },
    defaultPasswordWarning: isDefaultPasswordActive(admin.id)
  });
});

authRouter.get('/me', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    csrf: req.authPayload.csrf,
    user: { id: req.admin.id, email: req.admin.email, displayName: req.admin.display_name, role: req.admin.role },
    defaultPasswordWarning: isDefaultPasswordActive(req.admin.id)
  });
});

authRouter.post('/logout', requireAdmin, requireCsrf, (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.post('/change-password', requireAdmin, requireCsrf, (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ ok: false, message: 'Bitte prüfe die Passwortangaben.', fields: zodFields(parsed.error) });
  const changed = changePassword(req.admin.id, parsed.data.current_password, parsed.data.new_password);
  if (!changed) return res.status(400).json({ ok: false, message: 'Das aktuelle Passwort ist falsch.' });
  clearAuthCookie(res);
  res.json({ ok: true, message: 'Passwort geändert. Bitte erneut anmelden.' });
});
