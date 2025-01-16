import path from "path";
import { batchProcess } from "../tts/cartesia";
import type { Script, VoicedStatement } from "../types/script";
import fs from 'fs';

export const meditationappfolder = "/Users/hebe/Dropbox/Code/my_ai/ai_stuff/speechgen/data/8kmeditationapp"

export async function getVoiceFiles(statements: Script, baseFolder: string) {

    const voiced: VoicedStatement[] = statements.map((statement, index) => {
        return {
            ...statement,
            filename: `${index}.mp3`
        };
    });

    await batchProcess("f114a467-c40a-4db8-964d-aaba89cd08fa", voiced, path.join(baseFolder, 'statements'));

    const padFileText = voiced.map(statement => `ffmpeg -i statements/${statement.filename}  -af "apad=pad_dur=${statement.pauseAfter || 1}" -y statements/padded_${statement.filename}`)
    const concatFileText = voiced.map(statement => `file 'statements/padded_${statement.filename}'`)

    padFileText.push(`ffmpeg -f concat -safe 0 -i inputs.txt  -c copy final_output.wav`)
    padFileText.push(`ffmpeg -i final_output.wav -stream_loop -1 -i stillwaters.wav -filter_complex "[1:a]volume=0.2[b];[0:a][b]amix=inputs=2:duration=first:dropout_transition=2[out]" -map "[out]" "meditation_${new Date().toLocaleTimeString()}.wav"`)

    fs.writeFileSync(path.join(baseFolder, 'main.sh'), padFileText.join('\n'));

    fs.writeFileSync(path.join(baseFolder, 'inputs.txt'), concatFileText.join('\n'));
}