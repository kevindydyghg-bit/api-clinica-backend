// --- 1. Importaciones ---
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// --- 2. Configuración Inicial ---
const app = express();
// Usa el puerto de Render en la nube, o el 3000 si estás en tu computadora
const PORT = process.env.PORT || 3000;

// --- 3. Middlewares ---
app.use(express.json()); 
app.use(cors()); 

// --- 4. Configuración de la Conexión a PostgreSQL ---
// Usamos process.env.DATABASE_URL para conectarnos a la nube de Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:456893@localhost:5432/inventario_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// --- 5. Servir Archivos Estáticos (Frontend) ---
app.use(express.static('public')); 

// --- 6. Ruta de Prueba ---
app.get('/api/test', (req, res) => {
    res.send('¡El servidor backend está funcionando correctamente! 🚀');
});

// --- 7. Rutas de Autenticación (API) ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await pool.query("INSERT INTO usuarios (email, password_hash) VALUES ($1, $2) RETURNING id, email", [email, passwordHash]);
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuario: newUser.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'El email ya está registrado.' });
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    try {
        const userQuery = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (userQuery.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
        const user = userQuery.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta.' });
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso.' });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// --- 8. Rutas del CRUD de Inventario (API) ---
app.post('/api/productos', async (req, res) => {
    const { nombre, cantidad, precio } = req.body;
    if (!nombre || cantidad == null || precio == null) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    try {
        const newProducto = await pool.query("INSERT INTO productos (nombre, cantidad, precio) VALUES ($1, $2, $3) RETURNING *", [nombre, cantidad, precio]);
        res.status(201).json(newProducto.rows[0]);
    } catch (error) { console.error('Error al crear:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.get('/api/productos', async (req, res) => {
    try {
        const { buscar, page = 1, limit = 10, filtro } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (buscar) {
            conditions.push(`nombre ILIKE $${paramIndex}`);
            params.push(`%${buscar}%`);
            paramIndex++;
        }
        if (filtro === 'bajo') {
            conditions.push(`cantidad < 20`);
        }

        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = "WHERE " + conditions.join(" AND ");
        }

        const countQuery = `SELECT COUNT(*) FROM productos ${whereClause}`;
        const totalResult = await pool.query(countQuery, params);
        const totalItems = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        const dataParams = [...params];
        dataParams.push(parseInt(limit));
        dataParams.push(offset);

        const query = `SELECT * FROM productos ${whereClause} ORDER BY id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const allProductos = await pool.query(query, dataParams);
        
        res.status(200).json({ data: allProductos.rows, pagination: { currentPage: parseInt(page), totalPages: totalPages, totalItems: totalItems, limit: parseInt(limit) } });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.get('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
        if (producto.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json(producto.rows[0]);
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params; 
    const { nombre, cantidad, precio } = req.body;
    try {
        const updated = await pool.query("UPDATE productos SET nombre = $1, cantidad = $2, precio = $3 WHERE id = $4 RETURNING *", [nombre, cantidad, precio, id]);
        if (updated.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json(updated.rows[0]);
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await pool.query("DELETE FROM productos WHERE id = $1 RETURNING *", [id]);
        if (deleted.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json({ mensaje: 'Eliminado.' });
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

// --- 9. Rutas del CRUD de Pacientes (API) ---
app.post('/api/pacientes', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log("⚠️ El servidor recibió un cuerpo vacío. Revisa Postman.");
        return res.status(400).json({ error: 'El cuerpo de la petición (JSON) está vacío o mal formateado. Revisa Postman.' });
    }
    const { nombre_completo, fecha_nacimiento, telefono, email, direccion, notas_historial } = req.body;
    
    if (!nombre_completo || !fecha_nacimiento || !telefono) {
         return res.status(400).json({ error: 'Los campos nombre_completo, fecha_nacimiento y telefono son obligatorios.' });
    }
    try {
        const newP = await pool.query(
            "INSERT INTO pacientes (nombre_completo, fecha_nacimiento, telefono, email, direccion, notas_historial) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
            [nombre_completo, fecha_nacimiento, telefono, email, direccion, notas_historial]
        );
        res.status(201).json(newP.rows[0]);
    } catch (error) { 
        console.error('Error al insertar en DB:', error); 
        res.status(500).json({ error: 'Error interno del servidor al guardar el paciente.' }); 
    }
});

app.get('/api/pacientes', async (req, res) => {
    try {
        const { buscar, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereClause = "";
        let params = [];
        if (buscar) { whereClause = "WHERE nombre_completo ILIKE $1 OR email ILIKE $1"; params.push(`%${buscar}%`); }
        
        const countQuery = `SELECT COUNT(*) FROM pacientes ${whereClause}`;
        const totalResult = await pool.query(countQuery, params);
        const totalItems = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        
        const dataParams = [...params, parseInt(limit), offset];
        const query = `SELECT * FROM pacientes ${whereClause} ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const allPacientes = await pool.query(query, dataParams);
        
        res.status(200).json({ data: allPacientes.rows, pagination: { currentPage: parseInt(page), totalPages, totalItems, limit: parseInt(limit) } });
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.get('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const paciente = await pool.query("SELECT * FROM pacientes WHERE id = $1", [id]);
        if (paciente.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json(paciente.rows[0]);
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.put('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, fecha_nacimiento, telefono, email, direccion, notas_historial } = req.body;
    try {
        const updated = await pool.query("UPDATE pacientes SET nombre_completo = $1, fecha_nacimiento = $2, telefono = $3, email = $4, direccion = $5, notas_historial = $6 WHERE id = $7 RETURNING *", [nombre_completo, fecha_nacimiento, telefono, email, direccion, notas_historial, id]);
        if (updated.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json(updated.rows[0]);
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await pool.query("DELETE FROM pacientes WHERE id = $1 RETURNING *", [id]);
        if (deleted.rows.length === 0) return res.status(404).json({ error: 'No encontrado.' });
        res.status(200).json({ mensaje: 'Eliminado.' });
    } catch (error) { console.error('Error:', error); res.status(500).json({ error: 'Error interno.' }); }
});

// --- 10. Ruta de Estadísticas (Dashboard) ---
app.get('/api/stats', async (req, res) => {
    try {
        const pacientesRes = await pool.query("SELECT COUNT(*) FROM pacientes");
        const productosRes = await pool.query("SELECT COUNT(*) FROM productos");
        const stockRes = await pool.query("SELECT COUNT(*) FROM productos WHERE cantidad < 20");

        res.json({
            pacientes: pacientesRes.rows[0].count,
            productos: productosRes.rows[0].count,
            stockBajo: stockRes.rows[0].count
        });
    } catch (error) {
        console.error("Error stats:", error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// --- 11. Iniciar el Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});