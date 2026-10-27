import { describe, expect, it } from 'vitest';
import { detectLanguage } from './language';

describe('detectLanguage', () => {
    it('recognises German', () => {
        expect(detectLanguage('Der Container ist nicht erreichbar und die Logs sind leer.')).toBe('de');
        expect(detectLanguage('Bitte prüfe das nochmal')).toBe('de');
    });

    it('recognises English', () => {
        expect(detectLanguage('The container is not reachable and the logs are empty.')).toBe('en');
        expect(detectLanguage('Could you check this again?')).toBe('en');
    });

    it('leaves short or ambiguous chunks undecided', () => {
        expect(detectLanguage('Datei')).toBeNull();
        expect(detectLanguage('Issue #98')).toBeNull();
    });

    it('treats umlauts as a German signal', () => {
        expect(detectLanguage('Öffnen')).toBe('de');
    });
});
