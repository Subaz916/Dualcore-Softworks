/* ============================================================
   DUALCORE SOFTWORKS — chatbot.js
   Floating FAQ chatbot (home page). Question-button only —
   no free-text input. Click a question, get the answer.
   ============================================================ */
(function () {
  'use strict';

  const QA = [
    {
      cat: 'General',
      items: [
        { q: 'Can I see your portfolio?', a: 'Absolutely! Scroll to the Work / Portfolio section to explore our recent projects and case studies.' },
        { q: 'Do you build mobile-friendly websites?', a: 'Yes. Every website we develop is fully responsive and optimized for desktops, tablets, and mobile devices.' },
        { q: 'Which technologies do you use?', a: 'We work with HTML, CSS, JavaScript, React, Next.js, Node.js, PHP, Laravel, Supabase, Firebase, MySQL, MongoDB, and other modern technologies.' },
      ],
    },
    {
      cat: 'Pricing & Payments',
      items: [
        { q: 'Do you offer fixed pricing?', a: 'We offer both fixed-price and custom quotes depending on the project scope.' },
        { q: 'Is there any advance payment?', a: 'Yes. Most projects require a 50% upfront payment, with the remaining balance due upon project completion.' },
        { q: 'Do you provide refunds?', a: 'Refunds are handled based on the stage of development at the time your request is made.' },
        { q: 'Which currencies do you accept?', a: 'We accept USD, EUR, GBP, PKR, and other major currencies depending on the payment method.' },
        { q: 'Can I pay in installments?', a: 'Yes. Installment plans may be available for larger projects.' },
        { q: 'Will I receive an invoice?', a: 'Yes. Every payment includes a professional invoice.' },
      ],
    },
    {
      cat: 'Services & Projects',
      items: [
        { q: 'Can you redesign my existing website?', a: 'Yes. We can modernize your website with a fresh design, improved performance, and better user experience.' },
        { q: 'Can you fix bugs on my website?', a: 'Yes. We provide debugging, performance optimization, and feature enhancements for existing websites.' },
        { q: 'Do you build custom web applications?', a: 'Yes. We develop custom dashboards, CRM systems, SaaS platforms, booking systems, portals, and other tailored web applications.' },
        { q: 'Can you improve my existing website instead of rebuilding it?', a: 'Yes. We can upgrade the design, improve speed, fix issues, and add new features to your current website.' },
        { q: 'Can you redesign only a few pages?', a: 'Yes. We can redesign individual pages or improve specific sections without rebuilding the entire website.' },
        { q: 'Can you build custom business software?', a: 'Yes. We create CRMs, ERP systems, inventory management, dashboards, and custom web applications.' },
      ],
    },
    {
      cat: 'Design',
      items: [
        { q: 'Can you create a custom design?', a: 'Absolutely. Every project can be custom-designed to match your brand identity and business goals.' },
        { q: 'Do you use website templates?', a: 'We can use premium templates if requested, but we specialize in fully custom website designs.' },
        { q: 'Can you match an existing design?', a: 'We can create a similar style while ensuring your website remains unique and tailored to your brand.' },
        { q: 'Can I choose the colors and fonts?', a: 'Absolutely. We will work with your branding or help you choose a professional color palette and typography.' },
        { q: 'Will my website be unique?', a: 'Yes. Every custom project is designed specifically for your business.' },
      ],
    },
    {
      cat: 'Performance & Mobile',
      items: [
        { q: 'Will my website load quickly?', a: 'Yes. We optimize every website for speed, performance, and user experience.' },
        { q: 'Do you optimize Core Web Vitals?', a: 'Yes. We follow best practices to improve loading speed and overall performance.' },
        { q: 'Is image optimization included?', a: 'Yes. Images are compressed and optimized without sacrificing quality.' },
        { q: 'Will my website work on mobile devices?', a: 'Yes. All websites are fully responsive and tested on mobile, tablet, and desktop devices.' },
        { q: 'Do you test on different browsers?', a: 'Yes. We ensure compatibility with Chrome, Edge, Firefox, Safari, and other modern browsers.' },
      ],
    },
    {
      cat: 'E-commerce',
      items: [
        { q: 'Can you build an online store?', a: 'Yes. We create secure e-commerce websites with product management, payment gateways, inventory tracking, and order management.' },
        { q: 'Which payment gateways do you support?', a: 'We can integrate Stripe, PayPal, and many other payment gateways depending on your region and business needs.' },
      ],
    },
    {
      cat: 'Features & Extras',
      items: [
        { q: 'Can you add a booking system?', a: 'Yes. We can add appointment scheduling and booking systems.' },
        { q: 'Can users create accounts?', a: 'Yes. We develop secure login, registration, and user dashboard systems.' },
        { q: 'Can I update my website myself?', a: 'Yes. If required, we provide an admin panel or CMS so you can manage your content.' },
        { q: 'Can you integrate APIs?', a: 'Yes. We integrate third-party APIs, payment gateways, CRMs, maps, and more.' },
        { q: 'Can my website send emails automatically?', a: 'Yes. We can configure automated emails for inquiries, orders, bookings, and notifications.' },
        { q: 'Can you add a blog to my website?', a: 'Yes. We can include a blog section so you can publish news, articles, and updates.' },
        { q: 'Can you connect my social media accounts?', a: 'Yes. We can integrate Facebook, Instagram, LinkedIn, X, YouTube, TikTok, and other platforms.' },
        { q: 'Do you create multilingual websites?', a: 'Yes. We can build websites that support multiple languages.' },
        { q: 'Can you help me choose a domain name?', a: 'Yes. We can suggest professional and memorable, brand-friendly domain names for your business.' },
      ],
    },
    {
      cat: 'SEO & Hosting',
      items: [
        { q: 'Will my website appear on Google?', a: 'We build SEO-friendly websites and can optimize them to improve search engine visibility.' },
        { q: 'Do you submit websites to Google?', a: 'Yes. We can help submit your website to Google Search Console for indexing.' },
        { q: 'Do you perform keyword research?', a: 'Yes. Our SEO packages include keyword research and optimization.' },
        { q: 'Can you provide hosting and a domain?', a: 'Yes. We can help you register a domain and set up reliable hosting.' },
        { q: 'Which hosting do you recommend?', a: 'We recommend hosting based on your website size, traffic, and budget.' },
        { q: 'Can you migrate my existing website?', a: 'Yes. We can safely migrate your website with minimal downtime.' },
        { q: 'Will I own my website after completion?', a: 'Yes. Once the final payment is complete, you own the website and its files.' },
      ],
    },
    {
      cat: 'Security & Launch',
      items: [
        { q: 'Is my website secure?', a: 'Yes. We implement SSL certificates, security best practices, and regular updates.' },
        { q: 'Do you provide backups?', a: 'Yes. Backup solutions can be included in our maintenance plans.' },
        { q: 'Will my website be protected from hackers?', a: 'We implement security measures to reduce risks and keep your website protected.' },
        { q: 'Will you deploy my website?', a: 'Yes. Deployment is included with every completed project.' },
        { q: 'Can you connect my domain?', a: 'Absolutely. We will connect your domain and configure hosting.' },
        { q: 'Will my website have downtime during launch?', a: 'We aim to minimize downtime and ensure a smooth deployment process.' },
      ],
    },
    {
      cat: 'Process & Timeline',
      items: [
        { q: 'What is your development process?', a: 'Our process includes consultation, planning, UI/UX design, development, testing, revisions, deployment, and post-launch support.' },
        { q: 'How do I get started?', a: 'Simply contact us or submit your project details through our contact form. We will schedule a free consultation to discuss your requirements.' },
        { q: 'How long does it take to start my project?', a: 'Most projects begin within 1–3 business days after the proposal is approved and the initial payment is received.' },
        { q: 'Can you deliver my project urgently?', a: 'Yes. We offer express development services for urgent projects, subject to availability.' },
        { q: 'What if my project scope changes?', a: 'We will review the new requirements, update the timeline and quote if needed, and continue after your approval.' },
        { q: 'Can I make changes while building?', a: 'Yes. Small changes can usually be made during development. Larger feature requests may require additional time.' },
        { q: 'How many revisions do I get?', a: 'We include multiple revisions so we can refine the website until it matches the approved project plan.' },
        { q: 'Do you provide free consultations?', a: 'Yes! We offer a free initial consultation to understand your project and recommend the best solution.' },
        { q: 'Will I receive updates during development?', a: 'Yes. We provide regular progress updates and share preview versions throughout the project.' },
      ],
    },
    {
      cat: 'Contact & Support',
      items: [
        { q: 'How can I get a quote?', a: 'Simply tell us about your project, including the type of website, required features, and preferred timeline — we will prepare a personalized quote.' },
        { q: 'How can I contact your team?', a: 'You can contact us via the contact page, email, or WhatsApp.' },
        { q: 'Do you work with international clients?', a: 'Yes! We work with clients worldwide and communicate through email, WhatsApp, Zoom, Google Meet, and other online platforms.' },
        { q: 'What are your working hours?', a: 'Our team is available Monday–Friday, 9:00 AM–6:00 PM (local time). Premium plans may include extended hours.' },
        { q: 'How quickly do you reply?', a: 'We usually respond within 1–4 hours during business hours, and within 24 hours on weekends or holidays.' },
        { q: 'Can we schedule a video call?', a: 'Yes. We can arrange a Zoom or Google Meet call at a time that works for you.' },
        { q: 'Do you offer 24/7 maintenance?', a: 'We offer monitoring, updates, backups, and security improvements. Premium support plans cover more.' },
        { q: 'What happens if I find a bug after launch?', a: 'We will fix any issues covered under your support or warranty period.' },
        { q: 'Can I hire you for future updates?', a: 'Absolutely. We offer ongoing development and maintenance services whenever you need them.' },
        { q: 'Why should I choose your agency?', a: 'We focus on custom designs, clean code, fast performance, responsive layouts, SEO best practices, transparent communication, and reliable post-launch support.' },
      ],
    },
  ];

  const qs = (s) => document.querySelector(s);
  const fab = qs('#chatFab');
  const panel = qs('#chatPanel');
  const closeBtn = qs('#chatClose');
  const stream = qs('#chatStream');
  const qaList = qs('#chatQa');
  const qaToggle = qs('#chatQaToggle');

  if (!fab || !panel || !stream || !qaList || !qaToggle) return;

  document.body.classList.add('has-chatbot');

  let open = false;

  function scrollBottom() {
    const body = qs('#chatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function setQuestions(visible) {
    qaList.style.display = visible ? '' : 'none';
    qaToggle.style.display = visible ? 'none' : 'flex';
    if (visible) scrollBottom();
  }

  function addMsg(who, text) {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + who;
    const tag = document.createElement('b');
    tag.textContent = who === 'user' ? 'You' : 'Dualcore Assistant';
    const p = document.createElement('p');
    p.textContent = text;
    el.appendChild(tag);
    el.appendChild(p);
    stream.appendChild(el);
    scrollBottom();
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'chat-msg bot chat-typing';
    el.innerHTML = '<b>Dualcore Assistant</b><div class="chat-typing-io"><i></i><i></i><i></i></div>';
    stream.appendChild(el);
    scrollBottom();
    return el;
  }

  function say(q, a) {
    addMsg('user', q);
    const ty = addTyping();
    setTimeout(() => {
      ty.remove();
      addMsg('bot', a);
    }, 550 + Math.random() * 450);
  }

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    panel.classList.toggle('open', open);
    fab.classList.toggle('open', open);
    document.body.classList.toggle('chat-open', open);
    fab.setAttribute('aria-expanded', String(open));
    if (open) {
      setQuestions(true);
      scrollBottom();
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', () => toggle(false));
  fab.addEventListener('click', () => toggle());
  qaToggle.addEventListener('click', () => setQuestions(true));

  function renderQA() {
    qaList.innerHTML = QA.map((group, gi) =>
      '<section class="chat-cat">' +
        '<button type="button" class="chat-cat-head' + (gi === 0 ? ' active' : '') + '" data-cat="' + gi + '">' +
          esc(group.cat) +
          '<span class="chat-cat-num">' + group.items.length + '</span>' +
          '<i class="chat-cat-chev"></i>' +
        '</button>' +
        '<div class="chat-cat-body"' + (gi === 0 ? '' : ' style="display:none"') + '>' +
          group.items.map((item, qi) =>
            '<button type="button" class="chat-q" data-cat="' + gi + '" data-q="' + qi + '">' + esc(item.q) + '</button>'
          ).join('') +
        '</div>' +
      '</section>'
    ).join('');

    Array.from(qaList.querySelectorAll('.chat-cat-head')).forEach((h) => {
      h.addEventListener('click', () => {
        const body = h.nextElementSibling;
        const isOpen = h.classList.contains('active');
        Array.from(qaList.querySelectorAll('.chat-cat-head')).forEach((x) => {
          x.classList.remove('active');
          x.nextElementSibling.style.display = 'none';
        });
        if (!isOpen) {
          h.classList.add('active');
          body.style.display = '';
          scrollBottom();
        }
      });
    });

    Array.from(qaList.querySelectorAll('.chat-cat-body button')).forEach((b) => {
      b.addEventListener('click', () => {
        const g = QA[Number(b.dataset.cat)];
        if (!g) return;
        const item = g.items[Number(b.dataset.q)];
        if (item) {
          say(item.q, item.a);
          setQuestions(false);
          scrollBottom();
        }
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  addMsg('bot', 'Hi and welcome to Dualcore Softworks! Tap any question below and I will answer it right away.');
  renderQA();
})();