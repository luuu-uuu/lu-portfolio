(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");
  var navLinks = document.querySelectorAll(".site-nav a");
  var workDropdown = document.querySelector(".nav-item--dropdown");
  var workTrigger = document.getElementById("nav-work-trigger");
  var creativeTrigger = document.getElementById("nav-creative-trigger");
  var creativeItem = document.querySelector(".nav-item--creative");
  var creativePopover = document.getElementById("nav-creative-popover");
  var pageHome = document.body.classList.contains("page-home");

  var NAV_ORDER = [
    { id: "home", nav: "home" },
    { id: "project-dashboard", nav: "work" },
  ];

  function isMobileNav() {
    return window.matchMedia("(max-width: 820px)").matches;
  }

  function prefersCoarseOrNoHover() {
    return (
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function setNavOpen(open) {
    if (!siteNav || !navToggle) return;
    siteNav.classList.toggle("is-open", open);
    if (header) header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (header && zpjHomeHeader) {
      if (open) {
        header.classList.remove("site-header--zpj-scroll-hidden");
      } else {
        setZpjHeaderScrollHidden();
      }
    }
    if (!open && workDropdown) {
      workDropdown.classList.remove("is-open");
      if (workTrigger) workTrigger.setAttribute("aria-expanded", "false");
    }
    if (!open && creativeItem) {
      setCreativeOpen(false);
    }
  }

  function setWorkDropdownOpen(open) {
    if (!workDropdown || !workTrigger) return;
    workDropdown.classList.toggle("is-open", open);
    workTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setCreativeOpen(open) {
    if (!creativeItem || !creativeTrigger || !creativePopover) return;
    creativeItem.classList.toggle("is-open", open);
    creativeTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    creativePopover.setAttribute("aria-hidden", open ? "false" : "true");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = !siteNav.classList.contains("is-open");
      setNavOpen(open);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (!isMobileNav()) return;
      if (link.closest(".nav-dropdown")) {
        setNavOpen(false);
        setWorkDropdownOpen(false);
        return;
      }
      if (link === workTrigger) return;
      setNavOpen(false);
    });
  });

  if (workTrigger && workDropdown) {
    workTrigger.addEventListener("click", function (e) {
      e.preventDefault();
      if (isMobileNav()) {
        setWorkDropdownOpen(!workDropdown.classList.contains("is-open"));
      }
    });
  }

  if (creativeTrigger && creativeItem && creativePopover && pageHome) {
    creativeTrigger.addEventListener("click", function () {
      if (!isMobileNav() && !prefersCoarseOrNoHover()) return;
      var open = !creativeItem.classList.contains("is-open");
      setCreativeOpen(open);
    });
  }

  function bindHashNavLinks(root) {
    if (!root) return;
    root.querySelectorAll('a[href^="#"]').forEach(function (a) {
      if (a.id === "nav-work-trigger") return;
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href");
        if (!href || href.length < 2) return;
        var id = href.slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "auto", block: "start" });
        try {
          history.replaceState(null, "", href);
        } catch (err) {
          /* ignore */
        }
        if (isMobileNav()) setNavOpen(false);
      });
    });
  }

  bindHashNavLinks(siteNav);
  bindHashNavLinks(document.querySelector(".zpj-hero-nav"));

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setNavOpen(false);
      setWorkDropdownOpen(false);
      setCreativeOpen(false);
    }
  });

  document.addEventListener("click", function (e) {
    if (!isMobileNav() || !workDropdown) return;
    var t = e.target;
    if (!(t instanceof Node)) return;
    if (!workDropdown.contains(t)) {
      setWorkDropdownOpen(false);
    }
  });

  document.addEventListener("click", function (e) {
    if ((!isMobileNav() && !prefersCoarseOrNoHover()) || !creativeItem || !pageHome) return;
    var t = e.target;
    if (!(t instanceof Node)) return;
    if (!creativeItem.contains(t)) {
      setCreativeOpen(false);
    }
  });

  function elementDocumentTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function lockNavToHomeTab() {
    var path = (window.location.pathname || "").replace(/\/+$/, "");
    var isIndexPath =
      path === "" ||
      path === "/" ||
      /(^|\/)index\.html$/i.test(path);
    return !pageHome && isIndexPath && document.getElementById("home");
  }

  function updateActiveNav() {
    if (pageHome) {
      var workLinks = document.querySelectorAll('[data-nav="work"]');
      var projects = document.getElementById("zpj-projects");
      if (workLinks.length && projects) {
        var rect = projects.getBoundingClientRect();
        var vh = window.innerHeight;
        var inView = rect.top < vh * 0.55 && rect.bottom > vh * 0.2;
        workLinks.forEach(function (el) {
          el.classList.toggle("is-active", inView);
        });
      }
      return;
    }
    if (lockNavToHomeTab()) {
      document.querySelectorAll(".nav-link").forEach(function (a) {
        var key = a.getAttribute("data-nav");
        if (!key) return;
        a.classList.toggle("is-active", key === "home");
      });
      return;
    }
    var scrollPos = window.scrollY + window.innerHeight * 0.28;
    var active = NAV_ORDER[0].nav;
    for (var i = NAV_ORDER.length - 1; i >= 0; i--) {
      var el = document.getElementById(NAV_ORDER[i].id);
      if (!el) continue;
      var sectionTop = elementDocumentTop(el);
      if (scrollPos >= sectionTop - 8) {
        active = NAV_ORDER[i].nav;
        break;
      }
    }
    document.querySelectorAll(".nav-link").forEach(function (a) {
      var key = a.getAttribute("data-nav");
      if (!key) return;
      a.classList.toggle("is-active", key === active);
    });
  }

  var scrollThreshold = 8;
  var zpjHomeHeader =
    document.body.classList.contains("page-home") && document.body.classList.contains("zpj-v2");
  var zpjHeaderHideAt = 32;

  function setZpjHeaderScrollHidden() {
    if (!header || !zpjHomeHeader) return;
    if (header.classList.contains("nav-open")) return;
    /* 小屏顶栏含汉堡，收起会点不到菜单 */
    if (isMobileNav()) {
      header.classList.remove("site-header--zpj-scroll-hidden");
      return;
    }
    if (window.scrollY > zpjHeaderHideAt) {
      header.classList.add("site-header--zpj-scroll-hidden");
    } else {
      header.classList.remove("site-header--zpj-scroll-hidden");
    }
  }

  function onScroll() {
    if (header) {
      if (window.scrollY > scrollThreshold) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
      setZpjHeaderScrollHidden();
    }
    updateActiveNav();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(
    "resize",
    function () {
      updateActiveNav();
      setZpjHeaderScrollHidden();
    },
    { passive: true }
  );
  onScroll();

  document.addEventListener("visibilitychange", function () {
    /* reserved */
  });

  document.querySelectorAll(".project-card-video-widget").forEach(function (widget) {
    var video = widget.querySelector("video");
    var playBtn = widget.querySelector(".project-card-video-play");
    if (!video || !playBtn) return;

    function startPlayback() {
      widget.classList.add("is-playing");
      video.controls = true;
      var p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {});
      }
    }

    playBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startPlayback();
    });

    widget.addEventListener("click", function (e) {
      if (widget.classList.contains("is-playing")) return;
      if (e.target.closest(".project-card-video-play")) return;
      e.preventDefault();
      e.stopPropagation();
      startPlayback();
    });

    video.addEventListener("ended", function () {
      video.controls = false;
      widget.classList.remove("is-playing");
      try {
        video.currentTime = 0;
      } catch (err) {
        /* ignore */
      }
    });
  });

  /* Hero 装饰小人：默认 person.png，悬停 person_move.gif（与 index 中 ?v= 同步） */
  (function heroPersonHover() {
    var img = document.getElementById("hero-person-img");
    var wrap = document.getElementById("hero-person");
    if (!img || !wrap) return;
    var still = "static/person.png?v=5";
    var gif = "static/person_move.gif?v=5";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    wrap.addEventListener("mouseenter", function () {
      img.setAttribute("src", gif);
    });
    wrap.addEventListener("mouseleave", function () {
      img.setAttribute("src", still);
    });
  })();

  /* 项目卡片装饰：悬停换对应 GIF（data-decor-gif），离开还原 PNG */
  (function projectCardDecorHover() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".zpj-card-decor[data-decor-gif]").forEach(function (decor) {
      var img = decor.querySelector("img");
      var still = decor.getAttribute("data-decor-still");
      var gif = decor.getAttribute("data-decor-gif");
      var card = decor.closest(".zpj-card");
      if (!img || !still || !gif || !card) return;
      card.addEventListener("mouseenter", function () {
        img.setAttribute("src", gif);
      });
      card.addEventListener("mouseleave", function () {
        img.setAttribute("src", still);
      });
    });
  })();

  /* 首页 Hero「Hi !  I am Luu」：进入后从左到右逐字显现 */
  (function heroTitleTypewriter() {
    var el = document.getElementById("zpj-hero-title");
    if (!el) return;
    if (
      !document.body.classList.contains("page-home") ||
      !document.body.classList.contains("zpj-v2")
    ) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var full = el.textContent;
    if (!full || !full.length) return;
    el.textContent = "";
    el.setAttribute("aria-label", full);
    var spans = [];
    for (var i = 0; i < full.length; i++) {
      var span = document.createElement("span");
      span.className = "zpj-hero-title-char";
      span.appendChild(document.createTextNode(full.charAt(i)));
      el.appendChild(span);
      spans.push(span);
    }
    var stepMs = 44;
    var startDelayMs = 120;
    var j = 0;
    function revealNext() {
      if (j >= spans.length) {
        el.removeAttribute("aria-label");
        return;
      }
      spans[j].classList.add("is-visible");
      j += 1;
      window.setTimeout(revealNext, stepMs);
    }
    window.setTimeout(revealNext, startDelayMs);
  })();
})();
