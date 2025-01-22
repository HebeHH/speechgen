import path from "path";
import { voices } from "../constants/voices";
import { batchProcess } from "../tts/cartesia";


const voiceExampleCreationFolder = path.join(__dirname, '..', '..', 'voiceExamples');

function createExampleText(voiceName: string) {
    return `Hello, I am ${voiceName}. Good to meet you!`;
}

export async function createVoiceExamples() {
    const transcripts = voices.map(voice => {
        return {
            text: createExampleText(voice.name),
            filename: `${voice.id}.mp3`,
            voiceId: voice.id
        }
    });

    await batchProcess(voices[0].id, transcripts, voiceExampleCreationFolder);

}