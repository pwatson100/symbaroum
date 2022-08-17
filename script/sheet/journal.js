export class SymbaroumJournalSheet extends JournalSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 1268
        });
    }
}