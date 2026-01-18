const toggleBtn = document.createElement('button');
toggleBtn.id = 'dark-mode-toggle';
toggleBtn.innerHTML = '<span class="material-icons">dark_mode</span>';
document.body.appendChild(toggleBtn);

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

toggleBtn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
};
