const SoundManager = {
    click: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS56+OgTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzfLYiTYIGGW66+OfTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzfLYiTYIGGW66+OfTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzQ=='),
    delete: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='),
    success: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS56+OgTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzfLYiTYIGGW66+OfTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzfLYiTYIGGW66+OfTgwOUKXh8LdjHAU2jdXyzn0vBSh+zPDdkUELFGCz6OyrWBELR6Hf8r1rIAUrlc3y2Ik2CBhluuvjn04MDlCl4fC3YxwFNo3V8s59LwUofszw3ZFBCxRgs+jsq1gRC0eh3/K9ayAFK5XN8tiJNggYZbrr459ODA5QpeHwt2McBTaN1fLOfS8FKH7M8N2RQQsUYLPo7KtYEQtHod/yvWsgBSuVzQ=='),
    pop: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='),

    playClick() {
        this.click.currentTime = 0;
        this.click.volume = 0.3;
        this.click.play().catch(() => {});
    },

    playDelete() {
        this.delete.currentTime = 0;
        this.delete.volume = 0.4;
        this.delete.play().catch(() => {});
    },

    playSuccess() {
        this.success.currentTime = 0;
        this.success.volume = 0.5;
        this.success.play().catch(() => {});
    },

    playPop() {
        this.pop.currentTime = 0;
        this.pop.volume = 0.2;
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
