'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './manual.css';

type WinType = 'fisico' | 'mente' | 'social' | 'limpio';

interface Victoria {
  id: string;
  txt: string;
  type: WinType;
  date: string;
}

interface Contacto {
  n: string;
  tel: string;
}

interface Data {
  inicio: string | null;
  record: number;
  resets: number;
  marcas: Record<string, string>;
  victorias: Victoria[];
  guardia: Contacto[];
}

const STORAGE_KEY = 'manual-hermano:v1';

const DEFAULT_DATA: Data = {
  inicio: null,
  record: 0,
  resets: 0,
  marcas: {},
  victorias: [],
  guardia: [
    { n: '', tel: '' },
    { n: '', tel: '' },
    { n: '', tel: '' },
  ],
};

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const HITOS_DIAS = [1, 7, 14, 30, 60, 90, 180, 365, 730];
const HITO_LABEL: Record<number, string> = {
  1: '1 día',
  7: '1 sem',
  14: '2 sem',
  30: '1 mes',
  60: '2 mes',
  90: '3 mes',
  180: '6 mes',
  365: '1 año',
  730: '2 años',
};

const RITUAL_AM = [
  { t: 'Agua antes que café', d: 'Dos vasos apenas te levantas. Rehidrata, despierta, arranca.' },
  { t: 'Sol en la cara 5 minutos', d: 'Ventana o balcón. Ordena el reloj interno para el sueño de la noche.' },
  { t: 'Cinco minutos de movimiento', d: 'Sentadillas, plancha, elongación. Cuerpo antes que pantalla.' },
  { t: 'Escribir tres líneas', d: 'Qué voy a hacer hoy que importe. Qué voy a evitar. A quién voy a llamar.' },
  { t: 'Cara, dientes, ropa lista', d: 'Vestirse aunque trabajes en casa. No es vanidad, es señal al cerebro.' },
  { t: 'Nada de celular hasta terminar todo esto', d: 'Regla dura. El feed puede esperar veinte minutos.' },
];

const RITUAL_PM = [
  { t: 'Cerrar pantallas a las 22:00', d: 'Sin excepciones los primeros 30 días. Después ya se negocia.' },
  { t: 'Anotar la victoria del día', d: 'Aunque sea una. Va al registro de victorias abajo.' },
  { t: 'Dejar ropa de entrenar preparada', d: 'Cero fricción para mañana. Se decide una vez, no doce.' },
  { t: 'Té — no escape', d: 'Manzanilla, jengibre, tila. El ritual sin la anestesia (sin vaso, sin scroll, sin bandeja).' },
  { t: 'Lectura 20 minutos', d: 'Del canon, no de redes. Baja la cabeza igual que un ansiolítico.' },
  { t: 'Dormir a la misma hora que ayer', d: 'Sueño constante es la mitad del programa de cuerpo y cabeza.' },
];

const TIPO_LABEL: Record<WinType, string> = {
  fisico: 'Cuerpo',
  mente: 'Cabeza',
  social: 'Presencia',
  limpio: 'Día sobrio',
};

interface Actividad {
  n: string;
  c: string;
  p: string;
  t: string[];
}

const ACTIVIDADES: Actividad[] = [
  { n: 'CrossFit', c: 'Gimnasio', p: 'Fuerza y cardio en la misma hora, con clase y horario fijo. La intensidad alta libera endorfinas y deja una sensación de logro difícil de conseguir sentado.', t: ['cardio', 'fuerza', 'grupo'] },
  { n: 'Fit&Flex — pilates', c: 'Gimnasio', p: 'Trabaja core, postura y flexibilidad sin castigar articulaciones. Bajar el ritmo y concentrarse en la respiración también sirve para los días de cabeza acelerada.', t: ['flexibilidad', 'concentración', 'suave'] },
  { n: 'Kickboxing', c: 'Deporte', p: 'Coordinación, potencia y una descarga física enorme. Exige tanta atención en la técnica que no queda espacio mental para nada más durante la clase.', t: ['cardio', 'grupo', 'noche'] },
  { n: 'Natación', c: 'Agua', p: 'El cardio más completo y el más amable con rodillas y espalda. Ordena la respiración y suele mejorar mucho el sueño esa misma noche.', t: ['cardio', 'sueño', 'suave'] },
  { n: 'Trote o 5K juntos', c: 'Deporte', p: 'Cero costo y progreso visible semana a semana. Inscribirse a una carrera le pone fecha al esfuerzo y convierte los trotes sueltos en preparación.', t: ['cardio', 'progresión', 'barato'] },
  { n: 'Ciclopaseo dominical', c: 'Deporte', p: '30 km cerrados al tráfico los domingos por la mañana. Gratis, al aire libre y con media ciudad en la calle: sube el ánimo tanto como el pulso.', t: ['cardio', 'aire libre', 'mañana'] },
  { n: 'Cumbre o cerro', c: 'Montaña', p: 'Resistencia, altura y una vista que paga el esfuerzo. Empezar de madrugada ordena el fin de semana entero y deja el resto del día con energía.', t: ['cardio', 'aire libre', 'mañana'] },
  { n: 'Boulder', c: 'Montaña', p: 'Fuerza de agarre, equilibrio y resolución de problemas al mismo tiempo. Cada ruta es un acertijo físico y el avance se ve rutas arriba.', t: ['fuerza', 'concentración', 'progresión'] },
  { n: 'Karting', c: 'Aventura', p: 'Reflejos, concentración y adrenalina en tandas cortas. Competir en pareja es lo que la hace adictiva en el buen sentido.', t: ['reflejos', 'fin de semana'] },
  { n: 'Paintball', c: 'Aventura', p: 'Correr, agacharse y coordinar con el equipo durante horas sin notar que es ejercicio. Necesita cuatro o más, así que empuja a invitar gente.', t: ['cardio', 'grupo', 'barato'] },
  { n: 'Ultimate Blaster Arena', c: 'Aventura', p: 'Batallas con blasters de hidrogel en el Quicentro: lo mismo que paintball pero techado, más barato y sin moretones. Desde $6 la ronda corta.', t: ['cardio', 'grupo', 'barato', 'noche'] },
  { n: 'Escape room', c: 'Juegos', p: 'Lógica, comunicación y presión de tiempo. Salir de una sala juntos deja una sensación de equipo que pocas actividades igualan.', t: ['mental', 'grupo', 'noche'] },
  { n: 'Realidad virtual o arcade', c: 'Juegos', p: 'Sesión corta, barata y repetible, con harto movimiento en los juegos de cuerpo entero. Buen plan cuando el tiempo es poco.', t: ['corto', 'barato', 'noche'] },
  { n: 'Iceberg — juegos recreativos', c: 'Juegos', p: 'Retos físicos por salas: piso de lava, láser, pista sintética. Funciona perfecto entre dos y mejor en grupo. Cerca de $10,50 por hora, en la Villalengua junto al CCI.', t: ['cardio', 'grupo', 'barato'] },
  { n: 'BLIZZ — pista de hielo', c: 'Juegos', p: 'Equilibrio, core y piernas, con la ventaja de que ser malos al principio es parte de la gracia. Hielo real, con clases si quieren avanzar en serio.', t: ['equilibrio', 'progresión'] },
  { n: 'Mr. Joy — arcade', c: 'Juegos', p: 'Máquinas y retos cortos. Pensado para familias, así que no da para una tarde entera, pero el de Condado queda cerca y sirve de plan de rescate.', t: ['corto', 'barato', 'plan B'] },
  { n: 'Tiro con arco', c: 'Deporte', p: 'Pulso, respiración y calma absoluta. De las pocas disciplinas donde el progreso depende de aprender a bajar las pulsaciones a voluntad. Los clubes son pequeños y muy sociables.', t: ['concentración', 'grupo', 'progresión'] },
  { n: 'Canopy en Mindo', c: 'Aventura', p: 'Día completo fuera de la ciudad, con tirolesas sobre bosque nublado y caminatas entre medio. Cara para repetir seguido, perfecta como recompensa de un mes bueno.', t: ['aire libre', 'fin de semana', 'recompensa'] },
  { n: 'Pádel', c: 'Deporte', p: 'Cardio intenso disfrazado de juego, con menos exigencia técnica que el tenis. Se juega cuatro, así que cada partido amplía el círculo. Canchas abiertas hasta las 23:00.', t: ['cardio', 'grupo', 'noche'] },
  { n: 'Tenis', c: 'Deporte', p: 'Coordinación, reflejos y desplazamiento constante. Basta con ustedes dos, lo que lo vuelve el plan más fácil de sostener cuando nadie más puede.', t: ['cardio', 'progresión', 'barato'] },
  { n: 'Indoor fútbol', c: 'Deporte', p: 'Cancha reservada con equipo armado: si no llegan, el partido se cae. Ese compromiso con otros sostiene la constancia mejor que la fuerza de voluntad.', t: ['cardio', 'grupo', 'noche'] },
  { n: 'Gimnasio con rutina compartida', c: 'Gimnasio', p: 'Fuerza, densidad ósea y postura. Llevar registro de cargas hace que el progreso sea un número que sube, no una sensación.', t: ['fuerza', 'progresión', 'barato'] },
  { n: 'Dota en party', c: 'Juegos', p: 'Sesión de ranked juntos, con una meta de rango de por medio. Exige comunicación, lectura de mapa y aguante mental: el rendimiento sube con buen sueño y baja sin él.', t: ['mental', 'noche', 'progresión'] },
  { n: 'Taller manual', c: 'Taller', p: 'Cerámica, carpintería, cuero. Trabajo con las manos que absorbe la atención por completo y deja un objeto terminado. Los grupos suelen ser estables por años.', t: ['concentración', 'grupo', 'progresión'] },
  { n: 'Dipinto — pintar y café', c: 'Taller', p: 'Cafetería donde se pinta, en los Shyris, abierta hasta las 21:00 viernes y sábados. Dos horas de foco tranquilo y algo hecho por ustedes al final.', t: ['concentración', 'corto', 'noche'] },
  { n: 'Cocinar juntos', c: 'Comida', p: 'Comer mejor empieza por cocinar. Repartir roles y sacar un plato bueno es de las formas más baratas y repetibles de pasar una noche entera juntos.', t: ['en casa', 'barato', 'nutrición'] },
  { n: 'Caminata matutina y café', c: 'Suave', p: 'Luz de la mañana, movimiento suave y conversación. El plan más liviano de la lista y el que sostiene la racha cuando la semana estuvo dura.', t: ['suave', 'mañana', 'sueño'] },
  { n: 'Almuerzo dominical fuera', c: 'Familia', p: 'Hornado en Sangolquí, fritada en Calderón o el mercado que les guste. Sale barato, los cuatro caben sin planificar nada y el paseo de ida ya cuenta como salida.', t: ['familia', 'barato', 'mañana'] },
  { n: 'Teleférico y Cruz Loma', c: 'Familia', p: 'Se sube en cabina y arriba cada uno camina lo que quiera: los mayores pueden quedarse en el mirador mientras ustedes siguen. Vista de toda la ciudad y aire de páramo.', t: ['familia', 'aire libre', 'suave'] },
  { n: 'Mitad del Mundo y Pululahua', c: 'Familia', p: 'Museo, monumento y el cráter con vista al fondo. Poca caminata, mucho que ver, y queda cerca saliendo por Pomasqui.', t: ['familia', 'aire libre', 'fin de semana'] },
  { n: 'Parque La Carolina o Bicentenario', c: 'Familia', p: 'Bicicletas, botes, caminar y sentarse a conversar. Cada uno va a su ritmo sin que nadie quede fuera, y no cuesta nada.', t: ['familia', 'suave', 'barato'] },
  { n: 'Termas de Papallacta', c: 'Familia', p: 'Agua caliente, montaña y descanso real. De los pocos planes que le gustan igual a los cuatro, y sale mejor entre semana o temprano el sábado.', t: ['familia', 'suave', 'fin de semana'] },
  { n: 'Centro Histórico y el Panecillo', c: 'Familia', p: 'Iglesias, plazas y helado de paila. Caminata larga pero plana, buena para conversar durante horas sin que se sienta como un plan armado.', t: ['familia', 'cultura', 'aire libre'] },
  { n: 'Museo o Jardín Botánico', c: 'Familia', p: 'Yaku, la Capilla del Hombre, Casa del Alabado o el jardín de La Carolina. Media mañana tranquila, techada si llueve, con algo de qué hablar después.', t: ['familia', 'cultura', 'suave'] },
  { n: 'Mindo en familia', c: 'Familia', p: 'Mariposario, ruta del chocolate y cascadas. Día completo fuera de Quito donde cada quien elige su nivel de aventura.', t: ['familia', 'aire libre', 'fin de semana'] },
  { n: 'Noche de juegos de mesa', c: 'En casa', p: 'Cartas, dominó, cuarenta o lo que haya en casa. Cero costo, se arma en diez minutos y llena la noche entera sin pantalla.', t: ['familia', 'en casa', 'barato'] },
  { n: 'Baños de Agua Santa', c: 'Aventura', p: 'Tres horas y media desde Quito y ahí hay plan para cada nivel: termas, Casa del Árbol, canopy, rafting, puenting y la ruta de las cascadas hasta el Pailón del Diablo.', t: ['aire libre', 'fin de semana', 'recompensa'] },
];

