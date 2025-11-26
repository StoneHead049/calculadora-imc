/* ==========================================================================
   PROYECTO CALCULADORA DE IMC - LÓGICA (SIN GÉNERO)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MODO OSCURO ---
    let modo_oscuro = localStorage.getItem('modo_oscuro');
    const interruptor_tema = document.getElementById('interruptor_tema');

    const activar_modo_oscuro = () => {
        document.body.classList.add('modo_oscuro');
        localStorage.setItem('modo_oscuro', 'activo');
    };

    const desactivar_modo_oscuro = () => {
        document.body.classList.remove('modo_oscuro');
        localStorage.setItem('modo_oscuro', null);
    };

    if (modo_oscuro === "activo") {
        activar_modo_oscuro();
    }

    if (interruptor_tema) {
        interruptor_tema.addEventListener("click", () => {
            modo_oscuro = localStorage.getItem('modo_oscuro');
            modo_oscuro !== "activo" ? activar_modo_oscuro() : desactivar_modo_oscuro();
        });
    }

    // --- 2. NAVEGACIÓN ---
    const usuario_logueado = JSON.parse(sessionStorage.getItem('usuario_logueado'));
    const enlace_cuenta = document.getElementById('enlace_cuenta');

    if (usuario_logueado && enlace_cuenta) {
        enlace_cuenta.href = 'historial.html';
        enlace_cuenta.querySelector('span').textContent = 'Mi Historial';
    }

    // --- 3. LÓGICA DE CALCULADORA (Solo en index.html) ---
    const seccion_calculadora = document.getElementById('calculadora_seccion');
    
    if (seccion_calculadora) {
        const btn_metrico = document.getElementById('btn_metrico');
        const btn_imperial = document.getElementById('btn_imperial');
        const entradas_metricas = document.getElementById('entradas_metricas');
        const entradas_imperiales = document.getElementById('entradas_imperiales');
        const boton_calcular = document.getElementById('boton_calcular');
        const mensaje_error = document.getElementById('mensaje_error');
        
        const cm_input = document.getElementById('cm');
        const kg_input = document.getElementById('kg');
        const ft_input = document.getElementById('ft');
        const in_input = document.getElementById('in');
        const lb_input = document.getElementById('lb');
        
        const valor_imc_display = document.getElementById('valor_imc');
        const seccion_resultados = document.getElementById('seccion_resultados');
        const boton_guardar_resultado = document.getElementById('boton_guardar_resultado');
        const checkbox_guardar_siempre = document.getElementById('guardar_siempre');

        let es_imperial = false;

        // Cambio de Unidades
        const cambiar_unidad = (imperial) => {
            es_imperial = imperial;
            if (es_imperial) {
                btn_metrico.classList.remove('activo');
                btn_imperial.classList.add('activo');
                entradas_metricas.style.display = 'none';
                entradas_imperiales.style.display = 'flex';
            } else {
                btn_imperial.classList.remove('activo');
                btn_metrico.classList.add('activo');
                entradas_metricas.style.display = 'flex';
                entradas_imperiales.style.display = 'none';
            }
            validar_entradas();
        };

        if(btn_metrico && btn_imperial) {
            btn_metrico.addEventListener('click', () => cambiar_unidad(false));
            btn_imperial.addEventListener('click', () => cambiar_unidad(true));
        }

        // Validación (YA NO PIDE GÉNERO)
        const todos_los_inputs = [cm_input, kg_input, ft_input, in_input, lb_input];
        todos_los_inputs.forEach(input => {
            if (input) input.addEventListener('input', validar_entradas);
        });

        function validar_entradas() {
            let son_entradas_validas = false;
            if (es_imperial) { 
                son_entradas_validas = (ft_input.value > 0 && lb_input.value > 0);
            } else { 
                son_entradas_validas = (cm_input.value > 0 && kg_input.value > 0);
            }
            // MODIFICADO: Solo valida números, ignora el género
            boton_calcular.disabled = !son_entradas_validas;
            
            if (!boton_calcular.disabled) {
                mensaje_error.textContent = '';
                mensaje_error.style.display = 'none';
            }
        }

        // Cálculo
        function obtener_datos_estandarizados() {
            let imc, peso_kg, altura_cm;
            if (es_imperial) {
                const total_pulgadas = (parseFloat(ft_input.value) * 12) + (parseFloat(in_input.value) || 0);
                const libras = parseFloat(lb_input.value);
                imc = (libras / (total_pulgadas * total_pulgadas)) * 703;
                peso_kg = libras * 0.453592;
                altura_cm = total_pulgadas * 2.54;
            } else {
                const metros = parseFloat(cm_input.value) / 100;
                const kilogramos = parseFloat(kg_input.value);
                imc = kilogramos / (metros * metros);
                peso_kg = kilogramos;
                altura_cm = parseFloat(cm_input.value);
            }
            return { imc, peso_kg, altura_cm };
        }

        boton_calcular.addEventListener('click', () => {
            if (boton_calcular.disabled) return;
            const { imc } = obtener_datos_estandarizados();
            mostrar_resultados(imc);
            if (seccion_resultados) {
                seccion_resultados.scrollIntoView({ behavior: 'smooth' });
            }
            if (checkbox_guardar_siempre && checkbox_guardar_siempre.checked && usuario_logueado) {
                guardar_resultado_actual();
            }
        });

        // Guardar
        boton_guardar_resultado.addEventListener('click', () => {
            if (!usuario_logueado) {
                alert('Para guardar tu resultado, por favor inicia sesión o crea una cuenta.');
                window.location.href = 'inicio_de_sesion.html';
                return;
            }
            guardar_resultado_actual();
        });

        function guardar_resultado_actual() {
            const { imc, peso_kg, altura_cm } = obtener_datos_estandarizados();
            if (!imc) return; 
            const historial = JSON.parse(localStorage.getItem('historial_imc')) || {};
            const historial_usuario = historial[usuario_logueado.email] || [];
            const nuevo_registro = {
                fecha: new Date().toLocaleDateString('es-ES'),
                peso: peso_kg.toFixed(1),
                altura: altura_cm.toFixed(0),
                imc: imc.toFixed(1)
            };
            historial_usuario.push(nuevo_registro);
            historial[usuario_logueado.email] = historial_usuario;
            localStorage.setItem('historial_imc', JSON.stringify(historial));
            alert('¡Resultado guardado en tu historial!');
        }

        // Visualización
        function mostrar_resultados(imc) {
            const imc_formateado = imc.toFixed(1);
            valor_imc_display.textContent = `Tu IMC es: ${imc_formateado}`;
            resaltar_fila_resultado(imc);
            actualizar_medidor(imc, imc_formateado);
            mostrar_consejos_dieta(imc);
        }

        function actualizar_medidor(imc, imc_formateado) {
            const aguja_medidor = document.querySelector('.aguja_medidor');
            const texto_resultado_medidor = document.getElementById('texto_resultado_medidor');
            
            let rotacion = -90; 
            
            if (imc < 18.5) {
                const base = 15; const rango = 3.5;
                const progreso = Math.max(0, Math.min(1, (imc - base) / rango));
                rotacion = -90 + (progreso * 45);
            } else if (imc < 25) {
                const base = 18.5; const rango = 6.5;
                const progreso = Math.max(0, Math.min(1, (imc - base) / rango));
                rotacion = -45 + (progreso * 45);
            } else if (imc < 30) {
                const base = 25; const rango = 5;
                const progreso = Math.max(0, Math.min(1, (imc - base) / rango));
                rotacion = 0 + (progreso * 45);
            } else {
                const base = 30; const imc_max_visual = 40;
                const imc_limitado = Math.min(imc, imc_max_visual);
                const rango = 10;
                const progreso = (imc_limitado - base) / rango;
                rotacion = 45 + (progreso * 45);
            }

            rotacion = Math.max(-90, Math.min(90, rotacion));
            aguja_medidor.style.setProperty('--rotacion_medidor', `${rotacion}deg`);
            texto_resultado_medidor.querySelector('span').textContent = imc_formateado;
            
            let clasificacion = '';
            if (imc < 18.5) clasificacion = 'Bajo Peso';
            else if (imc < 25) clasificacion = 'Peso Normal';
            else if (imc < 30) clasificacion = 'Sobrepeso';
            else clasificacion = 'Obesidad';
            
            texto_resultado_medidor.querySelector('p').textContent = clasificacion;
        }

        // MODIFICADO: Consejos generales (sin distinción de sexo)
        function mostrar_consejos_dieta(imc) {
            const lista_consejos = document.getElementById('lista_consejos_dieta');
            lista_consejos.innerHTML = '';
            let consejos = [];

            if (imc < 18.5) { 
                consejos = ["Aumenta consumo de proteínas y carbos.", "Realiza ejercicios de fuerza.", "Haz 5-6 comidas al día.", "Incluye grasas saludables (aguacate, nueces).", "Consulta a un nutricionista."];
            } else if (imc < 25) {
                consejos = ["Mantén una dieta equilibrada.", "Hidrátate constantemente.", "Realiza 30 min de actividad física diaria.", "Prioriza alimentos integrales.", "Duerme entre 7 y 8 horas."];
            } else if (imc < 30) {
                consejos = ["Controla las porciones.", "Reduce azúcares y harinas refinadas.", "Aumenta consumo de vegetales y fibra.", "Bebe agua antes de las comidas.", "Camina al menos 45 min diarios."];
            } else {
                consejos = ["Prioriza alimentos no procesados.", "Busca apoyo profesional médico/nutricional.", "Comienza con ejercicios de bajo impacto.", "Establece metas pequeñas y realistas.", "Evita bebidas azucaradas."];
            }

            consejos.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                lista_consejos.appendChild(li);
            });
        }

        function resaltar_fila_resultado(imc) {
            const filas_resultado = document.querySelectorAll('#tabla_resultados tbody tr');
            filas_resultado.forEach(row => row.classList.remove('resaltado'));
            if (imc < 18.5) document.getElementById('resultado_bajo')?.classList.add('resaltado');
            else if (imc < 25) document.getElementById('resultado_normal')?.classList.add('resaltado');
            else if (imc < 30) document.getElementById('resultado_sobrepeso')?.classList.add('resaltado');
            else document.getElementById('resultado_obeso')?.classList.add('resaltado');
        }
    }

    // --- 4. SISTEMA DE AUTENTICACIÓN (MODIFICADO SIN GÉNERO) ---
    const formulario_registro = document.getElementById('formulario_registro');
    if (formulario_registro) {
        formulario_registro.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre_usuario = document.getElementById('registro_usuario').value;
            const email = document.getElementById('registro_email').value;
            const password = document.getElementById('registro_password').value;
            const password_confirm = document.getElementById('registro_password_confirm').value;
            const mensaje_error = document.getElementById('mensaje_error_registro');

            if (password !== password_confirm) {
                mensaje_error.textContent = 'Las contraseñas no coinciden.';
                mensaje_error.style.display = 'block';
                return;
            }
            const usuarios = JSON.parse(localStorage.getItem('usuarios_imc')) || {};
            if (usuarios[email]) {
                mensaje_error.textContent = 'Este email ya está registrado.';
                mensaje_error.style.display = 'block';
                return;
            }
            // YA NO GUARDAMOS GÉNERO
            usuarios[email] = { nombre: nombre_usuario, password: password };
            localStorage.setItem('usuarios_imc', JSON.stringify(usuarios));
            
            alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
            window.location.href = 'inicio_de_sesion.html';
        });
    }

    const formulario_login = document.getElementById('formulario_login');
    if (formulario_login) {
        formulario_login.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login_email').value;
            const password = document.getElementById('login_password').value;
            const mensaje_error = document.getElementById('mensaje_error_login');
            const usuarios = JSON.parse(localStorage.getItem('usuarios_imc')) || {};
            const usuario = usuarios[email];
            
            if (!usuario || usuario.password !== password) {
                mensaje_error.textContent = 'Correo o contraseña incorrectos.';
                mensaje_error.style.display = 'block';
                return;
            }
            sessionStorage.setItem('usuario_logueado', JSON.stringify({ email: email, nombre: usuario.nombre }));
            window.location.href = 'historial.html';
        });
    }

    // --- 5. HISTORIAL ---
    const seccion_historial = document.getElementById('seccion_historial');
    if (seccion_historial) {
        if (!usuario_logueado) {
            alert('Debes iniciar sesión para ver tu historial.');
            window.location.href = 'inicio_de_sesion.html';
            return;
        }
        cargar_historial();
        const boton_cerrar_sesion = document.getElementById('boton_cerrar_sesion');
        boton_cerrar_sesion.addEventListener('click', () => {
            sessionStorage.removeItem('usuario_logueado');
            alert('Sesión cerrada.');
            window.location.href = 'index.html';
        });
    }

    function cargar_historial() {
        const nombre_usuario_el = document.getElementById('historial_nombre_usuario');
        const cuerpo_tabla = document.getElementById('cuerpo_tabla_historial');
        nombre_usuario_el.textContent = `Hola, ${usuario_logueado.nombre}`;
        
        const historial = JSON.parse(localStorage.getItem('historial_imc')) || {};
        const historial_usuario = historial[usuario_logueado.email] || [];
        
        if (historial_usuario.length === 0) {
            cuerpo_tabla.innerHTML = '<tr><td colspan="4">No hay registros guardados.</td></tr>';
            return;
        }
        
        cuerpo_tabla.innerHTML = '';
        const etiquetas_grafico = [];
        const datos_grafico = [];
        
        historial_usuario.forEach(registro => {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td>${registro.fecha}</td><td>${registro.peso}</td><td>${registro.altura}</td><td>${registro.imc}</td>`;
            cuerpo_tabla.appendChild(fila);
            etiquetas_grafico.push(registro.fecha);
            datos_grafico.push(parseFloat(registro.imc));
        });

        const ctx = document.getElementById('grafico_historial');
        if (ctx && typeof Chart !== 'undefined') {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: etiquetas_grafico,
                    datasets: [{
                        label: 'Historial de IMC',
                        data: datos_grafico,
                        borderColor: 'rgba(0, 113, 255, 1)',
                        backgroundColor: 'rgba(0, 113, 255, 0.1)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    // --- 6. NOTIFICACIÓN ---
    const notificacion = document.getElementById('notificacion_motivacional');
    if (notificacion) { 
        const boton_cerrar_notificacion = document.getElementById('boton_cerrar_notificacion');
        const texto_mensaje = document.getElementById('texto_mensaje_motivacional');
        const mensajes = [
            "Cada pequeño paso te acerca a tu gran meta.",
            "La constancia es más importante que la perfección.",
            "Cuida tu cuerpo, es el único lugar que tienes para vivir.",
            "El éxito es la suma de pequeños esfuerzos.",
            "No mires lo lejos que te falta, mira lo lejos que has llegado.",
            "Cree en ti mismo.",
            "La disciplina es el puente entre las metas y los logros."
        ];
        const mostrar_notificacion = () => {
            const mensaje_aleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];
            texto_mensaje.textContent = mensaje_aleatorio;
            notificacion.classList.add('visible');
        };
        const ocultar_notificacion = () => {
            notificacion.classList.remove('visible');
        };
        setTimeout(mostrar_notificacion, 1000);
        boton_cerrar_notificacion.addEventListener('click', ocultar_notificacion);
    }
});
