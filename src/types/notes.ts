/** NoteDto from the API (GET /api/notes, GET /api/notes/{id}, POST /api/notes/generate). */
export interface Note {
    id: string;
    topic: string;
    /** AI-generated Markdown. */
    content: string;
    /** UTC ISO-8601 timestamp. */
    createdAt: string;
}

/** POST /api/notes/generate body (GenerateNoteDto). */
export interface GenerateNoteRequest {
    topic: string;
}
