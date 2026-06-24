import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   CONFIGURACION FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyD_hz2Y0qajgRMPeb0L3Ky75jQJIebywJM",
    authDomain: "red-de-patas.firebaseapp.com",
    projectId: "red-de-patas",
    storageBucket: "red-de-patas.firebasestorage.app",
    messagingSenderId: "812893065625",
    appId: "1:812893065625:web:08b1c067911872edd14308",
    measurementId: "G-M1NH2DJF29"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


/* =========================================================
   ELEMENTOS HTML
========================================================= */

const fechaFiltro = document.getElementById("fechaFiltro");

const turnoFiltro = document.getElementById("turnoFiltro");

const btnActualizar = document.getElementById("btnActualizar");

const totalFaltas = document.getElementById("totalFaltas");

const totalDescansos = document.getElementById(
    "totalDescansos"
);

const totalCitas = document.getElementById("totalCitas");

const contadorFaltas = document.getElementById(
    "contadorFaltas"
);

const contadorDescansos = document.getElementById(
    "contadorDescansos"
);

const contadorCitas = document.getElementById(
    "contadorCitas"
);

const listaFaltas = document.getElementById("listaFaltas");

const listaDescansos = document.getElementById(
    "listaDescansos"
);

const listaCitas = document.getElementById("listaCitas");

const textoFecha = document.getElementById("textoFecha");

const mensaje = document.getElementById("mensaje");

const canvasGrafico = document.getElementById(
    "graficoTurnos"
);


/* =========================================================
   VARIABLE GLOBAL
========================================================= */

let graficoTurnos = null;


/* =========================================================
   INICIO
========================================================= */

fechaFiltro.value = obtenerFechaLocal();

cargarDashboard();


/* =========================================================
   EVENTOS
========================================================= */

btnActualizar.addEventListener(
    "click",
    cargarDashboard
);

fechaFiltro.addEventListener(
    "change",
    cargarDashboard
);

turnoFiltro.addEventListener(
    "change",
    cargarDashboard
);


/* =========================================================
   CARGAR DASHBOARD
========================================================= */

async function cargarDashboard() {

    const fecha = fechaFiltro.value;

    const turnoSeleccionado = turnoFiltro.value;


    if (!fecha) {

        mostrarMensaje(
            "Seleccione una fecha.",
            "error"
        );

        return;

    }


    btnActualizar.disabled = true;

    btnActualizar.textContent = "Cargando...";

    ocultarMensaje();

    textoFecha.textContent = "Cargando información...";


    try {

        /*
           Lee los registros guardados en:

           descansos_diarios
               / FECHA
               / registros
        */

        const referenciaRegistros = collection(
            db,
            "descansos_diarios",
            fecha,
            "registros"
        );

        const resultado = await getDocs(
            referenciaRegistros
        );

        const registros = [];


        resultado.forEach((documento) => {

            registros.push({
                id: documento.id,
                ...documento.data()
            });

        });


        const registrosFiltrados =
            turnoSeleccionado === "TODOS"
                ? registros
                : registros.filter((registro) => {

                    return registro.turno === turnoSeleccionado;

                });


        actualizarResumen(registrosFiltrados);

        actualizarGrafico(registrosFiltrados);

        actualizarListas(registrosFiltrados);


        const textoTurno =
            turnoSeleccionado === "TODOS"
                ? "Todos los turnos"
                : `Turno ${turnoSeleccionado}`;


        textoFecha.textContent =
            `${formatearFecha(fecha)} - ${textoTurno}`;


        if (registrosFiltrados.length === 0) {

            mostrarMensaje(
                "No hay incidencias registradas con esos filtros.",
                "info"
            );

        } 

    } catch (error) {

        console.error(
            "Error al cargar dashboard:",
            error
        );

        limpiarDashboard();

        textoFecha.textContent =
            "No se pudo cargar la información.";

        mostrarMensaje(
            "No se pudo cargar la información. Revise las reglas de Firestore.",
            "error"
        );

    } finally {

        btnActualizar.disabled = false;

        btnActualizar.textContent = "Actualizar";

    }

}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen(registros) {

    const faltas = registros.filter((registro) => {

        return registro.incidencia === "FALTA";

    });

    const descansos = registros.filter((registro) => {

        return registro.incidencia === "DESCANSO MEDICO";

    });

    const citas = registros.filter((registro) => {

        return registro.incidencia === "CITA MEDICA";

    });


    totalFaltas.textContent = faltas.length;

    totalDescansos.textContent = descansos.length;

    totalCitas.textContent = citas.length;


    contadorFaltas.textContent = faltas.length;

    contadorDescansos.textContent = descansos.length;

    contadorCitas.textContent = citas.length;

}


/* =========================================================
   GRAFICO POR TURNOS
========================================================= */

