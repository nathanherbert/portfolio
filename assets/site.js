// Textes des interactions
const TERMINAL_REPLIES = {
  "help": "commandes disponibles :\n  whoami      qui je suis\n  projets     liste des projets\n  skills      compétences principales\n  stage       infos sur ma recherche de stage\n  contact     comment me joindre\n  clear       nettoyer le terminal",
  "whoami": "nathan — 18 ans — BTS SIO SISR — futur pentester.\nobjectif : cybersécurité offensive & défensive.",
  "skills": "linux · réseaux (osi, tcp/ip) · virtualisation · nmap · burp suite\nhtml/css · react · typescript · python (bases) · git",
  "stage": "recherche : stage bts sio sisr — 24 mai → 2 juillet 2027\nzone : paris / val-de-marne / champs-sur-marne / est parisien",
  "contact": "coordonnées en cours de configuration — voir la page contact",
  "sudo": "nathan n’est pas dans le fichier sudoers. Cet incident sera signalé.",
  "rm": "tentative détectée. loggée. jugée.",
  "rm -rf /": "tentative détectée. loggée. jugée."
};
const TERMINAL_PROJECTS = [
  "01/ homelab multifonction",
  "02/ ia locale pour la cyber",
  "03/ thinkpad sous linux",
  "04/ ubuntu + hyprland",
  "05/ lab root me / ctf",
  "06/ ce portfolio"
];
const TERMINAL_UNKNOWN = ": commande introuvable — tape « help »";
const CONTACT_MESSAGES = {
  "sending": "Envoi en cours…",
  "loading": "Validation du message en cours…",
  "success": "Votre message a été envoyé.",
  "demoSuccess": "Démonstration terminée : le formulaire est valide. Aucun message n’a été envoyé.",
  "error": "L’envoi a échoué. Veuillez réessayer.",
  "invalid": "Veuillez corriger les champs indiqués."
};

// Navigation et horloge
function initializeHeader(header) {
  const clock = header.querySelector('[data-clock]');
  const format = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'medium' });
  function updateClock() {
    const time = format.format(new Date());
    clock.textContent = time;
    clock.dateTime = time;
  }
  updateClock();
  setInterval(updateClock, 1000);

  const button = header.querySelector('[aria-controls="mobile-navigation"]');
  const navigation = header.querySelector('.header-navigation').cloneNode(true);
  navigation.id = 'mobile-navigation';
  navigation.className = 'mobile-navigation desktop-hidden';
  const desktop = matchMedia('(min-width: 1024px)');

  function setOpen(open) {
    if (open) header.append(navigation);
    else navigation.remove();
    button.textContent = open ? button.dataset.labelOpen : button.dataset.labelClosed;
    button.setAttribute('aria-expanded', String(open));
  }

  button.addEventListener('click', () => setOpen(!navigation.isConnected));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.isConnected) {
      setOpen(false);
      button.focus();
    }
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) setOpen(false);
  });
  header.dataset.menuReady = '';
  button.hidden = false;
}

