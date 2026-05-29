import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        googleTranslateElementInit: () => void;
        google: any;
    }
}

const GoogleTranslate: React.FC = () => {
    const isLoaded = useRef(false);

    useEffect(() => {
        // Prevent multiple script injections
        if (isLoaded.current || document.getElementById('google-translate-script')) {
            return;
        }

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa,or,as,mai,sa,sd',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                },
                'google_translate_element'
            );
        };

        const addScript = document.createElement('script');
        addScript.id = 'google-translate-script';
        addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        addScript.async = true;
        document.body.appendChild(addScript);

        isLoaded.current = true;
    }, []);

    return (
        <div id="google_translate_element" className="translate-widget-container"></div>
    );
};

export default GoogleTranslate;