function actualizarGrafico(registros) {

    const turnos = ["T1", "T2", "T3"];


    const faltasPorTurno = contarPorTurno(
        registros,
        "FALTA",
        turnos
    );

    const descansosPorTurno = contarPorTurno(
        registros,
        "DESCANSO MEDICO",
        turnos
    );

    const citasPorTurno = contarPorTurno(
        registros,
        "CITA MEDICA",
        turnos
    );


    if (graficoTurnos) {
        graficoTurnos.destroy();
    }


    graficoTurnos = new Chart(
        canvasGrafico,
        {
            type: "bar",

            plugins: [ChartDataLabels],

            data: {
                labels: turnos,

                datasets: [
                    {
                        label: "Faltas",
                        data: faltasPorTurno,
                        backgroundColor: "#dc2626",
                        borderRadius: 5
                    },
                    {
                        label: "Descansos médicos",
                        data: descansosPorTurno,
                        backgroundColor: "#2563eb",
                        borderRadius: 5
                    },
                    {
                        label: "Citas médicas",
                        data: citasPorTurno,
                        backgroundColor: "#d97706",
                        borderRadius: 5
                    }
                ]
            },

            options: {
                responsive: true,

                maintainAspectRatio: false,

                layout: {
                    padding: {
                        top: 25
                    }
                },

                plugins: {
                    legend: {
                        position: "top",

                        labels: {
                            usePointStyle: true,
                            pointStyle: "rectRounded"
                        }
                    },

                    datalabels: {
                        color: "#334155",
                        anchor: "end",
                        align: "end",
                        offset: 2,

                        font: {
                            weight: "700",
                            size: 12
                        },

                        formatter: (valor) => valor
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },

                    y: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0,
                            stepSize: 1
                        }
                    }
                }
            }
        }
    );

}


function contarPorTurno(registros, incidencia, turnos) {

    return turnos.map((turno) => {

        return registros.filter((registro) => {

            return (
                registro.turno === turno &&
                registro.incidencia === incidencia
            );

        }).length;

    });

}


/* =========================================================
   LISTAS DE PERSONAL
========================================================= */

function actualizarListas(registros) {

    const faltas = registros.filter((registro) => {

        return registro.incidencia === "FALTA";

    });

    const descansos = registros.filter((registro) => {

        return registro.incidencia === "DESCANSO MEDICO";

    });

    const citas = registros.filter((registro) => {

        return registro.incidencia === "CITA MEDICA";

    });


    pintarLista(
        listaFaltas,
        faltas,
        "No hay faltas registradas."
    );

    pintarLista(
        listaDescansos,
        descansos,
        "No hay descansos médicos registrados."
    );

    pintarLista(
        listaCitas,
        citas,
        "No hay citas médicas registradas."
    );

}


function pintarLista(contenedor, registros, mensajeVacio) {

    contenedor.innerHTML = "";


    if (registros.length === 0) {

        const sinDatos = document.createElement("p");

        sinDatos.className = "sin-datos";

        sinDatos.textContent = mensajeVacio;

        contenedor.appendChild(sinDatos);

        return;

    }


    registros
        .sort((a, b) => {

            const nombreA =
                a.apellidos_nombres || "";

            const nombreB =
                b.apellidos_nombres || "";

            return nombreA.localeCompare(
                nombreB,
                "es"
            );

        })
        .forEach((registro) => {

            const item = document.createElement("article");

            item.className = "persona-item";


            const nombre = document.createElement("strong");

            nombre.textContent =
                registro.apellidos_nombres ||
                "Personal sin nombre";


            const detalle = document.createElement("span");

            detalle.textContent = [

                `DNI: ${registro.dni || ""}`,

                registro.turno || "",

                registro.area || "",

                registro.funcion || ""

            ]
                .filter(Boolean)
                .join(" | ");


            item.appendChild(nombre);

            item.appendChild(detalle);

            contenedor.appendChild(item);

        });

}


/* =========================================================
   LIMPIAR DASHBOARD
========================================================= */

function limpiarDashboard() {

    actualizarResumen([]);

    actualizarListas([]);

    actualizarGrafico([]);

}


/* =========================================================
   MENSAJES
========================================================= */

function mostrarMensaje(texto, tipo) {

    mensaje.textContent = texto;

    mensaje.className = `mensaje ${tipo}`;

}


function ocultarMensaje() {

    mensaje.textContent = "";

    mensaje.className = "mensaje";

}


/* =========================================================
   FECHA
========================================================= */

function obtenerFechaLocal() {

    const fecha = new Date();

    const zonaLocal =
        fecha.getTimezoneOffset() * 60000;

    return new Date(
        fecha.getTime() - zonaLocal
    )
        .toISOString()
        .slice(0, 10);

}


function formatearFecha(fechaTexto) {

    const partes = fechaTexto.split("-");

    const fecha = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );


    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(fecha);

}