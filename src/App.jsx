import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { BookOpen, BarChart2, CheckCircle, XCircle, ChevronRight, ChevronLeft, Lock, Home, User, Info, List, Briefcase, AlertTriangle, Edit3, Brain, Image as ImageIcon, CheckSquare, MonitorPlay, TrendingUp, Projector, Sparkles, Eye, Activity, Presentation } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBjQQ6nVl8UrAySaxh6G1iP5QmPAB2Wr3Y",
  authDomain: "practica-docente-iv-normas.firebaseapp.com",
  databaseURL: "https://practica-docente-iv-normas-default-rtdb.firebaseio.com",
  projectId: "practica-docente-iv-normas",
  storageBucket: "practica-docente-iv-normas.firebasestorage.app",
  messagingSenderId: "990824406949",
  appId: "1:990824406949:web:abe0208d7b52d80678d24c"
};

// --- BASE DE DATOS DEL CUESTIONARIO (35 PREGUNTAS EN 6 MÓDULOS) ---
const quizData = [
  // --- MÓDULO 1: MULTIPLE CHOICE (10) ---
  { id: 'mc_1', moduleId: 'mc', type: 'mc', category: 'Normativa y Tiempos', question: "¿Con cuánta anticipación mínima deben presentarse en formato papel los borradores de planificación?", options: [{ text: "7 días antes", isCorrect: false, rationale: "Plazo de la planificación definitiva." }, { text: "15 días antes", isCorrect: true, rationale: "Garantiza tiempo para corrección." }, { text: "48 horas", isCorrect: false, rationale: "Insuficiente para correcciones." }], pill: "Anticipación: 15 días (Borrador) / 1 semana (Definitiva)." },
  { id: 'mc_2', moduleId: 'mc', type: 'mc', category: 'Rigor Científico', question: "¿Qué sucede si uno de los residentes presenta errores conceptuales no corregidos previo a la clase?", options: [{ text: "Dicta la clase con descuento de nota.", isCorrect: false, rationale: "Los errores en biología son críticos." }, { text: "No se habilita la práctica y puede suspenderse.", isCorrect: true, rationale: "Reglamento estricto: cero errores conceptuales." }, { text: "El co-formador asume la clase.", isCorrect: false, rationale: "La práctica no se habilita previamente." }], pill: "Rigurosidad: Sin precisión conceptual no hay habilitación de práctica." },
  { id: 'mc_3', moduleId: 'mc', type: 'mc', category: 'Asistencia y Compromiso', question: "¿Cuál es el mínimo de asistencia exigido para las clases del Taller en el IES?", options: [{ text: "100%", isCorrect: false, rationale: "Ese es el porcentaje para la escuela asociada." }, { text: "75%", isCorrect: true, rationale: "Art. 28 del reglamento de práctica." }, { text: "60%", isCorrect: false, rationale: "Por debajo del marco legal." }], pill: "Asistencia IES: 75% mínimo indispensable." },
  { id: 'mc_4', moduleId: 'mc', type: 'mc', category: 'Asistencia y Compromiso', question: "¿Cuál es el porcentaje de asistencia exigido para las actividades en la Escuela Asociada?", options: [{ text: "100%", isCorrect: true, rationale: "El compromiso territorial es total." }, { text: "75%", isCorrect: false, rationale: "Solo aplica al cursado en el IES." }, { text: "80%", isCorrect: false, rationale: "Falso." }], pill: "Asistencia Territorio: 100% obligatorio." },
  { id: 'mc_5', moduleId: 'mc', type: 'mc', category: 'Roles Institucionales', question: "¿Quiénes conforman el Equipo Formador según el Decreto 4200?", options: [{ text: "Solo profesores del IES.", isCorrect: false, rationale: "Falta la pata territorial." }, { text: "Supervisores y directores.", isCorrect: false, rationale: "Ellos gestionan, no forman directamente." }, { text: "Jefe de práctica, Profesores de Taller y Co-formadores.", isCorrect: true, rationale: "Red articulada de co-formación." }], pill: "Equipo Formador: Articulación IES - Escuela." },
  { id: 'mc_6', moduleId: 'mc', type: 'mc', category: 'Ética Profesional', question: "En relación al uso de IA generativa (ej. ChatGPT) para realizar la planificación, los criterios exigen:", options: [{ text: "Prohibición total de herramientas digitales.", isCorrect: false, rationale: "Se promueve el uso de TICs, pero con criterio." }, { text: "Ejercicio responsable: no usar IA para evadir la 'Capacidad de Anticipación' y el diseño original.", isCorrect: true, rationale: "Copiar y pegar destruye la fluidez y el conocimiento del contenido." }, { text: "Copiar íntegramente de la IA para ahorrar tiempo.", isCorrect: false, rationale: "Demuestra falta de profesionalismo." }], pill: "Ética y Planificación: La IA puede ser una herramienta de consulta, pero jamás debe reemplazar tu diseño pedagógico original." },
  { id: 'mc_7', moduleId: 'mc', type: 'mc', category: 'Transposición Didáctica', question: "¿Qué implica la 'Transposición Didáctica Específica'?", options: [{ text: "Transformar el saber biológico al nivel escolar sin perder rigor científico.", isCorrect: true, rationale: "El puente entre la ciencia y el aula." }, { text: "Eliminar palabras técnicas.", isCorrect: false, rationale: "Pierde rigor científico." }, { text: "Dictar teoría universitaria en secundaria.", isCorrect: false, rationale: "Falta de adaptación al sujeto que aprende." }], pill: "Transposición: Complejidad adaptada, rigor mantenido." },
  { id: 'mc_8', moduleId: 'mc', type: 'mc', category: 'Trabajo en Equipo', question: "¿Cómo se evalúa la Práctica en Pareja Pedagógica?", options: [{ text: "Solo se evalúa al que da la clase ese día.", isCorrect: false, rationale: "El trabajo es en equipo." }, { text: "Ambos son responsables de la ÚNICA práctica que constituye la unidad.", isCorrect: true, rationale: "Evaluación integral del equipo." }, { text: "Se promedian las notas individuales.", isCorrect: false, rationale: "Hay una síntesis, no un promedio frío." }], pill: "Pareja Pedagógica: Co-responsabilidad absoluta en el diseño y ejecución." },
  { id: 'mc_9', moduleId: 'mc', type: 'mc', category: 'Bioseguridad', question: "El Manejo Ético y Responsable de Recursos implica:", options: [{ text: "Garantizar bioseguridad y respeto por los seres vivos en el aula.", isCorrect: true, rationale: "Fundamental en prácticas de Biología." }, { text: "Solo usar libros de la biblioteca.", isCorrect: false, rationale: "Limita la experimentación." }, { text: "No gastar dinero en fotocopias.", isCorrect: false, rationale: "Visión reduccionista de 'recursos'." }], pill: "Bioseguridad y Ética: Respeto por la vida y el entorno en cada experimento." },
  { id: 'mc_10', moduleId: 'mc', type: 'mc', category: 'Evaluación Integral', question: "Según el Art 30, la evaluación de la residencia incluye:", options: [{ text: "Vínculos personales establecidos en la práctica.", isCorrect: true, rationale: "La dimensión vincular es clave." }, { text: "Promedio académico histórico del residente.", isCorrect: false, rationale: "Se evalúa el desempeño actual." }, { text: "Cantidad de horas extras realizadas.", isCorrect: false, rationale: "Se evalúa calidad y cumplimiento del 100%." }], pill: "Evaluación Integral: Incluye la preparación, planificación, vínculos y responsabilidad." },

  // --- MÓDULO 2: ESTUDIOS DE CASO (5) ---
  { id: 'case_1', moduleId: 'case', type: 'case', category: 'Asistencia y Compromiso', question: "Un residente falta a la escuela asociada justificando un problema de transporte (logra 90% de asistencia en territorio). ¿Alcanza la regularidad?", options: [{ text: "Sí, supera el 75%.", isCorrect: false, rationale: "Confusión con normativa del IES." }, { text: "No, en la escuela asociada el requisito es 100%.", isCorrect: true, rationale: "Art 28: Asistencia 100% a tareas asignadas." }, { text: "Depende del director.", isCorrect: false, rationale: "La norma es jurisdiccional." }], pill: "Asistencia: 100% innegociable en el territorio." },
  { id: 'case_2', moduleId: 'case', type: 'case', category: 'Ética Profesional', question: "Frente a una pregunta difícil de un alumno, el residente se queda en blanco porque la planificación fue generada íntegramente por ChatGPT y no la estudió. ¿Qué criterio incumple gravemente?", options: [{ text: "Presentación personal.", isCorrect: false, rationale: "No tiene relación." }, { text: "Lectura, estudio permanente, conocimiento y fluidez del contenido.", isCorrect: true, rationale: "Delegar el pensamiento a la IA destruye la fluidez y dominio del tema." }, { text: "Puntualidad.", isCorrect: false, rationale: "Irrelevante aquí." }], pill: "Fluidez Conceptual: La IA no puede estudiar por vos. El dominio del aula requiere conocimiento interiorizado." },
  { id: 'case_3', moduleId: 'case', type: 'case', category: 'Evaluación Integral', question: "El residente cuestiona frente a los estudiantes las indicaciones de su Co-formador, generando un conflicto de convivencia. Consecuencia según Art 35:", options: [{ text: "Cambio de escuela.", isCorrect: false, rationale: "No se premia la mala convivencia." }, { text: "Suspensión o no aprobación de la práctica.", isCorrect: true, rationale: "Causal directa de suspensión." }, { text: "Llamado de atención verbal sin consecuencias académicas.", isCorrect: false, rationale: "Reglamento explícito sobre convivencia." }], pill: "Convivencia: El respeto a la jerarquía y al clima institucional es obligatorio." },
  { id: 'case_4', moduleId: 'case', type: 'case', category: 'Trabajo en Equipo', question: "Una pareja pedagógica presenta un borrador perfecto. En la clase, un miembro dicta conceptos errados mientras el otro observa. ¿A quién afecta la nota?", options: [{ text: "Solo al que habló.", isCorrect: false, rationale: "Ignora el concepto de pareja pedagógica." }, { text: "A ambos, son responsables de la ÚNICA práctica.", isCorrect: true, rationale: "Corresponsabilidad." }, { text: "Al co-formador.", isCorrect: false, rationale: "La ejecución es del residente." }], pill: "Pareja Pedagógica: Solidaridad y corresponsabilidad en el error y el éxito." },
  { id: 'case_5', moduleId: 'case', type: 'case', category: 'Anticipación Pedagógica', question: "Un residente planifica un TP de laboratorio sin verificar previamente si hay microscopios suficientes ni reactivos. Durante la clase, los alumnos no pueden trabajar. ¿Qué faltó?", options: [{ text: "Creatividad e innovación.", isCorrect: false, rationale: "La idea podía ser creativa, pero falló la logística." }, { text: "Capacidad de Anticipación Pedagógica-Disciplinar y previsión de obstáculos.", isCorrect: true, rationale: "Criterios del Especialista: se evalúa la previsión técnica y material." }, { text: "Uso de TICs.", isCorrect: false, rationale: "El problema es de recursos físicos." }], pill: "Anticipación: Prever materiales, tiempos y posibles fallas es profesionalismo." },

  // --- MÓDULO 3: SITUACIONES PROBLEMÁTICAS (5) ---
  { id: 'prob_1', moduleId: 'problem', type: 'problem', category: 'Anticipación Pedagógica', question: "Vas a dar la clase definitiva y descubrís que el proyector (clave para tu presentación) no funciona. ¿Qué deberías haber previsto?", options: [{ text: "Faltar ese día.", isCorrect: false, rationale: "Falta grave de responsabilidad." }, { text: "Llevar un 'Plan B' como indicador de Anticipación Pedagógica.", isCorrect: true, rationale: "El profesional prevé fallas técnicas." }, { text: "Pedir al co-formador que dicte su clase.", isCorrect: false, rationale: "Es tu responsabilidad resolverlo." }], pill: "Plan B: Las dificultades técnicas son obstáculos que la anticipación pedagógica debe cubrir." },
  { id: 'prob_2', moduleId: 'problem', type: 'problem', category: 'Normativa y Tiempos', question: "Entregaste el borrador de planificación 48hs antes porque usaste un generador de unidades didácticas con IA a último momento. Los docentes de práctica te desaprueban. ¿Por qué?", options: [{ text: "Por no entregar con 15 días de anticipación, violando la normativa.", isCorrect: true, rationale: "Incumplimiento de tiempo y forma." }, { text: "Por usar IA, que está prohibido por ley.", isCorrect: false, rationale: "No está prohibida por ley, pero el plagio sí se penaliza; aquí el error formal son los 15 días." }, { text: "Porque el borrador debía ser digital.", isCorrect: false, rationale: "La norma pide formato PAPEL." }], pill: "Tiempos: 15 días es innegociable para garantizar un acompañamiento real, no automatizado." },
  { id: 'prob_3', moduleId: 'problem', type: 'problem', category: 'Transposición Didáctica', question: "Durante un debate sobre evolución, los alumnos presentan fuertes concepciones religiosas (ideas previas). ¿Cómo debe actuar el especialista en Biología?", options: [{ text: "Ignorarlos y dictar la teoría.", isCorrect: false, rationale: "Antipedagógico." }, { text: "Integrar el pensamiento científico respetando creencias, previendo estos obstáculos desde la planificación.", isCorrect: true, rationale: "Alfabetización científica real." }, { text: "Darles la razón para evitar conflictos.", isCorrect: false, rationale: "Pérdida de rigurosidad científica." }], pill: "Obstáculos Epistemológicos: Prever ideas previas es clave en la enseñanza de las ciencias." },
  { id: 'prob_4', moduleId: 'problem', type: 'problem', category: 'Roles Institucionales', question: "Tu co-formador falta el día de tu práctica. ¿Podés quedarte a cargo del grupo solo?", options: [{ text: "Sí, sos casi docente.", isCorrect: false, rationale: "Ilegal." }, { text: "No, el Art 23 exige presencia de personal de la institución.", isCorrect: true, rationale: "Responsabilidad civil y normativa." }, { text: "Solo si te autoriza el centro de estudiantes.", isCorrect: false, rationale: "No tienen potestad legal." }], pill: "Responsabilidad Civil: El residente JAMÁS queda solo a cargo del grupo." },
  { id: 'prob_5', moduleId: 'problem', type: 'problem', category: 'Anticipación Pedagógica', question: "En tu planificación incluyes un trabajo de campo en el patio, pero llueve torrencialmente. ¿Qué evalúa tu profesor de práctica en este momento?", options: [{ text: "Tu habilidad para cancelar clases.", isCorrect: false, rationale: "No se debe cancelar." }, { text: "Tu capacidad de adaptación y previsión de obstáculos climáticos.", isCorrect: true, rationale: "El criterio exige previsión." }, { text: "Tu redacción escrita.", isCorrect: false, rationale: "Eso ya se evaluó en el borrador." }], pill: "Adaptabilidad: El diseño didáctico debe ser flexible ante imprevistos del entorno." },

  // --- MÓDULO 4: DESARROLLO (5) ---
  { id: 'open_1', moduleId: 'open', type: 'open', category: 'Ética Profesional', question: "Reflexiona: ¿Por qué basar tu planificación exclusivamente en IA generativa atenta contra el criterio de 'Conocimiento y Fluidez' exigido en la presentación áulica?", pill: "Respuesta esperada: Porque la IA redacta el documento, pero no el proceso cognitivo del practicante. Al no haber un proceso de diseño genuino, el residente carece de fluidez y anclaje mental para defender el contenido frente a dudas reales de los alumnos." },
  { id: 'open_2', moduleId: 'open', type: 'open', category: 'Transposición Didáctica', question: "Según los criterios del 'Especialista', ¿cómo lograrías en una clase de genética la 'Transposición Didáctica Específica' sin caer en la infantilización del contenido?", pill: "Respuesta esperada: Utilizando analogías precisas, casos clínicos reales adaptados al ciclo orientado o simuladores (TICs), manteniendo siempre la rigurosidad y el vocabulario científico apropiado al finalizar la transposición." },
  { id: 'open_3', moduleId: 'open', type: 'open', category: 'Asistencia y Compromiso', question: "Explica la importancia del artículo 32 (pérdida de regularidad por inasistencias) en relación a la unidad indisoluble entre el Taller en el IES y la escuela asociada.", pill: "Respuesta esperada: El Art. 32 protege la co-formación. Las horas en territorio sin el andamiaje teórico-reflexivo del IES pierden sentido pedagógico; ambas instancias son co-dependientes para acreditar la práctica." },
  { id: 'open_4', moduleId: 'open', type: 'open', category: 'Roles Institucionales', question: "Menciona al menos tres funciones obligatorias del Profesor Co-formador según el Art 24.", pill: "Respuesta esperada: 1) Orientar análisis de proyectos. 2) Promover autorreflexión del practicante. 3) Participar del proceso de evaluación. 4) Posibilitar relación con proyectos institucionales." },
  { id: 'open_5', moduleId: 'open', type: 'open', category: 'Evaluación Integral', question: "¿Por qué el Reglamento (Art. 35) tipifica como causal de suspensión 'generar conflictos de convivencia'? Relacionar con el 'Rol Docente'.", pill: "Respuesta esperada: El rol docente trasciende lo disciplinar; implica inserción institucional. Un practicante incapaz de convivir y consensuar con colegas (co-formador/directivos) carece de las competencias profesionales sociales básicas para el ejercicio." },

  // --- MÓDULO 5: RAZONAMIENTO (5) ---
  { id: 'reason_1', moduleId: 'reasoning', type: 'reasoning', category: 'Rigor Científico', question: "¿Por qué el 'Rigurosidad y Actualización Científica' impide la habilitación de una clase si hay errores conceptuales en el borrador?", options: [{ text: "Porque los alumnos de secundaria no merecen aprender ciencia.", isCorrect: false, rationale: "Totalmente lo opuesto." }, { text: "Porque consolidar un 'modelo caduco' o error conceptual en los alumnos es un daño pedagógico inaceptable para un especialista.", isCorrect: true, rationale: "Deducción lógica del rol del especialista." }, { text: "Porque el IES quiere desaprobar residentes.", isCorrect: false, rationale: "Prejuicio infundado." }], pill: "Deducción: El error conceptual en Biología genera un daño cognitivo a largo plazo (modelos erróneos)." },
  { id: 'reason_2', moduleId: 'reasoning', type: 'reasoning', category: 'Normativa y Tiempos', question: "Si la IA te arma una clase brillante sobre fotosíntesis en 5 minutos, ¿por qué los docentes insisten en los 15 días de anticipación para el borrador?", options: [{ text: "Porque el proceso de corrección interinstitucional e intra-pareja requiere diálogo, ajuste y maduración del proyecto situado.", isCorrect: true, rationale: "El aprendizaje está en el proceso de iteración, no en el pdf final." }, { text: "Por burocracia estatal.", isCorrect: false, rationale: "Ignora el sentido pedagógico." }, { text: "Para verificar si usaste IA.", isCorrect: false, rationale: "El foco no es policial, es de maduración pedagógica." }], pill: "Razonamiento: La planificación no es un producto para entregar, es un proceso para pensar. Los 15 días garantizan ese pensamiento." },
  { id: 'reason_3', moduleId: 'reasoning', type: 'reasoning', category: 'Trabajo en Equipo', question: "¿Por qué el trabajo se realiza OBLIGATORIAMENTE en Pareja Pedagógica (salvo grupos impares)?", options: [{ text: "Para ahorrar escuelas asociadas.", isCorrect: false, rationale: "Reduccionismo administrativo." }, { text: "Para que uno descanse mientras el otro trabaja.", isCorrect: false, rationale: "Violación de la ética de trabajo." }, { text: "Porque la co-construcción, el debate y el apoyo mutuo son competencias esenciales del trabajo docente contemporáneo.", isCorrect: true, rationale: "El trabajo en equipo es un criterio de evaluación explícito." }], pill: "Trabajo en Equipo: Competencia clave del rol docente del siglo XXI." },
  { id: 'reason_4', moduleId: 'reasoning', type: 'reasoning', category: 'Transposición Didáctica', question: "El decreto habla de 'Alfabetización Científica y Tecnológica'. ¿Por qué es un error lógico usar TICs solo para hacer un PowerPoint estático?", options: [{ text: "Porque el PowerPoint es muy aburrido.", isCorrect: false, rationale: "Argumento pobre." }, { text: "Porque alfabetizar científicamente con TICs implica usarlas para co-construir saberes (simuladores, modelización), no como mero pizarrón digital.", isCorrect: true, rationale: "La TIC debe estar al servicio del pensamiento científico." }, { text: "Porque está prohibido usar PowerPoint.", isCorrect: false, rationale: "Falso." }], pill: "TICs y Ciencia: La tecnología debe transformar la cognición (ej. simuladores), no solo adornar la exposición." },
  { id: 'reason_5', moduleId: 'reasoning', type: 'reasoning', category: 'Evaluación Integral', question: "Analiza: ¿Por qué la 'calificación final' es una SÍNTESIS y no un 'Promedio' matemático de la nota del equipo y la personal?", options: [{ text: "Porque el promedio matemático no capta dimensiones complejas como el compromiso, la fluidez y la convivencia adquiridas en el proceso.", isCorrect: true, rationale: "La evaluación es cualitativa y formativa." }, { text: "Porque las calculadoras no están permitidas.", isCorrect: false, rationale: "Absurdo." }, { text: "Para que el profesor de práctica decida arbitrariamente.", isCorrect: false, rationale: "La síntesis se basa en rúbricas y criterios explícitos." }], pill: "Evaluación Integral: La síntesis pedagógica valora procesos, evolución y competencias, no solo resultados numéricos." },

  // --- MÓDULO 6: INTERPRETACIÓN DE IMÁGENES (5) ---
  { id: 'img_1', moduleId: 'image', type: 'image_interpretation', category: 'Bioseguridad', imageUrl: 'https://i.postimg.cc/nzzf1YnW/1.png', prompt: "Imagen de laboratorio sin medidas de seguridad.", question: "¿Qué criterio fundamental de la Dimensión del Especialista se está violando flagrantemente en esta escena?", options: [{ text: "Manejo Ético y Responsable de Recursos (Bioseguridad).", isCorrect: true, rationale: "Ausencia total de cuidado de la integridad física." }, { text: "Transposición didáctica.", isCorrect: false, rationale: "El error es de seguridad, no de contenido." }, { text: "Puntualidad.", isCorrect: false, rationale: "No aplica a la imagen." }], pill: "Interpretación: La bioseguridad es el pilar cero de cualquier trabajo experimental." },
  { id: 'img_2', moduleId: 'image', type: 'image_interpretation', category: 'Ética Profesional', imageUrl: 'https://i.postimg.cc/d0GjSzVn/2.png', prompt: "Gráfico sobre automatización de tareas con IA y su impacto en la fluidez docente.", question: "Interpreta el gráfico: ¿Cuál es la conclusión pedagógica respecto al rol del residente?", options: [{ text: "La IA es inútil para planificar.", isCorrect: false, rationale: "La IA sirve, el problema es el copy-paste pasivo." }, { text: "La delegación total del diseño didáctico a la automatización atrofia la apropiación del contenido y la seguridad expositiva.", isCorrect: true, rationale: "Sin diseño genuino no hay anclaje cognitivo del tema." }, { text: "Los residentes necesitan mejores prompts.", isCorrect: false, rationale: "Evade la responsabilidad del estudio." }], pill: "Gráficos: A mayor delegación automática, menor dominio personal frente al grupo." },
  { id: 'img_3', moduleId: 'image', type: 'image_interpretation', category: 'Normativa y Tiempos', imageUrl: 'https://i.postimg.cc/7LPSmbj2/3.png', prompt: "Calendario de entregas del residente.", question: "Al observar este calendario, ¿qué consecuencia reglamentaria inminente recaerá sobre el residente?", options: [{ text: "Se suspende o extiende la práctica por incumplir el 100% de los trabajos en tiempo y forma (Artículos de Evaluación).", isCorrect: true, rationale: "El tiempo y forma son criterios excluyentes." }, { text: "Solo perderá 2 puntos de la nota final.", isCorrect: false, rationale: "No se maneja por puntos." }, { text: "Se aprueba si la clase es buena.", isCorrect: false, rationale: "El proceso previo es tan importante como la clase." }], pill: "Tiempos Institucionales: Las fechas de entrega construyen la responsabilidad del Rol Docente." },
  { id: 'img_4', moduleId: 'image', type: 'image_interpretation', category: 'Evaluación Integral', imageUrl: 'https://i.postimg.cc/sDFSbTbw/4.png', prompt: "Pareja pedagógica discutiendo frente a la clase.", question: "Bajo el Dcto 4200 y los Criterios del Taller, ¿cómo se encuadra esta escena?", options: [{ text: "Falta de fluidez oral.", isCorrect: false, rationale: "El problema es vincular/ético." }, { text: "Violación del criterio de 'Presencia y presentación adecuada' y 'Trabajo en equipo', constituyendo conflicto de convivencia (Art 35).", isCorrect: true, rationale: "Es una falta grave frente a los alumnos." }, { text: "Estrategia didáctica de debate.", isCorrect: false, rationale: "La hostilidad no es estrategia didáctica." }], pill: "Profesionalismo: Las tensiones de la pareja pedagógica jamás deben exhibirse frente a los alumnos." },
  { id: 'img_5', moduleId: 'image', type: 'image_interpretation', category: 'Roles Institucionales', imageUrl: 'https://i.postimg.cc/gkPXgnZp/5.png', prompt: "Esquema de actores interrelacionados.", question: "Según el organigrama del Art. 11, ¿qué representa este conjunto de actores interrelacionados?", options: [{ text: "Tribunal Disciplinario.", isCorrect: false, rationale: "Tienen un rol formativo, no punitivo." }, { text: "Equipo Formador de la Práctica Docente.", isCorrect: true, rationale: "La red que sostiene el campo de la práctica." }, { text: "Sindicato Docente.", isCorrect: false, rationale: "Absurdo." }], pill: "Esquemas Normativos: El residente no está solo, está inserto en una red de Co-formación." }
];

