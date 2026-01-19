const toggleBtn = document.getElementById('dark-mode-toggle');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    if (toggleBtn) updateIcon(true);
}

if (toggleBtn) {
    toggleBtn.onclick = () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateIcon(isDark);
    };
}

function updateIcon(isDark) {
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('.material-icons');
    if (icon) {
        icon.innerText = isDark ? 'light_mode' : 'dark_mode';
        toggleBtn.style.color = isDark ? '#FFD700' : '';
    }
}
