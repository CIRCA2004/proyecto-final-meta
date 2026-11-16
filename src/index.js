const express = require('express');
const mysql = require('mysql2/promise');
const os = require('os');

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'meta_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function obtenerServicios() {
  const [rows] = await pool.query(
    'SELECT id, nombre, responsable, estado, descripcion, fecha FROM servicios ORDER BY id'
  );
  return rows;
}

app.get('/', async (_req, res) => {
  let servicios = [];
  let baseDatosActiva = true;

  try {
    servicios = await obtenerServicios();
  } catch (error) {
    baseDatosActiva = false;
    console.error('Error consultando MySQL:', error.message);
  }

  const tarjetas = servicios.map((servicio) => `
    <article class="service-card">
      <div class="service-top">
        <span class="service-number">0${escapeHtml(servicio.id)}</span>
        <span class="status"><span class="dot"></span>${escapeHtml(servicio.estado)}</span>
      </div>
      <h3>${escapeHtml(servicio.nombre)}</h3>
      <p>${escapeHtml(servicio.descripcion)}</p>
      <strong>Responsable: ${escapeHtml(servicio.responsable)}</strong>
    </article>
  `).join('');

  res.type('html').send(`<!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>META | Infraestructura de TI</title>
    <style>
      :root { color-scheme: dark; --bg:#080808; --panel:#111; --line:#2a2a2a; --text:#f5f5f5; --muted:#a8a8a8; --ok:#3ddc84; }
      * { box-sizing:border-box; }
      html { scroll-behavior:smooth; }
      body { margin:0; font-family:Arial,Helvetica,sans-serif; background:var(--bg); color:var(--text); }
      a { color:inherit; text-decoration:none; }
      header { position:sticky; top:0; z-index:10; display:flex; justify-content:space-between; align-items:center; padding:22px 7%; background:rgba(8,8,8,.94); border-bottom:1px solid var(--line); }
      .brand { font-size:1.35rem; font-weight:900; letter-spacing:.18em; }
      nav { display:flex; gap:24px; color:var(--muted); font-size:.92rem; }
      nav a:hover { color:var(--text); }
      main { width:min(1180px,86%); margin:auto; }
      .hero { min-height:72vh; display:grid; align-content:center; border-bottom:1px solid var(--line); }
      .eyebrow { margin:0 0 18px; color:var(--muted); text-transform:uppercase; letter-spacing:.18em; font-size:.78rem; font-weight:700; }
      h1 { max-width:900px; margin:0; font-size:clamp(3rem,8vw,7rem); line-height:.93; letter-spacing:-.06em; }
      .hero-copy { max-width:680px; margin:28px 0; color:var(--muted); font-size:1.08rem; line-height:1.7; }
      .summary { display:flex; flex-wrap:wrap; gap:12px; }
      .pill { padding:10px 14px; border:1px solid var(--line); border-radius:999px; font-size:.88rem; }
      .pill strong { color:var(--ok); }
      section { padding:84px 0; border-bottom:1px solid var(--line); }
      .section-title { display:flex; justify-content:space-between; gap:30px; align-items:end; margin-bottom:34px; }
      h2 { margin:0; font-size:clamp(2rem,5vw,4rem); letter-spacing:-.045em; }
      .section-title p { max-width:450px; margin:0; color:var(--muted); line-height:1.6; }
      .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
      .service-card { min-height:260px; display:flex; flex-direction:column; padding:24px; background:var(--panel); border:1px solid var(--line); border-radius:18px; }
      .service-top { display:flex; justify-content:space-between; color:var(--muted); font-size:.78rem; text-transform:uppercase; letter-spacing:.1em; }
      .status { display:flex; align-items:center; gap:7px; }
      .dot { width:8px; height:8px; border-radius:50%; background:var(--ok); box-shadow:0 0 14px var(--ok); }
      .service-card h3 { margin:44px 0 12px; font-size:1.35rem; }
      .service-card p { flex:1; margin:0 0 28px; color:var(--muted); line-height:1.55; }
      .service-card strong { font-size:.88rem; }
      .architecture { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
      .arch-box { padding:30px; border:1px solid var(--line); border-radius:18px; }
      .arch-box span { color:var(--muted); }
      footer { width:min(1180px,86%); margin:auto; padding:38px 0 60px; display:flex; justify-content:space-between; color:var(--muted); font-size:.85rem; }
      @media (max-width:800px) { nav { display:none; } .grid,.architecture { grid-template-columns:1fr; } .section-title { align-items:start; flex-direction:column; } footer { flex-direction:column; gap:10px; } }
    </style>
  </head>
  <body>
    <header>
      <a class="brand" href="#inicio">META</a>
      <nav><a href="#infraestructura">Infraestructura</a><a href="#arquitectura">Arquitectura</a><a href="/api/servicios">API</a><a href="/health">Salud</a></nav>
    </header>
    <main>
      <section class="hero" id="inicio">
        <p class="eyebrow">Administración de Infraestructura de TI</p>
        <h1>Infraestructura conectada, segura y disponible.</h1>
        <p class="hero-copy">Portal académico de META desplegado sobre Ubuntu Server y Dokploy. Integra aplicaciones, datos y servicios corporativos administrados por un equipo de infraestructura.</p>
        <div class="summary">
          <span class="pill"><strong>${baseDatosActiva ? 'En línea' : 'Sin conexión'}</strong> Base de datos</span>
          <span class="pill"><strong>${servicios.length}</strong> áreas verificadas</span>
          <span class="pill"><strong>v3.0.0</strong> versión</span>
        </div>
      </section>
      <section id="infraestructura">
        <div class="section-title"><h2>Servicios implementados</h2><p>La información de esta sección se consulta directamente desde MySQL, demostrando la integración entre el portal y la base de datos.</p></div>
        <div class="grid">${tarjetas || '<article class="service-card"><h3>Base de datos no disponible</h3><p>Revisa las variables de entorno de la aplicación.</p></article>'}</div>
      </section>
      <section id="arquitectura">
        <div class="section-title"><h2>Arquitectura</h2><p>Una solución centralizada para publicar aplicaciones y prestar servicios a clientes Linux y Windows.</p></div>
        <div class="architecture">
          <div class="arch-box"><h3>Plataforma</h3><span>Ubuntu Server · Dokploy · Docker Swarm · Traefik · Node.js · MySQL</span></div>
          <div class="arch-box"><h3>Servicios corporativos</h3><span>NTP · NFS · NIS · Samba · CUPS · UFW · Monitoreo · Respaldos</span></div>
        </div>
      </section>
    </main>
    <footer><strong>Proyecto final · META</strong><span>Santiago · Diana · Juan · 2026</span></footer>
  </body>
  </html>`);
});

app.get('/api/servicios', async (_req, res) => {
  try {
    const servicios = await obtenerServicios();
    res.json({ empresa: 'META', total: servicios.length, servicios });
  } catch (error) {
    res.status(503).json({ error: 'Base de datos no disponible', detalle: error.message });
  }
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'saludable', base_datos: 'conectada', version: '3.0.0', uptime: process.uptime() });
  } catch (error) {
    res.status(503).json({ estado: 'degradado', base_datos: 'sin conexion', version: '3.0.0' });
  }
});

app.get('/info', (_req, res) => {
  res.json({
    empresa: 'META',
    plataforma: 'Dokploy PaaS',
    node_version: process.version,
    arquitectura: process.arch,
    memoria_total_mb: Math.round(os.totalmem() / 1024 / 1024),
    memoria_libre_mb: Math.round(os.freemem() / 1024 / 1024)
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Portal META ejecutándose en el puerto ${port}`);
  console.log('Plataforma: Dokploy PaaS');
});
