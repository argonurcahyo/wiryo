(function () {
  try {
    var t = localStorage.getItem('wiryo-theme');
    if (t === 'dark' || (t === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
