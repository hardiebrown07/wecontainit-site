/* Contain-It v2 — vanilla, light, no scroll-jacking */
(function () {
  "use strict";
  // ---- FORM DELIVERY ----------------------------------------------------
  // Enquiries are emailed to info@wecontainit.co.uk.
  // Paste the Web3Forms access key below (free, no account needed):
  //   1. go to web3forms.com  2. enter info@wecontainit.co.uk
  //   3. they email you an access key  4. paste it here
  // Until a key is set, the form falls back to opening the visitor's mail app.
  var WEB3FORMS_KEY = "e763cefa-268c-48dc-916d-5161f1c3b91d";
  var FORM_ENDPOINT = WEB3FORMS_KEY ? "https://api.web3forms.com/submit" : "";
  var FORM_TO = "info@wecontainit.co.uk";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // loader splash: first visit this session only
  var loader = document.getElementById("loader");
  if (loader) {
    if (reduce || sessionStorage.getItem("ci-seen")) {
      document.documentElement.classList.add("no-loader");
    } else {
      sessionStorage.setItem("ci-seen", "1");
      var hide = function () { loader.classList.add("done"); };
      if (document.readyState === "complete") setTimeout(hide, 700);
      else window.addEventListener("load", function () { setTimeout(hide, 500); });
      setTimeout(hide, 2200); // hard cap
    }
  }


  // videos: force autoplay everywhere (mobile: no play buttons)
  function posterFallback(v) {
    // autoplay refused (e.g. iOS Low Power Mode): swap the video for its poster
    // so no play button ever appears.
    if (!v.poster || v.dataset.swapped) return;
    var img = document.createElement("img");
    img.src = v.poster;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = v.className;
    img.decoding = "async";
    v.dataset.swapped = "1";
    v.replaceWith(img);
  }
  function tryPlay(v, attempt) {
    if (v.dataset.swapped) return;
    v.muted = true;
    v.setAttribute("playsinline", "");
    var p = v.play();
    if (!p || !p.catch) return;
    p.catch(function () {
      // Give it time to settle; only fall back once it has genuinely failed
      // (e.g. iOS Low Power Mode), never on a transient rejection.
      setTimeout(function () {
        if (!v.paused) return;
        if (attempt < 2) tryPlay(v, attempt + 1);
        else posterFallback(v);
      }, 600);
    });
  }
  function nudgeVideos() {
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      if (v.paused) tryPlay(v, 0);
    });
  }
  nudgeVideos();
  window.addEventListener("touchstart", nudgeVideos, { once: true, passive: true });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) nudgeVideos(); });


  // Hero background video: attached but fully transparent, so a native play
  // button can never be seen. It is revealed only once playback is confirmed,
  // and removed outright if autoplay never starts (iOS Low Power Mode).
  document.querySelectorAll(".bgvid-mount").forEach(function (mount) {
    if (reduce) return;                       // reduced motion: keep the still
    var src = mount.dataset.src;
    if (!src) return;

    var v = document.createElement("video");
    v.muted = true; v.defaultMuted = true;
    v.loop = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.setAttribute("tabindex", "-1");
    v.preload = "auto";
    v.className = "bgvid";                    // starts at opacity 0
    v.src = src;
    mount.appendChild(v);                     // must be in the DOM to play

    var settled = false;
    var reveal = function () {
      if (settled) return;
      if (v.paused || v.ended || v.currentTime === 0) return;
      settled = true;
      v.classList.add("ready");
    };
    var drop = function () {
      if (settled) return;
      settled = true;
      v.pause();
      v.removeAttribute("src");
      v.load();
      if (v.parentNode) v.parentNode.removeChild(v);
    };

    v.addEventListener("timeupdate", reveal);
    v.addEventListener("playing", function () { setTimeout(reveal, 40); });

    var start = function () {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    start();
    // A backgrounded tab can refuse playback; retry once it is visible again.
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !settled && v.paused) start();
    });
    setTimeout(function () { if (!settled) { if (v.currentTime > 0 && !v.paused) reveal(); else drop(); } }, 3000);
  });

  // mobile nav
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("headNav");
  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    var navClose = document.getElementById("navClose");
    if (navClose) navClose.addEventListener("click", function () { setMenu(false); });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // reveals
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.documentElement.classList.add("no-io");
  }

  // size picker (home)
  var stageBox = document.getElementById("pickerBox");
  if (stageBox) {
    var SIZES = {
      "5": { w: 120, price: "£100", fits: "Fits the contents of a small shed · 37 sq ft" },
      "7": { w: 168, price: "£110", fits: "Fits the contents of a small bedroom · 50 sq ft" },
      "10": { w: 240, price: "£120", fits: "Fits the contents of a 1-bedroom house · 75 sq ft" },
      "20": { w: 480, price: "£150", fits: "Fits the contents of a 2/3-bedroom house · 150 sq ft" }
    };
    var price = document.getElementById("pickerPrice");
    var fits = document.getElementById("pickerFits");
    document.querySelectorAll(".picker-tabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".picker-tabs button").forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var s = SIZES[btn.getAttribute("data-ft")];
        stageBox.style.width = Math.min(s.w, window.innerWidth * 0.56) + "px";
        price.innerHTML = s.price + ' <small>/month + VAT</small>';
        fits.textContent = s.fits;
      });
    });
  }

  // gallery lightbox
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    document.querySelectorAll(".gal-grid a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        lbImg.src = a.getAttribute("href");
        lb.classList.add("open");
      });
    });
    lb.addEventListener("click", function () { lb.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("open"); });
  }


  // reviews carousel
  var revTrack = document.getElementById("revTrack");
  if (revTrack) {
    var step = function () {
      var card = revTrack.querySelector(".rev2");
      if (!card) return revTrack.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(revTrack).columnGap || getComputedStyle(revTrack).gap) || 18;
      return card.getBoundingClientRect().width + gap;
    };
    var prev = document.getElementById("revPrev");
    var next = document.getElementById("revNext");
    prev.addEventListener("click", function () { revTrack.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { revTrack.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
  }


  // locations switcher
  var locImg = document.getElementById("locImg");
  if (locImg) {
    var LOCS = [
      { name: "Glasgow · Polmadie", addr: "100 Jessie Street, Polmadie, Glasgow G42 0PG", phone: "0141 423 0544", tel: "+441414230544",
        img: "assets/img/DJI_0184-1800.jpg", alt: "The Contain-It Glasgow location from above",
        dir: "https://maps.google.com/?q=Contain-It,+100+Jessie+Street,+Glasgow+G42+0PG" },
      { name: "Paisley", addr: "4 Fulbar Road, Paisley PA2 9AP", phone: "07976 458662", tel: "+447976458662",
        img: "assets/img/DSC02353-900.jpg", alt: "The entry gate at Contain-It",
        dir: "https://maps.google.com/?q=Contain-It,+4+Fulbar+Road,+Paisley+PA2+9AP" }
    ];
    var li = 0;
    var show = function () {
      var l = LOCS[li];
      locImg.src = l.img; locImg.alt = l.alt;
      document.querySelector(".loc2-name").textContent = l.name;
      document.getElementById("locAddr").textContent = l.addr;
      var p = document.getElementById("locPhone"); p.textContent = l.phone; p.href = "tel:" + l.tel;
      document.getElementById("locDir").href = l.dir;
    };
    document.getElementById("locPrev").addEventListener("click", function () { li = (li + LOCS.length - 1) % LOCS.length; show(); });
    document.getElementById("locNext").addEventListener("click", function () { li = (li + 1) % LOCS.length; show(); });
  }


  // location accordions: exactly one open at all times
  var accs = document.querySelectorAll(".loc-acc");
  accs.forEach(function (d) {
    d.addEventListener("click", function (e) {
      if (d.open && e.target.closest("summary")) e.preventDefault();
    });
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      accs.forEach(function (o) { if (o !== d) o.open = false; });
      var img = document.getElementById("accImg");
      if (img && d.dataset.img) { img.src = d.dataset.img; img.alt = d.dataset.alt || ""; }
    });
  });


  // product detail tabs
  var tabs = document.querySelectorAll(".p-anchors [data-tab]");
  if (tabs.length) {
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (o) { o.classList.remove("on"); o.setAttribute("aria-selected", "false"); });
        t.classList.add("on"); t.setAttribute("aria-selected", "true");
        document.querySelectorAll(".p-panel").forEach(function (p) { p.classList.remove("on"); });
        var panel = document.getElementById("panel-" + t.getAttribute("data-tab"));
        if (panel) panel.classList.add("on");
      });
    });
  }


  // Replace a submitted form with a confirmation panel
  function showSuccess(form) {
    var panel = document.createElement("div");
    panel.className = "form-done";
    panel.setAttribute("role", "status");
    panel.innerHTML =
      '<span class="form-done-tick" aria-hidden="true">' +
        '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M15 27l8 8 15-16"/></svg>' +
      '</span>' +
      '<h3>Thanks, we\'ve got that</h3>' +
      '<p>We\'ll come back to you within 24 hours with a price and a move-in date. ' +
      'If it\'s urgent, call <a href="tel:+441414230544">0141 423 0544</a>.</p>';
    // keep the same footprint as the form it replaces, so the layout doesn't jump
    var box = form.getBoundingClientRect();
    panel.style.minHeight = Math.round(box.height) + "px";
    form.replaceWith(panel);
    panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }

  // quote form
  var form = document.getElementById("quoteForm");
  if (form) {
    var status = document.getElementById("formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = {
        name: form.name.value.trim(), phone: form.phone.value.trim(),
        email: form.email.value.trim(), location: form.location.value,
        size: form.size.value, movein: form.movein.value.trim(), message: form.message.value.trim()
      };
      var dur = form.querySelector('input[name="duration"]:checked');
      if (dur) d.message = (d.message ? d.message + "\n" : "") + "Duration: " + dur.value;
      if (!d.name || !d.phone || !d.message) { status.textContent = "Add your name, phone number and a quick message and we'll do the rest."; return; }
      if (FORM_ENDPOINT) {
        status.textContent = "Sending…";
        var payload = {
          access_key: WEB3FORMS_KEY,
          subject: "Website enquiry: " + (d.size || "storage") + " — " + (d.location || "not specified"),
          from_name: "Contain-It website",
          Name: d.name, Phone: d.phone, Email: d.email,
          Location: d.location, Size: d.size, "Move-in": d.movein, Message: d.message
        };
        fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw 0; showSuccess(form); })
          .catch(function () { status.textContent = "That didn't send. Call 0141 423 0544 or email " + FORM_TO + "."; });
      } else {
        var body = "Name: " + d.name + "\nPhone: " + d.phone + (d.email ? "\nEmail: " + d.email : "") +
          "\nYard: " + d.location + "\nSize: " + d.size + (d.movein ? "\nMove-in: " + d.movein : "") + (d.message ? "\n\n" + d.message : "");
        window.location.href = "mailto:" + FORM_TO + "?subject=" + encodeURIComponent("Quote request — " + d.size) + "&body=" + encodeURIComponent(body);
        status.textContent = "Your email app should open. Or call 0141 423 0544.";
      }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
