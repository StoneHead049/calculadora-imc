/* ==========================================================================
   PROYECTO CALCULADORA DE IMC - LÓGICA COMPLETA CON LOCALSTORAGE
   Este archivo maneja toda la interactividad del sitio:
   1. Modo Oscuro
   2. Navegación (Estado de Login)
   3. Lógica de Calculadora (Página Principal)
   4. Sistema de Autenticación (Login/Registro con localStorage)
   5. Sistema de Historial (Guardado y Carga desde localStorage)
   6. Modal Motivacional (Página de Historial)
   ========================================================================== */

// Espera a que todo el contenido del DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MODO OSCURO ---
    let modoOscuro = localStorage.getItem('modoOscuro');
    const interruptorTema = document.getElementById('interruptor-tema');

    const activarModoOscuro = () => {
        document.body.classList.add('modoscuro');
        localStorage.setItem('modoOscuro', 'activo');
    };

    const desactivarModoOscuro = () => {
        document.body.classList.remove('modoscuro');
        localStorage.setItem('modoOscuro', null);
    };

    if (modoOscuro === "activo") {
        activarModoOscuro();
    }

    if (interruptorTema) {
        interruptorTema.addEventListener("click", () => {
            modoOscuro = localStorage.getItem('modoOscuro');
            modoOscuro !== "activo" ? activarModoOscuro() : desactivarModoOscuro();
        });
    }

    // --- 2. NAVEGACIÓN (ESTADO DE LOGIN) ---
    // Revisa si hay un usuario logueado en 'sessionStorage'
    const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    const enlaceCuenta = document.getElementById('enlace-cuenta');

    if (usuarioLogueado && enlaceCuenta) {
        enlaceCuenta.href = 'Historial.html';
        enlaceCuenta.querySelector('span').textContent = 'Mi Historial';
    }

    // --- 3. LÓGICA DE CALCULADORA (Página Principal) ---
    // Estos elementos solo existen en la página principal
    const seccionCalculadora = document.getElementById('calculadora-seccion');
    if (seccionCalculadora) {
        const interruptorUnidades = document.getElementById('interruptor-unidades-checkbox');
        const entradasMetricas = document.getElementById('entradas-metricas');
        const entradasImperiales = document.getElementById('entradas-imperiales');
        const botonCalcular = document.getElementById('boton-calcular');
        const mensajeError = document.getElementById('mensaje-error');
        const cmInput = document.getElementById('cm');
        const kgInput = document.getElementById('kg');
        const ftInput = document.getElementById('ft');
        const inInput = document.getElementById('in');
        const lbInput = document.getElementById('lb');
        const valorImcDisplay = document.getElementById('valor-imc');
        const opcionesGenero = document.querySelectorAll('#seleccion-genero div');
        const seccionResultados = document.getElementById('seccion-resultados');
        const botonGuardarResultado = document.getElementById('boton-guardar-resultado');
        const checkboxGuardarSiempre = document.getElementById('guardar-siempre');

        let generoSeleccionado = null;

        // Lógica para la selección de género
        opcionesGenero.forEach(option => {
            option.addEventListener('click', () => {
                opcionesGenero.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                generoSeleccionado = option.getAttribute('data-genero');
                validarInputs();
            });
        });

        // Lógica para cambiar unidades
        interruptorUnidades.addEventListener('change', () => {
            const esImperial = interruptorUnidades.checked;
            entradasMetricas.style.display = esImperial ? 'none' : 'flex';
            entradasImperiales.style.display = esImperial ? 'flex' : 'none';
            validarInputs();
        });

        // Validación de inputs en tiempo real
        const todosLosInputs = [cmInput, kgInput, ftInput, inInput, lbInput];
        todosLosInputs.forEach(input => {
            if (input) input.addEventListener('input', validarInputs);
        });

        function validarInputs() {
            let sonInputsValidos = false;
            if (interruptorUnidades.checked) { // Imperial
                sonInputsValidos = (ftInput.value > 0 && lbInput.value > 0);
            } else { // Métrico
                sonInputsValidos = (cmInput.value > 0 && kgInput.value > 0);
            }
            botonCalcular.disabled = !(sonInputsValidos && generoSeleccionado);
            if (!botonCalcular.disabled) {
                mensajeError.textContent = '';
                mensajeError.style.display = 'none';
            }
        }

        // Función centralizada para obtener datos métricos (para guardar)
        function getDatosEstandarizados() {
            let imc, peso_kg, altura_cm;

            if (interruptorUnidades.checked) { // Imperial
                const totalInches = (parseFloat(ftInput.value) * 12) + (parseFloat(inInput.value) || 0);
                const lb = parseFloat(lbInput.value);
                imc = (lb / (totalInches * totalInches)) * 703;
                
                // Conversión a métrico para guardar
                peso_kg = lb * 0.453592;
                altura_cm = totalInches * 2.54;
            } else { // Métrico
                const meters = parseFloat(cmInput.value) / 100;
                const kg = parseFloat(kgInput.value);
                imc = kg / (meters * meters);

                // Ya están en métrico
                peso_kg = kg;
                altura_cm = parseFloat(cmInput.value);
            }
            
            return { imc, peso_kg, altura_cm };
        }


        // Cálculo del IMC
        botonCalcular.addEventListener('click', () => {
            if (botonCalcular.disabled) return;
            
            const { imc } = getDatosEstandarizados();
            
            displayResultados(imc);

            if (seccionResultados) {
                seccionResultados.scrollIntoView({ behavior: 'smooth' });
            }

            // Lógica de guardado automático si el checkbox está marcado
            if (checkboxGuardarSiempre.checked && usuarioLogueado) {
                guardarResultadoActual();
            }
        });

        // Botón de Guardar Resultado
        botonGuardarResultado.addEventListener('click', () => {
            if (!usuarioLogueado) {
                alert('Para guardar tu resultado, por favor inicia sesión o crea una cuenta.');
                window.location.href = 'Inicio de sesion.html';
                return;
            }
            guardarResultadoActual();
        });

        // Función para guardar en localStorage
        function guardarResultadoActual() {
            const { imc, peso_kg, altura_cm } = getDatosEstandarizados();
            if (!imc) return; // No guardar si no hay resultado

            // Obtenemos el historial existente del usuario logueado
            const historial = JSON.parse(localStorage.getItem('historialIMC')) || {};
            const historialUsuario = historial[usuarioLogueado.email] || [];

            // Creamos el nuevo registro
            const nuevoRegistro = {
                fecha: new Date().toLocaleDateString('es-ES'),
                peso: peso_kg.toFixed(1),
                altura: altura_cm.toFixed(0),
                imc: imc.toFixed(1)
            };

            // Añadimos el nuevo registro al historial del usuario
            historialUsuario.push(nuevoRegistro);
            historial[usuarioLogueado.email] = historialUsuario;

            // Guardamos el historial actualizado en localStorage
            localStorage.setItem('historialIMC', JSON.stringify(historial));

            alert('¡Resultado guardado en tu historial!');
        }


        // --- Funciones para mostrar resultados ---

        function displayResultados(imc) {
            const imcFormateado = imc.toFixed(1);
            valorImcDisplay.textContent = `Tu IMC es: ${imcFormateado}`;
            resaltarFilaResultado(imc);
            actualizarMedidor(imc, imcFormateado);
            displayConsejosDieta(imc);
        }

        function actualizarMedidor(imc, imcFormateado) {
            const agujaMedidor = document.querySelector('.aguja-medidor');
            const textoResultadoMedidor = document.getElementById('texto-resultado-medidor');

            const imcLimitado = Math.max(15, Math.min(40, imc));
            const rotacion = (imcLimitado - 15) / (40 - 15) * 180 - 90;
            agujaMedidor.style.setProperty('--rotacion-medidor', `${rotacion}deg`);

            textoResultadoMedidor.querySelector('span').textContent = imcFormateado;
            
            let clasificacion = '';
            if (imc < 18.5) clasificacion = 'Bajo Peso';
            else if (imc < 25) clasificacion = 'Peso Normal';
            else if (imc < 30) clasificacion = 'Sobrepeso';
            else clasificacion = 'Obesidad';
            
            textoResultadoMedidor.querySelector('p').textContent = clasificacion;
        }

        function displayConsejosDieta(imc) {
            const listaConsejos = document.getElementById('lista-consejos-dieta');
            listaConsejos.innerHTML = '';
            let consejos = [];

            if (imc < 18.5) {
                consejos = ["Aumenta la ingesta de proteínas y carbohidratos complejos.", "Considera snacks saludables entre comidas.", "Consulta a un nutricionista para un plan personalizado."];
            } else if (imc < 25) {
                consejos = ["¡Felicidades! Mantén una dieta balanceada y actividad física regular.", "Varía tus fuentes de proteínas, incluyendo legumbres y pescado.", "Asegúrate de consumir suficientes frutas y verduras cada día."];
            } else if (imc < 30) {
                consejos = ["Controla el tamaño de las porciones.", "Incrementa tu actividad física diaria, como caminar 30 minutos.", "Reduce el consumo de azúcares refinados y alimentos procesados."];
            } else {
                consejos = ["Prioriza alimentos integrales y ricos en fibra.", "Bebe abundante agua durante el día.", "Es recomendable buscar la guía de un profesional de la salud."];
            }

            consejos.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                listaConsejos.appendChild(li);
            });
        }

        function resaltarFilaResultado(imc) {
            const filasResultado = document.querySelectorAll('#tabla-resultados tbody tr');
            filasResultado.forEach(row => row.classList.remove('resaltado'));

            if (imc < 18.5) document.getElementById('resultado-bajo')?.classList.add('resaltado');
            else if (imc < 25) document.getElementById('resultado-normal')?.classList.add('resaltado');
            else if (imc < 30) document.getElementById('resultado-sobrepeso')?.classList.add('resaltado');
            else document.getElementById('resultado-obeso')?.classList.add('resaltado');
        }

        // Estado inicial de las unidades al cargar la página
        const esImperial = interruptorUnidades.checked;
        entradasMetricas.style.display = esImperial ? 'none' : 'flex';
        entradasImperiales.style.display = esImperial ? 'flex' : 'none';
    }

    // --- 4. SISTEMA DE AUTENTICACIÓN (Login/Registro) ---

    // --- Lógica de Registro  ---
    const formularioRegistro = document.getElementById('formulario-registro');
    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombreUsuario = document.getElementById('registro-usuario').value;
            const email = document.getElementById('registro-email').value;
            const password = document.getElementById('registro-password').value;
            const passwordConfirm = document.getElementById('registro-password-confirm').value;
            const mensajeError = document.getElementById('mensaje-error-registro');

            // Validaciones
            if (password !== passwordConfirm) {
                mensajeError.textContent = 'Las contraseñas no coinciden.';
                mensajeError.style.display = 'block';
                return;
            }

            // Cargamos los usuarios existentes de localStorage
            const usuarios = JSON.parse(localStorage.getItem('usuariosIMC')) || {};

            if (usuarios[email]) {
                mensajeError.textContent = 'Este email ya está registrado.';
                mensajeError.style.display = 'block';
                return;
            }

            // Guardamos el nuevo usuario (¡SIN HASHEAR, solo para esta prueba!)
            // En un proyecto real, la contraseña NUNCA se guarda así.
            usuarios[email] = { nombre: nombreUsuario, password: password };
            localStorage.setItem('usuariosIMC', JSON.stringify(usuarios));

            // Éxito
            alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
            window.location.href = 'Inicio de sesion.html';
        });
    }

    // --- Lógica de Inicio de Sesión ---
    const formularioLogin = document.getElementById('formulario-login');
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const mensajeError = document.getElementById('mensaje-error-login');

            // Cargamos los usuarios
            const usuarios = JSON.parse(localStorage.getItem('usuariosIMC')) || {};
            const usuario = usuarios[email];

            // Validamos
            if (!usuario || usuario.password !== password) {
                mensajeError.textContent = 'Email o contraseña incorrectos.';
                mensajeError.style.display = 'block';
                return;
            }

            // Éxito: Guardamos al usuario en 'sessionStorage'
            // (sessionStorage se borra al cerrar el navegador)
            sessionStorage.setItem('usuarioLogueado', JSON.stringify({ email: email, nombre: usuario.nombre }));

            // Redirigimos al historial
            window.location.href = 'Historial.html';
        });
    }


    // --- 5. SISTEMA DE HISTORIAL  ---
    const seccionHistorial = document.getElementById('seccion-historial');
    if (seccionHistorial) {
        // Redirigir si no está logueado
        if (!usuarioLogueado) {
            alert('Debes iniciar sesión para ver tu historial.');
            window.location.href = 'Inicio de sesion.html';
            return; // Detiene la ejecución del resto del código de historial
        }

        // Cargar datos del historial
        cargarHistorial();

        // Botón de Cerrar Sesión
        const botonCerrarSesion = document.getElementById('boton-cerrar-sesion');
        botonCerrarSesion.addEventListener('click', () => {
            sessionStorage.removeItem('usuarioLogueado');
            alert('Sesión cerrada.');
            window.location.href = 'Medio Curso (Pantalla principal).html';
        });
    }

    function cargarHistorial() {
        const nombreUsuarioEl = document.getElementById('historial-nombre-usuario');
        const cuerpoTabla = document.getElementById('cuerpo-tabla-historial');
        
        // Poner nombre
        nombreUsuarioEl.textContent = `Hola, ${usuarioLogueado.nombre}`;

        // Cargar datos
        const historial = JSON.parse(localStorage.getItem('historialIMC')) || {};
        const historialUsuario = historial[usuarioLogueado.email] || [];

        if (historialUsuario.length === 0) {
            cuerpoTabla.innerHTML = '<tr><td colspan="4">No hay registros guardados.</td></tr>';
            return;
        }

        // Limpiar tabla y preparar datos para el gráfico
        cuerpoTabla.innerHTML = '';
        const etiquetasGrafico = [];
        const datosGrafico = [];

        historialUsuario.forEach(registro => {
            // Llenar tabla
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${registro.fecha}</td>
                <td>${registro.peso}</td>
                <td>${registro.altura}</td>
                <td>${registro.imc}</td>
            `;
            cuerpoTabla.appendChild(fila);

            // Preparar datos para el gráfico
            etiquetasGrafico.push(registro.fecha);
            datosGrafico.push(parseFloat(registro.imc));
        });

        // --- Lógica del Gráfico (Opcional, si Chart.js está cargado) ---
        const ctx = document.getElementById('grafico-historial');
        if (ctx && typeof Chart !== 'undefined') { // Revisa si Chart.js existe
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: etiquetasGrafico,
                    datasets: [{
                        label: 'Historial de IMC',
                        data: datosGrafico,
                        borderColor: 'rgba(0, 113, 255, 1)',
                        backgroundColor: 'rgba(0, 113, 255, 0.1)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // --- 6. MODAL MOTIVACIONAL (history.html) ---
    const notificacion = document.getElementById('notificacion-motivacional');
    if (notificacion) {
        const botonCerrarNotificacion = document.getElementById('boton-cerrar-notificacion');
        const textoMensaje = document.getElementById('texto-mensaje-motivacional');

        const mensajes = [
            "La disciplina es el puente entre las metas y los logros.", 
            "Elige el bienestar, elige la salud.",
            "Cuida tu cuerpo como si fueras a vivir en él para siempre.",
            "Haz del bienestar tu prioridad y deja que guíe tus decisiones.",
            "Cuida tu cuerpo como si fueras a vivir en él para siempre.",
            "Cada comida y cada elección cuenta. Haz que cuenten para tu salud."
        ];

        // Función para mostrar el modal con un mensaje aleatorio
        const mostrarNotificacion = () => {
            const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];
            textoMensaje.textContent = mensajeAleatorio;
            notificacion.classList.add('visible');
        };

        // Función para ocultar el modal
        const ocultarNotificacion = () => {
            notificacion.classList.remove('visible');
        };

        // Mostrar el modal 1 segundo después de cargar la página de historial
        setTimeout(mostrarNotificacion, 1000);

        // Eventos para cerrar
        botonCerrarNotificacion.addEventListener('click', ocultarNotificacion);
    }

}); 