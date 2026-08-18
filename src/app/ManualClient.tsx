'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  { t: 'Té — no vaso', d: 'Manzanilla, jengibre, tila. El ritual sin el efecto.' },
  { t: 'Lectura 20 minutos', d: 'Del canon, no de redes. Baja la cabeza igual que un ansiolítico.' },
  { t: 'Dormir a la misma hora que ayer', d: 'Sueño constante es la mitad del programa de cuerpo y cabeza.' },
];

const TIPO_LABEL: Record<WinType, string> = {
  fisico: 'Cuerpo',
  mente: 'Cabeza',
  social: 'Presencia',
  limpio: 'Día limpio',
};

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
    return 'Esto ya no es abstinencia. Es tu vida nueva.';
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
        'La gana no dura para siempre. Dura entre 15 y 25 minutos.'
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
              MANUAL — <span className="gold">volverse quien iba a ser</span>
            </b>
          </div>
          <span className="eyebrow" suppressHydrationWarning>
            {nowLabel}
          </span>
        </div>

        <nav className="nav">
          <a href="#pilares">Pilares</a>
          <a href="#dias">Días limpios</a>
          <a href="#protocolo">Protocolo</a>
          <a href="#cuerpo">Cuerpo</a>
          <a href="#criterio">Criterio</a>
          <a href="#presencia">Presencia</a>
          <a href="#higiene">Higiene</a>
          <a href="#zona-roja">Zona roja</a>
          <a href="#alternativas">Bebidas</a>
          <a href="#victorias">Victorias</a>
          <a href="#cartas">Cartas</a>
        </nav>

        {/* ---- HERO ---- */}
        <section className="hero">
          <p className="eyebrow kicker">Para el hermano · uso personal · versión 01</p>
          <h1 className="title">
            <span>Se vuelve</span>
            <span>
              <em>quien</em> se
            </span>
            <span>practica.</span>
          </h1>
          <p className="hero-lede">
            Este no es un plan para dejar de beber. Es un plan para <strong>volverse alguien</strong>{' '}
            que ya no necesita hacerlo — un hombre con cuerpo firme, cabeza clara, criterio propio y
            una manera de estar en la sala que la gente nota antes de que hables.
            <br />
            <br />
            No hay atajo. Hay un método, un ritual, y suficientes días encima. Empieza hoy y no lo
            cuentes.
          </p>
          <div className="hero-cta">
            <a href="#dias" className="primary">
              Contar el día 1
            </a>
            <a href="#protocolo">Ver el protocolo</a>
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
            Dos. La bebida no es el problema. Es la <em>anestesia</em>. El problema es qué se
            anestesia — y ese sí se puede tocar.
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

        {/* ---- PILARES ---- */}
        <section id="pilares" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">01</span> — Los cuatro pilares
            </span>
            <span>norte</span>
          </h2>
          <p className="section-lead">
            Un solo pilar cae y se caen los otros. Los <em>cuatro</em> se sostienen juntos.
          </p>

          <div className="pillars">
            <div className="pillar">
              <b className="num">01</b>
              <p className="rol">Cuerpo</p>
              <h3>
                Presencia
                <br />
                física
              </h3>
              <p>
                Espalda armada, hombros abiertos, cara despierta. No es estética: es la señal de que
                hay disciplina detrás. El cuerpo se cuida seis días a la semana, no dos.
              </p>
            </div>
            <div className="pillar">
              <b className="num">02</b>
              <p className="rol">Cabeza</p>
              <h3>
                Capacidad
                <br />
                resolutiva
              </h3>
              <p>
                Ver el problema, cortar el ruido, decidir, ejecutar. Se entrena arreglando cosas
                pequeñas todos los días hasta que arreglar cosas grandes deja de asustar.
              </p>
            </div>
            <div className="pillar">
              <b className="num">03</b>
              <p className="rol">Juicio</p>
              <h3>
                Criterio
                <br />
                propio
              </h3>
              <p>
                Saber lo que piensas antes de que te lo pregunten. Se construye leyendo cosas
                difíciles, hablando poco y escribiendo lo que crees para poder defenderlo.
              </p>
            </div>
            <div className="pillar">
              <b className="num">04</b>
              <p className="rol">Base</p>
              <h3>
                Sobriedad
                <br />
                funcional
              </h3>
              <p>
                No es abstinencia por castigo. Es dejar de anestesiar para que los otros tres
                pilares puedan crecer. Si el vaso vuelve, los otros pilares se caen — todos, siempre,
                sin excepción.
              </p>
            </div>
          </div>
        </section>

        {/* ---- DÍAS ---- */}
        <section id="dias" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">02</span> — Contador de días limpios
            </span>
            <span suppressHydrationWarning>{hoyLabel}</span>
          </h2>
          <p className="section-lead">
            Un número, sin dramatismo. <em>Sube</em> solo, o se reinicia y sube otra vez.
          </p>

          <div className="counter-card">
            <div className="counter-grid">
              <div>
                <p className="eyebrow">Días consecutivos sin alcohol</p>
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
                  <span>Días limpios este año</span>
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

        {/* ---- PROTOCOLO ---- */}
        <section id="protocolo" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">03</span> — Protocolo diario
            </span>
            <span>ritual</span>
          </h2>
          <p className="section-lead">
            Dos rituales de <em>ocho minutos</em>. Uno abre el día, otro lo cierra. Todo lo demás
            sale de ahí.
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

        {/* ---- CUERPO ---- */}
        <section id="cuerpo" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">04</span> — Programa de cuerpo
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
              <span className="n">05</span> — Criterio propio
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
                w: '→ Para entender exactamente qué hace el vaso en el cerebro.',
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
              <span className="n">06</span> — Presencia
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
              <span className="n">07</span> — Higiene y aroma
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
              <ul>
                <li>
                  Agua tibia, no ardiendo — el agua muy caliente reseca y hace <strong>oler
                  peor</strong> al día siguiente.
                </li>
                <li>
                  Jabón <strong>antibacterial</strong> en axilas, ingle, pies y espalda. En el
                  resto del cuerpo, jabón normal.
                </li>
                <li>
                  Fregar con esponja o toalla, no solo pasar la mano. Piel muerta = olor.
                </li>
                <li>Secarse bien entre dedos de los pies. Ahí empieza el mal olor de zapatos.</li>
              </ul>
            </article>

            <article>
              <p className="kicker">02 · Aliento</p>
              <h3>La primera impresión</h3>
              <p>
                El aliento se lee en la primera frase. Y quien lo tiene mal es el <em>único</em>{' '}
                que no lo sabe. Dar por hecho que puede estar mal y arreglarlo antes.
              </p>
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
            </article>

            <article>
              <p className="kicker">03 · Desodorante</p>
              <h3>Antitranspirante en la noche</h3>
              <p>
                Aquí casi todo el mundo lo hace mal. El antitranspirante funciona mejor{' '}
                <strong>en la noche</strong>, sobre piel seca — no en la mañana después de la
                ducha.
              </p>
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
            </article>

            <article>
              <p className="kicker">04 · Perfume</p>
              <h3>Uno bueno, no cinco</h3>
              <p>
                El perfume no se huele — <em>se insinúa</em>. Si alguien lo huele a un metro,
                pusiste demasiado. La regla es que solo lo huela quien te <strong>abraza</strong>.
              </p>
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
            </article>

            <article>
              <p className="kicker">05 · Piel</p>
              <h3>Cara descansada gana</h3>
              <p>
                La piel es lo primero que la gente ve. Rutina de tres pasos, en serio, dos veces al
                día. Un mes y la diferencia se nota en fotos.
              </p>
              <ul>
                <li>
                  <strong>Mañana:</strong> lavar con gel suave (CeraVe, La Roche-Posay, o Nivea
                  Men), hidratar, protector solar SPF 30+. Sí, aunque estés en Quito.
                </li>
                <li>
                  <strong>Noche:</strong> lavar, hidratar. Una vez por semana, exfoliar suave.
                </li>
                <li>
                  Nada de jabón de cuerpo en la cara. Reseca y da acné. Gel específico.
                </li>
                <li>
                  Dormir 7 horas hace más por la piel que cualquier crema. Y <strong>tomar
                  agua</strong>, en serio.
                </li>
                <li>
                  Barba: aceite de barba dos veces por semana. Y definida — línea del cuello y
                  pómulos siempre limpia.
                </li>
              </ul>
            </article>

            <article>
              <p className="kicker">06 · Cabello</p>
              <h3>Corte cada 3–4 semanas</h3>
              <p>
                El corte prolijo se nota más que el corte moderno. Ir a una peluquería fija que
                sepa cómo te queda — no cambiar cada mes.
              </p>
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
            </article>

            <article>
              <p className="kicker">07 · Uñas y manos</p>
              <h3>Lo que la gente mira sin darse cuenta</h3>
              <p>
                Cuando das la mano, cuando pagas, cuando señalas algo — las uñas están a la vista.
                Sucias o largas, te descalifican en silencio.
              </p>
              <ul>
                <li>
                  Cortar cada domingo. Rectas o suavemente curvas, <strong>nunca puntiagudas</strong>
                  .
                </li>
                <li>Limpiar debajo cada día en la ducha. Cepillo de uñas, 5 segundos.</li>
                <li>Cutícula empujada con una toalla al secarse. No cortar.</li>
                <li>Manos hidratadas: crema simple después de lavarlas. Piel áspera se ve descuidada.</li>
              </ul>
            </article>

            <article>
              <p className="kicker">08 · Pies y zapatos</p>
              <h3>El olor que no se perdona</h3>
              <p>
                Los pies apestan cuando no se ventilan. Y los zapatos guardan el olor durante
                semanas. Rotar zapatos vale más que cualquier polvo.
              </p>
              <ul>
                <li>
                  Nunca el mismo par de zapatos <strong>dos días seguidos</strong>. Necesitan 24 h
                  para secarse por dentro.
                </li>
                <li>Medias de algodón o merino. Sintéticas hacen sudar más.</li>
                <li>
                  Talco o bicarbonato en los zapatos por la noche. Barato, eficaz, sin drama.
                </li>
                <li>
                  Uñas de pies cortadas rectas cada dos semanas. Y limpiar entre dedos al ducharse.
                </li>
                <li>
                  Zapatos limpios: cepillar antes de salir, lustrar el cuero una vez al mes. La
                  gente <strong>sí</strong> mira los zapatos.
                </li>
              </ul>
            </article>

            <article>
              <p className="kicker">09 · Ropa</p>
              <h3>Limpia, planchada, que ajusta</h3>
              <p>
                Ropa arrugada anula un buen corte y un buen cuerpo. No se necesita mucha — se
                necesita bien cuidada y bien puesta.
              </p>
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

        {/* ---- ZONA ROJA ---- */}
        <section id="zona-roja" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">08</span> — Zona roja
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
              La gana no dura para siempre. Dura entre <strong>15 y 25 minutos</strong> con toda su
              fuerza y después baja sola, hagas lo que hagas. El plan es simple:{' '}
              <strong>sobrevivir esos 20 minutos</strong>. No prometas “no vuelvo a tomar nunca”.
              Prométete no tomar en los próximos veinte.
            </p>
            <div className="red-grid">
              <div>
                <h4>Los disparadores más comunes</h4>
                <ul>
                  <li>Fin de viernes — cambio de modo, ansiedad de ocio.</li>
                  <li>Aburrimiento en casa a las 21:00.</li>
                  <li>Pelea o comentario que dolió.</li>
                  <li>Amigo específico invitando — hay uno o dos, conócelos.</li>
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
                <li>Tomar solo, escondido, en la mañana.</li>
                <li>Temblor, sudor o ansiedad al no beber por 24 h.</li>
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
              <span className="n">09</span> — Qué tomar en su lugar
            </span>
            <span>bebidas de reemplazo</span>
          </h2>
          <p className="section-lead">
            La mano necesita un vaso. El cuerpo necesita el ritual. <em>Dáselo</em> — solo que sin
            alcohol.
          </p>
          <div className="drinks">
            {[
              {
                s: 'Ritual noche',
                t: 'Té de manzanilla + jengibre',
                p: 'Relaja parecido al primer trago, sin resaca. Prepararlo es parte del ritual.',
              },
              {
                s: 'Bar',
                t: 'Agua con gas + lima + hielo',
                p: 'Se ve como trago, cuesta poco, nadie pregunta. El truco social más útil.',
              },
              {
                s: 'Bar',
                t: 'Cerveza 0.0',
                p: 'Corona Cero, Heineken 0.0, Erdinger sin alcohol. Sabor y ritual, sin efecto. Marca el pedido con seguridad.',
              },
              {
                s: 'Cena',
                t: 'Kombucha',
                p: 'Amarga y compleja como una copa de vino. Combina con comida fuerte.',
              },
              {
                s: 'Tarde',
                t: 'Café frío',
                p: 'Cafetera francesa la noche anterior, hielo, un dedo de leche. Ritual completo.',
              },
              {
                s: 'Gimnasio',
                t: 'Agua con electrolitos',
                p: 'Después de entrenar reemplaza lo que se pierde. Suero oral funciona, sabe raro pero funciona.',
              },
              {
                s: 'Reunión',
                t: 'Agua tónica + limón',
                p: 'Amarga, con burbujas, en copa. La mesa ni nota.',
              },
              {
                s: 'Fin de semana',
                t: 'Chicha o horchata',
                p: 'Sabor local, sabor de infancia. Recuerda que se puede celebrar sin quemarse.',
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

        {/* ---- VICTORIAS ---- */}
        <section id="victorias" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">10</span> — Registro de victorias
            </span>
            <span suppressHydrationWarning>{winCountLabel}</span>
          </h2>
          <p className="section-lead">
            Anotar las pequeñas. Las grandes se olvidan en tres semanas — las <em>pequeñas</em> son
            la evidencia de que estás cambiando.
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
              <option value="limpio">Día limpio</option>
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

        {/* ---- CARTAS ---- */}
        <section id="cartas" className="bloque">
          <h2 className="section">
            <span>
              <span className="n">11</span> — Cartas del hermano
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
              convierten en “otro día limpio” y desaparecen entre semanas, meses, un año. Este no.
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
              Ya viste la película: te ríes la primera hora, la segunda cambia el humor, la tercera
              hablas mal de gente, el sábado se pierde entero. No es que <em>a veces</em> pasa. Pasa{' '}
              <em>siempre</em>. La única variable eres tú, y ya sabes cómo termina.
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
              <strong>Para leer después de una recaída.</strong>
            </p>
            <p>
              Ok. Pasó. No te vas a castigar durante tres días — eso es parte del ciclo y no
              queremos ese ciclo. Anota la fecha, anota el disparador, y volvé mañana. La única
              forma de perder de verdad es dejar de contar.
            </p>
            <p>
              La gente que lo logra no es la que nunca recae. Es la que <em>vuelve</em> al día uno
              más rápido que antes.
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
              Ahora empieza la parte interesante: no defenderte del vaso, sino <em>construir</em>{' '}
              lo que va a ocupar ese espacio para siempre. Volvé a los pilares. Elegí uno para los
              próximos 90 días. Vamos.
            </p>
            <span className="from">— tu hermano</span>
          </div>
        </section>

        <footer>
          <div className="row">
            <p>
              Este archivo se guarda en tu navegador. Solo tú lo ves. Ábrelo cada mañana y cada
              noche durante 90 días.
            </p>
            <p>v01 · manual privado</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
