const posters = document.querySelectorAll('.poster');
let current = 1; // Set current to 1 (second poster) as default

function showPoster(index) {
  posters.forEach((p, i) => p.classList.remove('active'));
  posters[index].classList.add('active');
}

function nextPoster() {
  current = (current + 1) % posters.length;
  showPoster(current);
}

posters.forEach(p => p.addEventListener('click', nextPoster));


// Swipe detection (mobile)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if(touchEndX < touchStartX - 50) nextPoster(); // swipe left
  if(touchEndX > touchStartX + 50) {
    current = (current - 1 + posters.length) % posters.length;
    showPoster(current);
  }
});
