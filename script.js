document.addEventListener("DOMContentLoaded", () => {
  // ====== Insert Navbar ======
  const navbarHTML = `
    <nav class="navbar">
      <div class="logo-container">
        <a href="/index.html" class="logo">
          <img src="/BBCS2/images/BBCLOGO.png" alt="BBC Logo" class="logo-img">
        </a>
        <span class="logo-message">BBC Cavite Laguna NDR S2</span>
      </div>
      <input type="checkbox" id="toggler">
      <label for="toggler"><i class="ri-menu-line"></i></label>
<div class="menu">
  <ul class="list">
    <li><a href="index.html">Home</a></li>
    <li><a href="/BBCS2/Funrace/fr.html">Funrace</a></li>
    <li><a href="/BBCS2/Derby/derby.html">Derby</a></li>
    <li><a href="/BBCS2/Patibayan/pat.html">Patibayan</a></li>
  </ul>
</div>

    </nav>
  `;
  document.body.insertAdjacentHTML("afterbegin", navbarHTML);

  // ====== Insert Minimal Footer ======
  const footerHTML = `
    <footer class="footer">
      <div class="footer-bottom">&copy; BBC Cavite Laguna. All Rights Reserved 2025</div>
    </footer>
  `;
  document.body.insertAdjacentHTML("beforeend", footerHTML);

  // ====== Highlight Active Nav Link ======
  const currentPath = window.location.pathname.replace(/\/$/, "");
  const navLinks = document.querySelectorAll(".navbar ul li a");

  navLinks.forEach(link => {
    const linkPath = link.getAttribute("href").replace(/\/$/, "");
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });

  // ====== Mobile Dropdown Position ======
  const navbar = document.querySelector(".navbar");
  const menu = document.querySelector(".menu");

  function setMenuTop() {
    const navbarHeight = navbar.getBoundingClientRect().height;
    menu.style.top = navbarHeight + "px";
  }

  window.setTimeout(setMenuTop, 50); // wait for logo/fonts to load
  window.addEventListener("resize", setMenuTop);
});
