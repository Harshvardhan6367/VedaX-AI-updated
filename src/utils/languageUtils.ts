export const getActiveLanguage = (contextLang: string = 'en'): string => {
    try {
        const htmlLang = document.documentElement.lang;
        const isTranslated = document.documentElement.classList.contains('translated-ltr') || document.documentElement.classList.contains('translated-rtl');
        const cookieMatch = document.cookie.match(/googtrans=\/[^\/]+\/([a-zA-Z-]+)/);
        
        if (isTranslated && htmlLang && htmlLang !== 'en') {
            return htmlLang;
        } 
        
        if (cookieMatch && cookieMatch[1] && cookieMatch[1] !== 'en') {
            return cookieMatch[1];
        } 
        
        const googleSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (googleSelect && googleSelect.value && googleSelect.value !== 'en') {
            return googleSelect.value;
        }
        
        return contextLang;
    } catch (e) {
        return contextLang;
    }
};
