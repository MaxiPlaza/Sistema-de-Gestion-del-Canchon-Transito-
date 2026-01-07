class SistemaTransito {
    constructor() {
        this.apiBase = '/api'; // Relative path for portability
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
    }

    bindEvents() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });

        // Vehículos
        document.getElementById('nuevoVehiculoBtn').addEventListener('click', () => this.showVehiculoModal());
        document.getElementById('vehiculoForm').addEventListener('submit', (e) => this.handleVehiculoSubmit(e));
        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());

        // Cerrar modal al hacer click fuera
        document.getElementById('vehiculoModal').addEventListener('click', (e) => {
            if (e.target.id === 'vehiculoModal') this.hideModal();
        });

        // Nuevos listeners para modales
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.ocultarModal(modalId);
            });
        });

        document.querySelectorAll('.btn-secondary[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.ocultarModal(modalId);
            });
        });

        // Cerrar modales al hacer click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ocultarModal(modal.id);
                }
            });
        });

        document.getElementById('buscarVehiculosBtn').addEventListener('click', () => this.buscarVehiculos());
        document.getElementById('limpiarFiltrosVehiculosBtn').addEventListener('click', () => this.limpiarFiltrosVehiculos());
        document.getElementById('nuevoPropietarioBtn').addEventListener('click', () => this.showPropietarioModal());
        document.getElementById('propietarioForm').addEventListener('submit', (e) => this.handlePropietarioSubmit(e));
        document.getElementById('buscarPropietariosBtn').addEventListener('click', () => this.buscarPropietarios());
        document.getElementById('limpiarFiltrosPropietariosBtn').addEventListener('click', () => this.limpiarFiltrosPropietarios());
        document.getElementById('nuevaInfraccionBtn').addEventListener('click', () => this.showInfraccionModal());
        document.getElementById('infraccionForm').addEventListener('submit', (e) => this.handleInfraccionSubmit(e));
        document.getElementById('buscarInfraccionesBtn').addEventListener('click', () => this.buscarInfracciones());
        document.getElementById('limpiarFiltrosInfraccionesBtn').addEventListener('click', () => this.limpiarFiltrosInfracciones());
        document.getElementById('generarReporteGeneralBtn').addEventListener('click', () => this.loadReporteGeneral());
        document.getElementById('buscarPorPatenteBtn').addEventListener('click', () => this.consultarPorPatente());
        document.getElementById('buscarPorActaBtn').addEventListener('click', () => this.consultarPorActa());
        document.getElementById('buscarPorDNIBtn').addEventListener('click', () => this.consultarPorDNI());
        document.getElementById('generarReporteFechaBtn').addEventListener('click', () => this.generarReporteFecha());
        document.getElementById('generarReporteVehiculosBtn').addEventListener('click', () => this.generarReporteVehiculos());
        document.getElementById('actualizarDashboardBtn').addEventListener('click', () => this.loadDashboardCompleto());
        document.getElementById('nuevoUsuarioBtn').addEventListener('click', () => this.showUsuarioModal());
        document.getElementById('usuarioForm').addEventListener('submit', (e) => this.handleUsuarioSubmit(e));
        document.getElementById('cambiarPasswordForm').addEventListener('submit', (e) => this.handleCambiarPassword(e));

        // Importación de Excel
        document.getElementById('importarExcelBtn').addEventListener('click', () => this.showImportarModal());
        document.getElementById('excelFileInput').addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('ejecutarImportBtn').addEventListener('click', () => this.ejecutarImportacion());

        // Salidas de Vehículos
        document.getElementById('nuevaSalidaBtn').addEventListener('click', () => this.showSalidaModal());
        document.getElementById('salidaForm').addEventListener('submit', (e) => this.handleSalidaSubmit(e));
        document.getElementById('buscarSalidasBtn').addEventListener('click', () => this.buscarSalidas());
        document.getElementById('limpiarFiltrosSalidasBtn').addEventListener('click', () => this.limpiarFiltrosSalidas());

        // Historial
        const actualizarHistorialBtn = document.getElementById('actualizarHistorialBtn');
        if (actualizarHistorialBtn) {
            actualizarHistorialBtn.addEventListener('click', () => this.loadHistorial());
        }
        const buscarHistorialBtn = document.getElementById('buscarHistorialBtn');
        if (buscarHistorialBtn) {
            buscarHistorialBtn.addEventListener('click', () => this.loadHistorial());
        }
    }

    checkAuth() {
        if (this.token && this.user.id) {
            this.showDashboard();
            this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;

                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showDashboard();
                this.loadDashboardData();
                this.showMessage('Login exitoso', 'success');
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.token = null;
        this.user = {};
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('dashboard').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboard').classList.add('active');

        // Actualizar información del usuario
        document.getElementById('userWelcome').textContent = `Bienvenido, ${this.user.nombre_completo}`;

        // Mostrar/ocultar elementos según el rol
        if (this.user.rol === 'admin') {
            document.body.classList.add('user-role-admin');
        }
    }

    switchTab(e) {
        const tabId = e.currentTarget.getAttribute('data-tab');

        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        // Mostrar contenido de la pestaña
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        // Cargar datos específicos de la pestaña
        if (tabId === 'dashboard-tab') {
            this.loadDashboardCompleto();
        }
        if (tabId === 'vehiculos-tab') {
            this.loadVehiculos();
        }
        if (tabId === 'propietarios-tab') {
            this.loadPropietarios();
        }
        if (tabId === 'infracciones-tab') {
            this.loadInfracciones();
            this.loadEstadisticasInfracciones();
        }
        if (tabId === 'salidas-tab') {
            this.loadSalidas();
        }
        if (tabId === 'reportes-tab') {
            this.loadReporteGeneral();
        }
        if (tabId === 'admin-tab') {
            this.loadAdminData();
        }
        if (tabId === 'historial-tab') {
            this.loadHistorial();
        }
    }

    async loadDashboardData() {
        try {
            console.log('📊 Cargando datos del dashboard...');
            const response = await this.apiCall('/dashboard/stats');

            if (response.success && response.data && response.data.estadisticas) {
                const stats = response.data.estadisticas;

                // Actualizar contadores
                this.updateElementText('totalVehiculos', stats.total_vehiculos);
                this.updateElementText('totalPropietarios', stats.total_propietarios);
                this.updateElementText('totalInfracciones', stats.total_infracciones);
                this.updateElementText('activa', stats.infracciones_activas);
                this.updateElementText('resuelta', stats.infracciones_resueltas);
                this.updateElementText('totalUsuarios', stats.total_usuarios);
                this.updateElementText('infraccionesHoy', stats.infracciones_hoy);
            }
        } catch (error) {
            console.error('❌ Error cargando datos del dashboard:', error);
        }
    }

    updateElementText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || 0;
        }
    }

    async loadVehiculos() {
        try {
            console.log('🔄 Cargando vehículos...'); // Debug
            const data = await this.apiCall('/vehiculos');
            console.log('📦 Datos recibidos:', data); // Debug
            this.renderVehiculosTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando vehículos:', error);
            this.showMessage('Error al cargar vehículos', 'error');
        }
    }

    renderVehiculosTable(vehiculos) {
        const tbody = document.getElementById('vehiculosTableBody');
        tbody.innerHTML = '';

        console.log('🎯 Vehículos a renderizar:', vehiculos);

        if (vehiculos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-car" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay vehículos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        vehiculos.forEach(vehiculo => {
            console.log('🚗 Procesando vehículo:', vehiculo);

            const row = document.createElement('tr');

            // Verificar que tenemos los datos
            const tieneDocumentacion = vehiculo.cedula_verde || vehiculo.titulo_registro;
            const tieneSeguro = vehiculo.seguro_activo;
            const fechaRegistro = vehiculo.fecha_registro ? this.formatFecha(vehiculo.fecha_registro) : '-';

            // Crear las celdas de datos normalmente
            row.innerHTML = `
                <td><strong>${vehiculo.patente || '-'}</strong></td>
                <td><span class="badge">${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</span></td>
                <td>${vehiculo.marca || '-'}</td>
                <td>${vehiculo.modelo || '-'}</td>
                <td>${vehiculo.color || '-'}</td>
                <td>${vehiculo.numero_motor || '-'}</td>
                <td>${vehiculo.numero_chasis || '-'}</td>
                <td>${vehiculo.propietario_nombre || (vehiculo.propietario_dni ? `DNI: ${vehiculo.propietario_dni}` : 'No asignado')}</td>
                <td>${tieneDocumentacion ? '✅' : '❌'}</td>
                <td>
                    ${tieneSeguro ? '✅' : '❌'}
                    ${tieneSeguro && vehiculo.compañia_seguro ? `<br><small>${vehiculo.compañia_seguro}</small>` : ''}
                </td>
                <td>${fechaRegistro}</td>
            `;

            // === PARTE CORREGIDA: CREAR CELDA DE ACCIONES CON EVENT LISTENERS ===
            const accionesCell = document.createElement('td');

            // Botón Ver Detalles
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => {
                console.log('👁️ Click en Ver:', vehiculo.id);
                this.verVehiculo(vehiculo.id);
            });

            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => {
                console.log('✏️ Click en Editar:', vehiculo.id);
                this.editarVehiculo(vehiculo.id);
            });

            // Botón Historial
            const btnHistorial = document.createElement('button');
            btnHistorial.className = 'btn-icon';
            btnHistorial.title = 'Ver historial';
            btnHistorial.innerHTML = '<i class="fas fa-history"></i>';
            btnHistorial.addEventListener('click', () => {
                console.log('📜 Click en Historial:', vehiculo.id);
                this.verHistorialVehiculo(vehiculo.id, vehiculo.patente);
            });

            // Botón Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener('click', () => {
                console.log('🗑️ Click en Eliminar:', vehiculo.id);
                this.eliminarVehiculo(vehiculo.id);
            });

            // Agregar botones a la celda
            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnHistorial);
            accionesCell.appendChild(btnEliminar);

            // Agregar celda de acciones a la fila
            row.appendChild(accionesCell);

            tbody.appendChild(row);
        });
    }

    formatTipoVehiculo(tipo) {
        const tipos = {
            'auto': 'Auto',
            'camion': 'Camión',
            'moto': 'Moto',
            'bicicleta': 'Bicicleta',
            'otro': 'Otro'
        };
        return tipos[tipo] || tipo;
    }

    showVehiculoModal() {
        document.getElementById('vehiculoModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Nuevo Vehículo';
        document.getElementById('vehiculoForm').reset();
        // En showVehiculoModal, agrega:
        delete document.getElementById('vehiculoForm').dataset.editingId;
        document.getElementById('patente').readOnly = false;
    }

    hideModal() {
        document.getElementById('vehiculoModal').style.display = 'none';
    }

    // Manejar envío de vehículo COMPLETO
    async handleVehiculoSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const vehiculoData = {
            patente: formData.get('patente'),
            tipo_vehiculo: formData.get('tipo_vehiculo'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            color: formData.get('color'),
            numero_motor: formData.get('numero_motor'),
            numero_chasis: formData.get('numero_chasis'),
            propietario_dni: formData.get('propietario_dni') || null,
            cedula_verde: formData.get('cedula_verde') || null,
            titulo_registro: formData.get('titulo_registro') || null,
            seguro_activo: formData.get('seguro_activo') === 'true',
            compañia_seguro: formData.get('compañia_seguro') || null
        };

        console.log('📝 Datos del vehículo:', vehiculoData); // Para debug

        try {
            const editingId = document.getElementById('vehiculoForm').dataset.editingId;

            if (editingId) {
                // Modo edición - PUT request
                const data = await this.apiCall(`/vehiculos/${editingId}`, 'PUT', vehiculoData);
                this.showMessage('Vehículo actualizado exitosamente', 'success');

                // Limpiar el ID de edición
                delete document.getElementById('vehiculoForm').dataset.editingId;
            } else {
                // Modo creación - POST request
                const data = await this.apiCall('/vehiculos', 'POST', vehiculoData);
                this.showMessage('Vehículo creado exitosamente', 'success');
            }

            this.hideModal();
            this.loadVehiculos();
            this.loadDashboardData();

        } catch (error) {
            console.error('Error creando vehículo:', error);
            this.showMessage(error.message || 'Error al crear vehículo', 'error');
        }
    }
    // Buscar vehículos con filtros - VERSIÓN CORREGIDA
    async buscarVehiculos() {
        const patente = document.getElementById('filterPatente').value.trim();
        const marca = document.getElementById('filterMarca').value.trim();
        const propietario = document.getElementById('filterPropietario').value.trim();

        console.log('🔍 Filtros de búsqueda:', { patente, marca, propietario });

        // Si no hay filtros, cargar todos
        if (!patente && !marca && !propietario) {
            this.loadVehiculos();
            return;
        }

        try {
            // Construir query string con todos los filtros
            const params = new URLSearchParams();
            if (patente) params.append('patente', patente);
            if (marca) params.append('marca', marca);
            if (propietario) params.append('propietario', propietario);

            const queryString = params.toString();
            console.log('🌐 Query string:', queryString);

            const data = await this.apiCall(`/vehiculos/search?${queryString}`);
            console.log('✅ Resultados de búsqueda:', data.data);

            this.renderVehiculosTable(data.data || []);

            if (data.data && data.data.length === 0) {
                this.showMessage('No se encontraron vehículos con los filtros aplicados', 'info');
            }
        } catch (error) {
            console.error('❌ Error buscando vehículos:', error);
            this.showMessage('Error al buscar vehículos', 'error');
            this.loadVehiculos(); // Recargar todos en caso de error
        }
    }

    // Limpiar filtros de vehículos
    limpiarFiltrosVehiculos() {
        document.getElementById('filterPatente').value = '';
        document.getElementById('filterMarca').value = '';
        document.getElementById('filterPropietario').value = '';
        this.loadVehiculos();
    }

    // Función para ver detalles de vehículo
    async verVehiculo(id) {
        try {
            console.log('🔍 Obteniendo detalles del vehículo:', id);

            const data = await this.apiCall(`/vehiculos/${id}`);
            const vehiculo = data.data;

            this.mostrarDetalleVehiculo(vehiculo);

        } catch (error) {
            console.error('Error obteniendo detalles del vehículo:', error);
            this.showMessage('Error al cargar detalles del vehículo', 'error');
        }
    }
    // Mostrar detalles en modal
    mostrarDetalleVehiculo(vehiculo) {
        const content = document.getElementById('detalleVehiculoContent');

        content.innerHTML = `
            <div class="detalle-section">
                <h4>Información Básica</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Patente</div>
                        <div class="detalle-value"><strong>${vehiculo.patente}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Tipo de Vehículo</div>
                        <div class="detalle-value">${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Marca</div>
                        <div class="detalle-value">${vehiculo.marca || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Modelo</div>
                        <div class="detalle-value">${vehiculo.modelo || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Color</div>
                        <div class="detalle-value">${vehiculo.color || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Identificación Técnica</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Número de Motor</div>
                        <div class="detalle-value">${vehiculo.numero_motor || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Número de Chasis</div>
                        <div class="detalle-value">${vehiculo.numero_chasis || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Propietario</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Nombre</div>
                        <div class="detalle-value">${vehiculo.propietario_nombre || 'No asignado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">DNI</div>
                        <div class="detalle-value">${vehiculo.propietario_dni || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Documentación</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Cédula Verde</div>
                        <div class="detalle-value">${vehiculo.cedula_verde || 'No registrada'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Título de Registro</div>
                        <div class="detalle-value">${vehiculo.titulo_registro || 'No registrado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Seguro</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Seguro Activo</div>
                        <div class="detalle-value">${vehiculo.seguro_activo ? '✅ Sí' : '❌ No'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Compañía de Seguro</div>
                        <div class="detalle-value">${vehiculo.compañia_seguro || 'No especificada'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Información del Sistema</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Registro</div>
                        <div class="detalle-value">${this.formatFecha(vehiculo.fecha_registro)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">ID del Vehículo</div>
                        <div class="detalle-value">#${vehiculo.id}</div>
                    </div>
                </div>
            </div>
        `;

        this.mostrarModal('detalleVehiculoModal');
    }
    // Editar vehículo - VERSIÓN FUNCIONAL
    async editarVehiculo(id) {
        try {
            console.log('✏️ Cargando datos del vehículo para editar ID:', id);

            // Obtener datos del vehículo
            const data = await this.apiCall(`/vehiculos/${id}`);
            const vehiculo = data.data;

            console.log('📋 Datos del vehículo a editar:', vehiculo);

            // Llenar el formulario con los datos existentes
            this.llenarFormularioEdicion(vehiculo);

            // Mostrar mensaje informativo
            this.showMessage(`Modo edición: Vehículo ${vehiculo.patente}. Complete los campos y guarde los cambios.`, 'info');

        } catch (error) {
            console.error('❌ Error cargando vehículo para editar:', error);
            this.showMessage('Error al cargar datos del vehículo para editar', 'error');
        }
    }

    // Llenar formulario para edición
    llenarFormularioEdicion(vehiculo) {
        // Mostrar el modal de vehículo
        this.mostrarModal('vehiculoModal');

        // Cambiar título del modal
        document.getElementById('modalTitle').textContent = `Editar Vehículo: ${vehiculo.patente}`;

        // Llenar campos del formulario
        document.getElementById('patente').value = vehiculo.patente || '';
        document.getElementById('tipo_vehiculo').value = vehiculo.tipo_vehiculo || '';
        document.getElementById('marca').value = vehiculo.marca || '';
        document.getElementById('modelo').value = vehiculo.modelo || '';
        document.getElementById('color').value = vehiculo.color || '';
        document.getElementById('numero_motor').value = vehiculo.numero_motor || '';
        document.getElementById('numero_chasis').value = vehiculo.numero_chasis || '';
        document.getElementById('cedula_verde').value = vehiculo.cedula_verde || '';
        document.getElementById('titulo_registro').value = vehiculo.titulo_registro || '';
        document.getElementById('propietario_dni').value = vehiculo.propietario_dni || '';
        document.getElementById('seguro_activo').value = vehiculo.seguro_activo ? 'true' : 'false';
        document.getElementById('compañia_seguro').value = vehiculo.compañia_seguro || '';

        // Guardar el ID del vehículo que se está editando
        document.getElementById('vehiculoForm').dataset.editingId = vehiculo.id;

        // Hacer la patente de solo lectura durante la edición
        document.getElementById('patente').readOnly = true;
    }

    // Eliminar vehículo
    async eliminarVehiculo(id) {
        try {
            console.log('🗑️ Eliminando vehículo ID:', id);

            const confirmar = confirm('¿Estás seguro de que deseas eliminar este vehículo?\n\nEsta acción no se puede deshacer.');

            if (!confirmar) {
                console.log('❌ Eliminación cancelada');
                return;
            }

            await this.apiCall(`/vehiculos/${id}`, 'DELETE');

            console.log('✅ Vehículo eliminado');
            this.showMessage('Vehículo eliminado exitosamente', 'success');

            this.loadVehiculos();
            // Si estamos en dashboard, actualizar también
            if (document.getElementById('dashboard-tab').classList.contains('active')) {
                this.loadDashboardCompleto();
            }
        } catch (error) {
            console.error('❌ Error eliminando vehículo:', error);
            this.showMessage('Error al eliminar vehículo: ' + error.message, 'error');
        }
    }


    // Confirmar eliminación de vehículo
    async confirmarEliminacionVehiculo(id) {
        const confirmarBtn = document.getElementById('confirmarEliminarBtn');
        const originalText = confirmarBtn.textContent;

        try {
            // Deshabilitar botón y mostrar carga
            confirmarBtn.disabled = true;
            confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

            // TODO: Implementar endpoint DELETE en el backend
            // Por ahora mostramos un mensaje de que está en desarrollo
            this.showMessage('Función de eliminación en desarrollo. Por ahora, los vehículos no se pueden eliminar.', 'info');

            // Cerrar modal
            this.ocultarModal('confirmarEliminarModal');

            // Recargar la tabla (en una implementación real, eliminaríamos el vehículo)
            // await this.apiCall(`/vehiculos/${id}`, 'DELETE');
            // this.loadVehiculos();
            // this.showMessage('Vehículo eliminado exitosamente', 'success');

        } catch (error) {
            console.error('Error eliminando vehículo:', error);
            this.showMessage('Error al eliminar vehículo', 'error');
        } finally {
            // Restaurar botón
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = originalText;
        }
    }
    // Helper: Obtener vehículo de la tabla por ID
    obtenerVehiculoDeTabla(id) {
        // Esta es una implementación simple - en una app real buscaríamos en los datos cargados
        const filas = document.querySelectorAll('#vehiculosTableBody tr');

        for (let fila of filas) {
            const botonVer = fila.querySelector('button[title="Ver detalles"]');
            if (botonVer && botonVer.onclick) {
                const onclickStr = botonVer.onclick.toString();
                const match = onclickStr.match(/app\.verVehiculo\((\d+)\)/);
                if (match && match[1] == id) {
                    const celdas = fila.querySelectorAll('td');
                    return {
                        id: id,
                        patente: celdas[0].textContent.trim(),
                        tipo_vehiculo: celdas[1].textContent.trim(),
                        marca: celdas[2].textContent.trim(),
                        // ... otros campos que necesites
                    };
                }
            }
        }
        return null;
    }

    // Helper: Mostrar modal
    mostrarModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    // Helper: Ocultar modal
    ocultarModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }


    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.apiBase}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }

        return data;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('loginMessage');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
    formatFecha(fechaString) {
        if (!fechaString) return '-';

        try {
            const fecha = new Date(fechaString);

            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                console.warn('Fecha inválida:', fechaString);
                return '-';
            }

            return fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formateando fecha:', error, 'Fecha original:', fechaString);
            return '-';
        }
    }
    async loadPropietarios() {
        try {
            console.log('🔄 Cargando propietarios...');
            const data = await this.apiCall('/propietarios');
            console.log('✅ Propietarios cargados:', data.data.length);
            this.renderPropietariosTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando propietarios:', error);
            this.showMessage('Error al cargar propietarios', 'error');
        }
    }

    // Renderizar tabla de propietarios
    renderPropietariosTable(propietarios) {
        const tbody = document.getElementById('propietariosTableBody');
        tbody.innerHTML = '';

        if (propietarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-user-tie" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay propietarios registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        propietarios.forEach(propietario => {
            const row = document.createElement('tr');

            const fechaRegistro = this.formatFecha(propietario.fecha_registro);

            row.innerHTML = `
                <td><strong>${propietario.dni}</strong></td>
                <td>${propietario.nombre}</td>
                <td>${propietario.carnet_conducir || '-'}</td>
                <td>${propietario.telefono || '-'}</td>
                <td>${propietario.email || '-'}</td>
                <td><span class="badge">${propietario.total_vehiculos || 0}</span></td>
                <td>${fechaRegistro}</td>
            `;

            // Celda de acciones
            const accionesCell = document.createElement('td');

            // Botón Ver
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => this.verPropietario(propietario.id));

            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => this.editarPropietario(propietario.id));

            // Botón Historial
            const btnHistorial = document.createElement('button');
            btnHistorial.className = 'btn-icon';
            btnHistorial.title = 'Ver historial';
            btnHistorial.innerHTML = '<i class="fas fa-history"></i>';
            btnHistorial.addEventListener('click', () => this.verHistorialPropietario(propietario.id, propietario.nombre));

            // Botón Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener('click', () => this.eliminarPropietario(propietario.id));

            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnHistorial);
            accionesCell.appendChild(btnEliminar);
            row.appendChild(accionesCell);

            tbody.appendChild(row);
        });
    }

    // Mostrar modal de propietario
    showPropietarioModal() {
        this.mostrarModal('propietarioModal');
        document.getElementById('modalPropietarioTitle').textContent = 'Nuevo Propietario';
        document.getElementById('propietarioForm').reset();
        delete document.getElementById('propietarioForm').dataset.editingId;
    }

    // Manejar envío de propietario
    async handlePropietarioSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const propietarioData = {
            dni: formData.get('dni'),
            nombre: formData.get('nombre'),
            carnet_conducir: formData.get('carnet_conducir'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            fecha_nacimiento: formData.get('fecha_nacimiento')
        };

        console.log('📝 Datos del propietario:', propietarioData);

        try {
            const editingId = document.getElementById('propietarioForm').dataset.editingId;

            if (editingId) {
                // Modo edición
                await this.apiCall(`/propietarios/${editingId}`, 'PUT', propietarioData);
                this.showMessage('Propietario actualizado exitosamente', 'success');
            } else {
                // Modo creación
                await this.apiCall('/propietarios', 'POST', propietarioData);
                this.showMessage('Propietario creado exitosamente', 'success');
            }

            this.ocultarModal('propietarioModal');
            this.loadPropietarios();

        } catch (error) {
            console.error('Error guardando propietario:', error);
            this.showMessage('Error al guardar propietario: ' + error.message, 'error');
        }
    }

    // Buscar propietarios
    async buscarPropietarios() {
        const dni = document.getElementById('filterDNI').value.trim();
        const nombre = document.getElementById('filterNombre').value.trim();
        const carnet = document.getElementById('filterCarnet').value.trim();

        console.log('🔍 Buscando propietarios con filtros:', { dni, nombre, carnet });

        // Si no hay filtros, cargar todos
        if (!dni && !nombre && !carnet) {
            this.loadPropietarios();
            return;
        }

        try {
            const params = new URLSearchParams();
            if (dni) params.append('dni', dni);
            if (nombre) params.append('nombre', nombre);
            if (carnet) params.append('carnet', carnet);

            const data = await this.apiCall(`/propietarios/search?${params}`);
            console.log('✅ Resultados búsqueda:', data.data.length);

            this.renderPropietariosTable(data.data);

            if (data.data.length === 0) {
                this.showMessage('No se encontraron propietarios con los filtros aplicados', 'info');
            }
        } catch (error) {
            console.error('❌ Error buscando propietarios:', error);
            this.showMessage('Error al buscar propietarios', 'error');
        }
    }

    // Limpiar filtros de propietarios
    limpiarFiltrosPropietarios() {
        document.getElementById('filterDNI').value = '';
        document.getElementById('filterNombre').value = '';
        document.getElementById('filterCarnet').value = '';
        this.loadPropietarios();
    }

    // Ver detalles de propietario
    async verPropietario(id) {
        try {
            console.log('🔍 Ver detalles del propietario ID:', id);
            const data = await this.apiCall(`/propietarios/${id}`);
            this.mostrarDetallePropietario(data.data);
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error al cargar detalles del propietario', 'error');
        }
    }

    // Mostrar detalles del propietario en modal
    mostrarDetallePropietario(propietario) {
        const content = document.getElementById('detallePropietarioContent');

        let vehiculosHTML = '';
        if (propietario.vehiculos && propietario.vehiculos.length > 0) {
            vehiculosHTML = `
                <div class="detalle-section">
                    <h4>Vehículos del Propietario</h4>
                    <div class="vehiculos-list">
                        ${propietario.vehiculos.map(vehiculo => `
                            <div class="vehiculo-item">
                                <div class="vehiculo-info">
                                    <div>
                                        <span class="vehiculo-patente">${vehiculo.patente}</span>
                                        <span class="vehiculo-modelo"> - ${vehiculo.marca} ${vehiculo.modelo}</span>
                                    </div>
                                    <button class="btn-icon" onclick="app.verVehiculo(${vehiculo.id})">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            vehiculosHTML = `
                <div class="detalle-section">
                    <h4>Vehículos del Propietario</h4>
                    <p style="text-align: center; color: var(--text-light);">
                        <i class="fas fa-car" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                        No tiene vehículos registrados
                    </p>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="detalle-section">
                <h4>Información Personal</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">DNI</div>
                        <div class="detalle-value"><strong>${propietario.dni}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Nombre Completo</div>
                        <div class="detalle-value">${propietario.nombre}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Carnet de Conducir</div>
                        <div class="detalle-value">${propietario.carnet_conducir || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Nacimiento</div>
                        <div class="detalle-value">${propietario.fecha_nacimiento ? this.formatFecha(propietario.fecha_nacimiento) : 'No registrada'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Información de Contacto</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Teléfono</div>
                        <div class="detalle-value">${propietario.telefono || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Email</div>
                        <div class="detalle-value">${propietario.email || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item" style="grid-column: span 2;">
                        <div class="detalle-label">Dirección</div>
                        <div class="detalle-value">${propietario.direccion || 'No registrada'}</div>
                    </div>
                </div>
            </div>

            ${vehiculosHTML}

            <div class="detalle-section">
                <h4>Información del Sistema</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Registro</div>
                        <div class="detalle-value">${this.formatFecha(propietario.fecha_registro)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">ID del Propietario</div>
                        <div class="detalle-value">#${propietario.id}</div>
                    </div>
                </div>
            </div>
        `;

        this.mostrarModal('detallePropietarioModal');
    }

    // Editar propietario
    async editarPropietario(id) {
        try {
            console.log('✏️ Editando propietario ID:', id);
            const data = await this.apiCall(`/propietarios/${id}`);
            const propietario = data.data;

            this.llenarFormularioPropietarioEdicion(propietario);
            this.showMessage(`Editando propietario ${propietario.nombre}`, 'info');

        } catch (error) {
            console.error('❌ Error editando propietario:', error);
            this.showMessage('Error al cargar propietario para editar', 'error');
        }
    }

    // Llenar formulario para edición de propietario
    llenarFormularioPropietarioEdicion(propietario) {
        this.mostrarModal('propietarioModal');
        document.getElementById('modalPropietarioTitle').textContent = `Editar Propietario: ${propietario.nombre}`;

        document.getElementById('dni').value = propietario.dni;
        document.getElementById('nombre').value = propietario.nombre;
        document.getElementById('carnet_conducir').value = propietario.carnet_conducir || '';
        document.getElementById('direccion').value = propietario.direccion || '';
        document.getElementById('telefono').value = propietario.telefono || '';
        document.getElementById('email').value = propietario.email || '';
        document.getElementById('fecha_nacimiento').value = propietario.fecha_nacimiento || '';

        document.getElementById('propietarioForm').dataset.editingId = propietario.id;
    }

    // Eliminar propietario
    async eliminarPropietario(id) {
        try {
            console.log('🗑️ Eliminando propietario ID:', id);

            const confirmar = confirm('¿Estás seguro de que deseas eliminar este propietario?\n\nEsta acción no se puede deshacer.');

            if (!confirmar) {
                console.log('❌ Eliminación cancelada');
                return;
            }

            await this.apiCall(`/propietarios/${id}`, 'DELETE');

            console.log('✅ Propietario eliminado');
            this.showMessage('Propietario eliminado exitosamente', 'success');

            this.loadPropietarios();

        } catch (error) {
            console.error('❌ Error eliminando propietario:', error);
            this.showMessage('Error al eliminar propietario: ' + error.message, 'error');
        }
    }
    // Cargar infracciones
    async loadInfracciones() {
        try {
            console.log('🔄 Cargando infracciones...');
            const data = await this.apiCall('/infracciones');
            console.log('✅ Infracciones cargadas:', data.data.length);
            this.renderInfraccionesTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando infracciones:', error);
            this.showMessage('Error al cargar infracciones', 'error');
        }
    }

    // Renderizar tabla de infracciones
    renderInfraccionesTable(infracciones) {
        const tbody = document.getElementById('infraccionesTableBody');
        tbody.innerHTML = '';

        if (infracciones.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="15" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-clipboard-list" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p>No hay infracciones registradas</p>
                </td>
            </tr>
        `;
            return;
        }

        infracciones.forEach(infraccion => {
            const row = document.createElement('tr');

            const fechaInfraccion = this.formatFecha(infraccion.fecha_infraccion);
            const fechaRegistro = this.formatFecha(infraccion.fecha_registro);

            // CORRECCIÓN: Usar los estados correctos de la base de datos
            const estado = infraccion.estado || 'activa';
            console.log(`🔍 Renderizando infracción ${infraccion.numero_acta}: estado = ${estado}`);

            // Determinar clase CSS según el estado - CORREGIDO con estados correctos
            let estadoClass = '';
            let estadoTexto = '';
            switch (estado) {
                case 'activa':
                    estadoClass = 'badge-warning';
                    estadoTexto = 'Activa';
                    break;
                case 'resuelta':
                    estadoClass = 'badge-success';
                    estadoTexto = 'Resuelta';
                    break;
                case 'anulada':
                    estadoClass = 'badge-secondary';
                    estadoTexto = 'Anulada';
                    break;
                default:
                    estadoClass = 'badge-secondary';
                    estadoTexto = estado;
            }

            row.innerHTML = `
            <td><strong>${infraccion.numero_acta}</strong></td>
            <td>${fechaInfraccion}</td>
            <td>
                ${infraccion.patente ? `
                    <strong>${infraccion.patente}</strong><br>
                    <small>${infraccion.marca} ${infraccion.modelo} - ${infraccion.color}</small>
                ` : 'Vehículo no encontrado'}
            </td>
            <td>${infraccion.conductor_nombre}</td>
            <td>${infraccion.conductor_dni || '-'}</td>
            <td title="${infraccion.motivo}">${this.truncateText(infraccion.motivo, 50)}</td>
            <td>${infraccion.lugar_infraccion || '-'}</td>
            <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
            <td>${infraccion.nombre_inspector || '-'}</td>
            <td>${infraccion.articulo || '-'}</td>
            <td>${infraccion.ordenanza || '-'}</td>
            <td>${infraccion.traslado_movil || '-'}</td>
            <td>${infraccion.usuario_nombre || 'Sistema'}</td>
            <td>${fechaRegistro}</td>
        `;

            // Celda de acciones
            const accionesCell = document.createElement('td');

            // Botón Ver
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => this.verInfraccion(infraccion.id));

            // Botón Editar (solo admin)
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            if (this.user.rol === 'admin') {
                btnEditar.addEventListener('click', () => this.editarInfraccion(infraccion.id));
            } else {
                btnEditar.disabled = true;
                btnEditar.title = 'Solo administradores pueden editar';
            }

            // Botón Eliminar (solo admin)
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            if (this.user.rol === 'admin') {
                btnEliminar.addEventListener('click', () => this.eliminarInfraccion(infraccion.id));
            } else {
                btnEliminar.disabled = true;
                btnEliminar.title = 'Solo administradores pueden eliminar';
            }

            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
            row.appendChild(accionesCell);

            tbody.appendChild(row);
        });
    }

    // Formatear estado de infracción
    formatEstadoInfraccion(estado) {
        const estados = {
            'activa': 'Activa',
            'resuelta': 'Resuelta',
            'anulada': 'Anulada'
        };
        return estados[estado] || estado;
    }

    // Mostrar modal de infracción
    async showInfraccionModal() {
        await this.cargarVehiculosEnSelect();
        this.mostrarModal('infraccionModal');
        document.getElementById('modalInfraccionTitle').textContent = 'Nueva Infracción';
        document.getElementById('infraccionForm').reset();

        // CORRECCIÓN: Inicializar el select de estado con los valores correctos
        const estadoSelect = document.getElementById('estado');
        estadoSelect.innerHTML = `
        <option value="activa">Activa</option>
        <option value="resuelta">Resuelta</option>
        <option value="anulada">Anulada</option>
    `;
        estadoSelect.value = 'activa';

        // Establecer fecha y hora actual por defecto
        const now = new Date();
        const localDateTime = now.toISOString().slice(0, 16);
        document.getElementById('fecha_infraccion').value = localDateTime;

        delete document.getElementById('infraccionForm').dataset.editingId;
    }

    // Cargar vehículos en el select
    async cargarVehiculosEnSelect() {
        try {
            const select = document.getElementById('vehiculo_id');
            select.innerHTML = '<option value="">Seleccionar vehículo...</option>';

            const data = await this.apiCall('/vehiculos');
            data.data.forEach(vehiculo => {
                const option = document.createElement('option');
                option.value = vehiculo.id;
                option.textContent = `${vehiculo.patente} - ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.color})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando vehículos:', error);
        }
    }

    // Manejar envío de infracción
    async handleInfraccionSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const infraccionData = {
            numero_acta: formData.get('numero_acta'),
            vehiculo_id: formData.get('vehiculo_id'),
            conductor_dni: formData.get('conductor_dni'),
            conductor_nombre: formData.get('conductor_nombre'),
            motivo: formData.get('motivo'),
            fecha_infraccion: formData.get('fecha_infraccion'),
            lugar_infraccion: formData.get('lugar_infraccion'),
            estado: formData.get('estado'),
            observaciones: formData.get('observaciones'),
            nombre_inspector: formData.get('nombre_inspector'),
            articulo: formData.get('articulo'),
            ordenanza: formData.get('ordenanza'),
            traslado_movil: formData.get('traslado_movil')
        };

        console.log('📝 Datos de la infracción:', infraccionData);

        try {
            const editingId = document.getElementById('infraccionForm').dataset.editingId;

            if (editingId) {
                // Modo edición
                await this.apiCall(`/infracciones/${editingId}`, 'PUT', infraccionData);
                this.showMessage('Infracción actualizada exitosamente', 'success');
            } else {
                // Modo creación
                await this.apiCall('/infracciones', 'POST', infraccionData);
                this.showMessage('Infracción creada exitosamente', 'success');
            }

            this.ocultarModal('infraccionModal');
            this.loadInfracciones();
            this.loadEstadisticasInfracciones();

        } catch (error) {
            console.error('Error guardando infracción:', error);
            this.showMessage('Error al guardar infracción: ' + error.message, 'error');
        }
    }

    // Buscar infracciones
    async buscarInfracciones() {
        const numero_acta = document.getElementById('filterNumeroActa').value.trim();
        const patente = document.getElementById('filterPatenteInfraccion').value.trim();
        const conductor_dni = document.getElementById('filterConductorDNI').value.trim();
        const estado = document.getElementById('filterEstado').value;
        const fecha_desde = document.getElementById('filterFechaDesde').value;
        const fecha_hasta = document.getElementById('filterFechaHasta').value;

        console.log('🔍 Buscando infracciones con filtros:', {
            numero_acta, patente, conductor_dni, estado, fecha_desde, fecha_hasta
        });

        // Si no hay filtros, cargar todos
        if (!numero_acta && !patente && !conductor_dni && !estado && !fecha_desde && !fecha_hasta) {
            this.loadInfracciones();
            return;
        }

        try {
            const params = new URLSearchParams();
            if (numero_acta) params.append('numero_acta', numero_acta);
            if (patente) params.append('patente', patente);
            if (conductor_dni) params.append('conductor_dni', conductor_dni);
            if (estado) params.append('estado', estado);
            if (fecha_desde) params.append('fecha_desde', fecha_desde);
            if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);

            const data = await this.apiCall(`/infracciones/search?${params}`);
            console.log('✅ Resultados búsqueda:', data.data.length);

            this.renderInfraccionesTable(data.data);

            if (data.data.length === 0) {
                this.showMessage('No se encontraron infracciones con los filtros aplicados', 'info');
            }
        } catch (error) {
            console.error('❌ Error buscando infracciones:', error);
            this.showMessage('Error al buscar infracciones', 'error');
        }
    }


    // Limpiar filtros de infracciones
    limpiarFiltrosInfracciones() {
        document.getElementById('filterNumeroActa').value = '';
        document.getElementById('filterPatenteInfraccion').value = '';
        document.getElementById('filterConductorDNI').value = '';
        document.getElementById('filterEstado').value = '';
        document.getElementById('filterFechaDesde').value = '';
        document.getElementById('filterFechaHasta').value = '';
        this.loadInfracciones();
    }

    // Ver detalles de infracción
    async verInfraccion(id) {
        try {
            console.log('🔍 Ver detalles de infracción ID:', id);
            const data = await this.apiCall(`/infracciones/${id}`);
            this.mostrarDetalleInfraccion(data.data);
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error al cargar detalles de la infracción', 'error');
        }
    }

    // Mostrar detalles de infracción en modal
    mostrarDetalleInfraccion(infraccion) {
        const content = document.getElementById('detalleInfraccionContent');

        const fechaInfraccion = this.formatFecha(infraccion.fecha_infraccion);
        const fechaRegistro = this.formatFecha(infraccion.fecha_registro);

        // CORRECCIÓN: Mapear estado correcto
        const estado = infraccion.estado || 'activa';
        let estadoTexto = '';
        switch (estado) {
            case 'activa':
                estadoTexto = 'Activa';
                break;
            case 'resuelta':
                estadoTexto = 'Resuelta';
                break;
            case 'anulada':
                estadoTexto = 'Anulada';
                break;
            default:
                estadoTexto = estado;
        }

        content.innerHTML = `
        <div class="detalle-section">
            <h4>Información del Acta</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Número de Acta</div>
                    <div class="detalle-value"><strong>${infraccion.numero_acta}</strong></div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Estado</div>
                    <div class="detalle-value"><span class="badge">${estadoTexto}</span></div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Fecha de Infracción</div>
                    <div class="detalle-value">${fechaInfraccion}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Lugar</div>
                    <div class="detalle-value">${infraccion.lugar_infraccion || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Vehículo Involucrado</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Patente</div>
                    <div class="detalle-value">${infraccion.patente || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Marca y Modelo</div>
                    <div class="detalle-value">${infraccion.marca || ''} ${infraccion.modelo || ''}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Color</div>
                    <div class="detalle-value">${infraccion.color || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Tipo de Vehículo</div>
                    <div class="detalle-value">${this.formatTipoVehiculo(infraccion.tipo_vehiculo)}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Información del Conductor</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Nombre</div>
                    <div class="detalle-value">${infraccion.conductor_nombre}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">DNI</div>
                    <div class="detalle-value">${infraccion.conductor_dni || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Teléfono</div>
                    <div class="detalle-value">${infraccion.propietario_telefono || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Datos de Inspector y Tránsito</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Inspector</div>
                    <div class="detalle-value">${infraccion.nombre_inspector || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Artículo</div>
                    <div class="detalle-value">${infraccion.articulo || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Ordenanza</div>
                    <div class="detalle-value">${infraccion.ordenanza || 'No especificada'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Grúa / Traslado Móvil</div>
                    <div class="detalle-value">${infraccion.traslado_movil || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Detalles de la Infracción</h4>
            <div class="detalle-item" style="grid-column: span 2;">
                <div class="detalle-label">Motivo</div>
                <div class="detalle-value" style="white-space: pre-wrap;">${infraccion.motivo}</div>
            </div>
            ${infraccion.observaciones ? `
            <div class="detalle-item" style="grid-column: span 2;">
                <div class="detalle-label">Observaciones</div>
                <div class="detalle-value" style="white-space: pre-wrap;">${infraccion.observaciones}</div>
            </div>
            ` : ''}
        </div>

        <div class="detalle-section">
            <h4>Información del Sistema</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Agente Registrador</div>
                    <div class="detalle-value">${infraccion.usuario_nombre || 'Sistema'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Fecha de Registro</div>
                    <div class="detalle-value">${fechaRegistro}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">ID de Infracción</div>
                    <div class="detalle-value">#${infraccion.id}</div>
                </div>
            </div>
        </div>
    `;

        this.mostrarModal('detalleInfraccionModal');
    }

    // Cargar estadísticas de infracciones
    async loadEstadisticasInfracciones() {
        try {
            const data = await this.apiCall('/infracciones/estadisticas');
            const stats = data.data.resumen;

            console.log('📊 Estadísticas de infracciones recibidas:', stats);

            // Actualizar en pestaña de infracciones - CORREGIDO con estados correctos
            document.getElementById('totalInfracciones').textContent = stats.total || 0;
            // Usar los ids del HTML
            document.getElementById('activa').textContent = stats.activas || 0;
            document.getElementById('resuelta').textContent = stats.resueltas || 0;
            // Nota: Las anuladas no se muestran en el dashboard actual, pero están disponibles si las quieres agregar

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            this.showMessage('Error al cargar estadísticas de infracciones', 'error');
        }
    }

    // Helper para truncar texto
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Editar infracción
    async editarInfraccion(id) {
        try {
            console.log('✏️ Editando infracción ID:', id);
            const data = await this.apiCall(`/infracciones/${id}`);
            const infraccion = data.data;

            await this.cargarVehiculosEnSelect();
            this.mostrarModal('infraccionModal');
            document.getElementById('modalInfraccionTitle').textContent = `Editar Infracción: ${infraccion.numero_acta}`;

            // Llenar formulario con datos existentes
            document.getElementById('numero_acta').value = infraccion.numero_acta;
            document.getElementById('vehiculo_id').value = infraccion.vehiculo_id;
            document.getElementById('conductor_dni').value = infraccion.conductor_dni || '';
            document.getElementById('conductor_nombre').value = infraccion.conductor_nombre;
            document.getElementById('motivo').value = infraccion.motivo;
            document.getElementById('lugar_infraccion').value = infraccion.lugar_infraccion || '';
            document.getElementById('observaciones').value = infraccion.observaciones || '';
            document.getElementById('nombre_inspector').value = infraccion.nombre_inspector || '';
            document.getElementById('articulo').value = infraccion.articulo || '';
            document.getElementById('ordenanza').value = infraccion.ordenanza || '';
            document.getElementById('traslado_movil').value = infraccion.traslado_movil || '';

            // CORRECCIÓN: Usar los estados correctos
            const estadoSelect = document.getElementById('estado');
            estadoSelect.innerHTML = `
            <option value="activa">Activa</option>
            <option value="resuelta">Resuelta</option>
            <option value="anulada">Anulada</option>
        `;
            estadoSelect.value = infraccion.estado || 'activa';

            // Formatear fecha para el input datetime-local
            if (infraccion.fecha_infraccion) {
                const fecha = new Date(infraccion.fecha_infraccion);
                const localDateTime = fecha.toISOString().slice(0, 16);
                document.getElementById('fecha_infraccion').value = localDateTime;
            }

            document.getElementById('infraccionForm').dataset.editingId = infraccion.id;

        } catch (error) {
            console.error('❌ Error editando infracción:', error);
            this.showMessage('Error al cargar infracción para editar', 'error');
        }
    }

    // Eliminar infracción
    async eliminarInfraccion(id) {
        try {
            console.log('🗑️ Eliminando infracción ID:', id);

            // Buscar información de la infracción para el mensaje de confirmación
            const data = await this.apiCall(`/infracciones/${id}`);
            const infraccion = data.data;

            const confirmar = confirm(`¿Estás seguro de que deseas eliminar la infracción "${infraccion.numero_acta}"?\n\nEsta acción no se puede deshacer.`);

            if (!confirmar) {
                console.log('❌ Eliminación cancelada por el usuario');
                return;
            }

            await this.apiCall(`/infracciones/${id}`, 'DELETE');

            console.log('✅ Infracción eliminada');
            this.showMessage('Infracción eliminada exitosamente', 'success');

            this.loadInfracciones();
            this.loadEstadisticasInfracciones();

        } catch (error) {
            console.error('❌ Error eliminando infracción:', error);
            this.showMessage('Error al eliminar infracción: ' + error.message, 'error');
        }
    }
    // Cargar reporte general
    async loadReporteGeneral() {
        try {
            console.log('📈 Cargando reporte general...');
            const data = await this.apiCall('/reportes/general');
            const stats = data.data.estadisticas;

            // Actualizar estadísticas
            document.getElementById('totalVehiculosReporte').textContent = stats.total_vehiculos || 0;
            document.getElementById('totalPropietariosReporte').textContent = stats.total_propietarios || 0;
            document.getElementById('totalInfraccionesReporte').textContent = stats.total_infracciones || 0;
            document.getElementById('totalUsuariosReporte').textContent = stats.total_usuarios || 0;

            console.log('✅ Reporte general cargado');

        } catch (error) {
            console.error('❌ Error cargando reporte general:', error);
            this.showMessage('Error al cargar reporte general', 'error');
        }
    }
    // Consultar por patente
    async consultarPorPatente() {
        const patente = document.getElementById('consultaPatente').value.trim();

        if (!patente) {
            this.showMessage('Ingrese una patente para buscar', 'error');
            return;
        }

        try {
            console.log('🔍 Consultando por patente:', patente);
            const resultado = document.getElementById('resultadoPatente');
            resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

            const data = await this.apiCall(`/reportes/consulta-patente?patente=${encodeURIComponent(patente)}`);

            if (!data.data.vehiculo) {
                resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-car"></i>
                    <p>No se encontró ningún vehículo con la patente "${patente}"</p>
                </div>
            `;
                return;
            }

            const vehiculo = data.data.vehiculo;
            const infracciones = data.data.infracciones || [];

            let infraccionesHTML = '';
            if (infracciones.length > 0) {
                infraccionesHTML = `
                <div style="margin-top: 1rem;">
                    <h6 style="margin-bottom: 0.5rem; color: var(--danger);">Infracciones (${infracciones.length}):</h6>
                    ${infracciones.map(infraccion => `
                        <div class="resultado-card" style="border-left-color: var(--danger);">
                            <h6>Acta: ${infraccion.numero_acta}</h6>
                            <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                            <p><strong>Motivo:</strong> ${this.truncateText(infraccion.motivo, 100)}</p>
                            <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                        </div>
                    `).join('')}
                </div>
            `;
            } else {
                infraccionesHTML = `
                <div style="margin-top: 1rem; text-align: center; color: var(--success);">
                    <i class="fas fa-check-circle"></i>
                    <p>No tiene infracciones registradas</p>
                </div>
            `;
            }

            resultado.innerHTML = `
            <div class="resultado-card">
                <h5>Vehículo Encontrado</h5>
                <p><strong>Patente:</strong> ${vehiculo.patente}</p>
                <p><strong>Marca/Modelo:</strong> ${vehiculo.marca} ${vehiculo.modelo}</p>
                <p><strong>Color:</strong> ${vehiculo.color}</p>
                <p><strong>Tipo:</strong> ${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</p>
                ${vehiculo.propietario_nombre ? `
                    <p><strong>Propietario:</strong> ${vehiculo.propietario_nombre} (DNI: ${vehiculo.propietario_dni})</p>
                ` : '<p><strong>Propietario:</strong> No asignado</p>'}
                ${infraccionesHTML}
            </div>
        `;

        } catch (error) {
            console.error('❌ Error consultando por patente:', error);
            document.getElementById('resultadoPatente').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar patente</p>
            </div>
        `;
        }
    }

    // Consultar por acta
    async consultarPorActa() {
        const numero_acta = document.getElementById('consultaActa').value.trim();

        if (!numero_acta) {
            this.showMessage('Ingrese un número de acta para buscar', 'error');
            return;
        }

        try {
            console.log('🔍 Consultando por acta:', numero_acta);
            const resultado = document.getElementById('resultadoActa');
            resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

            const data = await this.apiCall(`/reportes/consulta-acta?numero_acta=${encodeURIComponent(numero_acta)}`);

            if (data.data.length === 0) {
                resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-file-alt"></i>
                    <p>No se encontró ninguna infracción con el acta "${numero_acta}"</p>
                </div>
            `;
                return;
            }

            const infracciones = data.data;

            resultado.innerHTML = infracciones.map(infraccion => `
            <div class="resultado-card">
                <h5>Infracción: ${infraccion.numero_acta}</h5>
                <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                <p><strong>Vehículo:</strong> ${infraccion.patente} - ${infraccion.marca} ${infraccion.modelo}</p>
                <p><strong>Conductor:</strong> ${infraccion.conductor_nombre} (DNI: ${infraccion.conductor_dni || 'No especificado'})</p>
                <p><strong>Motivo:</strong> ${infraccion.motivo}</p>
                <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                <p><strong>Lugar:</strong> ${infraccion.lugar_infraccion || 'No especificado'}</p>
                <p><strong>Agente:</strong> ${infraccion.agente || 'Sistema'}</p>
            </div>
        `).join('');

        } catch (error) {
            console.error('❌ Error consultando por acta:', error);
            document.getElementById('resultadoActa').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar acta</p>
            </div>
        `;
        }
    }

    // Consultar por DNI
    async consultarPorDNI() {
        const dni = document.getElementById('consultaDNI').value.trim();

        if (!dni) {
            this.showMessage('Ingrese un DNI para buscar', 'error');
            return;
        }

        try {
            console.log('🔍 Consultando por DNI:', dni);
            const resultado = document.getElementById('resultadoDNI');
            resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';

            const data = await this.apiCall(`/reportes/consulta-dni?dni=${encodeURIComponent(dni)}`);

            const propietario = data.data.propietario;
            const infraccionesConductor = data.data.infracciones_como_conductor || [];

            let propietarioHTML = '';
            if (propietario) {
                propietarioHTML = `
                <div class="resultado-card">
                    <h5>Información del Propietario</h5>
                    <p><strong>Nombre:</strong> ${propietario.nombre}</p>
                    <p><strong>DNI:</strong> ${propietario.dni}</p>
                    <p><strong>Teléfono:</strong> ${propietario.telefono || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${propietario.email || 'No especificado'}</p>
                    <p><strong>Vehículos registrados:</strong> ${propietario.total_vehiculos || 0}</p>
                </div>
            `;
            } else {
                propietarioHTML = `
                <div class="resultado-card" style="border-left-color: var(--warning);">
                    <h5>Información del Propietario</h5>
                    <p>No se encontró como propietario registrado</p>
                </div>
            `;
            }

            let infraccionesHTML = '';
            if (infraccionesConductor.length > 0) {
                infraccionesHTML = `
                <div class="resultado-card" style="border-left-color: var(--danger);">
                    <h5>Infracciones como Conductor (${infraccionesConductor.length})</h5>
                    ${infraccionesConductor.map(infraccion => `
                        <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                            <p><strong>Acta:</strong> ${infraccion.numero_acta}</p>
                            <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                            <p><strong>Vehículo:</strong> ${infraccion.patente}</p>
                            <p><strong>Motivo:</strong> ${this.truncateText(infraccion.motivo, 80)}</p>
                            <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                        </div>
                    `).join('')}
                </div>
            `;
            } else {
                infraccionesHTML = `
                <div class="resultado-card" style="border-left-color: var(--success);">
                    <h5>Infracciones como Conductor</h5>
                    <p>No tiene infracciones registradas como conductor</p>
                </div>
            `;
            }

            resultado.innerHTML = propietarioHTML + infraccionesHTML;

        } catch (error) {
            console.error('❌ Error consultando por DNI:', error);
            document.getElementById('resultadoDNI').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar DNI</p>
            </div>
        `;
        }
    }

    // Generar reporte por fecha
    async generarReporteFecha() {
        const fechaDesde = document.getElementById('reporteFechaDesde').value;
        const fechaHasta = document.getElementById('reporteFechaHasta').value;
        const agrupacion = document.getElementById('reporteAgrupacion').value;

        if (!fechaDesde || !fechaHasta) {
            this.showMessage('Seleccione un rango de fechas', 'error');
            return;
        }

        try {
            console.log('📊 Generando reporte por fecha:', { fechaDesde, fechaHasta, agrupacion });
            const resultado = document.getElementById('resultadoReporteFecha');
            resultado.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Generando reporte...</div>';

            const params = new URLSearchParams({
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                agrupacion: agrupacion
            });

            const data = await this.apiCall(`/reportes/infracciones-fecha?${params}`);

            if (data.data.resumen.length === 0) {
                resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-chart-bar"></i>
                    <p>No hay infracciones en el período seleccionado</p>
                </div>
            `;
                return;
            }

            const totalGeneral = data.data.totalGeneral;
            const resumen = data.data.resumen;

            let tablaHTML = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: var(--success); color: white; border-radius: 6px;">
                <strong>Total de infracciones en el período: ${totalGeneral}</strong>
            </div>
            <table class="resultado-table">
                <thead>
                    <tr>
                        <th>Período</th>
                        <th>Total</th>
                        <th>Activas</th>
                        <th>Resueltas</th>
                        <th>Anuladas</th>
                    </tr>
                </thead>
                <tbody>
        `;

            resumen.forEach(item => {
                tablaHTML += `
                <tr>
                    <td><strong>${this.formatearPeriodo(item.periodo, agrupacion)}</strong></td>
                    <td>${item.total}</td>
                    <td><span style="color: var(--warning);">${item.activas}</span></td>
                    <td><span style="color: var(--success);">${item.resueltas}</span></td>
                    <td><span style="color: var(--danger);">${item.anuladas}</span></td>
                </tr>
            `;
            });

            tablaHTML += `
                </tbody>
            </table>
        `;

            resultado.innerHTML = tablaHTML;

        } catch (error) {
            console.error('❌ Error generando reporte por fecha:', error);
            document.getElementById('resultadoReporteFecha').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al generar reporte</p>
            </div>
        `;
        }
    }

    // Generar reporte de vehículos con más infracciones
    async generarReporteVehiculos() {
        const limite = document.getElementById('reporteLimite').value;

        try {
            console.log('🚗 Generando reporte de vehículos con más infracciones');
            const resultado = document.getElementById('resultadoReporteVehiculos');
            resultado.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Generando reporte...</div>';

            const data = await this.apiCall(`/reportes/vehiculos-mas-infracciones?limite=${limite}`);

            if (data.data.length === 0) {
                resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-car"></i>
                    <p>No hay vehículos con infracciones registradas</p>
                </div>
            `;
                return;
            }

            let tablaHTML = `
            <table class="resultado-table">
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Vehículo</th>
                        <th>Propietario</th>
                        <th>Total Infracciones</th>
                        <th>Activas</th>
                    </tr>
                </thead>
                <tbody>
        `;

            data.data.forEach(vehiculo => {
                tablaHTML += `
                <tr>
                    <td><strong>${vehiculo.patente}</strong></td>
                    <td>${vehiculo.marca} ${vehiculo.modelo}<br><small>${vehiculo.color} - ${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</small></td>
                    <td>${vehiculo.propietario_nombre || 'No asignado'}<br><small>DNI: ${vehiculo.propietario_dni || 'N/A'}</small></td>
                    <td><strong style="color: var(--danger);">${vehiculo.total_infracciones}</strong></td>
                    <td><span style="color: var(--warning);">${vehiculo.activas}</span></td>
                </tr>
            `;
            });

            tablaHTML += `
                </tbody>
            </table>
        `;

            resultado.innerHTML = tablaHTML;

        } catch (error) {
            console.error('❌ Error generando reporte de vehículos:', error);
            document.getElementById('resultadoReporteVehiculos').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al generar reporte</p>
            </div>
        `;
        }
    }

    // Helper para formatear período según agrupación
    formatearPeriodo(periodo, agrupacion) {
        switch (agrupacion) {
            case 'mes':
                const [year, month] = periodo.split('-');
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return `${meses[parseInt(month) - 1]} ${year}`;
            case 'semana':
                const [yearSemana, semana] = periodo.split('-');
                return `Semana ${semana} del ${yearSemana}`;
            default: // día
                return new Date(periodo).toLocaleDateString('es-ES');
        }
    }
    // Métodos para dashboard mejorado:

    // Cargar dashboard completo
    async loadDashboardCompleto() {
        try {
            console.log('📊 Cargando dashboard completo...');

            // Cargar estadísticas
            await this.loadDashboardStats();

            // Cargar actividad reciente
            await this.loadActividadReciente();

            console.log('✅ Dashboard cargado completamente');

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showMessage('Error al cargar el dashboard', 'error');
        }
    }


    // Cargar estadísticas del dashboard
    async loadDashboardStats() {
        try {
            const data = await this.apiCall('/dashboard/stats');
            const stats = data.data;

            console.log('📊 Estadísticas del dashboard recibidas:', stats.estadisticas);

            // Actualizar estadísticas principales - CORREGIDO con estados correctos
            document.getElementById('totalVehiculos').textContent = stats.estadisticas.total_vehiculos || 0;
            document.getElementById('totalPropietarios').textContent = stats.estadisticas.total_propietarios || 0;
            document.getElementById('totalInfracciones').textContent = stats.estadisticas.total_infracciones || 0;
            // Mapear a los ids existentes en el HTML
            document.getElementById('activa').textContent = stats.estadisticas.infracciones_activas || 0;
            document.getElementById('resuelta').textContent = stats.estadisticas.infracciones_resueltas || 0;
            document.getElementById('totalUsuarios').textContent = stats.estadisticas.total_usuarios || 0;
            document.getElementById('infraccionesHoy').textContent = stats.estadisticas.infracciones_hoy || 0;

            // Renderizar gráficos
            this.renderChartTipoVehiculo(stats.por_tipo_vehiculo);
            this.renderChartEstadoInfracciones(stats.por_estado);
            this.renderChartTendencia(stats.por_dia);
            this.renderListaAgentes(stats.agentes_activos);
            this.renderVehiculosProblematicos(stats.vehiculos_problematicos);

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    // Cargar actividad reciente
    async loadActividadReciente() {
        try {
            const data = await this.apiCall('/dashboard/actividad');

            // El backend devuelve 'infracciones' en lugar de 'infractions'
            this.renderInfraccionesRecientes(data.data.infracciones || []);
            this.renderVehiculosRecientes(data.data.vehiculos || []);

        } catch (error) {
            console.error('❌ Error cargando actividad reciente:', error);
        }
    }

    // Renderizar gráfico de tipo de vehículo
    renderChartTipoVehiculo(datos) {
        const container = document.getElementById('chartTipoVehiculo');

        if (!datos || datos.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
            return;
        }

        const total = datos.reduce((sum, item) => sum + item.cantidad, 0);

        let html = '<div class="chart-bars">';

        datos.forEach(item => {
            const porcentaje = total > 0 ? (item.cantidad / total) * 100 : 0;
            const altura = Math.max(porcentaje * 1.5, 20); // Mínimo 20px de altura

            html += `
            <div class="chart-bar" style="height: ${altura}px; background: ${this.getColorForTipo(item.tipo_vehiculo)}" 
                 title="${this.formatTipoVehiculo(item.tipo_vehiculo)}: ${item.cantidad} (${porcentaje.toFixed(1)}%)">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${this.formatTipoVehiculo(item.tipo_vehiculo).substring(0, 3)}</div>
            </div>
        `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Renderizar gráfico de estado de infracciones
    renderChartEstadoInfracciones(datos) {
        const container = document.getElementById('chartEstadoInfracciones');

        if (!datos || datos.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
            return;
        }

        let html = '<div class="chart-bars">';

        datos.forEach(item => {
            const color = this.getColorForEstado(item.estado);
            const altura = Math.max(item.cantidad * 2, 20); // Escala de 2px por infracción

            html += `
            <div class="chart-bar" style="height: ${altura}px; background: ${color}" 
                 title="${this.formatEstadoInfraccion(item.estado)}: ${item.cantidad}">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${this.formatEstadoInfraccion(item.estado).substring(0, 3)}</div>
            </div>
        `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Renderizar gráfico de tendencia
    renderChartTendencia(datos) {
        const container = document.getElementById('chartTendencia');

        if (!datos || datos.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
            return;
        }

        // Completar días faltantes para tener 7 días consecutivos
        const fechasCompletas = this.completarDiasFaltantes(datos, 7);
        const maxCantidad = Math.max(...fechasCompletas.map(d => d.cantidad));

        let html = '<div class="chart-bars">';

        fechasCompletas.forEach(item => {
            const porcentaje = maxCantidad > 0 ? (item.cantidad / maxCantidad) * 100 : 0;
            const altura = Math.max(porcentaje * 1.5, 10);
            const fecha = new Date(item.fecha);
            const dia = fecha.getDate();
            const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });

            html += `
            <div class="chart-bar" style="height: ${altura}px; background: var(--primary)" 
                 title="${fecha.toLocaleDateString('es-ES')}: ${item.cantidad} infracciones">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${dia}/${mes}</div>
            </div>
        `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Completar días faltantes en el dataset
    completarDiasFaltantes(datos, dias) {
        const resultado = [];
        const hoy = new Date();

        for (let i = dias - 1; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(hoy.getDate() - i);
            const fechaStr = fecha.toISOString().split('T')[0];

            const datoExistente = datos.find(d => d.fecha === fechaStr);
            resultado.push({
                fecha: fechaStr,
                cantidad: datoExistente ? datoExistente.cantidad : 0
            });
        }

        return resultado;
    }

    // Renderizar lista de agentes activos
    renderListaAgentes(agentes) {
        const container = document.getElementById('listaAgentes');

        if (!agentes || agentes.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay agentes activos</div>';
            return;
        }

        let html = '';
        agentes.forEach(agente => {
            html += `
            <div class="agente-item">
                <span class="agente-nombre">${agente.nombre_completo}</span>
                <span class="agente-contador">${agente.infracciones_registradas}</span>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Renderizar infracciones recientes
    renderInfraccionesRecientes(infracciones) {
        const container = document.getElementById('listaInfraccionesRecientes');

        if (!infracciones || infracciones.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay infracciones recientes</div>';
            return;
        }

        let html = '';
        infracciones.forEach(infraccion => {
            const fecha = this.formatFecha(infraccion.fecha_infraccion);
            const estadoClass = this.getClassForEstado(infraccion.estado);

            html += `
            <div class="actividad-item ${estadoClass}" onclick="app.verInfraccion(${infraccion.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${infraccion.numero_acta}</span>
                    <span class="actividad-fecha">${fecha}</span>
                </div>
                <div class="actividad-descripcion">${this.truncateText(infraccion.motivo, 60)}</div>
                <div class="actividad-meta">
                    <span>${infraccion.patente}</span>
                    <span>${infraccion.agente}</span>
                    <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Renderizar vehículos recientes
    renderVehiculosRecientes(vehiculos) {
        const container = document.getElementById('listaVehiculosRecientes');

        if (!vehiculos || vehiculos.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay vehículos recientes</div>';
            return;
        }

        let html = '';
        vehiculos.forEach(vehiculo => {
            const fecha = this.formatFecha(vehiculo.fecha_registro);

            html += `
            <div class="actividad-item" onclick="app.verVehiculo(${vehiculo.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${vehiculo.patente}</span>
                    <span class="actividad-fecha">${fecha}</span>
                </div>
                <div class="actividad-descripcion">${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.color}</div>
                <div class="actividad-meta">
                    <span>${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</span>
                    <span>${vehiculo.propietario_nombre || 'Sin propietario'}</span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Renderizar vehículos problemáticos
    renderVehiculosProblematicos(vehiculos) {
        const container = document.getElementById('listaVehiculosProblematicos');

        if (!vehiculos || vehiculos.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay vehículos con infracciones</div>';
            return;
        }

        let html = '';
        vehiculos.forEach(vehiculo => {
            html += `
            <div class="actividad-item danger" onclick="app.verVehiculo(${vehiculo.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${vehiculo.patente}</span>
                    <span class="agente-contador">${vehiculo.total_infracciones}</span>
                </div>
                <div class="actividad-descripcion">${vehiculo.marca} ${vehiculo.modelo}</div>
                <div class="actividad-meta">
                    <span>${vehiculo.total_infracciones} infracciones</span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Helper: Obtener color según tipo de vehículo
    getColorForTipo(tipo) {
        const colores = {
            'auto': '#3B82F6',
            'camion': '#EF4444',
            'moto': '#10B981',
            'bicicleta': '#8B5CF6',
            'otro': '#6B7280'
        };
        return colores[tipo] || '#6B7280';
    }

    // Helper: Obtener color según estado
    getColorForEstado(estado) {
        const colores = {
            'activa': '#F59E0B',
            'resuelta': '#10B981',
            'anulada': '#EF4444'
        };
        return colores[estado] || '#6B7280';
    }

    // Helper: Obtener clase CSS según estado
    getClassForEstado(estado) {
        const clases = {
            'activa': 'warning',
            'resuelta': 'success',
            'anulada': 'danger'
        };
        return clases[estado] || '';
    }
    async loadAdminData() {
        try {
            console.log('👥 Cargando datos de administración...');
            await this.loadUsuarios();
            await this.loadAdminStats();
        } catch (error) {
            console.error('❌ Error cargando datos de admin:', error);
            this.showMessage('Error al cargar datos de administración', 'error');
        }
    }

    // Cargar usuarios
    async loadUsuarios() {
        try {
            const data = await this.apiCall('/usuarios');
            this.renderUsuariosTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.showMessage('Error al cargar usuarios', 'error');
        }
    }

    // Renderizar tabla de usuarios
    renderUsuariosTable(usuarios) {
        const tbody = document.getElementById('usuariosTableBody');
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-users" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p>No hay usuarios registrados</p>
                </td>
            </tr>
        `;
            return;
        }

        usuarios.forEach(usuario => {
            const row = document.createElement('tr');

            const ultimoLogin = usuario.ultimo_login ? this.formatFecha(usuario.ultimo_login) : 'Nunca';
            const fechaRegistro = this.formatFecha(usuario.fecha_creacion);

            row.innerHTML = `
            <td><strong>${usuario.username}</strong></td>
            <td>${usuario.nombre_completo}</td>
            <td>${usuario.email || '-'}</td>
            <td><span class="badge ${this.getBadgeClassForRol(usuario.rol)}">${this.formatRol(usuario.rol)}</span></td>
            <td>${usuario.activo ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>${ultimoLogin}</td>
            <td>${fechaRegistro}</td>
        `;

            // Celda de acciones
            const accionesCell = document.createElement('td');

            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar usuario';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => this.editarUsuario(usuario.id));

            // Botón Cambiar Contraseña
            const btnPassword = document.createElement('button');
            btnPassword.className = 'btn-icon';
            btnPassword.title = 'Cambiar contraseña';
            btnPassword.innerHTML = '<i class="fas fa-key"></i>';
            btnPassword.addEventListener('click', () => this.cambiarPasswordUsuario(usuario.id));

            // Botón Eliminar (no permitir eliminar propio usuario)
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar usuario';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';

            if (usuario.id !== this.user.id) {
                btnEliminar.addEventListener('click', () => this.eliminarUsuario(usuario.id));
            } else {
                btnEliminar.disabled = true;
                btnEliminar.title = 'No puedes eliminar tu propio usuario';
            }

            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnPassword);
            accionesCell.appendChild(btnEliminar);
            row.appendChild(accionesCell);

            tbody.appendChild(row);
        });
    }

    // Cargar estadísticas de administración
    async loadAdminStats() {
        try {
            const data = await this.apiCall('/usuarios/stats');
            const stats = data.data.usuarios;

            // Actualizar estadísticas
            document.getElementById('totalUsuariosAdmin').textContent = stats.total_usuarios || 0;
            document.getElementById('usuariosActivosAdmin').textContent = stats.usuarios_activos || 0;
            document.getElementById('totalAdminsAdmin').textContent = stats.total_admins || 0;
            document.getElementById('usuariosInactivosAdmin').textContent = stats.usuarios_inactivos || 0;

            // Renderizar actividad reciente
            this.renderLoginsRecientes(data.data.actividad_reciente);
            this.renderUsuariosActivos(data.data.usuarios_activos);

        } catch (error) {
            console.error('❌ Error cargando estadísticas de admin:', error);
        }
    }

    // Renderizar logins recientes
    renderLoginsRecientes(logins) {
        const container = document.getElementById('listaLoginsRecientes');

        if (!logins || logins.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay logins recientes</div>';
            return;
        }

        let html = '';
        logins.forEach(login => {
            const fecha = this.formatFecha(login.ultimo_login);

            html += `
            <div class="actividad-item">
                <div class="actividad-header">
                    <span class="actividad-titulo">${login.username}</span>
                    <span class="actividad-fecha">${fecha}</span>
                </div>
                <div class="actividad-meta">
                    <span class="badge ${this.getBadgeClassForRol(login.rol)}">${this.formatRol(login.rol)}</span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Renderizar usuarios activos
    renderUsuariosActivos(usuarios) {
        const container = document.getElementById('listaUsuariosActivos');

        if (!usuarios || usuarios.length === 0) {
            container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
            return;
        }

        let html = '';
        usuarios.forEach(usuario => {
            html += `
            <div class="actividad-item success">
                <div class="actividad-header">
                    <span class="actividad-titulo">${usuario.nombre_completo}</span>
                    <span class="agente-contador">${usuario.infracciones_registradas}</span>
                </div>
                <div class="actividad-descripcion">${usuario.username}</div>
                <div class="actividad-meta">
                    <span class="badge ${this.getBadgeClassForRol(usuario.rol)}">${this.formatRol(usuario.rol)}</span>
                    <span>${usuario.infracciones_registradas} infracciones</span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }

    // Helpers para roles
    formatRol(rol) {
        const roles = {
            'admin': 'Administrador',
            'usuario': 'Usuario',
            'invitado': 'Invitado'
        };
        return roles[rol] || rol;
    }

    getBadgeClassForRol(rol) {
        const clases = {
            'admin': 'badge-danger',
            'usuario': 'badge-primary',
            'invitado': 'badge-secondary'
        };
        return clases[rol] || 'badge';
    }

    // Mostrar modal de usuario
    showUsuarioModal() {
        this.mostrarModal('usuarioModal');
        document.getElementById('modalUsuarioTitle').textContent = 'Nuevo Usuario';
        document.getElementById('usuarioForm').reset();
        delete document.getElementById('usuarioForm').dataset.editingId;
    }

    // Manejar envío de usuario
    async handleUsuarioSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const usuarioData = {
            username: formData.get('username'),
            password: formData.get('password'),
            rol: formData.get('rol'),
            nombre_completo: formData.get('nombre_completo'),
            email: formData.get('email'),
            activo: formData.get('activo') === 'true'
        };

        try {
            const editingId = document.getElementById('usuarioForm').dataset.editingId;

            if (editingId) {
                // Modo edición
                await this.apiCall(`/usuarios/${editingId}`, 'PUT', usuarioData);
                this.showMessage('Usuario actualizado exitosamente', 'success');
            } else {
                // Modo creación
                await this.apiCall('/usuarios', 'POST', usuarioData);
                this.showMessage('Usuario creado exitosamente', 'success');
            }

            this.ocultarModal('usuarioModal');
            this.loadAdminData();

        } catch (error) {
            console.error('Error guardando usuario:', error);
            this.showMessage('Error al guardar usuario: ' + error.message, 'error');
        }
    }

    // Editar usuario
    async editarUsuario(id) {
        try {
            const data = await this.apiCall(`/usuarios/${id}`);
            const usuario = data.data;

            this.mostrarModal('usuarioModal');
            document.getElementById('modalUsuarioTitle').textContent = `Editar Usuario: ${usuario.username}`;

            document.getElementById('username').value = usuario.username;
            document.getElementById('nombre_completo').value = usuario.nombre_completo;
            document.getElementById('email').value = usuario.email || '';
            document.getElementById('rol').value = usuario.rol;
            document.getElementById('activo').value = usuario.activo ? 'true' : 'false';

            // Ocultar campo de contraseña en edición
            document.getElementById('password').closest('.form-group').style.display = 'none';

            document.getElementById('usuarioForm').dataset.editingId = usuario.id;

        } catch (error) {
            console.error('❌ Error editando usuario:', error);
            this.showMessage('Error al cargar usuario para editar', 'error');
        }
    }

    // Cambiar contraseña de usuario
    cambiarPasswordUsuario(id) {
        this.mostrarModal('cambiarPasswordModal');
        document.getElementById('cambiarPasswordForm').dataset.userId = id;
        document.getElementById('cambiarPasswordForm').reset();
    }

    // Manejar cambio de contraseña
    async handleCambiarPassword(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const nuevaPassword = formData.get('nueva_password');
        const confirmarPassword = formData.get('confirmar_password');
        const userId = document.getElementById('cambiarPasswordForm').dataset.userId;

        if (nuevaPassword !== confirmarPassword) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        if (nuevaPassword.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            await this.apiCall(`/usuarios/${userId}/password`, 'POST', {
                nueva_password: nuevaPassword
            });

            this.showMessage('Contraseña cambiada exitosamente', 'success');
            this.ocultarModal('cambiarPasswordModal');

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            this.showMessage('Error al cambiar contraseña: ' + error.message, 'error');
        }
    }

    // Eliminar usuario
    async eliminarUsuario(id) {
        try {
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este usuario?\n\nEsta acción no se puede deshacer.');

            if (!confirmar) {
                return;
            }

            await this.apiCall(`/usuarios/${id}`, 'DELETE');

            this.showMessage('Usuario eliminado exitosamente', 'success');
            this.loadAdminData();

        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            this.showMessage('Error al eliminar usuario: ' + error.message, 'error');
        }
    }

    // ==========================================
    // IMPORTACIÓN DE EXCEL
    // ==========================================

    showImportarModal() {
        this.mostrarModal('importarExcelModal');
        // Reset modal
        document.getElementById('importStepUpload').style.display = 'block';
        document.getElementById('importStepProgress').style.display = 'none';
        document.getElementById('importStepResults').style.display = 'none';
        document.getElementById('selectedFileName').textContent = '';
        document.getElementById('excelFileInput').value = '';
        document.getElementById('ejecutarImportBtn').style.display = 'none';
        this.selectedFile = null;
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.selectedFile = file;
            document.getElementById('selectedFileName').innerHTML =
                `<i class="fas fa-check-circle"></i> Archivo seleccionado: <strong>${file.name}</strong>`;
            document.getElementById('ejecutarImportBtn').style.display = 'inline-block';
        }
    }

    async ejecutarImportacion() {
        if (!this.selectedFile) {
            this.showMessage('Por favor seleccione un archivo', 'error');
            return;
        }

        // Mostrar paso de progreso
        document.getElementById('importStepUpload').style.display = 'none';
        document.getElementById('importStepProgress').style.display = 'block';
        document.getElementById('importProgressBar').style.width = '50%';
        document.getElementById('importProgressText').textContent = 'Subiendo y procesando archivo...';

        try {
            const formData = new FormData();
            formData.append('file', this.selectedFile);

            console.log('📤 Enviando archivo al servidor...');

            const response = await fetch(`${this.apiBase}/import/ingresos-completos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la importación');
            }

            console.log('✅ Importación completada:', data);

            // Completar barra de progreso
            document.getElementById('importProgressBar').style.width = '100%';
            document.getElementById('importProgressText').textContent = 'Importación completada!';

            setTimeout(() => {
                // Mostrar resultados
                document.getElementById('importStepProgress').style.display = 'none';
                document.getElementById('importStepResults').style.display = 'block';
                document.getElementById('ejecutarImportBtn').style.display = 'none';

                this.mostrarResultadosImportacion(data.data);

                // Recargar tabla de infracciones
                this.loadInfracciones();

                this.showMessage(`Importación completada: ${data.data.exitosos} exitosos, ${data.data.errores} errores`, 'success');
            }, 500);

        } catch (error) {
            console.error('❌ Error en importación:', error);
            this.showMessage('Error al importar: ' + error.message, 'error');
            document.getElementById('importStepUpload').style.display = 'block';
            document.getElementById('importStepProgress').style.display = 'none';
        }
    }

    mostrarResultadosImportacion(resultados) {
        const summary = document.getElementById('importResultsSummary');
        summary.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-file-excel"></i>
                <div class="stat-info">
                    <h3>${resultados.total}</h3>
                    <p>Total Registros</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                <div class="stat-info">
                    <h3>${resultados.exitosos}</h3>
                    <p>Exitosos</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                <div class="stat-info">
                    <h3>${resultados.omitidos}</h3>
                    <p>Omitidos</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-times-circle" style="color: var(--danger);"></i>
                <div class="stat-info">
                    <h3>${resultados.errores}</h3>
                    <p>Errores</p>
                </div>
            </div>
        `;

        const details = document.getElementById('importResultsDetails');
        if (resultados.detalles && resultados.detalles.length > 0) {
            let html = '<h4>Detalles (primeros 20 registros):</h4>';
            resultados.detalles.slice(0, 20).forEach(det => {
                const bgColor = det.estado === 'exitoso' ? '#d4edda' :
                    det.estado === 'error' ? '#f8d7da' : '#fff3cd';
                const borderColor = det.estado === 'exitoso' ? '#28a745' :
                    det.estado === 'error' ? '#dc3545' : '#ffc107';

                html += `
                    <div style="padding: 0.5rem; border-left: 3px solid ${borderColor}; 
                                margin-bottom: 0.5rem; background: ${bgColor};">
                        <strong>Fila ${det.fila}:</strong> ${det.estado === 'exitoso'
                        ? `✓ Acta: ${det.acta} - Patente: ${det.patente}`
                        : `⚠ ${det.motivo}`
                    }
                    </div>
                `;
            });
            details.innerHTML = html;
        }
    }

    // ==========================================
    // SALIDAS DE VEHÍCULOS
    // ==========================================

    async loadSalidas() {
        try {
            console.log('🔄 Cargando salidas...');
            const data = await this.apiCall('/salidas');
            console.log('✅ Salidas cargadas:', data.data.length);
            this.renderSalidasTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando salidas:', error);
            this.showMessage('Error al cargar salidas', 'error');
        }
    }

    renderSalidasTable(salidas) {
        const tbody = document.getElementById('salidasTableBody');
        tbody.innerHTML = '';

        if (salidas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-truck-loading" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay salidas registradas</p>
                    </td>
                </tr>
            `;
            return;
        }

        salidas.forEach(salida => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatFecha(salida.fecha_salida)}</td>
                <td><strong>${salida.vehiculo_patente}</strong></td>
                <td>${salida.marca || ''} ${salida.modelo || ''} ${salida.color || ''}</td>
                <td>${salida.numero_acta || '-'}</td>
                <td>${salida.persona_retira_nombre}</td>
                <td>${salida.persona_retira_dni}</td>
                <td>${salida.persona_retira_telefono || '-'}</td>
                <td>${salida.usuario_autoriza_nombre}</td>
            `;

            // Botón de acciones
            const accionesCell = document.createElement('td');

            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => this.verDetallesSalida(salida.id));

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => this.editarSalida(salida.id));

            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener('click', () => this.eliminarSalida(salida.id));

            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
            row.appendChild(accionesCell);

            tbody.appendChild(row);
        });
    }

    async showSalidaModal() {
        this.mostrarModal('salidaModal');
        document.getElementById('salidaForm').reset();
        delete document.getElementById('salidaForm').dataset.editingId;
        await this.cargarVehiculosParaSalida();
        await this.cargarInfraccionesActivas();
    }

    async cargarVehiculosParaSalida() {
        try {
            const data = await this.apiCall('/vehiculos');
            const select = document.getElementById('salida_vehiculo_id');
            select.innerHTML = '<option value="">Seleccionar vehículo...</option>';

            data.data.forEach(v => {
                const option = document.createElement('option');
                option.value = v.id;
                option.dataset.patente = v.patente;
                option.textContent = `${v.patente} - ${v.marca || ''} ${v.modelo || ''}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando vehículos:', error);
        }
    }

    async cargarInfraccionesActivas() {
        try {
            const data = await this.apiCall('/infracciones/search?estado=activa');
            const select = document.getElementById('salida_infraccion_id');
            select.innerHTML = '<option value="">Ninguna</option>';

            data.data.forEach(i => {
                const option = document.createElement('option');
                option.value = i.id;
                option.textContent = `${i.numero_acta} - ${i.patente}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando infracciones activas:', error);
        }
    }

    async handleSalidaSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const vehiculoSelect = document.getElementById('salida_vehiculo_id');
        const selectedOption = vehiculoSelect.options[vehiculoSelect.selectedIndex];

        if (!selectedOption || !selectedOption.dataset.patente) {
            this.showMessage('Por favor seleccione un vehículo válido', 'error');
            const vehiculoPatente = vehiculoSelect.options[vehiculoSelect.selectedIndex].text.split(' - ')[0];

            const salidaData = {
                vehiculo_id: formData.get('salida_vehiculo_id'),
                infraccion_id: formData.get('salida_infraccion_id') || null,
                persona_retira_nombre: formData.get('salida_persona_retira_nombre'),
                persona_retira_dni: formData.get('salida_persona_retira_dni'),
                persona_retira_telefono: formData.get('salida_persona_retira_telefono'),
                fecha_salida: formData.get('salida_fecha_salida'),
                observaciones: formData.get('salida_observaciones'),
                vehiculo_patente: vehiculoPatente
            };

            console.log('📝 Datos de salida:', salidaData);

            try {
                const editingId = document.getElementById('salidaForm').dataset.editingId;

                if (editingId) {
                    await this.apiCall(`/salidas/${editingId}`, 'PUT', salidaData);
                    this.showMessage('Salida actualizada exitosamente', 'success');
                } else {
                    await this.apiCall('/salidas', 'POST', salidaData);
                    this.showMessage('Salida registrada exitosamente', 'success');
                }

                this.ocultarModal('salidaModal');
                this.loadSalidas();
            } catch (error) {
                console.error('❌ Error registrando salida:', error);
                this.showMessage(error.message || 'Error al registrar salida', 'error');
            }
        }

    async buscarSalidas() {
            const patente = document.getElementById('filterSalidaPatente').value.trim();
            const dni = document.getElementById('filterSalidaDNI').value.trim();
            const fechaDesde = document.getElementById('filterSalidaFechaDesde').value;
            const fechaHasta = document.getElementById('filterSalidaFechaHasta').value;

            console.log('🔍 Buscando salidas con filtros:', { patente, dni, fechaDesde, fechaHasta });

            if (!patente && !dni && !fechaDesde && !fechaHasta) {
                this.loadSalidas();
                return;
            }

            try {
                const params = new URLSearchParams();
                if (patente) params.append('patente', patente);
                if (dni) params.append('dni', dni);
                if (fechaDesde) params.append('fecha_desde', fechaDesde);
                if (fechaHasta) params.append('fecha_hasta', fechaHasta);

                const data = await this.apiCall(`/salidas/search?${params.toString()}`);
                console.log('✅ Resultados de búsqueda:', data.data.length);
                this.renderSalidasTable(data.data || []);

                if (data.data.length === 0) {
                    this.showMessage('No se encontraron salidas con los filtros aplicados', 'info');
                }
            } catch (error) {
                console.error('❌ Error buscando salidas:', error);
                this.showMessage('Error al buscar salidas', 'error');
            }
        }

        limpiarFiltrosSalidas() {
            document.getElementById('filterSalidaPatente').value = '';
            document.getElementById('filterSalidaDNI').value = '';
            document.getElementById('filterSalidaFechaDesde').value = '';
            document.getElementById('filterSalidaFechaHasta').value = '';
            this.loadSalidas();
        }

    async verDetallesSalida(id) {
            try {
                console.log('🔍 Ver detalles de salida ID:', id);
                const data = await this.apiCall(`/salidas/${id}`);
                this.mostrarDetalleSalida(data.data);
            } catch (error) {
                console.error('Error:', error);
                this.showMessage('Error al cargar detalles de la salida', 'error');
            }
        }

        mostrarDetalleSalida(salida) {
            const content = document.getElementById('detalleSalidaContent');
            if (!content) return;

            const fechaSalida = this.formatFecha(salida.fecha_salida);
            const fechaInfraccion = salida.fecha_infraccion ? this.formatFecha(salida.fecha_infraccion) : 'N/A';

            content.innerHTML = `
                    <div class="detalle-section">
                <h4>Información de la Salida</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha y Hora de Salida</div>
                        <div class="detalle-value"><strong>${fechaSalida}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Usuario que Autoriza</div>
                        <div class="detalle-value">${salida.usuario_autoriza_nombre || 'Sistema'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Vehículo Retirado</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Patente</div>
                        <div class="detalle-value"><strong>${salida.patente}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Marca y Modelo</div>
                        <div class="detalle-value">${salida.marca || ''} ${salida.modelo || ''}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Color</div>
                        <div class="detalle-value">${salida.color || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Tipo</div>
                        <div class="detalle-value">${this.formatTipoVehiculo(salida.tipo_vehiculo)}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Persona que Retira</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Nombre</div>
                        <div class="detalle-value">${salida.persona_retira_nombre}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">DNI</div>
                        <div class="detalle-value">${salida.persona_retira_dni}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Teléfono</div>
                        <div class="detalle-value">${salida.persona_retira_telefono || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Infracción Relacionada</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Número de Acta</div>
                        <div class="detalle-value">${salida.numero_acta || 'Ninguna'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha Infracción</div>
                        <div class="detalle-value">${fechaInfraccion}</div>
                    </div>
                    <div class="detalle-item" style="grid-column: span 2;">
                        <div class="detalle-label">Motivo</div>
                        <div class="detalle-value">${salida.motivo || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Observaciones</h4>
                <div class="detalle-item" style="grid-column: span 2;">
                    <div class="detalle-value" style="white-space: pre-wrap;">${salida.observaciones || 'Sin observaciones'}</div>
                </div>
            </div>
        `;
            this.mostrarModal('detalleSalidaModal');
        }

    async editarSalida(id) {
            try {
                console.log('✏️ Editando salida ID:', id);
                const data = await this.apiCall(`/salidas/${id}`);
                const salida = data.data;

                await this.showSalidaModal();
                document.getElementById('modalSalidaTitle').textContent = 'Editar Salida';

                // Llenar formulario - CORREGIDO con los IDs correctos de index.html
                if (document.getElementById('salida_vehiculo_id')) {
                    document.getElementById('salida_vehiculo_id').value = salida.vehiculo_id;
                }
                if (document.getElementById('salida_infraccion_id')) {
                    document.getElementById('salida_infraccion_id').value = salida.infraccion_id || '';
                }
                if (document.getElementById('salida_persona_retira_nombre')) {
                    document.getElementById('salida_persona_retira_nombre').value = salida.persona_retira_nombre;
                }
                if (document.getElementById('salida_persona_retira_dni')) {
                    document.getElementById('salida_persona_retira_dni').value = salida.persona_retira_dni;
                }
                if (document.getElementById('salida_persona_retira_telefono')) {
                    document.getElementById('salida_persona_retira_telefono').value = salida.persona_retira_telefono || '';
                }

                // Formatear fecha para el input datetime-local
                if (salida.fecha_salida && document.getElementById('salida_fecha_salida')) {
                    const fecha = new Date(salida.fecha_salida);
                    const localISO = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    document.getElementById('salida_fecha_salida').value = localISO;
                }

                if (document.getElementById('salida_observaciones')) {
                    document.getElementById('salida_observaciones').value = salida.observaciones || '';
                }

                document.getElementById('salidaForm').dataset.editingId = id;

            } catch (error) {
                console.error('❌ Error editando salida:', error);
                this.showMessage('Error al cargar salida para editar', 'error');
            }
        }

    async eliminarSalida(id) {
            if (!confirm('¿Estás seguro de que deseas eliminar este registro de salida?\nEsta acción no se puede deshacer.')) {
                return;
            }

            try {
                await this.apiCall(`/salidas/${id}`, 'DELETE');
                this.showMessage('Salida eliminada exitosamente', 'success');
                this.loadSalidas();
            } catch (error) {
                console.error('❌ Error eliminando salida:', error);
                this.showMessage('Error al eliminar la salida', 'error');
            }
        }

    // ==========================================
    // HISTORIAL DE ACCIONES
    // ==========================================

    async verHistorialPropietario(id, nombre) {
            try {
                console.log('📜 Cargando historial del propietario:', id);

                // Actualizar título del modal
                document.getElementById('historialModalTitle').textContent = `Historial: ${nombre}`;

                // Mostrar modal
                this.mostrarModal('historialModal');

                // Mostrar loading
                const historialContent = document.getElementById('historialContent');
                historialContent.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</p>';

                // Cargar datos del historial
                const data = await this.apiCall(`/historial/propietario/${id}`);

                console.log('✅ Historial cargado:', data.data.length, 'acciones');

                // Renderizar historial
                this.renderHistorial(data.data || []);

            } catch (error) {
                console.error('❌ Error cargando historial del propietario:', error);
                document.getElementById('historialContent').innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar el historial</p>';
                this.showMessage('Error al cargar historial', 'error');
            }
        }

    async verHistorialVehiculo(id, patente) {
            try {
                console.log('📜 Cargando historial del vehículo:', id);

                // Actualizar título del modal
                document.getElementById('historialModalTitle').textContent = `Historial: ${patente}`;

                // Mostrar modal
                this.mostrarModal('historialModal');

                // Mostrar loading
                const historialContent = document.getElementById('historialContent');
                historialContent.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando historial...</p>';

                // Cargar datos del historial
                const data = await this.apiCall(`/historial/vehiculo/${id}`);

                console.log('✅ Historial cargado:', data.data.length, 'acciones');

                // Renderizar historial
                this.renderHistorial(data.data || []);

            } catch (error) {
                console.error('❌ Error cargando historial del vehículo:', error);
                document.getElementById('historialContent').innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar el historial</p>';
                this.showMessage('Error al cargar historial', 'error');
            }
        }

        renderHistorial(acciones) {
            const historialContent = document.getElementById('historialContent');

            if (acciones.length === 0) {
                historialContent.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                    <i class="fas fa-history" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p>No hay acciones registradas en el historial</p>
                </div>
                    `;
                return;
            }

            // Crear timeline de acciones
            let html = '<div class="timeline">';

            acciones.forEach((accion, index) => {
                // Determinar icono y color según tipo de acción
                let icono = '';
                let colorAccion = '';

                switch (accion.accion) {
                    case 'crear':
                        icono = 'fa-plus-circle';
                        colorAccion = '#28a745';
                        break;
                    case 'modificar':
                        icono = 'fa-edit';
                        colorAccion = '#ffc107';
                        break;
                    case 'eliminar':
                        icono = 'fa-trash-alt';
                        colorAccion = '#dc3545';
                        break;
                    default:
                        icono = 'fa-circle';
                        colorAccion = '#6c757d';
                }

                // Formatear fecha
                const fecha = this.formatFecha(accion.fecha_accion);

                // Parsear datos anteriores y nuevos si existen
                let cambios = '';
                if (accion.accion === 'modificar' && accion.datos_anteriores && accion.datos_nuevos) {
                    try {
                        const anterior = JSON.parse(accion.datos_anteriores);
                        const nuevo = JSON.parse(accion.datos_nuevos);

                        cambios = '<div style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem;">';
                        cambios += '<strong>Cambios:</strong><br>';

                        // Mostrar solo los campos que cambiaron
                        Object.keys(nuevo).forEach(key => {
                            if (anterior[key] !== nuevo[key]) {
                                cambios += `<span style="color: #666;">• ${key}:</span>`;
                                cambios += `<span style="color: #dc3545; text-decoration: line-through;"> ${anterior[key] || 'vacío'}</span>`;
                                cambios += `→ <span style="color: #28a745;">${nuevo[key] || 'vacío'}</span><br>`;
                            }
                        });

                        cambios += '</div>';
                    } catch (e) {
                        console.error('Error parseando datos del historial:', e);
                    }
                }

                html += `
                <div class="timeline-item" style="position: relative; padding-left: 2.5rem; padding-bottom: 1.5rem; border-left: 2px solid #e9ecef;">
                    <div style="position: absolute; left: -10px; top: 0; width: 20px; height: 20px; border-radius: 50%; background: ${colorAccion}; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${icono}" style="font-size: 0.7rem; color: white;"></i>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong style="color: ${colorAccion}; text-transform: capitalize;">${accion.accion}</strong>
                            <small style="color: #6c757d;">${fecha}</small>
                        </div>
                        <div style="font-size: 0.9rem; color: #495057;">
                            <i class="fas fa-user" style="margin-right: 0.5rem; color: #6c757d;"></i>
                            ${accion.usuario_nombre || 'Usuario desconocido'}
                        </div>
                        ${cambios}
                    </div>
                </div>
            `;
            });

            html += '</div>';

            historialContent.innerHTML = html;
        }


    async eliminarSalida(id) {
            if (!confirm('¿Estás seguro de que deseas eliminar este registro de salida?\nEsta acción no se puede deshacer.')) {
                return;
            }

            try {
                await this.apiCall(`/salidas/${id}`, 'DELETE');
                this.showMessage('Salida eliminada exitosamente', 'success');
                this.loadSalidas();
            } catch (error) {
                console.error('❌ Error eliminando salida:', error);
                this.showMessage('Error al eliminar la salida', 'error');
            }
        }

    async loadHistorial() {
            try {
                console.log('🔄 Cargando historial general...');

                const entidad = document.getElementById('filterHistorialEntidad')?.value || '';
                const accion = document.getElementById('filterHistorialAccion')?.value || '';

                const params = new URLSearchParams();
                if (entidad) params.append('tipo_entidad', entidad);
                if (accion) params.append('accion', accion);

                const data = await this.apiCall(`/historial/general?${params.toString()}`);
                console.log('✅ Historial cargado:', data.data.length);
                this.renderHistorialTable(data.data || []);
            } catch (error) {
                console.error('❌ Error cargando historial:', error);
                this.showMessage('Error al cargar historial', 'error');
            }
        }

        renderHistorialTable(historial) {
            const tbody = document.getElementById('historialTableBody');
            if (!tbody) return;

            tbody.innerHTML = '';

            if (historial.length === 0) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-history" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay registros en el historial</p>
                    </td>
                </tr>
            `;
                return;
            }

            historial.forEach(item => {
                const row = document.createElement('tr');
                const fecha = this.formatFecha(item.fecha_accion);

                // Intentar extraer algo útil de los datos para la columna "Detalles"
                let detallesText = '-';
                try {
                    if (item.datos_nuevos) {
                        const datos = JSON.parse(item.datos_nuevos);
                        if (item.tipo_entidad === 'vehiculo') detallesText = `Patente: ${datos.patente}`;
                        else if (item.tipo_entidad === 'propietario') detallesText = `Nombre: ${datos.nombre}`;
                        else if (item.tipo_entidad === 'infraccion') detallesText = `Acta: ${datos.numero_acta}`;
                        else if (item.tipo_entidad === 'salida') detallesText = `Patente: ${datos.vehiculo_patente}`;
                        else if (item.tipo_entidad === 'usuario') detallesText = `Usuario: ${datos.username}`;
                    } else if (item.datos_anteriores) {
                        const datos = JSON.parse(item.datos_anteriores);
                        if (item.tipo_entidad === 'vehiculo') detallesText = `Patente: ${datos.patente}`;
                        else if (item.tipo_entidad === 'propietario') detallesText = `Nombre: ${datos.nombre}`;
                        else if (item.tipo_entidad === 'infraccion') detallesText = `Acta: ${datos.numero_acta}`;
                        else if (item.tipo_entidad === 'salida') detallesText = `Patente: ${datos.vehiculo_patente}`;
                    }
                } catch (e) {
                    console.error('Error parseando datos del historial:', e);
                }

                row.innerHTML = `
                <td>${fecha}</td>
                <td>${item.usuario_nombre || 'Sistema'}</td>
                <td><span class="badge">${item.tipo_entidad}</span></td>
                <td><span class="badge ${this.getAccionClass(item.accion)}">${item.accion}</span></td>
                <td>${detallesText}</td>
            `;
                tbody.appendChild(row);
            });
        }

        getAccionClass(accion) {
            if (!accion) return 'badge-secondary';
            switch (accion.toLowerCase()) {
                case 'crear': return 'badge-success';
                case 'modificar': return 'badge-warning';
                case 'eliminar': return 'badge-danger';
                default: return 'badge-secondary';
            }
        }
    }

// Inicializar la aplicación cuando el DOM esté listo
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SistemaTransito();
    window.app = app; // Hacerla global para los onclick
});