// Loupe de l’accueil
function initializeSpotlight(lens) {
  const section = lens.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(pointer: fine)');
  let frameId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let visible = false;
  let inside = false;
  let cursorX = 0;
  let cursorY = 0;
  let x = section.clientWidth * 0.6;
  let y = section.clientHeight * 0.4;
  let targetX = x;
  let targetY = y;
  let radius = 0;
  let targetRadius = 0;

  const maxRadius = () => Math.min(160, section.clientWidth * 0.3);
  const drifts = () => !pointer.matches && !motion.matches;

  function paint() {
    lens.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
  }

  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
  }

  function snapToTarget() {
    x = targetX;
    y = targetY;
    radius = targetRadius;
  }

  function frame(time) {
    frameId = 0;
    const delta = lastTime ? Math.min(time - lastTime, 64) : 1000 / 60;
    lastTime = time;

    if (drifts()) {
      elapsed += delta / 1000;
      const centerX = section.clientWidth / 2;
      const centerY = section.clientHeight / 2;
      targetX = centerX + Math.cos(elapsed * 0.24) * centerX * 0.45;
      targetY = centerY + Math.sin(elapsed * 0.31) * centerY * 0.3;
      targetRadius = maxRadius();
    }

    const ease = 1 - Math.pow(0.88, delta / (1000 / 60));
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    radius += (targetRadius - radius) * ease;
    const settled = Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(targetRadius - radius) < 0.1;
    if (settled) snapToTarget();
    paint();

    if (visible && !document.hidden && (drifts() || !settled)) {
      frameId = requestAnimationFrame(frame);
    } else {
      lastTime = 0;
    }
  }

  function update() {
    if (!visible || document.hidden) {
      stop();
    } else if (motion.matches) {
      stop();
      snapToTarget();
      paint();
    } else if (!frameId) {
      frameId = requestAnimationFrame(frame);
    }
  }

  function move(event) {
    if (!pointer.matches || event.pointerType === 'touch') return;
    const bounds = section.getBoundingClientRect();
    cursorX = event.clientX;
    cursorY = event.clientY;
    targetX = cursorX - bounds.left;
    targetY = cursorY - bounds.top;
    targetRadius = maxRadius();
    if (!inside) {
      x = targetX;
      y = targetY;
    }
    inside = true;
    update();
  }

  function leave() {
    inside = false;
    targetRadius = 0;
    update();
  }

  function scroll() {
    if (!inside || !pointer.matches) return;
    const bounds = section.getBoundingClientRect();
    targetX = cursorX - bounds.left;
    targetY = cursorY - bounds.top;
    if (targetY < 0 || targetY > bounds.height) leave();
    else update();
  }

  function preferenceChanged() {
    stop();
    if (!pointer.matches) inside = false;
    targetRadius = inside ? maxRadius() : 0;
    if (motion.matches) {
      snapToTarget();
      paint();
    }
    update();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(section);
  new ResizeObserver(() => {
    targetRadius = inside || drifts() ? maxRadius() : 0;
    if (inside) scroll();
    update();
  }).observe(section);
  section.addEventListener('pointerenter', move);
  section.addEventListener('pointermove', move);
  section.addEventListener('pointerleave', leave);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('blur', leave);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', preferenceChanged);
  pointer.addEventListener('change', preferenceChanged);
}