const CATEGORIAS_ACT = ['Todo', ...Array.from(new Set(ACTIVIDADES.map((a) => a.c)))];

const IMGS_90 = [
  '/img/90dias/90dias-01.jpeg',
  '/img/90dias/90dias-02.jpeg',
  '/img/90dias/90dias-03.jpeg',
  '/img/90dias/90dias-04.jpeg',
  '/img/90dias/90dias-05.jpeg',
  '/img/90dias/90dias-06.jpeg',
  '/img/90dias/90dias-07.jpeg',
  '/img/90dias/90dias-08.jpeg',
  '/img/90dias/90dias-09.jpeg',
];

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function hoyISO(d = new Date()) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(a: string, b: string) {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86400000);
}

function fechaCorta(iso: string) {
  const d = toDate(iso);
  return d.getDate() + ' ' + MES[d.getMonth()];
}

function loadData(): Data {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<Data>;
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      guardia:
        Array.isArray(parsed.guardia) && parsed.guardia.length === 3
          ? parsed.guardia
          : DEFAULT_DATA.guardia,
      marcas: parsed.marcas || {},
      victorias: parsed.victorias || [],
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export default function ManualClient() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Data>(DEFAULT_DATA);
  const [wTxt, setWTxt] = useState('');
  const [wType, setWType] = useState<WinType>('fisico');
  const [nowLabel, setNowLabel] = useState('—');
  const [hoyLabel, setHoyLabel] = useState('—');
  const [catFiltro, setCatFiltro] = useState<string>('Todo');
  const [carIdx, setCarIdx] = useState(0);
  const carRef = useRef<HTMLDivElement>(null);

  const actividadesFiltradas = useMemo(
    () => (catFiltro === 'Todo' ? ACTIVIDADES : ACTIVIDADES.filter((a) => a.c === catFiltro)),
    [catFiltro]
  );

  const goToSlide = useCallback((i: number) => {
    const el = carRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: 'smooth' });
    setCarIdx(i);
  }, []);

  const nextSlide = useCallback(
    () => goToSlide((carIdx + 1) % IMGS_90.length),
    [carIdx, goToSlide]
  );
  const prevSlide = useCallback(
    () => goToSlide((carIdx - 1 + IMGS_90.length) % IMGS_90.length),
    [carIdx, goToSlide]
  );

  const onCarScroll = useCallback(() => {
    const el = carRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== carIdx) setCarIdx(idx);
  }, [carIdx]);

  useEffect(() => {
    setData(loadData());
    setMounted(true);
    const d = new Date();
    setNowLabel(
      `${DIA_LARGO[d.getDay()]} · ${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`
    );
    setHoyLabel(`hoy · ${d.getDate()} ${MES[d.getMonth()]}`);
  }, []);

  const persist = useCallback((next: Data) => {
    setData(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
    }
  }, []);

  const diasActuales = useMemo(() => {
    if (!mounted || !data.inicio) return 0;
    const d = diffDays(hoyISO(), data.inicio);
    return d < 0 ? 0 : d;
  }, [data.inicio, mounted]);

  useEffect(() => {
    if (mounted && diasActuales > data.record) {
      persist({ ...data, record: diasActuales });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diasActuales, mounted]);

  const diasLimpiosAnio = useMemo(() => {
    if (!mounted || !data.inicio) return 0;
    const inicio = toDate(data.inicio);
    const enero = new Date(new Date().getFullYear(), 0, 1);
    const desde = inicio > enero ? data.inicio : `${enero.getFullYear()}-01-01`;
    const d = diffDays(hoyISO(), desde);
    return d < 0 ? 0 : Math.min(d, diasActuales);
  }, [data.inicio, diasActuales, mounted]);

  const label = useMemo(() => {
    if (!mounted || !data.inicio) return 'Empieza cuando quieras. Hoy sirve.';
    if (diasActuales === 0) return 'Día cero. Aparecer mañana ya es el día uno.';
    if (diasActuales === 1) return 'Un día. Al día dos se llega dando un paso más.';
    if (diasActuales < 7) return 'Primera semana. Aquí es donde más pesa.';
    if (diasActuales < 30) return 'Ya no es capricho. Es hábito en formación.';
    if (diasActuales < 90) return 'El cuerpo y la cabeza ya cambiaron. Se nota.';
    return 'Esto ya no es privación. Es tu vida nueva.';
  }, [diasActuales, mounted, data.inicio]);

  const nextHito = useMemo(() => {
    const next = HITOS_DIAS.find((h) => h > diasActuales);
    return next ? `${next - diasActuales} días` : '—';
  }, [diasActuales]);

  const handleStart = () => {
    if (data.inicio) {
      if (!confirm('Ya hay un contador arrancado. ¿Reiniciar desde hoy?')) return;
      persist({ ...data, inicio: hoyISO(), resets: data.resets + 1 });
      return;
    }
    persist({ ...data, inicio: hoyISO() });
  };

  const handleSetDate = () => {
    const s = prompt('Fecha de inicio (YYYY-MM-DD):', data.inicio || hoyISO());
    if (!s) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      alert('Formato inválido. Usa YYYY-MM-DD.');
      return;
    }
    persist({ ...data, inicio: s });
  };

  const handleReset = () => {
    if (
      !confirm('¿Reiniciar el contador? No es un fracaso — es un dato. El record personal se guarda.')
    )
      return;
    persist({ ...data, inicio: hoyISO(), resets: data.resets + 1 });
  };

  const toggleMarca = (id: string) => {
    const today = hoyISO();
    const next = { ...data.marcas };
    if (next[id] === today) delete next[id];
    else next[id] = today;
    persist({ ...data, marcas: next });
  };

  // Reset diario de las marcas (rituales)
  useEffect(() => {
    if (!mounted) return;
    const today = hoyISO();
    let changed = false;
    const next = { ...data.marcas };
    for (const k of Object.keys(next)) {
      if (next[k] !== today) {
        delete next[k];
        changed = true;
      }
    }
    if (changed) persist({ ...data, marcas: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const saveWin = () => {
    const txt = wTxt.trim();
    if (!txt) return;
    const nuevo: Victoria = {
      id: 'v' + Date.now(),
      txt,
      type: wType,
      date: hoyISO(),
    };
    persist({ ...data, victorias: [...data.victorias, nuevo] });
    setWTxt('');
  };

  const deleteWin = (id: string) => {
    persist({ ...data, victorias: data.victorias.filter((v) => v.id !== id) });
  };

  const updateGuardia = (i: number, field: 'n' | 'tel', v: string) => {
    const next = data.guardia.map((g, idx) => (idx === i ? { ...g, [field]: v } : g));
    persist({ ...data, guardia: next });
  };

  const openSOS = () => {
    const contactos = data.guardia
      .filter((g) => g.n.trim())
      .map((g) => '· ' + g.n + (g.tel ? ' — ' + g.tel : ''))
      .join('\n');
    alert(
      'MODO SOS · próximos 20 minutos\n' +
        '———————————————————————\n\n' +
        '1. Salí del sitio ahora. Camina 15 minutos.\n' +
        '2. Agua fría en cara y muñecas.\n' +
        '3. Llama a alguien de la lista:\n' +
        (contactos || '   (todavía no llenaste la lista de guardia)') +
        '\n\n' +
        '4. Come algo con proteína.\n' +
        '5. Escribí tres líneas en un papel:\n' +
        '   — Qué sentí ahora mismo.\n' +
        '   — Qué lo disparó.\n' +
        '   — Qué necesitaba de verdad.\n\n' +
        '6. Dormí temprano. Mañana el contador sigue subiendo.\n\n' +
        'El impulso no dura para siempre. Dura entre 15 y 25 minutos.'
    );
  };

  const numClass = mounted && data.inicio && diasActuales === 0 ? 'counter-num warn' : 'counter-num';
  const winCountLabel = `${data.victorias.length} registrada${data.victorias.length === 1 ? '' : 's'}`;

  return (
    <main className="manual-page" data-manual>
      <div className="wrap">
        <div className="topbar">
          <div className="logo">
            <i />
            <b>
              MANUAL — <span className="gold">primero el jardín</span>
            </b>
            <span className="top-sig" aria-label="Creado por Kabir y Xavier">
              <em>Kabir</em> · <em>Xavier</em>
            </span>
          </div>
          <span className="eyebrow" suppressHydrationWarning>
            {nowLabel}
          </span>
        </div>

        <nav className="nav">
          <a href="#juntos">Juntos</a>
          <a href="#pasiones">Pasiones</a>
          <a href="#bebidas">Bebidas</a>
          <a href="#comida">Comida</a>
          <a href="#protocolo">Rituales</a>
          <a href="#victorias">Victorias</a>
          <a href="#cuerpo">Cuerpo</a>
          <a href="#criterio">Criterio</a>
          <a href="#presencia">Presencia</a>
          <a href="#higiene">Higiene</a>
          <a href="#zona-roja">Zona roja</a>
          <a href="#alternativas">Sustituciones</a>
          <a href="#cartas">Cartas</a>
          <a href="#dias">Contador</a>
        </nav>

        {/* ---- HERO ---- */}
        <section className="hero">
          <p className="eyebrow kicker">Para los dos · uso personal · versión 02</p>
          <h1 className="title">
            <span>Primero</span>
            <span>
              el <em>jardín</em>.
            </span>
          </h1>

          <p className="hero-epigraph">
            Nadie atrapa mariposas persiguiéndolas. Se siembra, se riega, se espera — y un día
            están ahí, y ya no se van.
          </p>

          <div className="hero-body">
            <p>
              <strong>Todas las cosas buenas toman tiempo.</strong> Un árbol que crece en un mes no
              aguanta el primer viento. La fuerza, el aire para subir un cerro, la cabeza tranquila,
              la confianza de la gente: todo eso tiene un tiempo mínimo y no hay manera de
              acelerarlo.
            </p>
            <p>
              Por eso el método aquí es simple y tiene dos partes. Una:{' '}
              <strong>ponerse una meta clara</strong>, con número y con nombre, para saber hacia
              dónde caminamos. Dos: <strong>olvidarse de ella casi todo el tiempo</strong>, porque a
              la cima no se llega mirándola — se llega dando el paso de hoy.
            </p>
            <p>
              La meta elige la dirección. Lo que sostiene es otra cosa:{' '}
              <strong>agarrarle gusto al camino</strong>. Si solo aguantas los entrenamientos por el
              resultado, los dejas en la tercera semana. Si te empieza a gustar el martes por la
              noche —la clase, el partido, la caminata con el hermano—, eso ya no se abandona, y el
              resultado llega solo mientras estabas distraído <em>disfrutando</em>.
            </p>
            <p>
              No hay atajo y no hace falta. Lo único que se pide es <strong>volver a aparecer</strong>.
              Aparecer suficientes veces, durante suficiente tiempo, <em>es</em> el método.
            </p>
          </div>

          <div className="hero-cta">
            <a href="#juntos" className="primary">
              Sembrar el primer plan
            </a>
            <a href="#bebidas">Bebidas y comida</a>
            <a href="#zona-roja">Zona roja</a>
          </div>
        </section>

        {/* ---- MANIFIESTO ---- */}
        <section className="manifesto">
          <p className="eyebrow" style={{ marginBottom: 24 }}>
            Manifiesto — cuatro frases para memorizar
          </p>
          <p>
            Uno. Nadie se vuelve <em>otro</em> hombre por decisión. Se vuelve otro hombre por{' '}
            <em>práctica</em>.
          </p>
          <p>
            Dos. La pasión que te desenfoca no es el problema. Es la <em>anestesia</em>. El problema
            es qué se anestesia — y ese sí se puede tocar.
          </p>
          <p>
            Tres. La presencia física, la cabeza clara y el criterio propio son <em>consecuencia</em>
            , no meta. Son lo que queda cuando dejas de saltarte los básicos.
          </p>
          <p>
            Cuatro. La única racha que importa es la de <em>volver a aparecer</em>. Si fallas un
            día, aparece al siguiente. Punto.
          </p>
          <p className="signed">Léelo en voz alta la primera semana</p>
        </section>

        {/* ---- RESUMEN 5 PUNTOS ---- */}
        <section className="resumen" aria-label="Resumen del manual en 5 puntos">
          <p className="head">Cómo leer esto · 5 puntos</p>
          <h2>Si solo lees esto, ya tienes el mapa.</h2>
          <p className="sub">
            No hace falta leer todo hoy. Estos son los cinco anclajes — el resto es referencia para
            volver cuando toque.
          </p>
          <div className="puntos">
            <div className="punto">
              <span className="n">01</span>
              <strong>Es para nosotros dos.</strong>
              <p>
                No hay atajo — hay siembra, riego y espera. <em>Volver a aparecer</em> es el método.
              </p>
            </div>
            <div className="punto">
              <span className="n">02</span>
              <strong>Primero el plan compartido.</strong>
              <p>Elegimos una actividad juntos, le ponemos fecha, aparecemos los dos. Ahí empieza.</p>
            </div>
            <div className="punto">
              <span className="n">03</span>
              <strong>El vaso es ritual, no enemigo.</strong>
              <p>Reemplaza el trago con algo frío en copa. Llena la nevera de lo que baja la ansiedad.</p>
            </div>
            <div className="punto">
              <span className="n">04</span>
              <strong>La gana dura 20 minutos.</strong>
              <p>Sobrevives esos 20 y ganaste el día. El plan ya está escrito en Zona roja.</p>
            </div>
            <div className="punto">
              <span className="n">05</span>
              <strong>El número, al final.</strong>
              <p>El contador es consecuencia, no meta. Se cuenta solo cuando lo demás anda.</p>
            </div>
          </div>
        </section>

        {/* ---- CARRUSEL 90 DÍAS ---- */}
        <section className="carousel-90" aria-label="Referencia visual 90 días">
          <p className="eyebrow gold">Referencia · 90 días</p>
          <h2 className="carousel-title">
            Repite esto 90 días — <em>y no te van a reconocer.</em>
          </h2>
          <div className="carousel-wrap">
            <div className="carousel-track" ref={carRef} onScroll={onCarScroll}>
              {IMGS_90.map((src, i) => (
                <div className="slide" key={src}>
                  <img
                    src={src}
                    alt={`Referencia 90 días — ${i + 1} de ${IMGS_90.length}`}
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="car-btn prev"
              onClick={prevSlide}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="car-btn next"
              onClick={nextSlide}
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
          <div className="carousel-dots">
            {IMGS_90.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`dot ${carIdx === i ? 'on' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Ir a slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        <aside className="cap-divider">
          <div className="cap-n">I</div>
          <div className="cap-info">
            <p className="kick">Capítulo · uno</p>
            <h2>El norte.</h2>
            <p>Lo que vamos a hacer juntos, y lo que nos aleja del foco. La razón antes que la técnica.</p>
          </div>
        </aside>

        {/* ---- JUNTOS ---- */}
        <section id="juntos" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">01</span> — Planes juntos
            </span>
            <span>lo que hacemos como hermanos</span>
          </h2>
          <p className="section-lead">
            Acá empieza el manual de verdad. El foco no se encuentra en la cabeza — se encuentra{' '}
            <em>haciendo cosas</em>, y las que se sostienen son las que se hacen con alguien que
            también está en esto. Este catálogo es <strong>nuestro</strong>: elige uno, escríbele,
            pónganle fecha. Aparecer los dos ya es la mitad.
          </p>

          <div className="filtros-cat">
            {CATEGORIAS_ACT.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filtro-pill ${catFiltro === cat ? 'on' : ''}`}
                onClick={() => setCatFiltro(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="actividades">
            {actividadesFiltradas.map((a) => (
              <div className="actividad" key={a.n}>
                <span className="cat">{a.c}</span>
                <b>{a.n}</b>
                <p>{a.p}</p>
                <div className="tags">
                  {a.t.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- PASIONES ---- */}
        <section id="pasiones" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">02</span> — Las pasiones que desenfocan
            </span>
            <span>nombrarlas primero</span>
          </h2>
          <p className="section-lead">
            No se puede vencer lo que no se nombra. Estas son las que más aparecen — cada una
            promete algo, <em>anestesia</em> otra cosa, y deja una factura al día siguiente.
          </p>

          <div className="pasiones">
            {[
              {
                k: '01',
                n: 'Bebida',
                promete: 'Soltar el día, ser más gracioso, dormir.',
                anestesia: 'Ansiedad, timidez, aburrimiento del viernes.',
                deja: 'Sábado robado, decisiones nubladas, sueño roto aunque duermas ocho horas.',
              },
              {
                k: '02',
                n: 'Pantalla infinita',
                promete: 'Distracción sin esfuerzo, sensación de estar “conectado”.',
                anestesia: 'Aburrimiento de un segundo, ansiedad, silencio.',
                deja: 'Dos horas sin memoria, comparación con extraños, cabeza saturada al dormir.',
              },
              {
                k: '03',
                n: 'Comida basura de noche',
                promete: 'Placer rápido, premio por el día que aguantaste.',
                anestesia: 'Cansancio, tristeza, estrés no procesado.',
                deja: 'Bajón al día siguiente, mal sueño, culpa que reactiva el ciclo.',
              },
              {
                k: '04',
                n: 'Drama y chats emocionales',
                promete: 'Sentirte vivo, importante, involucrado.',
                anestesia: 'Vacío, sensación de que “no pasa nada” en tu vida.',
                deja: 'Vínculos rotos, cabeza ocupada en gente que ni te importa, insomnio.',
              },
              {
                k: '05',
                n: 'Trabajo compulsivo',
                promete: 'Progreso, estatus, la nobleza de “estar ocupado”.',
                anestesia: 'La relación contigo mismo, con tu casa, con tu familia.',
                deja: 'Burnout, cuerpo apagado, meses en los que no recordás qué hiciste fuera del trabajo.',
              },
            ].map((p) => (
              <div className="pasion" key={p.n}>
                <span className="kick">{p.k} · pasión</span>
                <h3>{p.n}</h3>
                <div className="row-p">
                  <span className="lab">Promete</span>
                  <span className="val">{p.promete}</span>
                </div>
                <div className="row-p">
                  <span className="lab">Anestesia</span>
                  <span className="val">{p.anestesia}</span>
                </div>
                <div className="row-p">
                  <span className="lab">Deja</span>
                  <span className="val">{p.deja}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bebida-cadena">
            <p className="head">Nota especial · la primera ficha del dominó</p>
            <h3>La bebida abre la puerta a las otras</h3>
            <p>
              Casi todas las pasiones de arriba se activan por su cuenta. La bebida es distinta —
              es el eslabón débil que suelta la cadena entera. Si tuvieras que tocar una sola, tocá{' '}
              <em>esta</em> primero: las otras caen por gravedad.
            </p>
            <div className="grupos">
              <div className="grupo-c">
                <b>Directas · misma noche</b>
                <ul>
                  <li>
                    <strong>Trasnochar</strong> sin propósito. La noche se estira sola hasta las 2 AM.
                  </li>
                  <li>
                    <strong>Comida basura tarde.</strong> Fritanga o dulce a la 1 AM que sobrio nunca eliges.
                  </li>
                  <li>
                    <strong>Chat / llamadas impulsivas.</strong> Mensajes al ex, al jefe, al que ya no hablas — el sábado los mirás con miedo.
                  </li>
                  <li>
                    <strong>Fumar social.</strong> El “yo solo cuando tomo” que se vuelve 8 al mes.
                  </li>
                  <li>
                    <strong>Sexo sin criterio.</strong> A quién eliges con cinco tragos no es a quien eliges el lunes.
                  </li>
                </ul>
              </div>
              <div className="grupo-c">
                <b>Al día siguiente · resaca larga</b>
                <ul>
                  <li>
                    <strong>Sábado perdido.</strong> No solo la resaca física: el gym, el proyecto, la familia — se caen todos.
                  </li>
                  <li>
                    <strong>Hangxiety.</strong> Cortisol elevado y culpa difusa hasta el domingo tarde. La gente lo llama personalidad; es química.
                  </li>
                  <li>
                    <strong>Ritual AM roto.</strong> Si no aparecés al ritual, la semana arranca chueca. Un viernes de trago te cuesta el lunes.
                  </li>
                </ul>
              </div>
              <div className="grupo-c">
                <b>Efecto cadena · las peores</b>
                <ul>
                  <li>
                    <strong>Apuestas y compras online tarde.</strong> Bet365, Amazon, delivery a las 3 AM. Decisiones de plata que sobrio no tomás.
                  </li>
                  <li>
                    <strong>Drogas más fuertes.</strong> La línea, la pastilla, el porro — casi siempre aparecen con dos copas de por medio. Sin alcohol, la puerta no se abre.
                  </li>
                  <li>
                    <strong>Mentiras a los cercanos.</strong> “Solo tomé dos”, esconder cantidades. Desgasta la confianza más que el trago.
                  </li>
                  <li>
                    <strong>Aislar el proyecto.</strong> Faltar a lo importante del sábado por seguir la fiesta. El costo se cuenta en meses, no en horas.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p
            style={{
              color: 'var(--bone)',
              fontSize: 14,
              lineHeight: 1.6,
              marginTop: 26,
              maxWidth: '62ch',
            }}
          >
            <strong>La regla útil:</strong> una pasión sana te deja más presente al día siguiente.
            Una pasión que desenfoca te deja más lejos de ti mismo. Si no sabes cuál es cuál,
            pregúntale al del espejo el martes por la mañana — él sí sabe.
          </p>
        </section>

        <aside className="cap-divider">
          <div className="cap-n">II</div>
          <div className="cap-info">
            <p className="kick">Capítulo · dos</p>
            <h2>Lo que consumimos.</h2>
            <p>Con qué reemplazamos el trago y con qué llenamos la nevera. Los cambios concretos que se hacen esta semana.</p>
          </div>
        </aside>

        {/* ---- BEBIDAS ---- */}
        <section id="bebidas" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">03</span> — Bebidas para reemplazar el trago
            </span>
            <span>vaso en la mano, sin alcohol</span>
          </h2>
          <p className="section-lead">
            No extrañas el alcohol — extrañas <em>el vaso en la mano</em>: el gesto de pedir, el
            hielo, tener algo qué sostener mientras hablas. Estas bebidas te devuelven ese ritual,
            sin efecto y sin que tengas que explicar nada. Sirven para el bar, la cena y las noches
            en casa.
          </p>

          <div className="drinks">
            {[
              {
                s: 'Bar / salida',
                t: 'Agua con gas + lima + hielo',
                p: 'En vaso corto, con dos rodajas gordas de lima y mucho hielo. Se ve exactamente como un gin tonic y nadie pregunta. El truco social más útil.',
              },
              {
                s: 'Bar / salida',
                t: 'Cerveza 0.0',
                p: 'Corona Cero, Heineken 0.0, Erdinger sin alcohol, Athletic Brewing. Sabor y ritual completos, sin efecto. Pedila con seguridad, sin explicar.',
              },
              {
                s: 'Bar / salida',
                t: 'Agua tónica + lima',
                p: 'Amarga, con burbujas fuertes, en copa balón. Si le agregan angostura son dos gotas de bitter sin alcohol y sabe casi a coctel.',
              },
              {
                s: 'Cena',
                t: 'Kombucha',
                p: 'Amarga, ácida, compleja. Lo más parecido a una copa de vino tinto en boca. Combina con carne, con quesos, con comida fuerte.',
              },
              {
                s: 'Cena',
                t: 'Mosto o jugo de uva sin fermentar',
                p: 'Cuerpo y taninos del vino, sin alcohol. Servilo en copa de vino: la mesa se ve igual.',
              },
              {
                s: 'Casa noche',
                t: 'Té de manzanilla + jengibre',
                p: 'Relaja parecido al primer trago, sin resaca. Prepararlo —hervir, colar, servir en tetera— es parte del ritual.',
              },
              {
                s: 'Casa noche',
                t: 'Hierbaluisa, tila o valeriana',
                p: 'Para las noches donde la cabeza no baja. Se toma tibio, en jarro grande, con las manos alrededor. Manda al sueño en 30 minutos.',
              },
              {
                s: 'Casa noche',
                t: 'Cold brew con hielo',
                p: 'Cafetera francesa la noche anterior, hielo, un dedo de leche o de avena. Ritual completo, sabor complejo, cero alcohol.',
              },
            ].map((d) => (
              <div className="drink" key={d.t}>
                <span>{d.s}</span>
                <b>{d.t}</b>
                <p>{d.p}</p>
              </div>
            ))}
          </div>

          <p
            style={{
              color: 'var(--bone)',
              fontSize: 14,
              lineHeight: 1.6,
              marginTop: 26,
              maxWidth: '62ch',
            }}
          >
            <strong>La regla del bar:</strong> pides primero y firme —“una tónica con lima en copa”—
            antes de que alguien pregunte. Nadie insiste cuando ya tienes vaso en la mano.
          </p>
        </section>

        {/* ---- COMIDA ---- */}
        <section id="comida" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">04</span> — Comida que baja la ansiedad
            </span>
            <span>guía de compras</span>
          </h2>
          <p className="section-lead">
            La gana de tomar casi nunca es del alcohol. Es <em>otra cosa disfrazada</em>: sed,
            azúcar bajo, magnesio en el piso, cansancio, cabeza acelerada. Estos productos
            anticipan esos disparadores. Es una lista para llevar al súper, no para leer y olvidar.
          </p>

          <div className="higiene">
            <article>
              <p className="kicker">01 · Proteína</p>
              <h3>Estabiliza el azúcar</h3>
              <p>
                La caída de glucosa a las 6 PM es el <strong>40% de la gana</strong> del viernes.
                Con proteína a la mano, esa caída no ocurre. Tener siempre algo listo para
                cinco minutos.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Huevos — <strong>docena mínimo</strong>, siempre.</li>
                  <li>Pollo desmenuzado en tuppers (cocinar el domingo para toda la semana).</li>
                  <li>Atún o sardinas en lata — 4 latas de reserva.</li>
                  <li>Yogur natural o griego sin azúcar.</li>
                  <li>Queso fresco, mozzarella o cottage.</li>
                  <li>Jamón de pavo bajo en sal, para sándwich rápido.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">02 · Minerales del ánimo</p>
              <h3>Magnesio y potasio</h3>
              <p>
                Cuando están bajos aparecen como <strong>ansiedad, tensión, calambres</strong> — y
                el cerebro lo lee como “necesito un trago”. Reponerlos calma más y más rápido de lo
                que crees.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Banano — al menos 6 en la casa siempre.</li>
                  <li>Aguacate — 2 o 3 por semana, madurando en la ventana.</li>
                  <li>Espinaca o acelga — en bolsa, para tirar a cualquier plato.</li>
                  <li>Almendras crudas — bolsa grande, guardada en frasco visible.</li>
                  <li>Semillas de zapallo (pepas). Puñado sobre yogur o ensalada.</li>
                  <li>Chocolate 70% — una barra por semana, no más.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">03 · Intestino y ánimo</p>
              <h3>Fermentados</h3>
              <p>
                El alcohol destroza la flora intestinal, y la flora regula el ánimo más de lo que
                pensamos. Reponer con fermentados sostiene el estado emocional durante la semana.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Kombucha — 2 botellas por semana, para las noches.</li>
                  <li>Kéfir de leche o de agua — vaso al desayuno.</li>
                  <li>Yogur con probióticos vivos (Yakult, Actimel, o griego natural).</li>
                  <li>Chucrut o kimchi — cucharada al lado del arroz o el huevo.</li>
                  <li>Miso — sobre para sopa rápida en 3 minutos.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">04 · Cuando llega la gana</p>
              <h3>Snack de emergencia</h3>
              <p>
                El impulso dura <strong>15–25 minutos</strong>. Se cubre comiendo algo denso y
                salado. Tener esto <em>al alcance</em>, en la mesa, sin abrir gaveta, cambia el
                resultado.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Frutos secos porcionados — bolsitas de 30 g listas.</li>
                  <li>Fruta lavada y visible sobre la mesa (no escondida en el cajón).</li>
                  <li>Aceitunas — bote en la nevera.</li>
                  <li>Hummus + zanahoria o apio en palitos.</li>
                  <li>Palitos de queso o mozzarella individual.</li>
                  <li>Chocolate 70% en cuadraditos — dos, no la barra entera.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">05 · Días muertos</p>
              <h3>Comida lista de rescate</h3>
              <p>
                El viernes cansado, sin ganas de cocinar, es el disparador clásico.{' '}
                <strong>No comer bien es como no dormir</strong>: te empuja al trago. Deja comida
                lista para esos días.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Sopa lista en bolsa (lentejas, minestrone, garbanzo).</li>
                  <li>Huevos duros hechos el domingo, listos toda la semana.</li>
                  <li>Arroz integral o quinua pre-cocidos en tupper.</li>
                  <li>Pan integral bueno, congelado en rebanadas.</li>
                  <li>Salsa de tomate natural en frasco — la base de todo.</li>
                  <li>Pasta seca de calidad — plato en 10 minutos.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">06 · No es solo agua</p>
              <h3>Hidratación con sabor</h3>
              <p>
                La mitad de la sensación “quiero un trago” es sed disfrazada. Que la nevera tenga
                siempre <strong>opciones frías y con sabor</strong> — no solo agua sola.
              </p>
              <details className="detalle">
                <summary>Ver la lista de compra</summary>
                <ul>
                  <li>Agua con gas — pack de 6 mínimo.</li>
                  <li>Limones y limas — 4 a 6 en la casa siempre.</li>
                  <li>Menta o hierbabuena fresca en maceta o vaso con agua.</li>
                  <li>Jengibre fresco — un pedazo grande dura semanas.</li>
                  <li>Tés variados: manzanilla, verde, hierbaluisa, tila.</li>
                  <li>Cubetera con hielo <strong>siempre llena</strong> — que nunca falte.</li>
                </ul>
              </details>
            </article>
          </div>

          <div className="rules-callout">
            <p className="head">La regla del súper — cuándo y cómo comprar</p>
            <div className="rules-grid">
              <p>
                <strong>Carga el carrito el domingo</strong>
                Pensando en el viernes 8 PM. Ese es el momento crítico. Nevera vacía el viernes = ya
                perdiste.
              </p>
              <p>
                <strong>Nunca comprar con hambre</strong>
                Comé algo antes de ir al súper. Termina el carrito lleno de cosas que sabotean.
              </p>
              <p>
                <strong>Perímetro del súper</strong>
                Fresco está en los bordes (verdura, carne, lácteos). El centro son ultraprocesados.
                Camina el perímetro primero.
              </p>
              <p>
                <strong>Lista antes de entrar</strong>
                Escrita en papel o en el celular. Sin lista es todo impulso, y el impulso empuja al
                trago.
              </p>
            </div>
          </div>
        </section>

        <aside className="cap-divider">
          <div className="cap-n">III</div>
          <div className="cap-info">
            <p className="kick">Capítulo · tres</p>
            <h2>La práctica.</h2>
            <p>El día a día que sostiene todo lo demás. Cada uno en su casa, con el mismo ritual.</p>
          </div>
        </aside>

        {/* ---- PROTOCOLO ---- */}
        <section id="protocolo" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">05</span> — Protocolo diario
            </span>
            <span>ritual</span>
          </h2>
          <p className="section-lead">
            Dos rituales de <em>ocho minutos</em>. Uno abre el día, otro lo cierra. Todo lo demás
            sale de ahí — para los dos, cada uno en su casa.
          </p>

          <div className="rituals">
            <div className="ritual">
              <p className="hora">06:30 — 07:00</p>
              <h3>
                Ritual <em>de amanecer</em>
              </h3>
              <p className="sub">
                Antes del celular. Antes del ruido. Antes de que otra persona decida cómo empieza el
                día.
              </p>
              <ul>
                {RITUAL_AM.map((r) => {
                  const id = 'am-' + slugify(r.t);
                  const checked = mounted && data.marcas[id] === hoyISO();
                  return (
                    <li key={id} onClick={() => toggleMarca(id)}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMarca(id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={r.t}
                        suppressHydrationWarning
                      />
                      <span>
                        {r.t}
                        <small>{r.d}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="ritual">
              <p className="hora">22:00 — 22:30</p>
              <h3>
                Ritual <em>de cierre</em>
              </h3>
              <p className="sub">
                La noche es donde se pierden los proyectos. Si la noche está armada, el día
                siguiente ya arrancó ganando.
              </p>
              <ul>
                {RITUAL_PM.map((r) => {
                  const id = 'pm-' + slugify(r.t);
                  const checked = mounted && data.marcas[id] === hoyISO();
                  return (
                    <li key={id} onClick={() => toggleMarca(id)}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMarca(id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={r.t}
                        suppressHydrationWarning
                      />
                      <span>
                        {r.t}
                        <small>{r.d}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* ---- VICTORIAS ---- */}
        <section id="victorias" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">06</span> — Registro de victorias
            </span>
            <span suppressHydrationWarning>{winCountLabel}</span>
          </h2>
          <p className="section-lead">
            Anotar las pequeñas — las de él, las tuyas, las suyas juntos. Las grandes se olvidan en
            tres semanas; las <em>pequeñas</em> son la evidencia de que están cambiando.
          </p>

          <div className="wins-input">
            <input
              type="text"
              placeholder="Qué pasó hoy que hace un año no habría pasado"
              value={wTxt}
              onChange={(e) => setWTxt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveWin();
              }}
            />
            <select value={wType} onChange={(e) => setWType(e.target.value as WinType)}>
              <option value="fisico">Cuerpo</option>
              <option value="mente">Cabeza / criterio</option>
              <option value="social">Presencia / social</option>
              <option value="limpio">Día sobrio / en foco</option>
            </select>
            <button onClick={saveWin}>Guardar</button>
          </div>

          <div className="wins-list">
            {!mounted || data.victorias.length === 0 ? (
              <p className="empty-note">
                Sin victorias registradas todavía. La primera puede ser esta noche.
              </p>
            ) : (
              [...data.victorias].reverse().map((v) => (
                <div className="win" key={v.id}>
                  <span className="date">{fechaCorta(v.date)}</span>
                  <span className="txt">{v.txt}</span>
                  <span className={`type ${v.type}`}>{TIPO_LABEL[v.type]}</span>
                  <button className="del" onClick={() => deleteWin(v.id)} aria-label="Borrar">
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ---- CUERPO ---- */}
        <section id="cuerpo" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">07</span> — Programa de cuerpo
            </span>
            <span>12 semanas</span>
          </h2>
          <p className="section-lead">
            Tres fases. No importa la estética. Importa <em>llegar</em> al gimnasio o al piso los
            días que toca.
          </p>

          <div className="plan">
            <div className="fase">
              <p className="tag">Fase 01 · semanas 1–4</p>
              <h3>Volver al cuerpo</h3>
              <p className="weeks">CIMIENTO</p>
              <p>
                El cuerpo tiene que recordar que existe. Movimiento diario, cargas ligeras, técnica
                limpia. Nada épico. Aparecer.
              </p>
              <ul>
                <li>
                  <b>Fuerza</b>3 días · full body · 45 min
                </li>
                <li>
                  <b>Cardio</b>2 días · Z2 · 30 min
                </li>
                <li>
                  <b>Movilidad</b>Diaria · 8 min
                </li>
                <li>
                  <b>Regla</b>Sudar seis días
                </li>
              </ul>
            </div>
            <div className="fase">
              <p className="tag">Fase 02 · semanas 5–8</p>
              <h3>Fuerza real</h3>
              <p className="weeks">CONSTRUCCIÓN</p>
              <p>
                Empuje / tirón / pierna en split. Progresión medida. Todo entrenamiento anotado — no
                se entrena lo que no se anota.
              </p>
              <ul>
                <li>
                  <b>Fuerza</b>4 días · split PPL
                </li>
                <li>
                  <b>Cardio</b>2 días · Z2 + 1 HIIT
                </li>
                <li>
                  <b>Proteína</b>1,6 g / kg
                </li>
                <li>
                  <b>Regla</b>Sumar peso o repes
                </li>
              </ul>
            </div>
            <div className="fase">
              <p className="tag">Fase 03 · semanas 9–12</p>
              <h3>Presencia</h3>
              <p className="weeks">CONSOLIDACIÓN</p>
              <p>
                El cuerpo ya cambió. Ahora se pule: postura, respiración, deporte con otros. Aparece
                en la sala distinto — la gente lo va a notar antes que tú.
              </p>
              <ul>
                <li>
                  <b>Fuerza</b>4 días · pesado
                </li>
                <li>
                  <b>Deporte</b>1 día · con gente
                </li>
                <li>
                  <b>Cardio</b>Trail o cerro fin de semana
                </li>
                <li>
                  <b>Regla</b>Foto mes 1 vs mes 3
                </li>
              </ul>
            </div>
          </div>

          <div className="week-grid" style={{ marginTop: 36 }}>
            <div className="day">
              <p className="d">Lun</p>
              <p className="lab">Empuje</p>
              <p>Pecho, hombro, tríceps. 45 min. Duro.</p>
            </div>
            <div className="day">
              <p className="d">Mar</p>
              <p className="lab">Cardio Z2</p>
              <p>Trote suave o bici. 30–40 min. Nariz.</p>
            </div>
            <div className="day">
              <p className="d">Mié</p>
              <p className="lab">Tirón</p>
              <p>Espalda, bíceps. Dominadas asistidas.</p>
            </div>
            <div className="day">
              <p className="d">Jue</p>
              <p className="lab">Movilidad</p>
              <p>Cadera, hombro, columna. 20 min.</p>
            </div>
            <div className="day">
              <p className="d">Vie</p>
              <p className="lab">Pierna</p>
              <p>Sentadilla, peso muerto rumano.</p>
            </div>
            <div className="day">
              <p className="d">Sáb</p>
              <p className="lab">Aire libre</p>
              <p>Cerro, cancha, pelada. Con gente.</p>
            </div>
            <div className="day">
              <p className="d">Dom</p>
              <p className="lab rest">Descanso</p>
              <p>Caminar. Cocinar la semana.</p>
            </div>
          </div>
        </section>

        {/* ---- CRITERIO ---- */}
        <section id="criterio" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">08</span> — Criterio propio
            </span>
            <span>lectura + escritura</span>
          </h2>
          <p className="section-lead">
            Leer, subrayar, discutir, escribir. Repetir hasta que tengas <em>opiniones</em> que
            puedas defender sin subir la voz.
          </p>

          <div className="split" style={{ marginBottom: 32 }}>
            <div>
              <p className="eyebrow gold" style={{ marginBottom: 10 }}>
                La regla
              </p>
              <p style={{ color: 'var(--bone)', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
                Un libro cada tres semanas. Ficha corta al terminar:{' '}
                <strong>
                  tres ideas que te llevas, una con la que no estás de acuerdo, una que aplicas esta
                  semana
                </strong>
                . Sin ficha no se cuenta como leído.
              </p>
            </div>
            <div>
              <p className="eyebrow gold" style={{ marginBottom: 10 }}>
                La segunda regla
              </p>
              <p style={{ color: 'var(--bone)', fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>
                15 minutos de escritura diaria. A mano. Nadie lo lee. Tres preguntas:{' '}
                <strong>¿qué hice hoy? ¿qué evité? ¿qué haría distinto?</strong> Los que escriben
                tienen opinión; los que solo consumen, repiten.
              </p>
            </div>
          </div>

          <div className="canon">
            {[
              {
                cat: 'Estoicismo',
                t: 'Meditaciones',
                a: 'Marco Aurelio',
                p: 'Cuaderno privado de un emperador escribiéndose a sí mismo cada noche. Se abre por cualquier página.',
                w: '→ Para ordenar la cabeza en menos de cinco minutos.',
              },
              {
                cat: 'Hábito',
                t: 'Hábitos atómicos',
                a: 'James Clear',
                p: 'Cómo se construye realmente un comportamiento nuevo. Manual, no motivación.',
                w: '→ Para diseñar el ritual y no depender de la fuerza de voluntad.',
              },
              {
                cat: 'Sentido',
                t: 'El hombre en busca de sentido',
                a: 'Viktor Frankl',
                p: 'Psiquiatra sobreviviente de campos. Tesis: no se busca placer, se busca significado.',
                w: '→ Para saber por qué vale la pena aguantar días duros.',
              },
              {
                cat: 'Voluntad',
                t: 'La mente indomable',
                a: 'David Goggins',
                p: 'Crudo, ruidoso, útil. La incomodidad como herramienta, no como enemigo.',
                w: '→ Para las semanas en que todo pesa demasiado.',
              },
              {
                cat: 'Adicción',
                t: 'Dopamina',
                a: 'Anna Lembke',
                p: 'Neurocientífica de Stanford. Cómo funciona la recompensa, por qué el placer fácil vacía y por qué el difícil llena.',
                w: '→ Para entender qué hace en el cerebro cualquier placer fácil — vaso, pantalla, azúcar.',
              },
              {
                cat: 'Práctica',
                t: 'Los cuatro acuerdos',
                a: 'Miguel Ruiz',
                p: 'Cuatro frases sencillas. Difíciles de vivir, imposibles de olvidar una vez leídas.',
                w: '→ Para dejar de tomarse todo personal.',
              },
              {
                cat: 'Poder',
                t: 'Las 48 leyes del poder',
                a: 'Robert Greene',
                p: 'Manual incómodo sobre cómo se mueve la gente. Leerlo con distancia crítica, no como guion.',
                w: '→ Para leer las intenciones antes de que te lastimen.',
              },
              {
                cat: 'Foco',
                t: 'Deep Work',
                a: 'Cal Newport',
                p: 'Por qué el trabajo profundo es la habilidad rara y bien pagada de esta época.',
                w: '→ Para que dejes de contestar chats mientras trabajas.',
              },
              {
                cat: 'Vida buena',
                t: 'Cómo llevar una vida más filosófica',
                a: 'William B. Irvine',
                p: 'Estoicismo aplicado a la vida moderna, sin poses.',
                w: '→ Para tener un manual portátil de decisiones.',
              },
            ].map((b) => (
              <div className="book" key={b.t}>
                <p className="cat">{b.cat}</p>
                <h3>{b.t}</h3>
                <p className="aut">{b.a}</p>
                <p>{b.p}</p>
                <p className="why-line">{b.w}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- PRESENCIA ---- */}
        <section id="presencia" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">09</span> — Presencia
            </span>
            <span>cómo estás en la sala</span>
          </h2>
          <p className="section-lead">
            Presencia no es <em>hablar más</em>. Es ocupar el sitio sin pedir permiso y hablar
            menos, mejor.
          </p>

          <div className="presence">
            <article>
              <p className="why">Postura</p>
              <h3>Ocupar el eje</h3>
              <p>
                El 40% de la presencia física es cómo apoyas los pies y qué haces con los hombros.
                Se corrige rápido, se pierde rápido.
              </p>
              <ul>
                <li>Peso repartido en los dos pies, ligeramente separados.</li>
                <li>Hombros atrás y abajo, no arriba. Pecho abierto sin sacar pancita.</li>
                <li>Barbilla paralela al piso — ni levantada ni caída.</li>
                <li>Manos visibles, sin bolsillos cuando alguien te habla.</li>
              </ul>
            </article>
            <article>
              <p className="why">Voz</p>
              <h3>Bajar y desacelerar</h3>
              <p>
                La voz nerviosa sube de tono y de velocidad. La voz con autoridad hace lo contrario.
                Grábate una vez a la semana leyendo un párrafo.
              </p>
              <ul>
                <li>
                  Terminar las frases con la voz <strong>bajando</strong>, no subiendo.
                </li>
                <li>Pausas de un segundo entre ideas. El silencio es tuyo.</li>
                <li>Respirar por la nariz antes de arrancar una frase larga.</li>
                <li>Menos muletillas: “o sea”, “ya”, “tipo”. Cállalas.</li>
              </ul>
            </article>
            <article>
              <p className="why">Mirada</p>
              <h3>Sostener sin invadir</h3>
              <p>
                La mirada firme comunica antes que la ropa o la voz. La esquiva se lee como
                inseguridad aunque no lo seas.
              </p>
              <ul>
                <li>Al saludar: contacto directo dos segundos y sonrisa corta.</li>
                <li>Al escuchar: mirar entre los dos ojos, no fijamente a uno.</li>
                <li>Cuando piensas la respuesta: mirar hacia el lado, no al piso.</li>
                <li>Al despedirte: mirada, apretón firme, nombre de la persona.</li>
              </ul>
            </article>
            <article>
              <p className="why">Estilo</p>
              <h3>Uniforme, no moda</h3>
              <p>
                No necesitas ropa cara: necesitas{' '}
                <strong>tres combos que te quedan bien</strong> y usarlos rotando. La consistencia
                es la elegancia.
              </p>
              <ul>
                <li>Ropa que ajusta en hombros y en cintura, no “cómoda de más”.</li>
                <li>Paleta corta: negro, blanco, tierra, un color acento.</li>
                <li>Zapatos limpios siempre. Se nota más de lo que crees.</li>
                <li>Uñas cortas, barba definida o rasurada — nunca a medias.</li>
              </ul>
            </article>
          </div>
        </section>

        {/* ---- HIGIENE ---- */}
        <section id="higiene" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">10</span> — Higiene y aroma
            </span>
            <span>cómo llegas antes de hablar</span>
          </h2>
          <p className="section-lead">
            La gente decide en <em>siete segundos</em> — antes de que abras la boca. Olor, piel,
            uñas, aliento. Lo básico bien hecho vale más que cualquier fragancia cara.
          </p>

          <div className="higiene">
            <article>
              <p className="kicker">01 · Ducha</p>
              <h3>Todos los días, y una vez bien</h3>
              <p>
                El olor corporal no viene del sudor: viene de la bacteria que come el sudor. La
                ducha diaria la corta de raíz. Una vez a la semana, exfoliar y hacerla más larga.
              </p>
              <details className="detalle">
                <summary>Ver las 4 reglas</summary>
                <ul>
                  <li>
                    Agua tibia, no ardiendo — el agua muy caliente reseca y hace <strong>oler
                    peor</strong> al día siguiente.
                  </li>
                  <li>
                    Jabón <strong>antibacterial</strong> en axilas, ingle, pies y espalda. En el
                    resto del cuerpo, jabón normal.
                  </li>
                  <li>Fregar con esponja o toalla, no solo pasar la mano. Piel muerta = olor.</li>
                  <li>Secarse bien entre dedos de los pies. Ahí empieza el mal olor de zapatos.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">02 · Aliento</p>
              <h3>La primera impresión</h3>
              <p>
                El aliento se lee en la primera frase. Y quien lo tiene mal es el <em>único</em>{' '}
                que no lo sabe. Dar por hecho que puede estar mal y arreglarlo antes.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    Cepillar <strong>dos veces</strong> al día, dos minutos cada vez. Cronometrado,
                    no “rapidito”.
                  </li>
                  <li>
                    <strong>Hilo dental cada noche.</strong> El 80% del mal aliento vive entre
                    dientes, no en la lengua.
                  </li>
                  <li>
                    Raspador de lengua — 5 segundos, cambia todo. Más barato y más efectivo que
                    cualquier enjuague.
                  </li>
                  <li>Limpieza dental profesional cada 6 meses. No es cosmético, es salud.</li>
                  <li>
                    Chicles sin azúcar a la mano (menta o canela). Después del café, después de
                    comer.
                  </li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">03 · Desodorante</p>
              <h3>Antitranspirante en la noche</h3>
              <p>
                Aquí casi todo el mundo lo hace mal. El antitranspirante funciona mejor{' '}
                <strong>en la noche</strong>, sobre piel seca — no en la mañana después de la
                ducha.
              </p>
              <details className="detalle">
                <summary>Ver las 4 reglas</summary>
                <ul>
                  <li>
                    <strong>De noche:</strong> antitranspirante (con aluminio) sobre axila seca.
                    Bloquea los conductos y trabaja mientras duermes.
                  </li>
                  <li>
                    <strong>De día:</strong> desodorante normal encima si quieres, para el aroma.
                  </li>
                  <li>
                    Rebajar el vello de la axila con máquina — no afeitar. Menos vello = menos
                    superficie para bacteria.
                  </li>
                  <li>Cambiar de marca cada 6 meses. El cuerpo se acostumbra y baja la eficacia.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">04 · Perfume</p>
              <h3>Uno bueno, no cinco</h3>
              <p>
                El perfume no se huele — <em>se insinúa</em>. Si alguien lo huele a un metro,
                pusiste demasiado. La regla es que solo lo huela quien te <strong>abraza</strong>.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    <strong>Dos rociadas</strong>, no más. Cuello y muñeca — o pecho debajo de la
                    ropa.
                  </li>
                  <li>Nunca frotar las muñecas entre sí. Rompe las notas altas.</li>
                  <li>
                    Aplicar sobre piel <strong>hidratada</strong>. Sobre piel seca el aroma dura la
                    mitad.
                  </li>
                  <li>
                    Para empezar, uno versátil: <strong>Bleu de Chanel</strong>, <strong>Dior
                    Sauvage</strong>, <strong>Acqua di Giò Profumo</strong>, o <strong>Nautica
                    Voyage</strong> (barato y muy bueno).
                  </li>
                  <li>
                    Con el tiempo, dos: uno de día (fresco, cítrico) y uno de noche (amaderado,
                    especiado).
                  </li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">05 · Piel</p>
              <h3>Cara descansada gana</h3>
              <p>
                La piel es lo primero que la gente ve. Rutina de tres pasos, en serio, dos veces al
                día. Un mes y la diferencia se nota en fotos.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    <strong>Mañana:</strong> lavar con gel suave (CeraVe, La Roche-Posay, o Nivea
                    Men), hidratar, protector solar SPF 30+. Sí, aunque estés en Quito.
                  </li>
                  <li>
                    <strong>Noche:</strong> lavar, hidratar. Una vez por semana, exfoliar suave.
                  </li>
                  <li>Nada de jabón de cuerpo en la cara. Reseca y da acné. Gel específico.</li>
                  <li>
                    Dormir 7 horas hace más por la piel que cualquier crema. Y <strong>tomar
                    agua</strong>, en serio.
                  </li>
                  <li>
                    Barba: aceite de barba dos veces por semana. Y definida — línea del cuello y
                    pómulos siempre limpia.
                  </li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">06 · Cabello</p>
              <h3>Corte cada 3–4 semanas</h3>
              <p>
                El corte prolijo se nota más que el corte moderno. Ir a una peluquería fija que
                sepa cómo te queda — no cambiar cada mes.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    Lavar con shampoo <strong>máximo día por medio</strong>. Todos los días reseca
                    el cuero cabelludo.
                  </li>
                  <li>Acondicionador solo de medios a puntas, nunca en la raíz.</li>
                  <li>Peine o cepillo en la mañana. El cabello sin peinar se ve descuidado.</li>
                  <li>Si hay caspa: shampoo con ketoconazol o piritionato de zinc, 2× semana.</li>
                  <li>Corte cada 3–4 semanas — el pelo que crece sin forma pierde toda la estética.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">07 · Uñas y manos</p>
              <h3>Lo que la gente mira sin darse cuenta</h3>
              <p>
                Cuando das la mano, cuando pagas, cuando señalas algo — las uñas están a la vista.
                Sucias o largas, te descalifican en silencio.
              </p>
              <details className="detalle">
                <summary>Ver las 4 reglas</summary>
                <ul>
                  <li>
                    Cortar cada domingo. Rectas o suavemente curvas, <strong>nunca puntiagudas</strong>.
                  </li>
                  <li>Limpiar debajo cada día en la ducha. Cepillo de uñas, 5 segundos.</li>
                  <li>Cutícula empujada con una toalla al secarse. No cortar.</li>
                  <li>Manos hidratadas: crema simple después de lavarlas. Piel áspera se ve descuidada.</li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">08 · Pies y zapatos</p>
              <h3>El olor que no se perdona</h3>
              <p>
                Los pies apestan cuando no se ventilan. Y los zapatos guardan el olor durante
                semanas. Rotar zapatos vale más que cualquier polvo.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    Nunca el mismo par de zapatos <strong>dos días seguidos</strong>. Necesitan 24 h
                    para secarse por dentro.
                  </li>
                  <li>Medias de algodón o merino. Sintéticas hacen sudar más.</li>
                  <li>Talco o bicarbonato en los zapatos por la noche. Barato, eficaz, sin drama.</li>
                  <li>
                    Uñas de pies cortadas rectas cada dos semanas. Y limpiar entre dedos al ducharse.
                  </li>
                  <li>
                    Zapatos limpios: cepillar antes de salir, lustrar el cuero una vez al mes. La
                    gente <strong>sí</strong> mira los zapatos.
                  </li>
                </ul>
              </details>
            </article>

            <article>
              <p className="kicker">09 · Ropa</p>
              <h3>Limpia, planchada, que ajusta</h3>
              <p>
                Ropa arrugada anula un buen corte y un buen cuerpo. No se necesita mucha — se
                necesita bien cuidada y bien puesta.
              </p>
              <details className="detalle">
                <summary>Ver las 5 reglas</summary>
                <ul>
                  <li>
                    Camisetas y camisas <strong>una postura, una lavada</strong>. Sin excepciones en
                    clima cálido.
                  </li>
                  <li>
                    Detergente sin perfume fuerte + un chorrito de vinagre blanco en el enjuague. La
                    ropa huele a limpio, no a jabón.
                  </li>
                  <li>Planchar camisas y pantalones. Cinco minutos, mucha diferencia.</li>
                  <li>
                    Colgar la ropa del día siguiente <strong>la noche anterior</strong>. Ventila y se
                    desarruga sola.
                  </li>
                  <li>
                    Zapatos y ropa que <strong>ajustan bien</strong> pesan más que la marca. Talla
                    correcta &gt; talla grande.
                  </li>
                </ul>
              </details>
            </article>
          </div>

          <div className="rules-callout">
            <p className="head">Las 5 reglas rápidas — imposibles de olvidar</p>
            <div className="rules-grid">
              <p>
                <strong>Ducha diaria</strong>
                Sin excepciones. Corta el 80% del problema de olor.
              </p>
              <p>
                <strong>Antitranspirante de noche</strong>
                Funciona mientras duermes. Un aroma neutro de día encima.
              </p>
              <p>
                <strong>Cepillo, hilo, lengua</strong>
                Los tres, no solo el primero. Cada noche, sin negociar.
              </p>
              <p>
                <strong>Dos rociadas de perfume</strong>
                Si alguien lo huele desde lejos, es demasiado.
              </p>
              <p>
                <strong>Uñas y zapatos limpios</strong>
                Detalles que la gente lee sin darse cuenta.
              </p>
            </div>
          </div>
        </section>

        <aside className="cap-divider">
          <div className="cap-n">IV</div>
          <div className="cap-info">
            <p className="kick">Capítulo · cuatro</p>
            <h2>Cuando pesa.</h2>
            <p>Plan concreto para los momentos duros. Lo importante no es que no lleguen — es tener claro qué hacer cuando lleguen.</p>
          </div>
        </aside>

        {/* ---- ZONA ROJA ---- */}
        <section id="zona-roja" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">11</span> — Zona roja
            </span>
            <span>plan de recaída</span>
          </h2>
          <p className="section-lead">
            Preparar la recaída <em>antes</em> de que llegue. Cuando llega, ya no hay tiempo de
            pensar.
          </p>

          <div className="red">
            <h3>
              Si <em>sientes</em> que va a pasar — lee esto primero
            </h3>
            <p>
              El impulso no dura para siempre — sea el vaso, la pantalla, la bandeja, el chat o el
              escape que sea. Dura entre <strong>15 y 25 minutos</strong> con toda su fuerza y
              después baja solo, hagas lo que hagas. El plan es simple:{' '}
              <strong>sobrevivir esos 20 minutos</strong>. No prometas “nunca más”. Prométete no
              ceder en los próximos veinte.
            </p>
            <div className="red-grid">
              <div>
                <h4>Los disparadores más comunes</h4>
                <ul>
                  <li>Fin de viernes — cambio de modo, ansiedad de ocio.</li>
                  <li>Aburrimiento en casa a las 21:00 (celular, nevera, bebida).</li>
                  <li>Pelea o comentario que dolió.</li>
                  <li>Persona o chat específico — hay uno o dos, conócelos.</li>
                  <li>Cansancio + hambre. Nunca decidir con esas dos juntas.</li>
                  <li>Éxito. Sí, también. “Me lo merezco” es una trampa.</li>
                </ul>
              </div>
              <div>
                <h4>La respuesta — en orden</h4>
                <ol>
                  <li>
                    <strong>Salir del sitio.</strong> Camina 15 minutos afuera. Lo primero.
                  </li>
                  <li>
                    <strong>Agua fría</strong> en la cara y en las muñecas. Baja el sistema
                    nervioso.
                  </li>
                  <li>
                    <strong>Llamar a una persona</strong> de la lista corta (abajo). Aunque sea
                    para hablar de fútbol.
                  </li>
                  <li>
                    <strong>Comer</strong> algo con proteína. El bajón de azúcar amplifica todo.
                  </li>
                  <li>
                    <strong>Escribir tres líneas</strong>: qué sentiste, qué disparó, qué
                    necesitabas de verdad.
                  </li>
                  <li>
                    <strong>Dormir temprano.</strong> El día ya está ganado por no haberlo hecho.
                  </li>
                </ol>
              </div>
            </div>
            <p style={{ marginTop: 24 }}>
              <strong>Y si pasó:</strong> no se tira todo. Se anota la fecha, se identifica el
              disparador, se vuelve al día uno sin drama. La única forma de perder es no volver a
              empezar.
            </p>
            <button className="sos-btn" onClick={openSOS}>
              ⚠ Modo SOS · abrir plan de 20 min
            </button>
          </div>

          <div className="split" style={{ marginTop: 36 }}>
            <div>
              <p className="eyebrow gold" style={{ marginBottom: 14 }}>
                Lista corta — 3 personas de guardia
              </p>
              <p style={{ color: 'var(--bone)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 18px' }}>
                Anota tres nombres. Que sepan que están en la lista. Que sepan que a veces vas a
                llamar “solo para hablar” y que <strong>contestar la llamada es la ayuda</strong>.
              </p>
              {data.guardia.map((g, i) => (
                <div className="guardia-row" key={i}>
                  <input
                    type="text"
                    placeholder={`Nombre ${i + 1}`}
                    value={g.n}
                    onChange={(e) => updateGuardia(i, 'n', e.target.value)}
                  />
                  <input
                    type="tel"
                    className="tel"
                    placeholder="Teléfono"
                    value={g.tel}
                    onChange={(e) => updateGuardia(i, 'tel', e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div>
              <p className="eyebrow gold" style={{ marginBottom: 14 }}>
                Bandera blanca — cuándo pedir ayuda profesional
              </p>
              <ul
                style={{
                  color: 'var(--bone)',
                  fontSize: 14,
                  lineHeight: 1.7,
                  paddingLeft: 20,
                  margin: 0,
                }}
              >
                <li>Tres recaídas seguidas a pesar del plan.</li>
                <li>Buscar la anestesia solo, escondido, temprano en el día.</li>
                <li>Temblor, sudor, insomnio o ansiedad fuerte al no ceder por 24 h.</li>
                <li>Ideas oscuras que no se van.</li>
              </ul>
              <p style={{ color: 'var(--bone)', fontSize: 13.5, marginTop: 16, lineHeight: 1.6 }}>
                En Ecuador: <strong>171 opción 6</strong> (línea de salud mental, gratis, 24 h). No
                es debilidad — es el mismo criterio con el que llamarías al mecánico si el carro no
                arranca.
              </p>
            </div>
          </div>
        </section>

        {/* ---- ALTERNATIVAS ---- */}
        <section id="alternativas" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">12</span> — Qué hacer en su lugar
            </span>
            <span>sustituciones</span>
          </h2>
          <p className="section-lead">
            El cuerpo pide un ritual — un vaso en la mano, un scroll, una picada, un chat. La
            solución no es quitarlo: es <em>reemplazarlo</em>. Mismo gesto, otro combustible.
          </p>
          <div className="drinks">
            {[
              {
                s: 'Ritual noche',
                t: 'Té de manzanilla + jengibre',
                p: 'Relaja parecido al primer trago, sin resaca. Prepararlo es parte del ritual.',
              },
              {
                s: 'Salida',
                t: 'Agua con gas + lima + hielo',
                p: 'Se ve como trago, cuesta poco, nadie pregunta. El truco social más útil.',
              },
              {
                s: 'Salida',
                t: 'Cerveza 0.0',
                p: 'Corona Cero, Heineken 0.0, Erdinger sin alcohol. Sabor y ritual, sin efecto. Marca el pedido con seguridad.',
              },
              {
                s: 'Aburrimiento 21:00',
                t: 'Caminar 20 minutos afuera',
                p: 'La mano al bolsillo, no al celular ni a la nevera. Se rompe el modo automático.',
              },
              {
                s: 'Scroll infinito',
                t: 'Libro físico a la mano',
                p: 'Deja uno abierto boca abajo en la mesa. Tres páginas cortan la inercia de la pantalla.',
              },
              {
                s: 'Ansiedad de comer',
                t: 'Agua fría + fruta entera',
                p: 'Casi siempre es sed disfrazada. Manzana o naranja antes de bajar a la despensa.',
              },
              {
                s: 'Reunión',
                t: 'Agua tónica + limón',
                p: 'Amarga, con burbujas, en copa. La mesa ni nota.',
              },
              {
                s: 'Impulso de contestar',
                t: 'Nota en papel, no chat',
                p: 'Escribe lo que ibas a mandar. Guárdalo. Mañana lo relees. El 80% no lo mandas.',
              },
            ].map((d) => (
              <div className="drink" key={d.t}>
                <span>{d.s}</span>
                <b>{d.t}</b>
                <p>{d.p}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="cap-divider">
          <div className="cap-n">V</div>
          <div className="cap-info">
            <p className="kick">Capítulo · cinco</p>
            <h2>Memoria y medida.</h2>
            <p>Recordatorios para volver a leer, y el número — al final del manual a propósito.</p>
          </div>
        </aside>

        {/* ---- CARTAS ---- */}
        <section id="cartas" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">13</span> — Cartas del hermano
            </span>
            <span>léelas cuando toque</span>
          </h2>
          <p className="section-lead">
            Escritas <em>una vez</em> para leerlas mil. No son motivación. Son <em>memoria</em>.
          </p>

          <div className="letter">
            <p>
              <strong>Para leer el día 1.</strong>
            </p>
            <p>
              Este día es un día raro y no lo sabes: es el único que se recuerda. El resto se
              convierten en “otro día en foco” y desaparecen entre semanas, meses, un año. Este no.
            </p>
            <p>
              No te prometas grandes cosas. Prométete <em>este</em> día. Si mañana también lo
              haces, ya son dos. Así se cuenta.
            </p>
            <span className="from">— tu hermano</span>
          </div>

          <div className="letter">
            <p>
              <strong>Para leer un viernes a las 20:00.</strong>
            </p>
            <p>
              Ya viste la película: la primera hora es risa, la segunda cambia el humor, la tercera
              se dice de más — y el sábado se pierde entero, sea por resaca, por scroll hasta las
              cuatro, por bandeja vacía o por chat que no debiste mandar. No es que <em>a veces</em>{' '}
              pasa. Pasa <em>siempre</em>. La única variable eres tú, y ya sabes cómo termina.
            </p>
            <p>
              El plan alternativo ya está en la app: llama a alguien de la lista, sal a caminar, o
              quédate y cocina algo bueno. En seis meses no vas a extrañar los viernes; vas a{' '}
              <em>agradecerlos</em>.
            </p>
            <span className="from">— tu hermano</span>
          </div>

          <div className="letter">
            <p>
              <strong>Para leer después de una caída.</strong>
            </p>
            <p>
              Ok. Pasó. No te vas a castigar durante tres días — eso es parte del ciclo y no
              queremos ese ciclo. Anota la fecha, anota el disparador, y vuelve mañana. La única
              forma de perder de verdad es dejar de contar.
            </p>
            <p>
              La gente que lo logra no es la que nunca cae. Es la que <em>vuelve</em> al día uno más
              rápido que antes.
            </p>
            <span className="from">— tu hermano</span>
          </div>

          <div className="letter">
            <p>
              <strong>Para leer el día 90.</strong>
            </p>
            <p>
              Si estás leyendo esto en el día 90, para. Levantá la cara del teléfono y date cuenta.
              Hace tres meses no podías imaginar este día. Hoy es normal. <em>Eso</em> es lo que
              estamos haciendo — volver normal lo que parecía imposible.
            </p>
            <p>
              Ahora empieza la parte interesante: no defenderte de la pasión que te desenfoca, sino{' '}
              <em>construir</em> lo que va a ocupar ese espacio para siempre. Vuelve a los planes
              juntos, elige uno nuevo para los próximos 90 días. Vamos.
            </p>
            <span className="from">— tu hermano</span>
          </div>
        </section>

        {/* ---- DÍAS ---- */}
        <section id="dias" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">14</span> — Contador de días en foco
            </span>
            <span suppressHydrationWarning>{hoyLabel}</span>
          </h2>
          <p className="section-lead">
            Un número, sin dramatismo. <em>Sube</em> solo, o se reinicia y sube otra vez. Va al
            final del manual a propósito: el número es <em>consecuencia</em> de todo lo anterior,
            no la meta.
          </p>

          <div className="counter-card">
            <div className="counter-grid">
              <div>
                <p className="eyebrow">Días consecutivos sin ceder al desenfoque</p>
                <p className={numClass} suppressHydrationWarning>
                  {mounted ? diasActuales : 0}
                </p>
                <p className="counter-label" suppressHydrationWarning>
                  {label}
                </p>
                <div className="counter-actions">
                  <button className="primary" onClick={handleStart}>
                    Empezar / continuar hoy
                  </button>
                  <button onClick={handleSetDate}>Fijar fecha inicio</button>
                  <button className="danger" onClick={handleReset}>
                    Reiniciar contador
                  </button>
                </div>
                <div className="milestones">
                  {HITOS_DIAS.map((h) => (
                    <span
                      key={h}
                      className={`milestone ${mounted && diasActuales >= h ? 'on' : ''}`}
                      suppressHydrationWarning
                    >
                      {HITO_LABEL[h]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="counter-side">
                <div className="row">
                  <b suppressHydrationWarning>{mounted ? Math.max(data.record, diasActuales) : 0}</b>
                  <span>Record personal</span>
                </div>
                <div className="row">
                  <b suppressHydrationWarning>{mounted ? diasLimpiosAnio : 0}</b>
                  <span>Días en foco este año</span>
                </div>
                <div className="row">
                  <b suppressHydrationWarning>{mounted ? data.resets : 0}</b>
                  <span>Reinicios (no son fracasos)</span>
                </div>
                <div className="row">
                  <b suppressHydrationWarning>{mounted ? nextHito : '—'}</b>
                  <span>Próximo hito</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div className="row">
            <p>
              Este archivo se guarda en tu navegador. Solo tú lo ves. Ábrelo cada mañana y cada
              noche durante 90 días.
            </p>
            <p>v02 · manual privado</p>
          </div>

          <div className="signature">
            <span className="sig-flourish" aria-hidden="true">◆</span>
            <p className="sig-line">creado por</p>
            <p className="sig-names">
              <em>Kabir</em> <span className="amp">&amp;</span> <em>Xavier</em>
            </p>
            <p className="sig-tag">hermanos · un jardín compartido</p>
          </div>
        </footer>
      </div>

      <a href="#juntos" className="fab-juntos" aria-label="Ir a Planes juntos">
        <span className="fab-icon" aria-hidden="true">◆</span>
        <span className="fab-label">Planes juntos</span>
      </a>
    </main>
  );
}
