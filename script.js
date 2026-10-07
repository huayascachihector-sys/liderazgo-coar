/**
 * LIDERAZGO COAR - LÓGICA INTERACTIVA & EFECTOS DINÁMICOS
 * Campaña Municipio Escolar - Joel Jonas Mendoza Curiñaupa
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas();
  initCountdown();
  initAudioEngine();
  initNavbarAndScroll();
  initAxesFilter();
  initModals();
  initMailboxAndIdeasWall();
  initSupportVote();
  initFaqAccordion();
  initCredentialGenerator();
  initScrollReveal();
});

/* ==========================================================================
   1. CANVAS DE PARTÍCULAS / RED CONECTADA (CONSTELLATION)
   ========================================================================== */
function initParticleCanvas() {
  const canvas = document.getElementById('canvas-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor((width * height) / 18000), 75);

  const mouse = { x: null, y: null, radius: 120 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2 + 1;
      this.isGold = Math.random() > 0.8;
      this.color = this.isGold ? 'rgba(245, 158, 11, ' : 'rgba(59, 130, 246, ';
      this.baseAlpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Interacción con mouse
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2;
          this.y -= Math.sin(angle) * force * 2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.baseAlpha + ')';
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   2. CUENTA REGRESIVA DINÁMICA (TEMPORIZADOR EN VIVO)
   ========================================================================== */
function initCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl) return;

  // Fecha tentativa de las elecciones escolares COAR (ej: 14 días en el futuro a las 08:30 AM)
  const now = new Date();
  let targetDate = new Date();
  targetDate.setDate(now.getDate() + 14);
  targetDate.setHours(8, 30, 0, 0);

  function updateTimer() {
    const currentTime = new Date().getTime();
    const distance = targetDate.getTime() - currentTime;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   3. SINTETIZADOR DE AUDIO UI (WEB AUDIO API)
   ========================================================================== */
let audioCtx = null;
let soundEnabled = true;

function initAudioEngine() {
  const toggleBtn = document.getElementById('sound-toggle');
  if (!toggleBtn) return;

  soundEnabled = localStorage.getItem('coar_sound_enabled') !== 'false';
  updateSoundButtonUI(toggleBtn);

  toggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('coar_sound_enabled', soundEnabled);
    updateSoundButtonUI(toggleBtn);
    if (soundEnabled) playUiSound('click');
  });

  // Escucha para reproducir clic en elementos interactivos clave
  document.querySelectorAll('.btn, .filter-btn, .axis-action-btn, .nav-link, .team-card-btn').forEach((el) => {
    el.addEventListener('click', () => {
      if (soundEnabled) playUiSound('soft-click');
    });
  });
}

function updateSoundButtonUI(btn) {
  if (soundEnabled) {
    btn.classList.remove('muted');
    btn.setAttribute('title', 'Efectos de sonido: Activados');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  } else {
    btn.classList.add('muted');
    btn.setAttribute('title', 'Efectos de sonido: Silenciados');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
  }
}

function playUiSound(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'soft-click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'heart') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // Audio context not allowed without prior interaction or unsupported
  }
}

/* ==========================================================================
   4. NAVBAR, SCROLL PROGRESS & MENU MÓVIL
   ========================================================================== */
