// Navbar Menu
document.addEventListener('DOMContentLoaded', () => {
  const sepet = document.querySelector('.cart-icon');
  const offScreenSepet = document.querySelector('.off-screen-sepet');

  sepet.addEventListener('click', () => {
    sepet.classList.toggle('active');
    offScreenSepet.classList.toggle('active');
  });
});