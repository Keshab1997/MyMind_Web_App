const toggleBtn = document.getElementById('dark-mode-toggle');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    updateIcon(true);
}

toggleBtn.onclick = () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateIcon(isDark);
};

function updateIcon(isDark) {
    const icon = toggleBtn.querySelector('.material-icons');
    if (isDark) {
        icon.innerText = 'light_mode';
        toggleBtn.style.color = '#FFD700';
    } else {
        icon.innerText = 'dark_mode';
        toggleBtn.style.color = '';
    }
}
