if (!localStorage.getItem('usuario_conectado')) {
    alert('Acceso denegado. Debes iniciar sesión.');
    window.location.href = '/admin/login.html';
}

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Obtenemos los Elementos del DOM ---
    const form = document.getElementById('paciente-form');
    const tabla = document.getElementById('pacientes-tabla');
    const searchInput = document.getElementById('search-input');
    const paginationControls = document.getElementById('pagination-controls');
    
    const editIdInput = document.getElementById('edit-id');
    const nombreInput = document.getElementById('nombre_completo');
    const fechaInput = document.getElementById('fecha_nacimiento');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    const direccionInput = document.getElementById('direccion');
    const notasInput = document.getElementById('notas_historial');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');

    const API_URL = '/api/pacientes';
    let currentPage = 1;

    // --- 2. Función FETCH (READ) ---
    const fetchPacientes = async (page = 1, searchTerm = '') => {
        try {
            currentPage = page;
            const url = `${API_URL}?page=${page}&limit=10&buscar=${encodeURIComponent(searchTerm)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar pacientes');

            const { data, pagination } = await response.json();
            
            tabla.innerHTML = '';
            
            if (data.length === 0) {
                tabla.innerHTML = '<tr><td colspan="6" style="text-align: center;">No se encontraron pacientes.</td></tr>';
            } else {
                data.forEach(p => {
                    const fechaFormateada = p.fecha_nacimiento.split('T')[0];
                    const fila = `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre_completo}</td>
                            <td>${fechaFormateada}</td>
                            <td>${p.telefono}</td>
                            <td>${p.email || ''}</td>
                            <td>
                                <button class="btn-edit" data-id="${p.id}">Editar</button>
                                <button class="btn-delete" data-id="${p.id}">Eliminar</button>
                            </td>
                        </tr>
                    `;
                    tabla.innerHTML += fila;
                });
            }
            renderPagination(pagination);

        } catch (error) {
            console.error('Error en fetchPacientes:', error);
            tabla.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar pacientes.</td></tr>';
        }
    };

    // --- FUNCIÓN DE PAGINACIÓN INTELIGENTE (Igual a Productos) ---
    const renderPagination = (pagination) => {
        const { currentPage, totalPages } = pagination;
        paginationControls.innerHTML = '';

        if (totalPages <= 1) return;

        const createPageButton = (i) => {
            const button = document.createElement('button');
            button.innerText = i;
            button.className = 'page-link';
            if (i === currentPage) button.classList.add('active');
            button.addEventListener('click', () => fetchPacientes(i, searchInput.value));
            return button;
        };

        const createEllipsis = () => {
            const span = document.createElement('span');
            span.innerText = '...';
            span.style.padding = '5px 10px';
            span.style.color = '#666';
            return span;
        };

        const prevButton = document.createElement('button');
        prevButton.innerText = 'Anterior';
        prevButton.className = 'page-link';
        if (currentPage === 1) prevButton.classList.add('disabled');
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) fetchPacientes(currentPage - 1, searchInput.value);
        });
        paginationControls.appendChild(prevButton);

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                paginationControls.appendChild(createPageButton(i));
            }
        } else {
            paginationControls.appendChild(createPageButton(1));
            if (currentPage > 3) paginationControls.appendChild(createEllipsis());
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 3) { start = 2; end = 4; }
            if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
            for (let i = start; i <= end; i++) {
                paginationControls.appendChild(createPageButton(i));
            }
            if (currentPage < totalPages - 2) paginationControls.appendChild(createEllipsis());
            paginationControls.appendChild(createPageButton(totalPages));
        }

        const nextButton = document.createElement('button');
        nextButton.innerText = 'Siguiente';
        nextButton.className = 'page-link';
        if (currentPage === totalPages) nextButton.classList.add('disabled');
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) fetchPacientes(currentPage + 1, searchInput.value);
        });
        paginationControls.appendChild(nextButton);
    };

    // --- 3. Función GUARDAR ---
    const guardarPaciente = async (e) => {
        e.preventDefault();
        const pacienteData = {
            nombre_completo: nombreInput.value,
            fecha_nacimiento: fechaInput.value,
            telefono: telefonoInput.value,
            email: emailInput.value,
            direccion: direccionInput.value,
            notas_historial: notasInput.value,
        };
        const id = editIdInput.value;
        let url = API_URL;
        let method = 'POST';
        if (id) { url = `${API_URL}/${id}`; method = 'PUT'; }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pacienteData),
            });
            if (!response.ok) throw new Error('Error al guardar.');
            form.reset();
            editIdInput.value = '';
            btnGuardar.textContent = 'Guardar Paciente';
            btnCancelar.style.display = 'none';
            await fetchPacientes(1, ''); 
            searchInput.value = ''; 
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo guardar el paciente.');
        }
    };

    // --- 4. Función TABLA ---
    const manejarClicsTabla = async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm(`¿Eliminar paciente ID ${id}?`)) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Error al eliminar.');
                    await fetchPacientes(currentPage, searchInput.value);
                } catch (error) { alert('No se pudo eliminar.'); }
            }
        }
        if (e.target.classList.contains('btn-edit')) {
            const id = e.target.dataset.id;
            try {
                const response = await fetch(`${API_URL}/${id}`);
                if (!response.ok) throw new Error('Error cargar paciente.');
                const paciente = await response.json();
                const fechaFormateada = paciente.fecha_nacimiento.split('T')[0];
                editIdInput.value = paciente.id;
                nombreInput.value = paciente.nombre_completo;
                fechaInput.value = fechaFormateada;
                telefonoInput.value = paciente.telefono;
                emailInput.value = paciente.email;
                direccionInput.value = paciente.direccion;
                notasInput.value = paciente.notas_historial;
                btnGuardar.textContent = 'Actualizar Paciente';
                btnCancelar.style.display = 'inline';
                window.scrollTo(0, 0);
            } catch (error) { alert('Error al cargar datos.'); }
        }
    };

    const cancelarEdicion = () => {
        form.reset();
        editIdInput.value = '';
        btnGuardar.textContent = 'Guardar Paciente';
        btnCancelar.style.display = 'none';
    };

    form.addEventListener('submit', guardarPaciente);
    tabla.addEventListener('click', manejarClicsTabla);
    btnCancelar.addEventListener('click', cancelarEdicion);
    searchInput.addEventListener('keyup', (e) => fetchPacientes(1, e.target.value));

    fetchPacientes(1, ''); 

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuario_conectado');
            window.location.href = '/admin/login.html';
        });
    }
});