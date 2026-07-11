class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('gram2profit_theme') || 'midnight';
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(themeName) {
        document.body.className = 'theme-' + themeName;
        localStorage.setItem('gram2profit_theme', themeName);
        this.currentTheme = themeName;
        
        document.querySelectorAll('.theme-option').forEach(function(opt) {
            if (opt.dataset.theme === themeName) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }
    
    init() {
        var self = this;
        document.querySelectorAll('.theme-option').forEach(function(option) {
            option.addEventListener('click', function() {
                self.applyTheme(this.dataset.theme);
            });
        });
    }
}

var themeManager = new ThemeManager();