function initNavbarAndScroll() {
  const navbar = document.querySelector('.navbar');
  const progressBar = document.getElementById('scroll-progress');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollY / docHeight) * 100;

    if (progressBar) progressBar.style.width = `${progress}%`;

    if (scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    // Active link highlighting
    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        links.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    links.forEach((link) => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
}

/* ==========================================================================
   5. FILTRO DE EJES DEL PLAN DE GOBIERNO
   ========================================================================== */
function initAxesFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const axisCards = document.querySelectorAll('.axis-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      axisCards.forEach((card) => {
        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   6. MODALES INTERACTIVOS (EJES Y REGIDORES)
   ========================================================================== */
const proposalsData = {
  mental: {
    title: 'Salud Mental y Bienestar Emocional',
    subtitle: 'Liderado por Baldocedo Funk & Joel Jonas',
    badge: 'Eje 01 • Cuidado Integral',
    color: '#8b5cf6',
    intro: 'La alta exigencia académica del COAR solo es sostenible cuando se cuida la mente y el corazón de cada estudiante. Nuestra meta es erradicar el agotamiento y normalizar el apoyo emocional.',
    initiatives: [
      {
        name: 'Módulos "Respira COAR": Espacios Seguros de Descompresión',
        desc: 'Adecuación de rincones silenciosos en residencias y biblioteca con iluminación cálida, cojines ergonómicos y difusores aromáticos para momentos de pausa y autorregulación.'
      },
      {
        name: 'Talleres Mensuales de Manejo de Ansiedad y Síndrome del Impostor',
        desc: 'Sesiones dinámicas facilitadas en alianza con el área de Psicología y especialistas invitados para técnicas de mindfulness y gestión de expectativas académicas.'
      },
      {
        name: 'Red de Escucha Activa "Pares COAR"',
        desc: 'Capacitación voluntaria de estudiantes de 4to y 5to año como primeros escuchas empáticos y derivadores discretos a psicopedagogía.'
      },
      {
        name: 'Semana de la Salud Mental Estudiantil',
        desc: 'Jornadas de catarsis artística, muro de desahogo anónimo y conversatorios sobre el balance entre el Programa del Diploma IB y la vida personal.'
      }
    ]
  },
  residential: {
    title: 'Vida Residencial y Convivencia Armónica',
    subtitle: 'Comodidad, Respeto y Calidez de Hogar Lejos de Casa',
    badge: 'Eje 02 • Convivencia',
    color: '#f59e0b',
    intro: 'El COAR no es solo un colegio: es nuestro hogar durante el año lectivo. Queremos transformar la experiencia en los dormitorios en un espacio fraterno, digno y libre de fricciones.',
    initiatives: [
      {
        name: 'Flexibilización Progresiva de Horarios en Áreas Comunes',
        desc: 'Mesa de diálogo con Bienestar Estudiantil para extender 45 minutos el uso supervisado de salas de estudio y patios los fines de semana.'
      },
      {
        name: 'Comité Paritario de Comedor y Nutrición',
        desc: 'Representación estudiantil quincenal con el equipo de concesionario y nutricionista para monitorear variedad, raciones equilibradas y dietas especiales.'
      },
      {
        name: 'Viernes de Integración Residencial ("COAR Nights")',
        desc: 'Noches temáticas de cine debate, juegos de mesa gigantes, karaoke y competencias recreativas entre pabellones para disipar el estrés acumulado.'
      },
      {
        name: 'Mantenimiento Preventivo Ágil de Sanitarios y Lavandería',
        desc: 'Canal de reporte express mediante código QR en cada pabellón para registrar fallas de agua caliente o lavadoras con resolución en menos de 24h.'
      }
    ]
  },
  sustainability: {
    title: 'Sostenibilidad y Campus Verde',
    subtitle: 'Liderado por Jhon Kawai',
    badge: 'Eje 03 • Conciencia Ecológica',
    color: '#10b981',
    intro: 'Convertiremos nuestro campus en un referente de economía circular y respeto medioambiental, demostrando que los estudiantes podemos liderar la transición ecológica con acciones concretas.',
    initiatives: [
      {
        name: 'Proyecto "Campus Verde" y Huerto Escolar Orgánico',
        desc: 'Reactivación de bancales de cultivo biointensivo con hortalizas y plantas aromáticas cuidadas por delegados ambientales de cada aula.'
      },
      {
        name: 'Punto Limpio COAR & Reciclaje Electrónico (RAEE)',
        desc: 'Contenedores específicos para cables, baterías y componentes en desuso, en convenio con gestores autorizados y talleres de reacondicionamiento.'
      },
      {
        name: 'Campaña "Cero Desperdicio de Alimentos"',
        desc: 'Monitoreo colaborativo del pesaje de mermas en comedor y compostaje pedagógico de residuos orgánicos para abono del campus.'
      },
      {
        name: 'Auditorías Estudiantiles de Eficiencia Energética',
        desc: 'Reconocimiento mensual al pabellón más eficiente en consumo hídrico y eléctrico, promoviendo el apagado consciente de luces y equipos.'
      }
    ]
  },
  innovation: {
    title: 'Innovación Académica y Herramientas Digitales',
    subtitle: 'Liderado por Huaches Rimaches (DICTADOR)',
    badge: 'Eje 04 • Vanguardia Digital',
    color: '#06b6d4',
    intro: 'La exigencia del Bachillerato Internacional y el currículo COAR requiere herramientas modernas. Pondremos la tecnología al servicio del aprendizaje solidario y colaborativo.',
    initiatives: [
      {
        name: 'Plataforma "COAR Share": Banco Colaborativo de Apuntes',
        desc: 'Repositorio en Google Drive institucional categorizado por asignaturas IB, con resúmenes verificados, monografías modelo y fichas de estudio.'
      },
      {
        name: 'Banco de Préstamo Rápido de Calculadoras y Accesorios',
        desc: 'Gestión transparente de calculadoras de pantalla gráfica (GDC), adaptadores HDMI y cargadores de emergencia para jornadas de evaluación.'
      },
      {
        name: 'Club de Programación, Robótica e Inteligencia Artificial',
        desc: 'Talleres prácticos extracurriculares de Python, diseño 3D y uso ético de herramientas de IA aplicada a la investigación académica.'
      },
      {
        name: 'Maratones de Estudio Pre-Evaluaciones IB / COAR',
        desc: 'Espacios de asesoría entre pares donde alumnos con fortalezas en áreas específicas resuelven dudas en vivo antes de exámenes clave.'
      }
    ]
  }
};

const regidoresData = {
  valeria: {
    name: 'Rainer Quispe Torres ("España")',
    role: 'Regidor de Deportes • Becado en España 🇪🇸',
    badge: 'Deportes',
    photo: 'assets/rainer_quispe.jpg',
    quote: '"Desde mi experiencia como becado en España, sé que el deporte y la disciplina forjan mentes imparables. Vamos a llevar el deporte COAR al más alto nivel."',
    bio: 'Destacado estudiante y deportista escolar becado en España. Aporta una visión internacional y moderna para transformar el deporte COAR en un espacio de superación, compañerismo y desestrés total.',
    proposals: [
      'Ligas Deportivas Inter-Aulas e Inter-Casas con estándares de alto rendimiento.',
      'Torneo Oficial de E-Sports COAR (FIFA, Valorant, Clash Royale) con reglas de juego limpio.',
      'Pausas Activas Guiadas de 10 minutos durante las jornadas de estudio intensivo.',
      'Adquisición y renovación comunitaria de material deportivo para horas libres en residencias.'
    ]
  },
  mateo_s: {
    name: 'Jhon Kawai',
    role: 'Regidor de Medio Ambiente y Sostenibilidad',
    badge: 'Medio Ambiente',
    photo: 'assets/jhon_kawai.jpg',
    quote: '"Un líder que cuida su entorno es un líder que asegura el futuro de su comunidad."',
    bio: 'Activista juvenil por la ecología y coordinador de proyectos comunitarios. Su meta es integrar la sostenibilidad en la vida diaria de los residentes del COAR con proyectos prácticos de alto impacto.',
    proposals: [
      'Proyecto "Campus Verde": Huerto escolar ecológico y zonas de sombra arboladas.',
      'Campaña de Reciclaje Tecnológico y puntos de recolección de pilas y artefactos.',
      'Estaciones de compostaje con restos vegetales del comedor para las áreas verdes.',
      'Talleres CAS de reutilización creativa y cuidado del recurso hídrico en residencias.'
    ]
  },
  camila: {
    name: 'Baldocedo Funk',
    role: 'Regidora de Cultura y Bienestar',
    badge: 'Cultura & Bienestar',
    photo: 'assets/baldocedo_funk.jpg',
    quote: '"El arte, la integración lúdica con la ruleta de emociones y la buena vibra son la mejor medicina frente al estrés del COAR."',
    bio: 'Representante cultural, amante de las artes plásticas, el teatro y la mediación de conflictos. Dedicada a crear un ecosistema escolar cálido, solidario y mentalmente enriquecedor.',
    proposals: [
      'Noches de Talento y Expresión Artística "COAR Fest" para música, declamación y danza.',
      'Espacio "Respira COAR": Módulos de autorregulación emocional y escucha entre pares.',
      'Café Literario y Círculos de Conversación sobre películas y lecturas recreativas.',
      'Mural Comunitario y vitrinas para exponer obras plásticas y literarias estudiantiles.'
    ]
  },
  mateo_c: {
    name: 'Huaches Rimaches (DICTADOR)',
    role: 'Regidor de Innovación y Tecnología',
    badge: 'Innovación',
    photo: 'assets/huaches_rimaches.jpg',
    quote: '"Bajo mi régimen digital nadie se queda sin monografía aprobada ni calculadora GDC disponible. Disciplina, tecnología y excelencia."',
    bio: 'Estratega implacable de la innovación escolar. Su visión busca máxima eficiencia digital, orden estricto en los recursos compartidos y cero excusas para el éxito en el Bachillerato Internacional.',
    proposals: [
      'Repositorio Digital "COAR Share" en la nube con recursos verificados al 100%.',
      'Banco Comunitario de herramientas técnicas (calculadoras GDC, periféricos y cables).',
      'Régimen intensivo de hackatones y soluciones de software para la vida COAR.',
      'Talleres directos de Inteligencia Artificial práctica y programación avanzada.'
    ]
  }
};

function initModals() {
  const modalBackdrop = document.getElementById('info-modal');
  const modalContent = document.getElementById('modal-dynamic-content');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modalBackdrop || !modalContent) return;

  function closeModal() {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Abrir modal de Ejes de Gobierno
  document.querySelectorAll('.open-axis-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const axisKey = btn.getAttribute('data-axis');
      const data = proposalsData[axisKey];
      if (!data) return;

      modalContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <span style="background:${data.color}22; color:${data.color}; border:1px solid ${data.color}55; padding:0.3rem 0.85rem; border-radius:9999px; font-size:0.8rem; font-weight:700;">
            ${data.badge}
          </span>
        </div>
        <h2 style="font-size:1.85rem; margin-bottom:0.4rem; color:#fff;">${data.title}</h2>
        <p style="color:var(--accent-gold-light); font-weight:600; font-size:0.95rem; margin-bottom:1.25rem;">${data.subtitle}</p>
        <p style="color:var(--text-muted); font-size:1rem; line-height:1.7; margin-bottom:2rem; background:rgba(255,255,255,0.03); padding:1.2rem; border-radius:14px; border:1px solid var(--border-glass);">
          ${data.intro}
        </p>

        <h3 style="font-size:1.2rem; margin-bottom:1.2rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
          <span style="color:${data.color};">✦</span> Medidas Concretas de Acción
        </h3>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          ${data.initiatives
            .map(
              (init, idx) => `
            <div style="background:rgba(15,23,42,0.8); border:1px solid var(--border-glass); border-radius:14px; padding:1.1rem; display:flex; gap:1rem;">
              <div style="background:${data.color}20; color:${data.color}; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0;">
                0${idx + 1}
              </div>
              <div>
                <h4 style="font-size:1rem; font-weight:700; margin-bottom:0.3rem; color:#fff;">${init.name}</h4>
                <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6;">${init.desc}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div style="margin-top:2.5rem; display:flex; justify-content:flex-end;">
          <button class="btn btn-gold btn-sm" id="btn-modal-support" style="width:100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Respaldar este Eje de Gobierno
          </button>
        </div>
      `;

      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';

      document.getElementById('btn-modal-support')?.addEventListener('click', () => {
        closeModal();
        triggerSupportVote();
      });
    });
  });

  // Abrir modal de Regidores
  document.querySelectorAll('.open-team-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const regId = btn.getAttribute('data-team');
      const data = regidoresData[regId];
      if (!data) return;

      modalContent.innerHTML = `
        <div style="display:flex; gap:1.75rem; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap;">
          <img src="${data.photo}" alt="${data.name}" style="width:120px; height:120px; border-radius:20px; object-fit:cover; border:2px solid var(--accent-gold); box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <div style="flex:1; min-width:240px;">
            <span style="background:rgba(37,99,235,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3); padding:0.25rem 0.75rem; border-radius:9999px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
              ${data.badge}
            </span>
            <h2 style="font-size:1.75rem; margin-top:0.4rem; margin-bottom:0.2rem; color:#fff;">${data.name}</h2>
            <p style="color:var(--accent-gold-light); font-weight:600; font-size:0.95rem;">${data.role}</p>
          </div>
        </div>

        <blockquote style="background:rgba(37,99,235,0.08); border-left:3px solid var(--primary-light); padding:1rem 1.25rem; border-radius:0 12px 12px 0; font-style:italic; color:#e2e8f0; margin-bottom:1.5rem; font-size:0.95rem;">
          ${data.quote}
        </blockquote>

        <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.7; margin-bottom:1.75rem;">
          ${data.bio}
        </p>

        <h3 style="font-size:1.15rem; margin-bottom:1rem; color:#fff;">Propuestas Clave para su Gestión:</h3>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${data.proposals
            .map(
              (prop) => `
            <div style="display:flex; align-items:flex-start; gap:0.65rem; font-size:0.9rem; color:#cbd5e1;">
              <span style="color:var(--accent-gold); font-size:1.1rem; line-height:1;">★</span>
              <span>${prop}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `;

      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
}

/* ==========================================================================
   7. BUZÓN ESTUDIANTIL & MURO DE IDEAS (CON LOCALSTORAGE)
   ========================================================================== */
const DEFAULT_IDEAS = [
  {
    id: 1,
    name: 'Andrea P.',
    grade: '4° Secundaria',
    category: 'Vida Residencial',
    catClass: 'cat-residential',
    text: 'Sería genial habilitar más tomas eléctricas y mesas en el patio exterior para estudiar al aire libre en las tardes.',
    time: 'Hace 2 horas',
    likes: 24,
    likedByUser: false
  },
  {
    id: 2,
    name: 'Sebastián M.',
    grade: '5° Secundaria (IB)',
    category: 'Innovación',
    catClass: 'cat-tech',
    text: 'Apoyo al 100% el repositorio COAR Share. Necesitamos unificar las monografías modelo de años anteriores para guiarnos.',
    time: 'Hace 4 horas',
    likes: 41,
    likedByUser: false
  },
  {
    id: 3,
    name: 'Luciana F.',
    grade: '3° Secundaria',
    category: 'Salud Mental',
    catClass: 'cat-mental',
    text: 'Por favor, incluyan talleres de técnicas de estudio para los ingresantes de 3ro, adaptarnos al ritmo del COAR es un gran reto.',
    time: 'Ayer',
    likes: 38,
    likedByUser: false
  },
  {
    id: 4,
    name: 'Diego R.',
    grade: '4° Secundaria',
    category: 'Deportes',
    catClass: 'cat-sports',
    text: '¡Las ligas de fútbol y e-sports suenan excelentes! Sugiero que también haya campeonato relámpago de vóley mixto.',
    time: 'Hace 2 días',
    likes: 19,
    likedByUser: false
  }
];

function initMailboxAndIdeasWall() {
  const form = document.getElementById('mailbox-form');
  const wallContainer = document.getElementById('ideas-wall-list');
  const countBadge = document.getElementById('ideas-count');

  if (!wallContainer) return;

  // Cargar de LocalStorage o inicializar
  let ideas = JSON.parse(localStorage.getItem('coar_student_ideas'));
  if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
    ideas = DEFAULT_IDEAS;
    localStorage.setItem('coar_student_ideas', JSON.stringify(ideas));
  }

  function renderIdeas() {
    wallContainer.innerHTML = '';
    if (countBadge) countBadge.textContent = `${ideas.length} Propuestas`;

    ideas.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'idea-item-card';
      card.innerHTML = `
        <div class="idea-item-top">
          <div class="idea-author">
            <span>${escapeHTML(item.name)}</span>
            <span class="idea-grade-tag">${escapeHTML(item.grade)}</span>
          </div>
          <span class="idea-category-tag ${item.catClass}">${escapeHTML(item.category)}</span>
        </div>
        <p class="idea-text">${escapeHTML(item.text)}</p>
        <div class="idea-item-footer">
          <span class="idea-time">${item.time}</span>
          <button class="idea-like-btn ${item.likedByUser ? 'liked' : ''}" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.likedByUser ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span class="like-num">${item.likes}</span>
          </button>
        </div>
      `;

      // Evento Like
      card.querySelector('.idea-like-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const targetId = parseInt(btn.getAttribute('data-id'));
        const ideaObj = ideas.find((i) => i.id === targetId);
        if (!ideaObj) return;

        if (ideaObj.likedByUser) {
          ideaObj.likes--;
          ideaObj.likedByUser = false;
        } else {
          ideaObj.likes++;
          ideaObj.likedByUser = true;
          playUiSound('heart');
        }

        localStorage.setItem('coar_student_ideas', JSON.stringify(ideas));
        renderIdeas();
      });

      wallContainer.appendChild(card);
    });
  }

  renderIdeas();

  // Enviar nueva sugerencia
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('mb-name').value.trim();
      const gradeInput = document.getElementById('mb-grade').value;
      const catInput = document.getElementById('mb-category').value;
      const textInput = document.getElementById('mb-message').value.trim();

      if (!textInput) {
        showToast('Por favor escribe tu propuesta antes de enviar.', 'error');
        return;
      }

      const categoryMap = {
        residential: { label: 'Vida Residencial', class: 'cat-residential' },
        mental: { label: 'Salud Mental', class: 'cat-mental' },
        sports: { label: 'Deportes', class: 'cat-sports' },
        eco: { label: 'Medio Ambiente', class: 'cat-eco' },
        tech: { label: 'Innovación', class: 'cat-tech' },
        other: { label: 'General', class: 'cat-residential' }
      };

      const selectedCat = categoryMap[catInput] || categoryMap.other;

      const newIdea = {
        id: Date.now(),
        name: nameInput || 'Estudiante COAR',
        grade: gradeInput || 'Comunidad COAR',
        category: selectedCat.label,
        catClass: selectedCat.class,
        text: textInput,
        time: 'Recién publicado',
        likes: 1,
        likedByUser: true
      };

      ideas.unshift(newIdea);
      localStorage.setItem('coar_student_ideas', JSON.stringify(ideas));
      renderIdeas();

      form.reset();
      playUiSound('success');
      launchConfetti();
      showToast('¡Propuesta enviada con éxito! Tu voz cuenta para Liderazgo COAR 🚀', 'success');
    });
  }
}

/* ==========================================================================
   8. SIMULADOR DE RESPALDO Y VOTO SIMBÓLICO
   ========================================================================== */
function initSupportVote() {
  const supportBtn = document.getElementById('btn-give-support');
  const countEl = document.getElementById('support-count');
  const percentEl = document.getElementById('support-percentage');

  let currentCount = parseInt(localStorage.getItem('coar_support_count')) || 487;
  let hasSupported = localStorage.getItem('coar_has_supported') === 'true';

  if (countEl) countEl.textContent = currentCount.toLocaleString();
  if (percentEl) percentEl.textContent = '89.4%';

  if (hasSupported && supportBtn) {
    supportBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
      ¡Respaldo Registrado! Gracias por Sumarte
    `;
    supportBtn.classList.remove('btn-gold');
    supportBtn.classList.add('btn-secondary');
  }

  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      triggerSupportVote();
    });
  }
}

