const SoundManager = {
    click: new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3'),
    delete: new Audio('https://www.soundjay.com/misc/sounds/trash-can-1.mp3'),
    success: new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3'),
    pop: new Audio('https://www.soundjay.com/buttons/sounds/button-20.mp3'),

    playClick() {
        this.click.currentTime = 0;
        this.click.play().catch(() => {});
    },

    playDelete() {
        this.delete.currentTime = 0;
        this.delete.play().catch(() => {});
    },

    playSuccess() {
        this.success.currentTime = 0;
        this.success.play().catch(() => {});
    },

    playPop() {
        this.pop.currentTime = 0;
        this.pop.play().catch(() => {});
    }
};

document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .nav-item, .card, .add-btn, .icon-btn, .tag');
    if (target) {
        if (target.id?.includes('delete') || target.classList.contains('delete')) {
            SoundManager.playDelete();
        } else {
            SoundManager.playClick();
        }
    }
});

window.AppSounds = SoundManager;
console.log("🔊 Sound System Loaded");