// --- COMPONENTES UI ANIMADOS ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-xl bg-white/80 border border-white/40 shadow-2xl rounded-3xl p-6 transition-all duration-500 animate-[flipIn_0.6s_ease-out] ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", disabled=false }) => {
  const baseStyle = "font-bold rounded-2xl p-4 w-full transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center overflow-hidden relative group";
  const variants = {
    primary: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_25px_rgba(16,185,129,0.4)]",
    secondary: "bg-white/50 text-slate-700 border-2 border-slate-200 hover:bg-white",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg",
    module: "bg-slate-800 text-white hover:bg-slate-700 shadow-md",
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {!disabled && variant !== 'secondary' && (
        <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-0"></span>
      )}
      <span className="relative z-10 flex items-center justify-center w-full">{children}</span>
    </button>
  );
};

// --- COMPONENTE FONDO ANIMADO "CICLOSIS" ---
// Recrea el efecto de las burbujas verdes sobre fondo oscuro
const CiclosisBackground = React.memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#022c22]">
    {/* Gradiente base para dar profundidad */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#022c22] to-black"></div>
    
    {/* Generar burbujas animadas (ciclosis) */}
    {Array.from({ length: 40 }).map((_, i) => {
      const size = Math.random() * 60 + 10;
      const left = Math.random() * 100;
      const moveX = (Math.random() * 40 - 20) + 'vw';
      const animationDuration = Math.random() * 15 + 10;
      const animationDelay = Math.random() * -20;
      
      return (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-500/30 blur-[2px] shadow-[0_0_25px_rgba(16,185,129,0.6)]"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            bottom: '-10%',
            '--move-x': moveX,
            animation: `ciclosis ${animationDuration}s linear ${animationDelay}s infinite`,
          }}
        ></div>
      );
    })}
  </div>
));

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [userAuth, setUserAuth] = useState(null);
  const [view, setView] = useState('home'); 
  const [studentName, setStudentName] = useState('');
  
  // Quiz Navigation State
  const [currentModule, setCurrentModule] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [openAnswerText, setOpenAnswerText] = useState('');
  
  // Teacher State
  const [teacherPass, setTeacherPass] = useState('');
  const [allResponses, setAllResponses] = useState([]);
  const [authError, setAuthError] = useState('');
  const [teacherTab, setTeacherTab] = useState('monitor'); // monitor, analysis, presentation
  
  // Teacher Guided Presentation State
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);

  // Reset reveal when guided question changes
  useEffect(() => {
    setShowCorrect(false);
  }, [guidedIndex]);

  // Firebase Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUserAuth);
    return () => unsubscribe();
  }, []);

  // Fetch Teacher Data
  useEffect(() => {
    if (!userAuth || !view.includes('teacher')) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'respuestas_practica_iv');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllResponses(data.sort((a,b) => b.timestamp - a.timestamp));
    }, (error) => console.error("Snapshot error:", error));
    return () => unsubscribe();
  }, [userAuth, view]);

  const moduleQuestions = currentModule ? quizData.filter(q => q.moduleId === currentModule) : [];

  // --- LÓGICA DE SINCRONIZACIÓN EN TIEMPO REAL (SILENCIOSA Y COMPLETA) ---
  const syncProgressRealTime = async (currentAnswers, overrideModule = currentModule, overrideIndex = currentQuestionIndex) => {
    if (!userAuth || !studentName.trim()) return;
    try {
      const studentId = studentName.toLowerCase().replace(/\s/g, '_');
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'respuestas_practica_iv', studentId);
      
      let score = 0; let totalScorable = 0;
      Object.values(currentAnswers).forEach(ans => {
        if (['mc', 'case', 'problem', 'reasoning', 'image_interpretation'].includes(ans.type)) {
          totalScorable++;
          if (ans.isCorrect) score++;
        }
      });

      const modQs = overrideModule ? quizData.filter(q => q.moduleId === overrideModule) : [];
      const activeQ = modQs[overrideIndex] || null;

      await setDoc(ref, {
        studentName,
        answers: currentAnswers,
        score,
        totalScorable,
        timestamp: Date.now(),
        lastActive: new Date().toISOString(),
        currentModuleId: overrideModule || 'home',
        currentQuestionIndex: overrideIndex,
        currentQuestionId: activeQ ? activeQ.id : null,
        currentQuestionText: activeQ ? activeQ.question : 'En el menú principal',
        currentCategory: activeQ ? activeQ.category : 'N/A'
      }, { merge: true });
    } catch (e) {
      console.error("Sync error", e);
    }
  };

  // --- SINCRONIZACIÓN DE TECLADO EN VIVO (Para Desarrollo) ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (view === 'student' && currentModule && openAnswerText !== undefined) {
        const q = moduleQuestions[currentQuestionIndex];
        if (q && q.type === 'open') {
          syncLiveTyping(openAnswerText, q.id);
        }
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timeoutId);
  }, [openAnswerText, currentQuestionIndex, view]);

  const syncLiveTyping = async (text, qId) => {
    if (!userAuth || !studentName.trim() || !currentModule) return;
    try {
      const studentId = studentName.toLowerCase().replace(/\s/g, '_');
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'respuestas_practica_iv', studentId);
      await setDoc(ref, {
        liveTyping: { questionId: qId, text: text },
        lastActive: new Date().toISOString()
      }, { merge: true });
    } catch(e) {}
  };

  // --- LÓGICA DEL ESTUDIANTE ---
  const handleStartModule = (moduleId) => {
    if (!studentName.trim()) return;
    setCurrentModule(moduleId);
    setCurrentQuestionIndex(0);
    setView('student');
    
    const modQId = quizData.find(q => q.moduleId === moduleId).id;
    setIsAnswered(answers[modQId] !== undefined);
    setOpenAnswerText(answers[modQId]?.text || '');
    
    syncProgressRealTime(answers, moduleId, 0);
  };

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    const q = moduleQuestions[currentQuestionIndex];
    const isCorrect = q.options[optionIndex].isCorrect;
    
    const newAnswers = { ...answers, [q.id]: { selected: optionIndex, isCorrect, type: q.type } };
    setAnswers(newAnswers);
    setIsAnswered(true);
    syncProgressRealTime(newAnswers, currentModule, currentQuestionIndex);
  };

  const handleOpenSubmit = () => {
    if (!openAnswerText.trim() || isAnswered) return;
    const q = moduleQuestions[currentQuestionIndex];
    
    const newAnswers = { ...answers, [q.id]: { text: openAnswerText, type: q.type, isCorrect: true } };
    setAnswers(newAnswers);
    setIsAnswered(true);
    syncProgressRealTime(newAnswers, currentModule, currentQuestionIndex);
  };

  const handleNext = () => {
    if (currentQuestionIndex < moduleQuestions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const nextQId = moduleQuestions[nextIdx].id;
      setIsAnswered(answers[nextQId] !== undefined);
      setOpenAnswerText(answers[nextQId]?.text || '');
      syncProgressRealTime(answers, currentModule, nextIdx);
    } else {
      setView('home'); 
      syncProgressRealTime(answers, 'home', 0);
    }
  };

  const handleFinalSubmit = () => {
      setView('results');
  };

  const calculateScore = (ansObj) => {
    let s = 0, t = 0;
    Object.values(ansObj).forEach(ans => {
       if (['mc', 'case', 'problem', 'reasoning', 'image_interpretation'].includes(ans.type)) {
         t++;
         if (ans.isCorrect) s++;
       }
    });
    return { score: s, total: t };
  };

  // --- RENDERIZADO DE VISTAS ---

  const renderHome = () => {
    const modules = [
      { id: 'mc', title: 'Múltiple Choice', icon: <List className="text-blue-500"/>, count: 10 },
      { id: 'case', title: 'Estudios de Caso', icon: <Briefcase className="text-emerald-500"/>, count: 5 },
      { id: 'problem', title: 'Problemas Áulicos', icon: <AlertTriangle className="text-amber-500"/>, count: 5 },
      { id: 'open', title: 'Desarrollo Práctico', icon: <Edit3 className="text-purple-500"/>, count: 5 },
      { id: 'reasoning', title: 'Razonamiento', icon: <Brain className="text-rose-500"/>, count: 5 },
      { id: 'image', title: 'Interpretación Visual', icon: <ImageIcon className="text-teal-500"/>, count: 5 },
    ];

    const getProgress = (modId) => {
      const modQs = quizData.filter(q => q.moduleId === modId);
      const answered = modQs.filter(q => answers[q.id] !== undefined).length;
      return { answered, total: modQs.length, isComplete: answered === modQs.length };
    };

    const totalAnswered = Object.keys(answers).length;
    const isReadyToSubmit = totalAnswered > 0;

    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden pb-24">
        
        {/* VIBRANT BACKGROUND ELEMENTS - SOLO PARA HOME */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-[1200px] h-full min-h-[800px]">
            <svg className="absolute top-[10%] left-[-5%] md:left-[10%] w-80 h-80 text-purple-600 opacity-90 animate-[float-slow_8s_ease-in-out_infinite] drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor"><path d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.3,-40.5C85.5,-25.7,91.8,-10.1,88.9,4.2C85.9,18.5,73.8,31.4,62.1,43C50.3,54.6,38.9,64.8,25.3,70.9C11.7,77,-4.1,78.9,-19.6,76.5C-35.1,74,-50.2,67.1,-61.8,55.9C-73.4,44.7,-81.4,29.1,-84.9,12.3C-88.4,-4.5,-87.3,-22.6,-79.3,-37.4C-71.3,-52.2,-56.3,-63.8,-41.4,-70.2C-26.5,-76.7,-11.6,-78.1,2.5,-81.1C16.6,-84.2,32.5,-83.4,45.7,-76.4Z" transform="translate(100 100)" /></svg>
            <svg className="absolute bottom-[10%] right-[-10%] md:right-[5%] w-96 h-96 text-teal-400 opacity-90 animate-[float-fast_7s_ease-in-out_infinite] drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor"><path d="M42.7,-73.4C56.3,-66.5,69,-56.1,77.6,-42.6C86.2,-29.1,90.6,-12.4,87.6,3C84.5,18.5,73.9,32.7,62.2,44.1C50.5,55.5,37.8,64,23.3,70.5C8.8,77,-7.4,81.4,-21.9,78.5C-36.4,75.6,-49.2,65.4,-60.1,53.4C-71.1,41.4,-80.2,27.5,-84.1,11.8C-88,-3.9,-86.6,-21.4,-78.5,-35.5C-70.5,-49.6,-55.8,-60.3,-41.2,-67C-26.6,-73.7,-12.1,-76.4,2.1,-79C16.2,-81.6,32.5,-83.9,42.7,-73.4Z" transform="translate(100 100)" /></svg>
            <svg className="absolute bottom-[-5%] left-[15%] md:left-[30%] w-72 h-72 text-yellow-400 opacity-90 animate-[float-medium_9s_ease-in-out_infinite] drop-shadow-2xl" viewBox="0 0 200 200" fill="currentColor"><path d="M51.9,-73.1C65.5,-63.3,73.7,-46.5,79.5,-29.1C85.3,-11.7,88.7,6.3,83.9,22.2C79.1,38.1,66.1,51.9,51.1,62.2C36.1,72.5,19,79.3,1.6,77.1C-15.8,74.9,-31.6,63.7,-45.5,52.1C-59.4,40.5,-71.4,28.5,-77.8,13.4C-84.2,-1.7,-85,-19.9,-77.7,-34.5C-70.4,-49.1,-55,-60.1,-40.1,-69.5C-25.2,-78.9,-12.6,-86.7,2.2,-89.7C17,-92.7,34,-90.9,51.9,-73.1Z" transform="translate(100 100)" /></svg>
            <div className="absolute top-[30%] left-[5%] w-24 h-24 bg-orange-500 rounded-xl rotate-[30deg] animate-[float-medium_6s_ease-in-out_infinite] shadow-2xl border-b-8 border-orange-700"></div>
            <div className="absolute top-[15%] right-[25%] w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-teal-500 transform -rotate-12 animate-[float-fast_5s_ease-in-out_infinite] drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)]"></div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL - HUB */}
        <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 mt-8">
          
          <GlassCard className="text-center bg-white/85 backdrop-blur-2xl border-white shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4">
              <img src="https://i.postimg.cc/Xv7F6jCH/Screenshot_2026_02_28_201243.png" alt="Logo" className="animated-logo w-full h-full object-contain drop-shadow-2xl"/>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Práctica Docente IV</h1>
            <p className="text-slate-500 font-medium mt-2 text-lg">El rol docente y su práctica</p>
            
            <div className="mt-6 max-w-md mx-auto">
              <input 
                type="text" 
                placeholder="Ingresa tu Nombre Completo para iniciar" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg transition-all text-center"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
          </GlassCard>

          {/* GRID DE MÓDULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const { answered, total, isComplete } = getProgress(mod.id);
              const disabled = !studentName.trim();
              
              return (
                <button 
                  key={mod.id} 
                  disabled={disabled}
                  onClick={() => handleStartModule(mod.id)}
                  className={`text-left transition-all duration-300 transform active:scale-95 rounded-3xl p-6 relative overflow-hidden group ${
                    disabled ? 'bg-white/40 cursor-not-allowed opacity-50' : 
                    isComplete ? 'bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-300 shadow-lg' : 
                    'bg-white/90 hover:bg-white border border-white shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {isComplete && <div className="absolute top-4 right-4 animate-[flipIn_0.5s_ease-out]"><CheckCircle className="text-emerald-500" size={24}/></div>}
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-sm mb-4">
                    {mod.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{mod.title}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-semibold text-slate-500">{answered} / {total} Completadas</span>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{width: `${(answered/total)*100}%`}}></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* BOTÓN FINALIZAR */}
          <div className="flex justify-center mt-8 pb-10">
            <Button 
              onClick={handleFinalSubmit} 
              disabled={!isReadyToSubmit} 
              className={`max-w-md py-5 text-lg ${isReadyToSubmit ? 'animate-[pulse_2s_infinite]' : 'opacity-50'}`}
            >
              <CheckSquare className="mr-2"/> Enviar Evaluación ({totalAnswered}/35)
            </Button>
          </div>

        </div>
      </div>
    );
  };

  const renderStudentQuiz = () => {
    const q = moduleQuestions[currentQuestionIndex];
    if (!q) return null;
    const currentAnswer = answers[q.id];

    return (
      <div className="flex flex-col items-center py-12 px-4 min-h-screen relative z-10 pb-32">
        <div className="w-full max-w-2xl flex justify-between items-center mb-8 px-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white">
           <span className="text-emerald-700 font-bold flex items-center">
             <BookOpen size={20} className="mr-2"/> {q.category}
           </span>
           <span className="text-slate-500 font-bold bg-white px-4 py-1 rounded-full shadow-sm">
             Pregunta {currentQuestionIndex + 1} de {moduleQuestions.length}
           </span>
        </div>

        <GlassCard className="max-w-2xl w-full space-y-8 bg-white/95 border-t-4 border-t-emerald-400">
          
          <div className="space-y-4">
            {q.type === 'image_interpretation' && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center relative overflow-hidden group flex flex-col items-center justify-center shadow-inner min-h-[150px]">
                 <span className="absolute top-3 right-3 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest z-20 shadow-md">Análisis Visual</span>
                 
                 {q.imageUrl ? (
                   <div className="relative z-10 w-full flex justify-center mt-6 mb-2">
                     <img src={q.imageUrl} alt={q.prompt} className="max-h-[350px] object-contain rounded-xl shadow-lg border border-slate-200 transition-transform duration-500 hover:scale-[1.02]" />
                   </div>
                 ) : (
                   <div className="py-8">
                     <ImageIcon className="mx-auto text-slate-400 mb-3 relative z-10" size={48}/>
                     <p className="text-slate-600 font-medium italic relative z-10 px-4 max-w-lg mx-auto">"{q.prompt}"</p>
                   </div>
                 )}
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed pl-2 border-l-4 border-emerald-500">
              {q.question}
            </h2>
          </div>

          <div className="space-y-3">
            {q.type !== 'open' ? (
              q.options.map((opt, idx) => {
                let btnStyle = "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200";
                if (isAnswered) {
                  if (opt.isCorrect) btnStyle = "bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-200 shadow-md transform scale-[1.02] z-10 relative";
                  else if (currentAnswer?.selected === idx) btnStyle = "bg-rose-100 text-rose-800 border-rose-400";
                  else btnStyle = "bg-slate-50 opacity-40";
                }
                return (
                  <button key={idx} disabled={isAnswered} onClick={() => handleOptionSelect(idx)} className={`w-full text-left p-5 rounded-2xl transition-all duration-300 shadow-sm ${btnStyle}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-[15px]">{opt.text}</span>
                      {isAnswered && opt.isCorrect && <CheckCircle className="text-emerald-600 shrink-0 ml-3" size={24}/>}
                      {isAnswered && currentAnswer?.selected === idx && !opt.isCorrect && <XCircle className="text-rose-600 shrink-0 ml-3" size={24}/>}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="space-y-4">
                <textarea 
                  className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 min-h-[180px] focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none resize-none transition-all text-slate-700 font-medium shadow-inner"
                  placeholder="Redacta tu análisis profesional aquí (argumentando bajo la normativa)..."
                  value={openAnswerText}
                  onChange={(e) => setOpenAnswerText(e.target.value)}
                  disabled={isAnswered}
                />
                {!isAnswered && <Button onClick={handleOpenSubmit} disabled={!openAnswerText.trim()} className="w-full">Guardar Respuesta de Desarrollo</Button>}
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {isAnswered && (
            <div className="mt-8 animate-[flipIn_0.5s_ease-out] border-t border-slate-100 pt-6">
              {q.type !== 'open' && (
                <div className={`p-4 rounded-2xl mb-4 ${currentAnswer.isCorrect ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200'}`}>
                  <p className={`font-bold flex items-center ${currentAnswer.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {currentAnswer.isCorrect ? <CheckCircle className="mr-2" size={18}/> : <XCircle className="mr-2" size={18}/>}
                    {currentAnswer.isCorrect ? 'Análisis Correcto' : 'Error Normativo/Conceptual'}
                  </p>
                  <p className="text-slate-700 mt-2 text-sm leading-relaxed font-medium">{q.options[currentAnswer.selected].rationale}</p>
                </div>
              )}
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <h4 className="text-indigo-800 font-bold flex items-center text-sm uppercase tracking-wider mb-2">
                  <Info size={18} className="mr-2 text-indigo-500" /> Píldora de Aprendizaje
                </h4>
                <p className="text-indigo-900 font-medium text-[15px] leading-relaxed">{q.pill}</p>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleNext} className="w-auto px-10 flex items-center text-lg">
                  {currentQuestionIndex === moduleQuestions.length - 1 ? 'Volver al Menú Principal' : 'Siguiente Pregunta'} <ChevronRight className="ml-2" size={24}/>
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    );
  };

  const renderResults = () => {
    const { score, total } = calculateScore(answers);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in zoom-in-95 duration-700 relative z-10">
        <GlassCard className="max-w-lg w-full text-center space-y-8 bg-white/95 border border-slate-200 relative overflow-hidden">
          
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner relative z-10">
             <CheckSquare size={48} className="text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 relative z-10">Evaluación Registrada</h2>
          <p className="text-slate-500 text-lg relative z-10">Residente: <span className="font-bold text-slate-800">{studentName}</span></p>
          
          <div className="relative w-48 h-48 mx-auto z-10">
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-xl">
              <path className="text-slate-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`${percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'} stroke-current`} strokeWidth="3" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{transition: 'stroke-dasharray 2s ease-out'}} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-slate-700">{percentage}%</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Precisión General</span>
            </div>
          </div>

          <p className="text-slate-700 font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 relative z-10 shadow-sm">
            {percentage >= 75 
              ? "Excelente dominio del Reglamento 4200 y los Criterios de Evaluación." 
              : "Se sugiere repasar el marco normativo y los criterios de la Dimensión del Especialista."}
            <br/><br/>
            <span className="text-sm text-slate-500 italic">Las preguntas de desarrollo han sido enviadas al Panel Docente para su corrección cualitativa.</span>
          </p>

          <Button onClick={() => window.location.reload()} variant="secondary" className="border-slate-300 relative z-10">Cerrar Sesión</Button>
        </GlassCard>
      </div>
    );
  };

  const renderTeacherLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in relative z-10">
      <GlassCard className="max-w-sm w-full space-y-6 text-center bg-white/95 border-transparent">
        <div className="bg-indigo-100 text-indigo-700 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-2">
          <Lock size={36} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Acceso Docente</h2>
        <p className="text-slate-500 text-sm font-medium">Panel de control en tiempo real</p>
        
        {authError && <p className="text-rose-500 text-sm font-bold bg-rose-50 p-2 rounded-lg">{authError}</p>}
        
        <input 
          type="password" 
          placeholder="Contraseña de acceso" 
          className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg font-mono tracking-widest shadow-inner"
          value={teacherPass}
          onChange={(e) => setTeacherPass(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter') { if(teacherPass === 'lolo') { setView('teacher_dashboard'); setAuthError(''); } else setAuthError('Contraseña incorrecta'); } }}
        />
        <Button onClick={() => {
          if(teacherPass === 'lolo') { setView('teacher_dashboard'); setAuthError(''); } 
          else setAuthError('Contraseña incorrecta');
        }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30">
          Verificar Identidad
        </Button>
      </GlassCard>
    </div>
  );

  const renderTeacherDashboard = () => {
    const totalEstudiantes = allResponses.length;
    let sumaPorcentajes = 0;
    
    // Calcula debilidades (Análisis Pedagógico)
    const categoryStats = {};
    const chartData = allResponses.map(r => {
      let rScore = 0; let rTotal = 0;
      Object.entries(r.answers).forEach(([qId, ans]) => {
         if (!['mc', 'case', 'problem', 'reasoning', 'image_interpretation'].includes(ans.type)) return;
         rTotal++;
         if (ans.isCorrect) rScore++;
         
         const q = quizData.find(x => x.id === qId);
         if (q) {
           if (!categoryStats[q.category]) categoryStats[q.category] = { correct: 0, total: 0 };
           categoryStats[q.category].total++;
           if (ans.isCorrect) categoryStats[q.category].correct++;
         }
      });
      const perc = rTotal > 0 ? Math.round((rScore / rTotal) * 100) : 0;
      sumaPorcentajes += perc;
      return { ...r, perc, answeredCount: Object.keys(r.answers).length };
    });

    const promedio = totalEstudiantes > 0 ? Math.round(sumaPorcentajes / totalEstudiantes) : 0;
    
    // Sort categories by lowest performance
    const sortedCategories = Object.keys(categoryStats).map(cat => ({
      name: cat,
      perc: Math.round((categoryStats[cat].correct / categoryStats[cat].total) * 100)
    })).sort((a,b) => a.perc - b.perc);

    const weakestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

    if (teacherTab === 'presentation') {
      return (
        <div className="min-h-screen bg-slate-900/90 backdrop-blur-md text-white p-8 flex flex-col items-center justify-center animate-in zoom-in duration-700 relative overflow-hidden z-10">
          <button onClick={() => setTeacherTab('monitor')} className="absolute top-8 right-8 text-slate-400 hover:text-white flex items-center bg-slate-800 px-4 py-2 rounded-xl z-20 transition-colors">
            Cerrar Presentación <XCircle className="ml-2" size={20}/>
          </button>

          <GlassCard className="max-w-4xl w-full bg-slate-800/80 border-slate-600 text-center p-12 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-[flipIn_1s_ease-out]">
            <Sparkles className="mx-auto text-indigo-400 mb-6" size={60}/>
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
              Evaluación General de la Residencia
            </h1>
            <p className="text-xl text-slate-300 mb-12">Análisis de {totalEstudiantes} estudiantes en tiempo real</p>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-slate-700/50 p-8 rounded-3xl border border-slate-600">
                <p className="text-lg text-slate-400 uppercase tracking-widest font-bold mb-2">Promedio General</p>
                <p className="text-7xl font-extrabold text-emerald-400">{promedio}%</p>
              </div>
              <div className="bg-slate-700/50 p-8 rounded-3xl border border-slate-600 flex flex-col justify-center">
                <p className="text-lg text-slate-400 uppercase tracking-widest font-bold mb-4">Foco de Mejora (Clase)</p>
                {weakestCategory ? (
                  <div>
                    <span className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-2xl font-bold shadow-lg">{weakestCategory.name}</span>
                    <p className="text-slate-300 mt-4 text-sm">Rendimiento global: {weakestCategory.perc}%</p>
                  </div>
                ) : <p className="text-slate-500">Recopilando datos...</p>}
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-4 pb-32 md:p-8 animate-in fade-in relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* HEADER DEL PANEL DOCENTE */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white/95 p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
               <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/30"><MonitorPlay size={28}/></div>
               <div>
                 <h1 className="text-2xl font-extrabold text-slate-800">Centro de Comando (En Vivo)</h1>
                 <p className="text-slate-500 font-medium text-sm">Guía cada actividad y visualiza el proceso cognitivo de los residentes</p>
               </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => {setTeacherTab('monitor'); setIsGuidedMode(false);}} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${teacherTab === 'monitor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Activity className="inline mr-1" size={16}/>Monitor Activo</button>
              <button onClick={() => {setTeacherTab('analysis'); setIsGuidedMode(false);}} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${teacherTab === 'analysis' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp className="inline mr-1" size={16}/>Análisis</button>
              <button onClick={() => {setTeacherTab('presentation'); setIsGuidedMode(false);}} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all text-emerald-600 hover:bg-emerald-50`}><Projector className="inline mr-1" size={16}/> Proyectar</button>
            </div>
          </div>

          {teacherTab === 'monitor' && (
            <div>
              {!isGuidedMode ? (
                // --- VISTA MONITOREO GENERAL ---
                <div className="animate-[flipIn_0.4s_ease-out]">
                   <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white/95 p-4 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center mb-4 sm:mb-0"><List className="mr-3 text-emerald-500"/> Avance en Vivo (Estudiantes)</h3>
                      <Button onClick={() => setIsGuidedMode(true)} className="w-auto px-6 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_5px_15px_rgba(16,185,129,0.3)]">
                        <Presentation className="mr-2" size={18}/> Iniciar Presentación Guiada
                      </Button>
                   </div>

                   <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                     {allResponses.length === 0 && <div className="col-span-full text-center py-12"><GlassCard className="inline-block bg-white/90 text-slate-500 font-medium text-lg">Esperando conexión de residentes...</GlassCard></div>}
                     
                     {chartData.map((res, i) => {
                        const isActive = (new Date() - new Date(res.lastActive)) < 60000; // Activo si movió algo en el último minuto
                        const isHome = res.currentModuleId === 'home' || !res.currentModuleId;
                        const activeAnswer = res.answers?.[res.currentQuestionId];
                        const isTyping = res.liveTyping?.questionId === res.currentQuestionId && res.liveTyping?.text;

                        return (
                          <GlassCard key={i} className="bg-white/95 border-t-4 border-t-emerald-500 relative overflow-hidden group !p-5">
                             <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent skew-x-12 z-0 pointer-events-none"></span>

                             <div className="relative z-10 flex flex-col h-full">
                               <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                                  <div>
                                    <h4 className="font-extrabold text-lg text-slate-800">{res.studentName}</h4>
                                    <div className="flex items-center mt-1">
                                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                      <span className="text-xs text-slate-500 font-bold uppercase">{isActive ? 'En línea' : 'Ausente'}</span>
                                    </div>
                                  </div>
                                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-center shadow-inner">
                                    <span className="block text-xl font-black">{res.answeredCount}/35</span>
                                    <span className="block text-[10px] font-bold uppercase">Progreso</span>
                                  </div>
                               </div>

                               {isHome ? (
                                 <div className="py-8 text-center text-slate-400 italic font-medium flex-grow flex flex-col items-center justify-center">
                                   <Home className="mx-auto mb-2 opacity-50" size={32}/>
                                   En el Menú Principal
                                 </div>
                               ) : (
                                 <div className="space-y-3 flex-grow flex flex-col">
                                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-grow">
                                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{res.currentCategory} (Q{res.currentQuestionIndex + 1})</span>
                                     <p className="text-sm font-semibold text-slate-700 mt-1 line-clamp-3">"{res.currentQuestionText}"</p>
                                   </div>

                                   <div className="bg-slate-800 text-white p-4 rounded-xl shadow-inner relative">
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest absolute top-2 left-3">Actividad en vivo</span>
                                      <div className="mt-4 text-sm font-medium">
                                        {activeAnswer ? (
                                          activeAnswer.type === 'open' ? (
                                             <div className="flex items-start"><CheckCircle className="text-emerald-400 mr-2 mt-0.5 shrink-0" size={16}/><span className="text-emerald-50 line-clamp-4">Enviado: "{activeAnswer.text}"</span></div>
                                          ) : (
                                             <div className="flex items-center"><CheckCircle className="text-emerald-400 mr-2 shrink-0" size={16}/><span className={activeAnswer.isCorrect ? 'text-emerald-300' : 'text-rose-400'}>Opción {activeAnswer.isCorrect ? 'Correcta' : 'Incorrecta'} seleccionada</span></div>
                                          )
                                        ) : isTyping ? (
                                          <div className="flex items-start"><Edit3 className="text-emerald-300 mr-2 mt-0.5 shrink-0 animate-pulse" size={16}/><span className="text-emerald-100 line-clamp-4 italic">"{res.liveTyping.text}"</span></div>
                                        ) : (
                                          <div className="flex items-center text-slate-400"><Eye className="mr-2 animate-pulse" size={16}/> Analizando opciones...</div>
                                        )}
                                      </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                          </GlassCard>
                        );
                     })}
                   </div>
                </div>
              ) : (
                // --- VISTA PRESENTACIÓN GUIADA (PREGUNTA POR PREGUNTA) ---
                <div className="animate-[flipIn_0.4s_ease-out] relative bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100 min-h-[700px] border border-slate-700">
                   <div className="relative z-10">
                     {/* Control Bar */}
                     <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 backdrop-blur-md">
                        <button onClick={() => setIsGuidedMode(false)} className="text-slate-300 hover:text-white flex items-center font-bold mb-4 sm:mb-0 transition-colors">
                          <ChevronLeft className="mr-1"/> Volver al Monitor
                        </button>
                        <div className="flex items-center space-x-6">
                           <button onClick={() => setGuidedIndex(i => Math.max(0, i - 1))} disabled={guidedIndex === 0} className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-full disabled:opacity-30 transition-colors text-white shadow-md">
                             <ChevronLeft size={24}/>
                           </button>
                           <div className="text-center">
                             <span className="block text-xl font-extrabold text-white">Pregunta {guidedIndex + 1} <span className="text-slate-400 text-base font-medium">de {quizData.length}</span></span>
                             <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{quizData[guidedIndex].category}</span>
                           </div>
                           <button onClick={() => setGuidedIndex(i => Math.min(quizData.length - 1, i + 1))} disabled={guidedIndex === quizData.length - 1} className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-full disabled:opacity-30 transition-colors text-white shadow-md">
                             <ChevronRight size={24}/>
                           </button>
                        </div>
                     </div>

                     {/* Current Question Display */}
                     <div key={guidedIndex} className="animate-[flipIn_0.6s_ease-out]">
                       <h2 className="text-2xl md:text-3xl font-bold leading-relaxed border-l-4 border-emerald-500 pl-4 mb-8 text-white shadow-sm">
                         {quizData[guidedIndex].question}
                       </h2>

                       {quizData[guidedIndex].imageUrl && (
                         <div className="flex justify-center mb-8">
                           <img src={quizData[guidedIndex].imageUrl} alt="Referencia" className="max-h-[300px] rounded-xl border border-slate-600 shadow-2xl"/>
                         </div>
                       )}

                       {/* Live Answers Grid */}
                       <div className="mt-6">
                         {quizData[guidedIndex].type === 'open' ? (
                           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {allResponses.map((res, idx) => {
                                const ans = res.answers?.[quizData[guidedIndex].id];
                                const isTypingHere = res.liveTyping?.questionId === quizData[guidedIndex].id && res.liveTyping?.text;
                                if (!ans && !isTypingHere) return null;

                                return (
                                  <div key={idx} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-inner">
                                     <p className="font-bold text-emerald-300 mb-2 flex items-center"><User size={16} className="mr-2"/>{res.studentName}</p>
                                     {ans ? (
                                       <p className="text-sm text-slate-200 italic">"{ans.text}"</p>
                                     ) : (
                                       <p className="text-sm text-emerald-200 italic animate-pulse">Escribiendo... "{res.liveTyping.text}"</p>
                                     )}
                                  </div>
                                );
                              })}
                           </div>
                         ) : (
                           <div className="space-y-4">
                             {quizData[guidedIndex].options.map((opt, optIdx) => {
                               const studentsWhoPickedThis = allResponses.filter(r => r.answers?.[quizData[guidedIndex].id]?.selected === optIdx);
                               
                               let optionStyle = "bg-slate-800 border-slate-700";
                               if (showCorrect) {
                                  optionStyle = opt.isCorrect ? "bg-emerald-900/80 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] relative overflow-hidden" : "bg-rose-900/30 border-rose-800/50 opacity-40";
                               }

                               return (
                                 <div key={optIdx} className={`p-5 rounded-2xl border-2 transition-all duration-500 ${optionStyle}`}>
                                    {showCorrect && opt.isCorrect && <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></span>}
                                    
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center">
                                      <span className="font-medium text-lg text-white mb-3 md:mb-0 pr-4">{opt.text}</span>
                                      
                                      {/* Avatars of students */}
                                      <div className="flex flex-wrap gap-2 justify-end">
                                        {studentsWhoPickedThis.map((s, sIdx) => (
                                          <span key={sIdx} className="bg-emerald-900/50 text-xs font-bold px-2 py-1 rounded-md text-emerald-100 border border-emerald-700/50 shadow-sm" title={s.studentName}>
                                            {s.studentName.split(' ')[0]} {/* Muestra solo el primer nombre */}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {showCorrect && opt.isCorrect && (
                                       <div className="relative z-10 mt-4 pt-4 border-t border-emerald-700/50">
                                         <p className="text-emerald-300 text-sm italic font-medium">{opt.rationale}</p>
                                       </div>
                                    )}
                                 </div>
                               );
                             })}
                           </div>
                         )}
                       </div>

                       {/* Reveal Correct Answer Action */}
                       {quizData[guidedIndex].type !== 'open' && (
                         <div className="mt-8 flex justify-center">
                           <Button onClick={() => setShowCorrect(!showCorrect)} className={`max-w-xs ${showCorrect ? 'bg-slate-700 text-white shadow-none' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_5px_15px_rgba(16,185,129,0.4)]'}`}>
                              {showCorrect ? <Eye className="mr-2"/> : <CheckSquare className="mr-2"/>}
                              {showCorrect ? 'Ocultar Corrección' : 'Revelar Opción Correcta'}
                           </Button>
                         </div>
                       )}
                       
                       {showCorrect && quizData[guidedIndex].pill && (
                         <div className="mt-6 bg-slate-800/80 border border-emerald-500/50 p-5 rounded-2xl text-center animate-[flipIn_0.5s_ease-out] shadow-inner">
                            <p className="text-emerald-300 font-bold"><Info className="inline mr-2 mb-1" size={18}/> Píldora Teórica: {quizData[guidedIndex].pill}</p>
                         </div>
                       )}

                     </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {teacherTab === 'analysis' && (
            <div className="animate-[flipIn_0.4s_ease-out]">
              <GlassCard className="bg-white/95 border-slate-200">
                 <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center border-b pb-4"><TrendingUp className="mr-3 text-emerald-500"/> Análisis para Mejora Continua</h3>
                 
                 <div className="grid md:grid-cols-2 gap-8">
                   <div>
                     <p className="text-slate-600 mb-4 font-medium">Basado en el rendimiento de los {totalEstudiantes} residentes evaluados, este es el diagnóstico por categorías del Dcto 4200 y Criterios:</p>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {sortedCategories.map((cat, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-slate-700">{cat.name}</span>
                            <span className={`px-3 py-1 rounded-md font-extrabold text-sm ${cat.perc >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {cat.perc}% Aciertos
                            </span>
                          </div>
                        ))}
                     </div>
                   </div>

                   <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100 shadow-inner">
                     <h4 className="font-extrabold text-emerald-800 mb-4 flex items-center"><Brain className="mr-2"/> Sugerencia del Arquitecto Pedagógico</h4>
                     {weakestCategory ? (
                       <div className="space-y-4 text-emerald-900 leading-relaxed font-medium">
                         <p>El área con mayor dificultad en la cohorte actual es <strong>"{weakestCategory.name}" ({weakestCategory.perc}% de precisión)</strong>.</p>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                            <strong>Acción recomendada para el resto del año:</strong>
                            <p className="mt-2 text-sm text-slate-600">Planificar un taller de refuerzo específico o simulaciones de casos centrados en {weakestCategory.name.toLowerCase()}. Esto reducirá incidentes durante las residencias y mejorará la calificación de Síntesis Final.</p>
                         </div>
                       </div>
                     ) : <p className="text-slate-500">Recopilando datos para el análisis...</p>}
                   </div>
                 </div>
              </GlassCard>
            </div>
          )}
          
        </div>
      </div>
    );
  };

  // --- FLOATING MENU (DOCK ESTILO MAC) ---
  const FloatingMenu = () => {
    const modules = [
      { id: 'mc', icon: <List size={22} />, title: 'Múltiple Choice', color: 'text-blue-400' },
      { id: 'case', icon: <Briefcase size={22} />, title: 'Casos', color: 'text-emerald-400' },
      { id: 'problem', icon: <AlertTriangle size={22} />, title: 'Problemas', color: 'text-amber-400' },
      { id: 'open', icon: <Edit3 size={22} />, title: 'Desarrollo', color: 'text-purple-400' },
      { id: 'reasoning', icon: <Brain size={22} />, title: 'Razonamiento', color: 'text-rose-400' },
      { id: 'image', icon: <ImageIcon size={22} />, title: 'Imágenes', color: 'text-teal-400' },
    ];

    if (view === 'teacher_dashboard' && teacherTab === 'presentation') return null;

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-1 sm:space-x-3 bg-slate-900/80 backdrop-blur-xl p-3 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/20 animate-in slide-in-from-bottom-10 overflow-x-auto max-w-[95vw]">
        
        <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all duration-300 ${view === 'home' ? 'bg-white/20 scale-110 shadow-inner' : 'hover:bg-white/10 text-slate-300'}`} title="Panel Central">
          <Home size={24} className="text-white" />
        </button>
        
        <div className="w-px h-8 bg-white/20 mx-2"></div>

        {modules.map(mod => (
          <button 
            key={mod.id}
            onClick={() => handleStartModule(mod.id)} 
            className={`p-3 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center min-w-[50px]
              ${(view === 'student' && currentModule === mod.id) ? 'bg-white/20 scale-110 shadow-inner' : 'hover:bg-white/10 text-slate-400'}`}
            title={mod.title}
          >
            <span className={(view === 'student' && currentModule === mod.id) ? 'text-white' : mod.color}>{mod.icon}</span>
          </button>
        ))}

        <div className="w-px h-8 bg-white/20 mx-2"></div>

        <button onClick={() => setView('teacher')} className={`p-3 rounded-2xl transition-all duration-300 ${view.includes('teacher') ? 'bg-emerald-500/50 scale-110 shadow-inner' : 'hover:bg-white/10 text-slate-300'}`} title="Acceso Docente">
          <Lock size={24} className={view.includes('teacher') ? 'text-white' : 'text-emerald-300'} />
        </button>

      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans text-slate-900 selection:bg-emerald-200 relative ${view === 'home' ? 'bg-[#f8fafc]' : ''}`}>
      <style>
        {`
          /* Animaciones Originales Vectoriales */
          @keyframes superLogoAnim {
            0% { transform: translate(0px, 0px) scale(1); filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); opacity: 0.85; }
            25% { transform: translate(12px, -15px) scale(1.05); filter: drop-shadow(0 0 25px rgba(16, 185, 129, 0.7)); opacity: 1; }
            50% { transform: translate(0px, -25px) scale(1.1); filter: drop-shadow(0 0 40px rgba(16, 185, 129, 1)); opacity: 0.9; }
            75% { transform: translate(-12px, -15px) scale(1.05); filter: drop-shadow(0 0 25px rgba(16, 185, 129, 0.7)); opacity: 1; }
            100% { transform: translate(0px, 0px) scale(1); filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); opacity: 0.85; }
          }
          .animated-logo { animation: superLogoAnim 6s ease-in-out infinite; will-change: transform, filter, opacity; }
          
          @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
          @keyframes float-medium { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-5deg); } }
          @keyframes float-fast { 0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); } 50% { transform: translateY(-25px) rotate(10deg) scale(1.05); } }
          
          /* ANIMACIONES DE FLIP, GLOSS, GLITTER Y CICLOSIS */
          @keyframes flipIn {
            from { transform: perspective(800px) rotateX(20deg) scale(0.95); opacity: 0; }
            to { transform: perspective(800px) rotateX(0deg) scale(1); opacity: 1; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(-15deg); }
            50%, 100% { transform: translateX(200%) skewX(-15deg); }
          }
          @keyframes sparkle {
            0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; filter: blur(2px); }
            50% { transform: scale(1) rotate(180deg); opacity: 1; filter: blur(0px); box-shadow: 0 0 20px currentColor; }
          }
          @keyframes ciclosis {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translate(var(--move-x), -120vh) scale(1.5); opacity: 0; }
          }
          
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        `}
      </style>
      
      {/* Fondo de Ciclosis animado, presente en todas las páginas salvo la principal */}
      {view !== 'home' && <CiclosisBackground />}

      {view === 'home' && renderHome()}
      {view === 'student' && renderStudentQuiz()}
      {view === 'results' && renderResults()}
      {view === 'teacher' && renderTeacherLogin()}
      {view === 'teacher_dashboard' && renderTeacherDashboard()}
      
      <FloatingMenu />
    </div>
  );
}