function triggerSupportVote() {
  const supportBtn = document.getElementById('btn-give-support');
  const countEl = document.getElementById('support-count');
  let currentCount = parseInt(localStorage.getItem('coar_support_count')) || 487;
  let hasSupported = localStorage.getItem('coar_has_supported') === 'true';

  if (hasSupported) {
    showToast('¡Ya has respaldado a Joel Jonas y la lista Liderazgo COAR! ⭐', 'success');
    return;
  }

  currentCount++;
  localStorage.setItem('coar_support_count', currentCount);
  localStorage.setItem('coar_has_supported', 'true');

  if (countEl) countEl.textContent = currentCount.toLocaleString();

  if (supportBtn) {
    supportBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
      ¡Respaldo Registrado! Gracias por Sumarte
    `;
    supportBtn.classList.remove('btn-gold');
    supportBtn.classList.add('btn-secondary');
  }

  playUiSound('success');
  launchConfetti();
  showToast('¡Gracias por tu respaldo a Joel Jonas Mendoza! Construyamos el COAR del futuro.', 'success');
}

/* ==========================================================================
   9. GENERADOR DE CREDENCIAL / STICKER DIGITAL (CANVAS EXPORT)
   ========================================================================== */
function initCredentialGenerator() {
  const generateBtn = document.getElementById('btn-gen-sticker');
  const nameInput = document.getElementById('sticker-name-input');
  const previewCanvas = document.getElementById('sticker-canvas');

  if (!generateBtn || !previewCanvas) return;

  const ctx = previewCanvas.getContext('2d');

  function drawBadge(name) {
    const studentName = name || 'LÍDER COAR';

    // Canvas dimensions: 600 x 360
    previewCanvas.width = 600;
    previewCanvas.height = 360;

    // Fondo degradado futurista
    const gradient = ctx.createLinearGradient(0, 0, 600, 360);
    gradient.addColorStop(0, '#0b1120');
    gradient.addColorStop(0.5, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 360);

    // Borde exterior dorado y azul
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 340);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, 568, 328);

    // Encabezado
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 15px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('COLEGIO DE ALTO RENDIMIENTO • MUNICIPIO ESCOLAR', 30, 48);

    // Título Principal
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('YO APOYO A LIDERAZGO COAR', 30, 90);

    // Candidato
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('JOEL JONAS MENDOZA CURIÑAUPA', 30, 120);

    // Lema
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 15px sans-serif';
    ctx.fillText('"Excelencia con Empatía: Un COAR donde tu voz cuenta"', 30, 148);

    // Línea divisoria
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 170);
    ctx.lineTo(570, 170);
    ctx.stroke();

    // Caja con nombre de estudiante
    ctx.fillStyle = 'rgba(37,99,235,0.2)';
    ctx.fillRect(30, 190, 540, 75);
    ctx.strokeStyle = 'rgba(59,130,246,0.5)';
    ctx.strokeRect(30, 190, 540, 75);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px sans-serif';
    ctx.fillText('RESPALDO ESTUDIANTIL OFICIAL EMITIDO PARA:', 45, 215);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(studentName.toUpperCase(), 45, 248);

    // Pie de la credencial
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('✔ VOTO CON CONVICCIÓN • ELECCIONES COAR 2026', 30, 310);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('#ExcelenciaConEmpatía #LiderazgoCOAR', 360, 310);
  }

  drawBadge('Estudiante COAR');

  nameInput?.addEventListener('input', (e) => {
    drawBadge(e.target.value.trim());
  });

  generateBtn.addEventListener('click', () => {
    const val = nameInput ? nameInput.value.trim() : '';
    drawBadge(val);

    // Descargar imagen
    const imageLink = document.createElement('a');
    imageLink.download = `Respaldo_Joel_Jonas_COAR_${val ? val.replace(/\s+/g, '_') : 'Estudiante'}.png`;
    imageLink.href = previewCanvas.toDataURL('image/png');
    imageLink.click();

    playUiSound('success');
    showToast('¡Sticker descargado! Compártelo con tus compañeros en WhatsApp o redes 📲', 'success');
  });
}

/* ==========================================================================
   10. EFECTO CONFETI DIGITAL (CANVAS ANIMATION)
   ========================================================================== */
function launchConfetti() {
  const confettiCanvas = document.createElement('canvas');
  confettiCanvas.style.position = 'fixed';
  confettiCanvas.style.top = '0';
  confettiCanvas.style.left = '0';
  confettiCanvas.style.width = '100vw';
  confettiCanvas.style.height = '100vh';
  confettiCanvas.style.pointerEvents = 'none';
  confettiCanvas.style.zIndex = '9999';
  document.body.appendChild(confettiCanvas);

  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const count = 120;
  const pieces = [];
  const colors = ['#2563eb', '#3b82f6', '#f59e0b', '#fbbf24', '#10b981', '#ffffff', '#8b5cf6'];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      w: Math.random() * 8 + 6,
      h: Math.random() * 6 + 4,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      gravity: 0.35,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1
    });
  }

  let frames = 0;
  function updateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    frames++;

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRotation;
      if (frames > 40) {
        p.opacity -= 0.015;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (frames < 110) {
      requestAnimationFrame(updateConfetti);
    } else {
      confettiCanvas.remove();
    }
  }

  updateConfetti();
}

/* ==========================================================================
   11. PREGUNTAS FRECUENTES (FAQ ACORDEÓN)
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach((other) => other.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
        playUiSound('soft-click');
      }
    });
  });
}

/* ==========================================================================
   12. NOTIFICACIONES TOAST
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:1.2rem;">${type === 'success' ? '✨' : 'ℹ️'}</span>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 20);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

/* ==========================================================================
   13. SCROLL REVEAL OBSERVER
   ========================================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
}

// Utilidad para prevenir XSS en inputs de usuarios
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
