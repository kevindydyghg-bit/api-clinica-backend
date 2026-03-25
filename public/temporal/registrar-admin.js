// --- FASE 4: GUARDIÁN DE SEGURIDAD ---
if (!localStorage.getItem('usuario_conectado')) {
    window.location.href = '/admin/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('registro-admin-form');
    const mensaje = document.getElementById('mensaje-respuesta');
    const btnGuardar = document.getElementById('btn-guardar');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desactivar botón para evitar doble clic
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Registrando...";
        mensaje.textContent = "";

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Usamos la ruta de registro que ya existe en tu server.js
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                mensaje.style.color = 'green';
                mensaje.textContent = '¡Usuario administrador creado con éxito!';
                form.reset(); // Limpiar el formulario
            } else {
                mensaje.style.color = 'red';
                // Muestra el error que devuelve el servidor (ej: "Email ya registrado")
                mensaje.textContent = data.error || 'Error al registrar usuario.';
            }

        } catch (error) {
            console.error('Error:', error);
            mensaje.style.color = 'red';
            mensaje.textContent = 'Error de conexión con el servidor.';
        } finally {
            // Reactivar botón
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Registrar Usuario";
        }
    });
});