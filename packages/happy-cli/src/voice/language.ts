/**
 * Language guess for read-aloud, so a German reply is not spoken with an English
 * voice (and vice versa). Deliberately dumb: the app sends short chunks, a full
 * detector library would be more code than the problem is worth.
 */

const UMLAUT = /[äöüÄÖÜß]/;

const GERMAN = /\b(der|die|das|den|dem|des|und|oder|aber|ist|sind|war|waren|nicht|kein|keine|ich|du|er|sie|es|wir|ihr|mit|für|auf|aus|bei|nach|von|zu|zum|zur|ein|eine|einen|einem|sich|auch|noch|nur|dass|wird|werden|hat|haben|kann|können|muss|müssen|soll|sollen|wie|wenn|dann|schon|jetzt|bitte|danke|hier|heute|gut|geht|macht|gibt|mehr|sehr)\b/gi;

const ENGLISH = /\b(the|and|or|but|is|are|was|were|not|no|you|your|he|she|it|we|they|them|with|for|from|on|in|at|to|of|by|as|this|that|these|those|be|been|have|has|had|can|could|should|would|will|may|might|must|there|here|when|then|what|which|how|why|i)\b/gi;

export type Language = 'de' | 'en';

/** The likely language of `text`, or null when nothing points one way. */
export function detectLanguage(text: string): Language | null {
    const german = (text.match(GERMAN) ?? []).length + (UMLAUT.test(text) ? 3 : 0);
    const english = (text.match(ENGLISH) ?? []).length;
    if (german === english) return null;
    return german > english ? 'de' : 'en';
}
