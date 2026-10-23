// Pimath IA - verificación de Premium (activación manual por correo)
// Para activar a un usuario: agrega su correo de Google a esta lista, entre comillas simples y con coma.
const PREMIUM = [
  'ejemplo@gmail.com',
];

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = String((req.query && req.query.email) || (req.body && req.body.email) || '')
    .trim()
    .toLowerCase();
  if (!email || email.length > 200) return res.status(200).json({ premium: false });
  const lista = PREMIUM.map(e => String(e).trim().toLowerCase());
  return res.status(200).json({ premium: lista.includes(email) });
};