// Mots animés de la présentation
function initializeGlitch(word) {
  const substitutions = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', l: '1', u: 'µ' };
  const visible = word.querySelector('[aria-hidden="true"]');
  const original = visible.textContent;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;

  function restore() {
    clearInterval(timer);
    timer = 0;
    visible.textContent = original;
  }

  function animate() {
    if (timer || motion.matches) return;
    timer = setInterval(() => {
      visible.textContent = Array.from(original, character => {
        const lower = character.toLowerCase();
        const replacement = substitutions[lower];
        if (!replacement || Math.random() <= 0.35) return character;
        return character === lower ? replacement : replacement.toUpperCase();
      }).join('');
    }, 90);
    setTimeout(restore, 800);
  }

  word.addEventListener('pointerenter', animate);
  word.addEventListener('pointerdown', animate);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Terminal simulé
function initializeTerminal(terminal) {
  const form = terminal.querySelector('[data-terminal-command]');
  const input = form.querySelector('input');
  const body = form.parentElement;
  const cursor = body.querySelector('.caret-blink');
  const bootLines = [...body.querySelectorAll(':scope > p')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const replies = TERMINAL_REPLIES;
  const projects = TERMINAL_PROJECTS;
  let booting = false;

  function scrollToPrompt() {
    body.scrollTop = body.scrollHeight;
  }

  function finishBoot() {
    booting = false;
    cursor.hidden = true;
    form.hidden = false;
    scrollToPrompt();
  }

  async function boot() {
    if (motion.matches) {
      finishBoot();
      return;
    }

    booting = true;
    cursor.hidden = false;
    bootLines.forEach(line => { line.hidden = true; });
    for (const line of bootLines) {
      if (!booting) return;
      line.classList.add('chunk-in');
      line.hidden = false;
      if (!line.hasAttribute('data-command')) continue;
      const command = line.lastChild;
      const text = command.nodeValue;
      for (let index = 1; index <= text.length; index++) {
        command.nodeValue = text.slice(0, index);
        scrollToPrompt();
        await delay(24);
        if (!booting) {
          command.nodeValue = text;
          return;
        }
      }
      await delay(120);
    }
    finishBoot();
  }

  motion.addEventListener('change', () => {
    if (motion.matches && booting) {
      bootLines.forEach(line => { line.hidden = false; });
      finishBoot();
    }
  });

  function addLine(text, command) {
    const line = document.createElement('p');
    line.className = command ? 'chunk-in whitespace-pre-wrap text-terminal-green' : 'chunk-in mb-2 whitespace-pre-wrap text-white-70';
    if (command) {
      const prompt = document.createElement('span');
      prompt.className = 'text-white-40';
      prompt.setAttribute('aria-hidden', 'true');
      prompt.textContent = '$ ';
      line.append(prompt);
    }
    line.append(text);
    form.before(line);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const raw = input.value;
    const command = raw.trim().toLowerCase();
    input.value = '';

    if (command === 'clear') {
      body.querySelectorAll(':scope > p').forEach(line => line.remove());
      return;
    }

    addLine(raw, true);
    const reply = command === 'ls' || command === 'projets'
      ? projects.join('\n')
      : Object.hasOwn(replies, command) ? replies[command] : command + TERMINAL_UNKNOWN;
    if (command && reply) addLine(reply, false);
    scrollToPrompt();
  });
  terminal.addEventListener('click', () => input.focus({ preventScroll: true }));
  void boot();
}

// Formulaire de contact
function initializeContact(form) {
  const messages = CONTACT_MESSAGES;
  const endpoint = form.dataset.endpoint.trim();
  const fieldset = form.querySelector('fieldset');
  const fields = [...form.querySelectorAll('input, textarea')];
  const submit = form.querySelector('button[type="submit"]');
  const feedback = form.querySelector('[role="status"] p');
  const sendLabel = submit.textContent;
  let pending = false;

  function showFieldError(field, invalid) {
    const error = form.querySelector('#error-' + field.name);
    field.setAttribute('aria-invalid', String(invalid));
    error.hidden = !invalid;
    if (invalid) field.setAttribute('aria-describedby', error.id);
    else field.removeAttribute('aria-describedby');
  }

  function showFeedback(text) {
    feedback.textContent = text;
    feedback.hidden = !text;
  }

  function setPending(value) {
    pending = value;
    fieldset.disabled = value;
    form.setAttribute('aria-busy', String(value));
    submit.textContent = value ? messages.sending : sendLabel;
  }

  async function send(values) {
    if (!endpoint) {
      await delay(600);
      return;
    }
    if (!endpoint.startsWith('https://') && !/^\/(?!\/)/.test(endpoint)) {
      throw new Error(messages.error);
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(values)
    });
    if (!response.ok) throw new Error(messages.error);
  }

  for (const field of fields) {
    field.addEventListener('input', () => {
      showFieldError(field, false);
      showFeedback('');
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(fields.map(field => [field.name, field.value.trim()]));
    const invalidFields = [];
    for (const field of fields) {
      const value = values[field.name];
      const invalid = value.length > field.maxLength || (field.type === 'email'
        ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        : value.length < field.minLength);
      showFieldError(field, invalid);
      if (invalid) invalidFields.push(field);
    }
    if (invalidFields.length) {
      showFeedback(messages.invalid);
      invalidFields[0].focus();
      return;
    }

    setPending(true);
    showFeedback(endpoint ? messages.sending : messages.loading);
    try {
      await send(values);
      form.reset();
      showFeedback(endpoint ? messages.success : messages.demoSuccess);
    } catch {
      showFeedback(messages.error);
    } finally {
      setPending(false);
    }
  });
  if (endpoint) document.querySelectorAll('[data-contact-demo]').forEach(notice => { notice.hidden = true; });
  fieldset.disabled = false;
}

initializeHeader(document.querySelector('header'));
const spotlight = document.querySelector('.spotlight-alternate');
if (spotlight) initializeSpotlight(spotlight);
document.querySelectorAll('.glitch-word').forEach(initializeGlitch);
const terminal = document.querySelector('[data-terminal]');
if (terminal) initializeTerminal(terminal);
const contactForm = document.querySelector('[data-contact]');
if (contactForm) initializeContact(contactForm);
