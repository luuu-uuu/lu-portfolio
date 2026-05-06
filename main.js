(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");
  var navLinks = document.querySelectorAll(".site-nav a");
  var workDropdown = document.querySelector(".nav-item--dropdown");
  var workTrigger = document.getElementById("nav-work-trigger");
  var heroStage = document.getElementById("hero-stage");
  var heroHit = document.getElementById("hero-person-hit");
  var heroVideo = document.getElementById("hero-hover-video");

  var NAV_ORDER = [
    { id: "home", nav: "home" },
    { id: "project-dashboard", nav: "work" },
  ];

  function isMobileNav() {
    return window.matchMedia("(max-width: 820px)").matches;
  }

  function setNavOpen(open) {
    if (!siteNav || !navToggle) return;
    siteNav.classList.toggle("is-open", open);
    if (header) header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (!open && workDropdown) {
      workDropdown.classList.remove("is-open");
      if (workTrigger) workTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function setWorkDropdownOpen(open) {
    if (!workDropdown || !workTrigger) return;
    workDropdown.classList.toggle("is-open", open);
    workTrigger.setAttribute("aria-expanded", open ? "true" : "false");
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

  if (siteNav) {
    siteNav.querySelectorAll('a[href^="#"]').forEach(function (a) {
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
      });
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setNavOpen(false);
      setWorkDropdownOpen(false);
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

  function elementDocumentTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  /** 单页作品集首页：首屏与项目区均在「首页」tab 下，滚动不改变主导航高亮 */
  function lockNavToHomeTab() {
    var path = (window.location.pathname || "").replace(/\/+$/, "");
    var isIndexPath =
      path === "" ||
      path === "/" ||
      /(^|\/)index\.html$/i.test(path);
    return isIndexPath && document.getElementById("home");
  }

  function updateActiveNav() {
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
  function onScroll() {
    if (header) {
      if (window.scrollY > scrollThreshold) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }
    updateActiveNav();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateActiveNav, { passive: true });
  onScroll();

  function setHeroVideoHover(on) {
    if (!heroStage || !heroVideo) return;
    heroStage.classList.toggle("is-video-hover", on);
    if (on) {
      var p = heroVideo.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {});
      }
    } else {
      heroVideo.pause();
      try {
        heroVideo.currentTime = 0;
      } catch (err) {
        /* ignore */
      }
    }
  }

  if (heroHit && heroStage && heroVideo) {
    heroHit.addEventListener("mouseenter", function () {
      setHeroVideoHover(true);
    });
    heroHit.addEventListener("mouseleave", function () {
      setHeroVideoHover(false);
    });
    heroHit.addEventListener("focus", function () {
      setHeroVideoHover(true);
    });
    heroHit.addEventListener("blur", function () {
      setHeroVideoHover(false);
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && heroVideo) {
      heroVideo.pause();
    }
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
})();
