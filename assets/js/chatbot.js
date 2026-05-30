/* =============================================================================
 *  FEDERAL MINISTRY OF DEFENCE — Virtual Assistant v2
 *  Fully client-side, no API keys, no subscriptions. Free & permanent.
 *  Features: NLP keyword scoring, context memory, typing indicator,
 *            quick-reply chips, multi-variant responses, friendly personality.
 * ============================================================================= */
(function () {
  'use strict';

  /* ── Bot identity ─────────────────────────────────────────────────────────── */
  var BOT_NAME = 'MOD Assistant';

  /* ── Knowledge base ───────────────────────────────────────────────────────── */
  /* Each entry: keywords[], weight[], responses[] (one is picked randomly),
     optional chips[] for follow-up suggestions, optional links[]           */
  var KB = [

    /* ── Greetings ── */
    {
      id: 'greet',
      keywords: ['hello','hi','hey','good morning','good afternoon','good evening',
                 'good day','howdy','greetings','sup','whatsup','what\'s up','morning',
                 'afternoon','evening','night','goodnight'],
      responses: [
        'Hello! 👋 Great to see you here. I\'m the MOD Assistant — I can help with recruitment, FOI requests, contact details, procurement, and much more. What can I do for you today?',
        'Hi there! 😊 Welcome to the Federal Ministry of Defence virtual assistant. How can I help you today?',
        'Good day! I\'m here to help you navigate the Ministry\'s services. Feel free to ask about recruitment, departments, tenders, veterans support — or anything else. What\'s on your mind?'
      ],
      chips: ['Recruitment','FOI Request','Contact details','Who is the Minister']
    },

    /* ── How are you / small talk ── */
    {
      id: 'howareyou',
      keywords: ['how are you','how are u','how r u','how do you do','you good',
                 'you okay','you alright','how\'s it going','how\'s things',
                 'doing well','doing good'],
      responses: [
        'I\'m doing great, thank you for asking! 😊 I\'m always ready to help. What can I assist you with today?',
        'All good on my end — thanks for asking! Ready and waiting to help. What would you like to know?',
        'Fantastic, thank you! I\'m here and happy to help. What brings you to the Ministry\'s website today?'
      ],
      chips: ['Recruitment','Contact details','FOI Request']
    },

    /* ── Who are you / what can you do ── */
    {
      id: 'identity',
      keywords: ['who are you','what are you','what can you do','what do you do',
                 'are you a bot','are you human','are you real','your name',
                 'what is your name','tell me about yourself','help me'],
      responses: [
        'I\'m the <strong>MOD Assistant</strong> — a virtual assistant for the Federal Ministry of Defence, Nigeria. 🇳🇬\n\nI can help you with:\n• Recruitment & careers\n• FOI requests\n• Contact details\n• Procurement & tenders\n• Departments & agencies\n• Veterans services\n• Press releases\n• And much more!\n\nJust ask me anything.',
        'I\'m a virtual assistant built for the Federal Ministry of Defence website. I know about MOD\'s services, departments, key officials, and how to get things done. I can\'t replace a real officer, but I can point you in the right direction fast! What do you need?'
      ],
      chips: ['Recruitment','FOI Request','Who is the Minister','Contact details']
    },

    /* ── Thank you ── */
    {
      id: 'thanks',
      keywords: ['thank you','thanks','thank u','cheers','appreciate','grateful',
                 'helpful','that helps','perfect','great','awesome','excellent',
                 'well done','nice one','brilliant'],
      responses: [
        'You\'re welcome! 😊 Is there anything else I can help you with?',
        'Happy to help! Feel free to ask if there\'s anything else you need.',
        'Glad I could assist! Don\'t hesitate to come back if you have more questions. 🙏'
      ],
      chips: ['Recruitment','Contact details','FOI Request','Procurement tenders']
    },

    /* ── Goodbye ── */
    {
      id: 'bye',
      keywords: ['goodbye','bye','see you','see ya','later','take care',
                 'farewell','have a good','have a nice','until next'],
      responses: [
        'Goodbye! 👋 Thank you for visiting the Federal Ministry of Defence website. Have a great day!',
        'Take care! Feel free to return anytime you need assistance. God bless Nigeria! 🇳🇬',
        'Farewell! It was a pleasure helping you. Visit us again anytime. 👋'
      ]
    },

    /* ── Recruitment ── */
    {
      id: 'recruit',
      keywords: ['recruit','enlist','join','apply','application','career','job',
                 'employment','vacancy','vacancies','hire','hiring','work for',
                 'how to join','how do i join','military career','soldier','officer'],
      responses: [
        'To join the Nigerian Armed Forces, apply directly through each Service\'s official portal:\n\n🪖 <a href="https://recruitment.army.mil.ng" target="_blank">Nigerian Army</a>\n⚓ <a href="https://navy.mil.ng" target="_blank">Nigerian Navy</a>\n✈️ <a href="https://airforce.mil.ng" target="_blank">Nigerian Air Force</a>\n\nFor <strong>civilian</strong> roles at the Ministry of Defence, visit our <a href="services.html#recruitment">Recruitment page</a> for current openings and requirements.',
        'Interested in serving Nigeria? Here\'s how:\n\n• <strong>Military roles</strong>: Apply through the Army, Navy, or Air Force recruitment portals during open exercises.\n• <strong>Civilian roles at MOD</strong>: Advertised on our <a href="services.html#recruitment">Recruitment page</a>.\n\nMake sure you meet the age, educational, and physical requirements before applying!'
      ],
      chips: ['Contact details','Who is the Minister','Departments']
    },

    /* ── FOI ── */
    {
      id: 'foi',
      keywords: ['foi','freedom of information','information request','public record',
                 'document request','request information','request document',
                 'access to information','foia','official record'],
      responses: [
        'You can submit a <strong>Freedom of Information (FOI)</strong> request through our dedicated <a href="foi.html">FOI page</a>. 📋\n\nKey facts:\n• We respond within <strong>7 working days</strong> under the FOI Act 2011\n• No fee for most requests\n• You can appeal to the Federal High Court if refused\n\nNeed help? Email <a href="mailto:foi@defence.gov.ng">foi@defence.gov.ng</a>',
        'Under the <strong>FOI Act 2011</strong>, you have the right to access public records held by the Ministry.\n\n→ <a href="foi.html">Submit your FOI request here</a>\n\nWe acknowledge all requests within <strong>1 working day</strong> and respond within 7. If you disagree with our decision, you may appeal to the Federal High Court under §20 of the Act.'
      ],
      chips: ['Contact details','SERVICOM complaint','Privacy Policy']
    },

    /* ── Contact ── */
    {
      id: 'contact',
      keywords: ['contact','address','location','where are you','where is','phone',
                 'email','reach','find you','head office','headquarters','hq',
                 'ship house','abuja','area 10','telephone','call','write to'],
      responses: [
        '📍 <strong>Federal Ministry of Defence</strong>\nShip House, Central Business District\nArea 10, Abuja, FCT — Nigeria\n\n📞 +234 9 234 5670\n📧 <a href="mailto:contact@defence.gov.ng">contact@defence.gov.ng</a>\n\nFull contact directory → <a href="contact.html">Contact page</a>',
        'You can reach the Ministry at:\n\n🏢 Ship House, Area 10, Abuja\n📞 +234 9 234 5670\n📧 <a href="mailto:contact@defence.gov.ng">contact@defence.gov.ng</a>\n\nFor <strong>media enquiries</strong>, contact the Press Office.\nFor <strong>FOI requests</strong>, use <a href="foi.html">the FOI page</a>.\nFor <strong>complaints</strong>, use <a href="servicom.html">SERVICOM</a>.'
      ],
      chips: ['FOI Request','SERVICOM complaint','Press Office']
    },

    /* ── Minister ── */
    {
      id: 'minister',
      keywords: ['minister','musa','christopher','honourable','hon','minister of defence',
                 'who is in charge','head of','leadership','defence minister'],
      responses: [
        'The <strong>Honourable Minister of Defence</strong> is <strong>General Christopher Gwabin Musa (rtd), OFR</strong>. 🎖\n\nGeneral Musa is a highly decorated military officer and former Chief of Defence Staff. He was appointed Honourable Minister of Defence in 2023.\n\n→ <a href="minister.html">Read the Minister\'s full profile</a>',
        '🇳🇬 <strong>General Christopher Gwabin Musa (rtd), OFR</strong> serves as the Honourable Minister of Defence.\n\nThe <strong>Minister of State</strong> is <strong>Dr. Bello Mohammed Matawalle, MON</strong>.\n\n→ <a href="minister.html">Minister\'s profile</a> | <a href="minister-of-state.html">Minister of State\'s profile</a>'
      ],
      chips: ['Management team','Departments','Press Office']
    },

    /* ── Minister of State ── */
    {
      id: 'minister_of_state',
      keywords: ['minister of state','matawalle','bello','state minister'],
      responses: [
        'The <strong>Honourable Minister of State for Defence</strong> is <strong>Dr. Bello Mohammed Matawalle, MON</strong>.\n\n→ <a href="minister-of-state.html">View the Minister of State\'s profile</a>'
      ],
      chips: ['Who is the Minister','Management team']
    },

    /* ── Permanent Secretary / Management ── */
    {
      id: 'permsec',
      keywords: ['permanent secretary','perm sec','permsec','management','director',
                 'management team','senior staff','top officials','leadership team'],
      responses: [
        'The <strong>Permanent Secretary</strong> is the chief administrative officer of the Ministry, responsible for day-to-day management.\n\n→ <a href="management.html">View the full Management team</a> — including Directors and senior officials across all departments.'
      ],
      chips: ['Departments','Who is the Minister','Contact details']
    },

    /* ── SERVICOM ── */
    {
      id: 'servicom',
      keywords: ['servicom','complaint','complain','poor service','bad service',
                 'service quality','lodge a complaint','service charter','dissatisfied'],
      responses: [
        'To make a <strong>SERVICOM complaint</strong> about the quality of service you received from the Ministry, use our <a href="servicom.html">SERVICOM page</a>. 📝\n\nWe acknowledge complaints within <strong>1 working day</strong> and resolve them within 7. If unresolved, you can escalate to the National SERVICOM Office.',
        'Not satisfied with our service? You have every right to complain! 🙏\n\n→ <a href="servicom.html">Submit a SERVICOM complaint</a>\n\nAlternatively, contact <a href="mailto:servicom@defence.gov.ng">servicom@defence.gov.ng</a> directly. We take all feedback seriously.'
      ],
      chips: ['Contact details','FOI Request','SLA standards']
    },

    /* ── Procurement ── */
    {
      id: 'procurement',
      keywords: ['procurement','tender','bid','contract','award','supplier',
                 'vendor','bpp','nocopo','rfq','request for quotation','purchase',
                 'buying','supplies'],
      responses: [
        'The Ministry publishes all open tenders and contract awards on the <a href="procurement.html">Procurement page</a> 🏢 in line with the <strong>Public Procurement Act 2007</strong>.\n\nAll contracts above the threshold are processed through the <strong>Bureau of Public Procurement (BPP)</strong>.\n\nFor procurement enquiries, expect a response within <strong>3 working days</strong>.',
        'Looking to bid for a Ministry contract? 📄\n\n→ <a href="procurement.html">View open tenders & contract awards</a>\n\nAll procurement follows the BPP Act. Tenders are advertised publicly and awarded transparently. Contact the Procurement Department for specific queries.'
      ],
      chips: ['Contact details','Annual Reports','FOI Request']
    },

    /* ── Veterans ── */
    {
      id: 'veterans',
      keywords: ['veteran','pension','retired','ex-serviceman','ex-soldier',
                 'military pension','nafrc','mpb','welfare','discharged','resettlement'],
      responses: [
        'Veterans and retired service personnel can access support through:\n\n🎗 <a href="veterans.html">Veterans page</a> — welfare, pensions, and resettlement\n🏥 <strong>NAFRC</strong> (Nigerian Armed Forces Resettlement Centre)\n💼 <strong>Military Pensions Board (MPB)</strong> — pension administration\n\nFor pension enquiries, contact the MPB directly or visit the Veterans page for full details.'
      ],
      chips: ['Contact details','Recruitment','Agencies & bodies']
    },

    /* ── Army / Navy / Air Force / DHQ ── */
    {
      id: 'military',
      keywords: ['army','navy','air force','airforce','dhq','defence headquarters',
                 'military','armed forces','coas','cns','cas','cds','chief of',
                 'nigerian army','nigerian navy','nigerian air force'],
      responses: [
        'The Federal Ministry of Defence oversees three Service branches and the Defence Headquarters:\n\n🪖 <a href="military.html#army">Nigerian Army</a>\n⚓ <a href="military.html#navy">Nigerian Navy</a>\n✈️ <a href="military.html#airforce">Nigerian Air Force</a>\n🏛 <a href="military.html#dhq">Defence Headquarters (DHQ)</a>\n\nVisit the <a href="military.html">Components of MOD page</a> for full details on each branch.'
      ],
      chips: ['Recruitment','Operations','Agencies & bodies']
    },

    /* ── Agencies ── */
    {
      id: 'agencies',
      keywords: ['agency','agencies','nda','ndc','afcsc','dicon','nafrc','mpb','dia',
                 'defence academy','war college','tri-service','institution'],
      responses: [
        'The Ministry oversees several tri-service institutions and agencies:\n\n🎓 <strong>NDA</strong> — Nigerian Defence Academy\n📚 <strong>NDC</strong> — National Defence College\n🎖 <strong>AFCSC</strong> — Armed Forces Command and Staff College\n🏭 <strong>DICON</strong> — Defence Industries Corporation of Nigeria\n🏥 <strong>NAFRC</strong> — Nigerian Armed Forces Resettlement Centre\n💼 <strong>MPB</strong> — Military Pensions Board\n🔍 <strong>DIA</strong> — Defence Intelligence Agency\n\n→ <a href="agencies.html">Full details on the Agencies page</a>'
      ],
      chips: ['Recruitment','Military branches','Contact details']
    },

    /* ── Operations ── */
    {
      id: 'operations',
      keywords: ['operation','operations','hadin kai','fansan yamma','delta safe',
                 'joint operation','theatre','insurgency','boko haram','bandits',
                 'terrorism','security','northeast','northwest'],
      responses: [
        'The Nigerian Armed Forces are currently conducting several active joint operations:\n\n🔴 <strong>Op HADIN KAI</strong> — Northeast (counter-insurgency)\n🔴 <strong>Op FANSAN YAMMA</strong> — Northwest (banditry)\n🔴 <strong>Op DELTA SAFE</strong> — Niger Delta\n🔴 <strong>Op SAFE HAVEN</strong> — North Central\n🟢 <strong>MNJTF</strong> — Multinational Joint Task Force (Lake Chad)\n\n→ <a href="operations.html">Full operations briefing</a>'
      ],
      chips: ['Military branches','Press Office','Contact details']
    },

    /* ── Press / News ── */
    {
      id: 'press',
      keywords: ['press','news','release','latest','update','announcement',
                 'statement','communique','speech','media','journalist',
                 'reporter','press office'],
      responses: [
        'Stay informed with the latest from the Ministry:\n\n📰 <a href="press.html">Press Releases</a> — official statements and announcements\n🎙 <a href="press.html#speeches">Speeches</a> — ministerial addresses\n📜 <a href="press.html#communiques">Communiques</a> — joint communiques\n📸 <a href="gallery.html">Gallery</a> — official photos\n\nFor media enquiries, contact the Press Office at the details on the <a href="contact.html">Contact page</a>.'
      ],
      chips: ['Contact details','Gallery','Annual Reports']
    },

    /* ── Annual Reports ── */
    {
      id: 'annual_reports',
      keywords: ['annual report','report','accounts','yearly report','performance',
                 'auditor','financial report','budget performance'],
      responses: [
        'Annual Reports covering the Ministry\'s budget performance, procurement activity, operations, and key performance indicators are available to download free of charge.\n\n→ <a href="annual-reports.html">Download Annual Reports (2014–present)</a>\n\nFor earlier reports, submit an <a href="foi.html">FOI request</a>.'
      ],
      chips: ['FOI Request','Procurement tenders','Contact details']
    },

    /* ── Privacy / Data Protection ── */
    {
      id: 'privacy',
      keywords: ['privacy','data','personal data','gdpr','ndpa','ndpr','data protection',
                 'privacy policy','cookies','my data','information rights'],
      responses: [
        'The Ministry\'s <strong>Privacy Policy</strong> explains how we collect, use and protect your personal data under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>.\n\n→ <a href="privacy.html">Read the full Privacy Policy</a>\n\nTo exercise your rights (access, erasure, portability), email our Data Protection Officer at <a href="mailto:dpo@defence.gov.ng">dpo@defence.gov.ng</a>.'
      ],
      chips: ['FOI Request','Contact details','SERVICOM complaint']
    },

    /* ── SLA / Service standards ── */
    {
      id: 'sla',
      keywords: ['sla','service level','response time','how long','how many days',
                 'standard','commitment','service standard','turnaround'],
      responses: [
        'Our <strong>Service Level Agreement</strong> sets out guaranteed response times:\n\n📧 General correspondence — <strong>5 working days</strong>\n📋 FOI requests — <strong>7 working days</strong>\n📝 SERVICOM complaints — <strong>7 working days</strong>\n🏢 Procurement enquiries — <strong>3 working days</strong>\n📰 Media enquiries — <strong>1 working day</strong>\n\n→ <a href="sla.html">Read the full Service Level Agreement</a>'
      ],
      chips: ['SERVICOM complaint','FOI Request','Contact details']
    },

    /* ── Accessibility ── */
    {
      id: 'accessibility',
      keywords: ['accessibility','accessible','screen reader','wcag','contrast',
                 'font size','text size','disability','visually impaired','hearing'],
      responses: [
        'This website is built to <strong>WCAG 2.1 AA</strong> accessibility standards. You can:\n\n🔡 Adjust text size (Default / Larger / Largest)\n🌑 Enable High-contrast mode\n⌨️ Navigate fully by keyboard\n\nUse the <strong>accessibility button</strong> (bottom-left corner) to adjust settings.\n\n→ <a href="accessibility.html">Full Accessibility Statement</a>'
      ],
      chips: ['Contact details','SERVICOM complaint']
    },

    /* ── Website / Technical ── */
    {
      id: 'website',
      keywords: ['website','web','site','broken','not working','bug','error',
                 'feedback','report a problem','technical','page not found','404'],
      responses: [
        'If you\'ve found a technical issue on this website, please report it using our <a href="contact.html">Contact page</a> or email <a href="mailto:webmaster@defence.gov.ng">webmaster@defence.gov.ng</a>. We aim to fix reported issues within <strong>3 working days</strong>. Thank you for helping us improve!'
      ],
      chips: ['Contact details','Accessibility','SERVICOM complaint']
    }
  ];

  /* ── Chip shortcuts (map chip label to a query string to match KB) ───────── */
  var CHIP_QUERIES = {
    'Recruitment':          'recruit',
    'FOI Request':          'freedom of information request',
    'Contact details':      'contact address phone',
    'Procurement tenders':  'procurement tender bid',
    'Who is the Minister':  'minister musa',
    'Veterans support':     'veteran pension',
    'Departments':          'departments management',
    'Management team':      'permanent secretary management',
    'Press Office':         'press news release',
    'Annual Reports':       'annual report',
    'SERVICOM complaint':   'servicom complaint',
    'SLA standards':        'sla service level',
    'Privacy Policy':       'privacy data',
    'Agencies & bodies':    'agency nda dicon',
    'Military branches':    'army navy air force',
    'Operations':           'operations hadin kai',
    'Gallery':              'gallery photo'
  };

  /* ── NLP scoring ─────────────────────────────────────────────────────────── */
  function score(text, entry) {
    var t = text.toLowerCase();
    var s = 0;
    for (var i = 0; i < entry.keywords.length; i++) {
      var kw = entry.keywords[i];
      if (t.indexOf(kw) !== -1) {
        /* Longer keyword matches score higher */
        s += kw.split(' ').length * 2;
      }
    }
    return s;
  }

  function findBestMatch(text) {
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var s = score(text, KB[i]);
      if (s > bestScore) { bestScore = s; best = KB[i]; }
    }
    return bestScore > 0 ? best : null;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ── Fallback responses ──────────────────────────────────────────────────── */
  var FALLBACKS = [
    'I\'m not sure about that one, but I\'d love to help you find the right person. 😊 Try the <a href="search.html">site search</a> or email <a href="mailto:contact@defence.gov.ng">contact@defence.gov.ng</a> and an officer will respond within 5 working days.',
    'That\'s a bit outside my knowledge! For specialised queries, the best route is to email <a href="mailto:contact@defence.gov.ng">contact@defence.gov.ng</a> or call <strong>+234 9 234 5670</strong>. I\'ve also listed some common topics below — maybe one of those helps?',
    'I don\'t have a specific answer for that right now. Try the <a href="search.html">site search</a> for detailed information, or contact us directly at <a href="mailto:contact@defence.gov.ng">contact@defence.gov.ng</a>. 📧'
  ];

  /* ── DOM helpers ─────────────────────────────────────────────────────────── */
  var panel, body, form, input, suggestions, toggleBtn, unreadBadge;
  var isOpen = false;
  var msgCount = 0;

  function addMessage(html, sender, chipList) {
    msgCount++;
    var wrap = document.createElement('div');
    wrap.className = 'chatbot-msg-wrap ' + (sender === 'user' ? 'user-wrap' : 'bot-wrap');

    var msg = document.createElement('div');
    msg.className = 'chatbot-msg ' + sender;
    msg.innerHTML = html.replace(/\n/g, '<br>');
    wrap.appendChild(msg);
    body.appendChild(wrap);

    /* Render quick-reply chips for this message */
    if (chipList && chipList.length && sender === 'bot') {
      var chipRow = document.createElement('div');
      chipRow.className = 'chatbot-chip-row';
      chipList.forEach(function (label) {
        var c = document.createElement('button');
        c.className = 'chat-chip chat-chip-sm';
        c.textContent = label;
        c.setAttribute('data-chip', label);
        chipRow.appendChild(c);
      });
      body.appendChild(chipRow);
    }

    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    var t = document.createElement('div');
    t.className = 'chatbot-msg-wrap bot-wrap';
    t.id = 'typingIndicator';
    t.innerHTML = '<div class="chatbot-msg bot typing-msg"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    return t;
  }

  function removeTyping() {
    var t = document.getElementById('typingIndicator');
    if (t) t.parentNode.removeChild(t);
  }

  function respond(userText) {
    var match = findBestMatch(userText);
    var delay = 600 + Math.random() * 600;

    var typing = showTyping();

    setTimeout(function () {
      removeTyping();
      if (match) {
        addMessage(pickRandom(match.responses), 'bot', match.chips);
      } else {
        addMessage(pickRandom(FALLBACKS), 'bot',
          ['Recruitment', 'FOI Request', 'Contact details', 'Procurement tenders']);
      }
    }, delay);
  }

  function handleChip(label) {
    var query = CHIP_QUERIES[label] || label;
    addMessage(label, 'user');
    respond(query);
  }

  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (toggleBtn) {
      toggleBtn.classList.toggle('is-open', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    }
    if (open) {
      if (unreadBadge) unreadBadge.style.display = 'none';
      setTimeout(function () { if (input) input.focus(); }, 200);
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    /* Wait for partials.js to inject the chatbot HTML */
    var attempts = 0;
    var init = setInterval(function () {
      panel       = document.getElementById('chatbotPanel');
      body        = document.getElementById('chatbotBody');
      form        = document.getElementById('chatbotForm');
      input       = document.getElementById('chatbotInput');
      suggestions = document.getElementById('chatSuggestions');
      toggleBtn   = document.getElementById('chatbotToggleBtn');
      unreadBadge = document.getElementById('chatUnread');

      if (!panel || !body || !form || !input || ++attempts > 30) {
        clearInterval(init);
        return;
      }
      clearInterval(init);

      /* Welcome message */
      var hour = new Date().getHours();
      var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      addMessage(
        greeting + '! 👋 I\'m the <strong>MOD Assistant</strong> — here to help you with services, departments, recruitment, and more. What can I help you with today?',
        'bot',
        ['Recruitment', 'FOI Request', 'Contact details', 'Who is the Minister']
      );

      /* Toggle open/close */
      document.querySelectorAll('[data-chatbot-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () { setOpen(!isOpen); });
      });

      /* Form submit */
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = (input.value || '').trim();
        if (!q) return;
        addMessage(q, 'user');
        input.value = '';
        respond(q);
      });

      /* Chip clicks — global delegation (covers dynamic chips too) */
      document.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-chip]');
        if (!chip || !panel.contains(chip)) return;
        handleChip(chip.getAttribute('data-chip'));
      });

      /* Show unread badge after 6 seconds if chat hasn't been opened */
      setTimeout(function () {
        if (!isOpen && unreadBadge) {
          unreadBadge.textContent = '1';
          unreadBadge.style.display = 'flex';
        }
      }, 6000);

    }, 100);
  });

})();
