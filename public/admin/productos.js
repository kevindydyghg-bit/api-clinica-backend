// --- FASE 4: GUARDIÁN DE SEGURIDAD ---
if (!localStorage.getItem('usuario_conectado')) {
    alert('Acceso denegado. Debes iniciar sesión.');
    window.location.href = '/admin/login.html';
}

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('producto-form');
    const tabla = document.getElementById('productos-tabla');
    const searchInput = document.getElementById('search-input');
    const paginationControls = document.getElementById('pagination-controls');
    
    const editIdInput = document.getElementById('edit-id');
    const nombreInput = document.getElementById('nombre');
    const cantidadInput = document.getElementById('cantidad');
    const precioInput = document.getElementById('precio');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');

    const API_URL = '/api/productos';
    let currentPage = 1;

    // --- 1. DETECTAR FILTRO "STOCK BAJO" ---
    const urlParams = new URLSearchParams(window.location.search);
    const filtroBajo = urlParams.get('filtro'); 

    // Si hay filtro activo, cambiamos visualmente el título
    if (filtroBajo === 'bajo') {
        const titulo = document.querySelector('section.card:nth-child(2) h2'); // Busca el h2 de la segunda tarjeta
        if(titulo) {
            titulo.textContent = '⚠️ Productos con Stock Bajo';
            titulo.style.color = '#d9534f';
        }
    }

    // --- 2. Función FETCH (READ) Actualizada ---
    const fetchProductos = async (page = 1, searchTerm = '') => {
        try {
            currentPage = page;
            
            // Construimos la URL base
            let url = `${API_URL}?page=${page}&limit=10&buscar=${encodeURIComponent(searchTerm)}`;
            
            // Si el filtro está activo, lo añadimos a la petición
            if (filtroBajo === 'bajo') {
                url += `&filtro=bajo`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar productos');
            
            const { data, pagination } = await response.json();
            
            tabla.innerHTML = '';
            
            if (data.length === 0) {
                tabla.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se encontraron productos.</td></tr>';
            } else {
                data.forEach(p => {
                    // Estilo condicional: Rojo si hay menos de 20
                    const estiloCantidad = p.cantidad < 20 ? 'color: #d9534f; font-weight: bold;' : '';

                    const fila = `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre}</td>
                            <td style="${estiloCantidad}">${p.cantidad}</td>
                            <td>$${p.precio}</td>
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
            console.error('Error en fetchProductos:', error);
            tabla.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar productos.</td></tr>';
        }
    };

    // --- FUNCIÓN DE PAGINACIÓN INTELIGENTE ---
    const renderPagination = (pagination) => {
        const { currentPage, totalPages } = pagination;
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;

        const createPageButton = (i) => {
            const button = document.createElement('button');
            button.innerText = i;
            button.className = 'page-link';
            if (i === currentPage) button.classList.add('active');
            button.addEventListener('click', () => fetchProductos(i, searchInput.value));
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
            if (currentPage > 1) fetchProductos(currentPage - 1, searchInput.value);
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
            if (currentPage < totalPages) fetchProductos(currentPage + 1, searchInput.value);
        });
        paginationControls.appendChild(nextButton);
    };

    // --- 3. Función GUARDAR ---
    const guardarProducto = async (e) => {
        e.preventDefault(); 
        const productoData = {
            nombre: nombreInput.value,
            cantidad: parseInt(cantidadInput.value),
            precio: parseFloat(precioInput.value),
        };
        const id = editIdInput.value; 
        let url = API_URL;
        let method = 'POST'; 
        if (id) { url = `${API_URL}/${id}`; method = 'PUT'; }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData),
            });
            if (!response.ok) throw new Error('Error al guardar.');
            form.reset(); 
            editIdInput.value = ''; 
            btnGuardar.textContent = 'Guardar Producto'; 
            btnCancelar.style.display = 'none'; 
            await fetchProductos(1, ''); 
            searchInput.value = ''; 
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo guardar el producto.');
        }
    };

    // --- 4. Función TABLA ---
    const manejarClicsTabla = async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm(`¿Eliminar producto ID ${id}?`)) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Error al eliminar.');
                    await fetchProductos(currentPage, searchInput.value); 
                } catch (error) { alert('No se pudo eliminar.'); }
            }
        }
        if (e.target.classList.contains('btn-edit')) {
            const id = e.target.dataset.id;
            try {
                const response = await fetch(`${API_URL}/${id}`); 
                if (!response.ok) throw new Error('Error cargar producto.');
                const producto = await response.json();
                editIdInput.value = producto.id;
                nombreInput.value = producto.nombre;
                cantidadInput.value = producto.cantidad;
                precioInput.value = producto.precio;
                btnGuardar.textContent = 'Actualizar Producto';
                btnCancelar.style.display = 'inline'; 
                window.scrollTo(0, 0); 
            } catch (error) { alert('Error al cargar datos.'); }
        }
    };

    const cancelarEdicion = () => {
        form.reset();
        editIdInput.value = '';
        btnGuardar.textContent = 'Guardar Producto';
        btnCancelar.style.display = 'none';
    };

    form.addEventListener('submit', guardarProducto);
    tabla.addEventListener('click', manejarClicsTabla);
    btnCancelar.addEventListener('click', cancelarEdicion);
    searchInput.addEventListener('keyup', (e) => fetchProductos(1, e.target.value));

    fetchProductos(1, ''); 

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuario_conectado');
            window.location.href = '/admin/login.html';
        });
    }
});