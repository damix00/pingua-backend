const supportedLanguages = [
    "en",
    "de",
    "hr",
    "es",
    "fr",
    "it",
    "ru",
    "pt",
    "tr",
    "el",
    "nl",
    "pl",
    "sv",
];

function isSupportedLanguage(lang: string): boolean {
    return supportedLanguages.includes(lang.toLowerCase());
}

export { isSupportedLanguage, supportedLanguages };
