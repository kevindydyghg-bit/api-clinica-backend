document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const message = document.getElementById('message');

    // --- LÓGICA DE REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    message.textContent = '¡Registro exitoso! Redirigiendo a login...';
                    message.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = '/admin/login.html';
                    }, 2000);
                } else {
                    message.textContent = data.error;
                    message.style.color = 'red';
                }
            } catch (error) {
                console.error('Error en fetch:', error);
                message.textContent = 'Error de conexión. Intenta de nuevo.';
                message.style.color = 'red';
            }
        });
    }

    // --- LÓGICA DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    message.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
                    message.style.color = 'green';
                    
                    localStorage.setItem('usuario_conectado', 'true');
                    // Guardamos el email para mostrarlo en el saludo del dashboard
                    localStorage.setItem('usuario_email', email);
                    
                    setTimeout(() => {
                        // ¡AQUÍ CAMBIA! Redirige al nuevo dashboard
                        window.location.href = '/admin/dashboard.html';
                    }, 1500);

                } else {
                    message.textContent = data.error;
                    message.style.color = 'red';
                }
            } catch (error) {
                console.error('Error en fetch:', error);
                message.textContent = 'Error de conexión. Intenta de nuevo.';
                message.style.color = 'red';
            }
        });
    }
});