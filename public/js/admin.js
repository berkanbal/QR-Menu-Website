document.addEventListener('DOMContentLoaded', () => {
    const Menu = document.querySelector('.menu');
    const offScreenMenu = document.querySelector('.off-screen-menu');

    Menu.addEventListener('click', () => {
        Menu.classList.toggle('active');
        offScreenMenu.classList.toggle('active');
    });
});